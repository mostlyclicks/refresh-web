/**
 * Approve route tests — approve/reject/clarify, inline-edited changes,
 * and deploy-failure recovery (request reverts to pending).
 *
 * All external I/O is mocked — Supabase and the internal /api/deploy fetch.
 *
 * Run: npx vitest __tests__/api/approve.test.ts
 */

import { describe, it, expect, vi, beforeEach, afterEach, type Mock } from 'vitest'
import { NextRequest } from 'next/server'

// ─── Mock: Supabase ───────────────────────────────────────────────────────────
const mockSupabase = {
  from: vi.fn(),
}

vi.mock('@/lib/db', () => ({
  supabaseAdmin: mockSupabase,
}))

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Chainable Supabase table mock. Every builder method returns the chain;
 * the chain itself is awaitable (terminal .eq() in updates) and .single()
 * resolves separately (terminal in selects).
 */
function mockTable(opts: { single?: unknown; result?: unknown } = {}) {
  const chain: any = {}
  ;['select', 'insert', 'update', 'eq'].forEach((m) => {
    chain[m] = vi.fn(() => chain)
  })
  chain.single = vi.fn().mockResolvedValue(opts.single ?? { data: null, error: null })
  chain.then = (resolve: any, reject: any) =>
    Promise.resolve(opts.result ?? { data: null, error: null }).then(resolve, reject)
  return chain
}

function setupTables(overrides: { requests?: any; suggestions?: any } = {}) {
  const requests = overrides.requests ?? mockTable()
  const suggestions = overrides.suggestions ?? mockTable({
    single: { data: { claude_response: { request_summary: 'orig', changes: [] } }, error: null },
  })

  ;(mockSupabase.from as Mock).mockImplementation((table: string) => {
    if (table === 'requests') return requests
    if (table === 'suggestions') return suggestions
    return mockTable()
  })

  return { requests, suggestions }
}

