/**
 * Deploy route tests — grouped commits, exact-match failure, and the
 * "update is live" client notification.
 *
 * All external I/O is mocked — Supabase, Octokit, and the email lib.
 *
 * Run: npx vitest __tests__/api/deploy.test.ts
 */

import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest'
import { NextRequest } from 'next/server'

// ─── Mock: next/server `after` — capture the callback so tests can await it ──
let afterCallback: (() => Promise<void>) | null = null

vi.mock('next/server', async (importOriginal) => {
  const actual = await importOriginal<typeof import('next/server')>()
  return {
    ...actual,
    after: (fn: () => Promise<void>) => { afterCallback = fn },
  }
})

// ─── Mock: Octokit ────────────────────────────────────────────────────────────
const mockGetContent = vi.fn()
const mockCreateOrUpdate = vi.fn()

vi.mock('@octokit/rest', () => ({
  Octokit: class {
    repos = {
      getContent: mockGetContent,
      createOrUpdateFileContents: mockCreateOrUpdate,
    }
  },
}))

// ─── Mock: Supabase ───────────────────────────────────────────────────────────
const mockSupabase = { from: vi.fn() }
vi.mock('@/lib/db', () => ({ supabaseAdmin: mockSupabase }))

// ─── Mock: email lib ──────────────────────────────────────────────────────────
const mockSendUpdateLiveEmail = vi.fn().mockResolvedValue({ sent: true, id: 'email_1' })
vi.mock('@/lib/email', () => ({
  sendUpdateLiveEmail: (...a: unknown[]) => mockSendUpdateLiveEmail(...a),
}))

// ─── Helpers ──────────────────────────────────────────────────────────────────

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

const baseSuggestion = {
  id: 'sug-1',
  claude_response: {
    request_summary: 'Update headline and button color',
    changes: [
      { target_file: 'index.html', target_section: 'hero', old_code: '<h1>Old</h1>', new_code: '<h1>New</h1>' },
      { target_file: 'index.html', target_section: 'cta', old_code: 'class="green"', new_code: 'class="blue"' },
      { target_file: 'styles.css', target_section: 'btn', old_code: 'red;', new_code: 'blue;' },
    ],
  },
  requests: {
    id: 'req-1',
    websites: { id: 'web-1', github_repo_url: 'owner/site', deployed_url: 'https://site.vercel.app' },
    clients: { id: 'cli-1', name: 'Bill', email: 'bill@example.com' },
  },
}

const fileContents: Record<string, string> = {
  'index.html': '<html><h1>Old</h1><a class="green">Go</a></html>',
  'styles.css': '.btn { color: red; }',
}

function setup(suggestion: unknown = baseSuggestion) {
  afterCallback = null
  const suggestions = mockTable({ single: { data: suggestion, error: null } })
  const changes = mockTable()
  const requests = mockTable()

  ;(mockSupabase.from as Mock).mockImplementation((table: string) => {
    if (table === 'suggestions') return suggestions
    if (table === 'changes') return changes
    if (table === 'requests') return requests
    return mockTable()
  })

  mockGetContent.mockImplementation(async ({ path }: { path: string }) => ({
    data: {
      type: 'file',
      sha: 'sha-' + path,
      content: Buffer.from(fileContents[path] ?? '').toString('base64'),
    },
  }))
  mockCreateOrUpdate.mockImplementation(async ({ path }: { path: string }) => ({
    data: { commit: { sha: 'commit-' + path } },
  }))

  return { suggestions, changes, requests }
}

function makeRequest(body: Record<string, unknown>): NextRequest {
  return new NextRequest('http://localhost/api/deploy', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

// ─── Import route AFTER all mocks are registered ─────────────────────────────
const { POST } = await import('@/app/api/deploy/route')

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('POST /api/deploy', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockSendUpdateLiveEmail.mockResolvedValue({ sent: true, id: 'email_1' })
  })

  it('returns 400 when suggestionId is missing', async () => {
    setup()
    const res = await POST(makeRequest({}))
    expect(res.status).toBe(400)
  })

  it('groups changes by file — one commit per file, all changes applied', async () => {
    const { requests } = setup()
    const res = await POST(makeRequest({ suggestionId: 'sug-1' }))
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.filesChanged).toEqual(['index.html', 'styles.css'])
    expect(body.commitHashes).toEqual(['commit-index.html', 'commit-styles.css'])
    // index.html committed once with BOTH its changes applied
    expect(mockCreateOrUpdate).toHaveBeenCalledTimes(2)
    const htmlCommit = mockCreateOrUpdate.mock.calls.find((c) => c[0].path === 'index.html')![0]
    const committed = Buffer.from(htmlCommit.content, 'base64').toString('utf8')
    expect(committed).toContain('<h1>New</h1>')
    expect(committed).toContain('class="blue"')
    // request flipped to deployed
    expect(requests.update).toHaveBeenCalledWith({ status: 'deployed' })
  })

  it('fails with 500 when old_code is not found in the file, and sends no email', async () => {
    setup({
      ...baseSuggestion,
      claude_response: {
        request_summary: 'x',
        changes: [{ target_file: 'index.html', target_section: '', old_code: 'NOT IN FILE', new_code: 'y' }],
      },
    })

    const res = await POST(makeRequest({ suggestionId: 'sug-1' }))
    const body = await res.json()

    expect(res.status).toBe(500)
    expect(body.error).toContain('Could not find target code')
    expect(afterCallback).toBeNull()
    expect(mockSendUpdateLiveEmail).not.toHaveBeenCalled()
  })

  it('returns 400 when the website has no GitHub repo', async () => {
    setup({
      ...baseSuggestion,
      requests: { ...baseSuggestion.requests, websites: { id: 'web-1', github_repo_url: null } },
    })
    const res = await POST(makeRequest({ suggestionId: 'sug-1' }))
    expect(res.status).toBe(400)
  })

  // ── Client notification ───────────────────────────────────────────────────

  it('queues the "update is live" email after a successful deploy', async () => {
    setup()
    const res = await POST(makeRequest({ suggestionId: 'sug-1' }))
    expect(res.status).toBe(200)

    expect(afterCallback).not.toBeNull()
    await afterCallback!()

    expect(mockSendUpdateLiveEmail).toHaveBeenCalledWith({
      to: 'bill@example.com',
      clientName: 'Bill',
      summary: 'Update headline and button color',
      siteUrl: 'https://site.vercel.app',
    })
  })

  it('skips the email when the client has no email address', async () => {
    setup({
      ...baseSuggestion,
      requests: { ...baseSuggestion.requests, clients: { id: 'cli-1', name: 'Bill', email: null } },
    })

    const res = await POST(makeRequest({ suggestionId: 'sug-1' }))
    expect(res.status).toBe(200)
    expect(afterCallback).toBeNull()
  })

  it('deploy succeeds even if the email send resolves as failed', async () => {
    mockSendUpdateLiveEmail.mockResolvedValue({ sent: false, error: 'no key' })
    setup()

    const res = await POST(makeRequest({ suggestionId: 'sug-1' }))
    expect(res.status).toBe(200)
    await afterCallback!() // must not throw
  })
})
