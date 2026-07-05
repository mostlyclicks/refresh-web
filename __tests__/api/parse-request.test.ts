/**
 * Parse-request route tests — the endpoint that spends Claude tokens.
 * Focus: the hardening gates (client status, hourly rate limit, basic-tier
 * monthly cap) and the happy path.
 *
 * All external I/O is mocked — Supabase, Claude, GitHub.
 *
 * Run: npx vitest __tests__/api/parse-request.test.ts
 */

import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest'
import { NextRequest } from 'next/server'

// ─── Mock: Supabase ───────────────────────────────────────────────────────────
const mockSupabase = { from: vi.fn() }
vi.mock('@/lib/db', () => ({ supabaseAdmin: mockSupabase }))

// ─── Mock: Claude ─────────────────────────────────────────────────────────────
const mockParseRequest = vi.fn().mockResolvedValue({
  understood: true,
  request_summary: 'Change the headline',
  risk_level: 'low',
  confidence: 0.95,
  changes: [{ target_file: 'index.html', target_section: 'hero', old_code: 'a', new_code: 'b' }],
})
vi.mock('@/lib/claude', () => ({
  parseRequest: (...a: unknown[]) => mockParseRequest(...a),
}))

// ─── Mock: GitHub helpers ─────────────────────────────────────────────────────
vi.mock('@/lib/github', () => ({
  normaliseRepo: vi.fn((r: string) => r),
  listGitHubFiles: vi.fn().mockResolvedValue(['index.html']),
  fetchAllSiteFiles: vi.fn().mockResolvedValue({ 'index.html': '<html>a</html>' }),
}))

// ─── Helpers ──────────────────────────────────────────────────────────────────

function mockTable(opts: { single?: unknown; counts?: number[] } = {}) {
  const chain: any = {}
  ;['select', 'insert', 'update', 'eq', 'gte'].forEach((m) => {
    chain[m] = vi.fn(() => chain)
  })
  chain.single = vi.fn().mockResolvedValue(opts.single ?? { data: null, error: null })
  // Head-count queries await the chain directly; shift through the queue so
  // the hourly and monthly counts can differ within one request
  const queue = [...(opts.counts ?? [0, 0])]
  chain.then = (resolve: any, reject: any) =>
    Promise.resolve({ count: queue.length > 1 ? queue.shift() : queue[0] }).then(resolve, reject)
  return chain
}

function setup(opts: {
  client?: unknown
  counts?: number[]
} = {}) {
  const clients = mockTable({
    single: {
      data: 'client' in opts ? opts.client : { id: 'cli-1', tier: 'basic', status: 'active' },
      error: null,
    },
  })
  const requests = mockTable({
    single: { data: { id: 'req-1' }, error: null },
    counts: opts.counts ?? [0, 0],
  })
  const websites = mockTable({
    single: { data: { id: 'web-1', github_repo_url: 'owner/site' }, error: null },
  })
  const suggestions = mockTable({ single: { data: { id: 'sug-1' }, error: null } })

  ;(mockSupabase.from as Mock).mockImplementation((table: string) => {
    if (table === 'clients') return clients
    if (table === 'requests') return requests
    if (table === 'websites') return websites
    if (table === 'suggestions') return suggestions
    return mockTable()
  })

  return { clients, requests, websites, suggestions }
}

function makeRequest(body: Record<string, unknown>): NextRequest {
  return new NextRequest('http://localhost/api/parse-request', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

const validBody = { message_text: 'Change the headline', clientId: 'cli-1', websiteId: 'web-1' }

// ─── Import route AFTER all mocks are registered ─────────────────────────────
const { POST } = await import('@/app/api/parse-request/route')

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('POST /api/parse-request', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns 400 when required fields are missing', async () => {
    setup()
    const res = await POST(makeRequest({ message_text: 'x' }))
    expect(res.status).toBe(400)
  })

  it('returns 404 for an unknown client', async () => {
    setup({ client: null })
    const res = await POST(makeRequest(validBody))
    expect(res.status).toBe(404)
  })

  it('returns 403 for a paused client and saves nothing', async () => {
    const { requests } = setup({ client: { id: 'cli-1', tier: 'basic', status: 'paused' } })
    const res = await POST(makeRequest(validBody))

    expect(res.status).toBe(403)
    expect(requests.insert).not.toHaveBeenCalled()
    expect(mockParseRequest).not.toHaveBeenCalled()
  })

  it('returns 429 when the hourly rate limit is hit', async () => {
    const { requests } = setup({ counts: [10, 0] })
    const res = await POST(makeRequest(validBody))
    const body = await res.json()

    expect(res.status).toBe(429)
    expect(body.error).toContain('hour')
    expect(requests.insert).not.toHaveBeenCalled()
    expect(mockParseRequest).not.toHaveBeenCalled()
  })

  it('returns 429 when a basic client has used 20 requests this month', async () => {
    const { requests } = setup({ counts: [3, 20] })
    const res = await POST(makeRequest(validBody))
    const body = await res.json()

    expect(res.status).toBe(429)
    expect(body.error).toContain('20 updates')
    expect(body.error).toContain('Professional')
    expect(requests.insert).not.toHaveBeenCalled()
    expect(mockParseRequest).not.toHaveBeenCalled()
  })

  it('does not apply the monthly cap to professional clients', async () => {
    const { requests } = setup({
      client: { id: 'cli-1', tier: 'professional', status: 'active' },
      counts: [3],
    })
    const res = await POST(makeRequest(validBody))

    expect(res.status).toBe(200)
    expect(requests.insert).toHaveBeenCalled()
    expect(mockParseRequest).toHaveBeenCalled()
  })

  it('lets a basic client under both limits through the full pipeline', async () => {
    const { requests, suggestions } = setup({ counts: [2, 12] })
    const res = await POST(makeRequest(validBody))
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.success).toBe(true)
    expect(requests.insert).toHaveBeenCalledWith(
      expect.objectContaining({ message_text: 'Change the headline', status: 'pending', source: 'chat' })
    )
    expect(mockParseRequest).toHaveBeenCalled()
    expect(suggestions.insert).toHaveBeenCalled()
  })
})