function makeRequest(body: Record<string, unknown>): NextRequest {
  return new NextRequest('http://localhost/api/approve', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

const validChange = {
  target_file: 'index.html',
  target_section: 'hero',
  old_code: '<h1>Old</h1>',
  new_code: '<h1>New</h1>',
}

// Deploy fetch mock — default succeeds
const mockFetch = vi.fn()
vi.stubGlobal('fetch', mockFetch)

// ─── Import route AFTER all mocks are registered ─────────────────────────────
const { POST } = await import('@/app/api/approve/route')

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('POST /api/approve', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockFetch.mockResolvedValue({ ok: true, json: async () => ({}) })
  })

  // ── Basic validation ──────────────────────────────────────────────────────

  it('returns 400 when requestId or action is missing', async () => {
    setupTables()
    const res = await POST(makeRequest({ action: 'approve' }))
    expect(res.status).toBe(400)

    const res2 = await POST(makeRequest({ requestId: 'req-1' }))
    expect(res2.status).toBe(400)
  })

  // ── Reject / clarify ──────────────────────────────────────────────────────

  it('reject sets status to rejected and does not deploy', async () => {
    const { requests } = setupTables()
    const res = await POST(makeRequest({ requestId: 'req-1', suggestionId: 'sug-1', action: 'reject' }))

    expect(res.status).toBe(200)
    expect(requests.update).toHaveBeenCalledWith({ status: 'rejected' })
    expect(mockFetch).not.toHaveBeenCalled()
  })

  it('clarify keeps status pending and does not deploy', async () => {
    const { requests } = setupTables()
    const res = await POST(makeRequest({ requestId: 'req-1', suggestionId: 'sug-1', action: 'clarify' }))

    expect(res.status).toBe(200)
    expect(requests.update).toHaveBeenCalledWith({ status: 'pending' })
    expect(mockFetch).not.toHaveBeenCalled()
  })

  // ── Plain approve ─────────────────────────────────────────────────────────

  it('approve stamps the suggestion and triggers deploy', async () => {
    const { requests, suggestions } = setupTables()
    const res = await POST(makeRequest({ requestId: 'req-1', suggestionId: 'sug-1', action: 'approve' }))

    expect(res.status).toBe(200)
    expect(requests.update).toHaveBeenCalledWith({ status: 'approved' })
    expect(suggestions.update).toHaveBeenCalledWith(
      expect.objectContaining({ approved_by: 'carlos', approved_at: expect.any(String) })
    )
    expect(mockFetch).toHaveBeenCalledWith(
      'http://localhost/api/deploy',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ suggestionId: 'sug-1' }),
      })
    )
  })

  it('approve without edits does not rewrite the suggestion changes', async () => {
    const { suggestions } = setupTables()
    await POST(makeRequest({ requestId: 'req-1', suggestionId: 'sug-1', action: 'approve' }))

    // Only one update: the approval stamp — no claude_response rewrite
    expect(suggestions.update).toHaveBeenCalledTimes(1)
    const payload = (suggestions.update as Mock).mock.calls[0][0]
    expect(payload).not.toHaveProperty('claude_response')
  })

  // ── Approve with inline-edited changes ────────────────────────────────────

  it('persists edited changes to the suggestion before deploying', async () => {
    const { suggestions } = setupTables()
    const edited = [
      { ...validChange, new_code: '<h1>Hand-fixed</h1>' },
      { target_file: 'styles.css', old_code: 'color: red;', new_code: 'color: blue;' },
    ]

    const res = await POST(makeRequest({
      requestId: 'req-1',
      suggestionId: 'sug-1',
      action: 'approve',
      changes: edited,
    }))

    expect(res.status).toBe(200)

    // First suggestions.update = persisted edits; second = approval stamp
    const firstPayload = (suggestions.update as Mock).mock.calls[0][0]
    expect(firstPayload.claude_response.changes).toHaveLength(2)
    expect(firstPayload.claude_response.changes[0].new_code).toBe('<h1>Hand-fixed</h1>')
    expect(firstPayload.claude_response.manually_edited).toBe(true)
    // Original claude_response fields are preserved
    expect(firstPayload.claude_response.request_summary).toBe('orig')
    // Legacy single-change columns mirror the first change
    expect(firstPayload.target_file).toBe('index.html')
    expect(firstPayload.new_code).toBe('<h1>Hand-fixed</h1>')

    expect(mockFetch).toHaveBeenCalled()
  })

  it('defaults target_section to empty string and trims target_file', async () => {
    const { suggestions } = setupTables()
    await POST(makeRequest({
      requestId: 'req-1',
      suggestionId: 'sug-1',
      action: 'approve',
      changes: [{ target_file: '  index.html  ', old_code: 'a', new_code: 'b' }],
    }))

    const payload = (suggestions.update as Mock).mock.calls[0][0]
    expect(payload.claude_response.changes[0].target_file).toBe('index.html')
    expect(payload.claude_response.changes[0].target_section).toBe('')
  })

  it('rejects edits with an empty old_code (nothing to find-and-replace)', async () => {
    const { requests } = setupTables()
    const res = await POST(makeRequest({
      requestId: 'req-1',
      suggestionId: 'sug-1',
      action: 'approve',
      changes: [{ ...validChange, old_code: '' }],
    }))

    expect(res.status).toBe(400)
    // Nothing was touched — request stays pending, no deploy
    expect(requests.update).not.toHaveBeenCalled()
    expect(mockFetch).not.toHaveBeenCalled()
  })

  it('rejects edits with a missing target_file', async () => {
    setupTables()
    const res = await POST(makeRequest({
      requestId: 'req-1',
      suggestionId: 'sug-1',
      action: 'approve',
      changes: [{ old_code: 'a', new_code: 'b' }],
    }))
    expect(res.status).toBe(400)
  })

  it('rejects an empty changes array', async () => {
    setupTables()
    const res = await POST(makeRequest({
      requestId: 'req-1',
      suggestionId: 'sug-1',
      action: 'approve',
      changes: [],
    }))
    expect(res.status).toBe(400)
  })

  it('allows an empty new_code (deletion is a valid edit)', async () => {
    setupTables()
    const res = await POST(makeRequest({
      requestId: 'req-1',
      suggestionId: 'sug-1',
      action: 'approve',
      changes: [{ target_file: 'index.html', old_code: '<p>gone</p>', new_code: '' }],
    }))
    expect(res.status).toBe(200)
  })

  it('returns 500 when persisting edits fails, without touching request status', async () => {
    const failingSuggestions = mockTable({
      single: { data: { claude_response: {} }, error: null },
      result: { data: null, error: { message: 'db down' } },
    })
    const { requests } = setupTables({ suggestions: failingSuggestions })

    const res = await POST(makeRequest({
      requestId: 'req-1',
      suggestionId: 'sug-1',
      action: 'approve',
      changes: [validChange],
    }))

    expect(res.status).toBe(500)
    expect(requests.update).not.toHaveBeenCalled()
    expect(mockFetch).not.toHaveBeenCalled()
  })

  // ── Deploy failure recovery ───────────────────────────────────────────────

  it('reverts the request to pending and returns 502 when deploy fails', async () => {
    const { requests } = setupTables()
    mockFetch.mockResolvedValue({
      ok: false,
      json: async () => ({ error: 'Could not find target code in index.html' }),
    })

    const res = await POST(makeRequest({ requestId: 'req-1', suggestionId: 'sug-1', action: 'approve' }))
    const body = await res.json()

    expect(res.status).toBe(502)
    expect(body.success).toBe(false)
    expect(body.error).toContain('Could not find target code')

    // Status went approved → pending (kept in the queue for editing/retry)
    const statusUpdates = (requests.update as Mock).mock.calls.map((c) => c[0].status)
    expect(statusUpdates).toEqual(['approved', 'pending'])
  })

  it('returns a fallback error message when deploy fails with a non-JSON body', async () => {
    setupTables()
    mockFetch.mockResolvedValue({
      ok: false,
      json: async () => { throw new Error('not json') },
    })

    const res = await POST(makeRequest({ requestId: 'req-1', suggestionId: 'sug-1', action: 'approve' }))
    const body = await res.json()

    expect(res.status).toBe(502)
    expect(body.error).toBeTruthy()
  })

  // ── DB failure on status update ───────────────────────────────────────────

  it('returns 500 when the request status update fails', async () => {
    const failingRequests = mockTable({ result: { data: null, error: { message: 'db down' } } })
    setupTables({ requests: failingRequests })

    const res = await POST(makeRequest({ requestId: 'req-1', action: 'reject' }))
    expect(res.status).toBe(500)
    expect(mockFetch).not.toHaveBeenCalled()
  })

  // ── Admin auth gate ───────────────────────────────────────────────────────

  describe('when ADMIN_PASSWORD is set', () => {
    const { createHash } = require('crypto') as typeof import('crypto')

    beforeEach(() => {
      process.env.ADMIN_PASSWORD = 'hunter2'
    })

    afterEach(() => {
      delete process.env.ADMIN_PASSWORD
    })

    it('returns 401 without a valid session cookie and touches nothing', async () => {
      const { requests } = setupTables()
      const res = await POST(makeRequest({ requestId: 'req-1', suggestionId: 'sug-1', action: 'approve' }))

      expect(res.status).toBe(401)
      expect(requests.update).not.toHaveBeenCalled()
      expect(mockFetch).not.toHaveBeenCalled()
    })

    it('proceeds with a valid session cookie', async () => {
      setupTables()
      const token = createHash('sha256').update('hunter2').digest('hex')
      const req = new NextRequest('http://localhost/api/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', cookie: `admin_session=${token}` },
        body: JSON.stringify({ requestId: 'req-1', suggestionId: 'sug-1', action: 'approve' }),
      })

      const res = await POST(req)
      expect(res.status).toBe(200)
      // The deploy call forwards the admin cookie
      const deployHeaders = mockFetch.mock.calls[0][1].headers
      expect(deployHeaders.cookie).toContain('admin_session=')
    })
  })
})
