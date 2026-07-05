/**
 * SMS webhook route tests
 *
 * All external I/O is mocked — Supabase, Claude, GitHub, Twilio, and fetch.
 * MOCK_TWILIO=true (set in vitest.setup.ts) bypasses signature validation.
 *
 * Run: npx vitest __tests__/api/sms.test.ts
 */

import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest'
import { NextRequest } from 'next/server'

// ─── Mock: next/server `after` ────────────────────────────────────────────────
// after() runs background work after the response is sent.
// We capture the callback so individual tests can await it.

let afterCallback: (() => Promise<void>) | null = null

vi.mock('next/server', async (importOriginal) => {
  const actual = await importOriginal<typeof import('next/server')>()
  return {
    ...actual,
    after: (fn: () => Promise<void>) => { afterCallback = fn },
  }
})

// ─── Mock: Twilio signature validation ───────────────────────────────────────
vi.mock('twilio', () => ({
  validateRequest: vi.fn(() => true),
}))

// ─── Mock: Supabase ───────────────────────────────────────────────────────────
const mockSupabase = {
  from: vi.fn(),
  storage: {
    from: vi.fn(),
  },
}

vi.mock('@/lib/db', () => ({
  supabaseAdmin: mockSupabase,
}))

// ─── Mock: Claude ─────────────────────────────────────────────────────────────
vi.mock('@/lib/claude', () => ({
  parseRequest: vi.fn().mockResolvedValue({
    request_summary: 'Change the headline',
    risk_level: 'low',
    confidence: 0.95,
    changes: [
      {
        target_file: 'index.html',
        target_section: 'hero',
        old_code: '<h1>Old</h1>',
        new_code: '<h1>New</h1>',
      },
    ],
  }),
}))

// ─── Mock: GitHub helpers ─────────────────────────────────────────────────────
vi.mock('@/lib/github', () => ({
  normaliseRepo: vi.fn((r: string) => r),
  listGitHubFiles:   vi.fn().mockResolvedValue(['index.html']),
  fetchAllSiteFiles: vi.fn().mockResolvedValue({ 'index.html': '<html><h1>Old</h1></html>' }),
}))

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makeRequest(params: Record<string, string>): NextRequest {
  const body = new URLSearchParams(params).toString()
  return new NextRequest('http://localhost/api/sms', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  })
}

function parseTwiml(text: string): string {
  const match = text.match(/<Message>(.*?)<\/Message>/)
  return match?.[1] ?? ''
}

/** Builds chainable Supabase mock for a single query */
function mockQuery(result: { data?: unknown; error?: unknown; count?: number }) {
  const chain: Record<string, unknown> = {}
  const end = { ...result }
  ;['select', 'insert', 'eq', 'gte', 'single'].forEach((m) => {
    chain[m] = vi.fn(() => chain)
  })
  // Terminal: single() resolves
  ;(chain.single as Mock).mockResolvedValue(end)
  // Terminal: insert().select().single()
  ;(chain.select as Mock).mockReturnValue(chain)
  // Terminal: awaiting the chain directly (head-count queries)
  ;(chain as any).then = (resolve: any, reject: any) =>
    Promise.resolve(end).then(resolve, reject)
  return chain
}

/** Standard happy-path Supabase: client found, website found, request saved */
function setupHappyPath(overrides: {
  client?: unknown
  website?: unknown
  request?: unknown
} = {}) {
  const client  = overrides.client  ?? { id: 'client-uuid-1', tier: 'professional' }
  const website = overrides.website ?? { id: 'website-uuid-1', github_repo_url: 'owner/repo', client_id: 'client-uuid-1' }
  const request = overrides.request ?? { id: 'request-uuid-1' }

  const clientQuery  = mockQuery({ data: client })
  const websiteQuery = mockQuery({ data: website })
  const requestQuery = mockQuery({ data: request })
  const suggestQuery = mockQuery({ data: {} })

  ;(mockSupabase.from as Mock).mockImplementation((table: string) => {
    if (table === 'clients')     return clientQuery
    if (table === 'websites')    return websiteQuery
    if (table === 'requests')    return requestQuery
    if (table === 'suggestions') return suggestQuery
    return mockQuery({ data: null })
  })
}

// ─── Import route AFTER all mocks are registered ─────────────────────────────
const { POST } = await import('@/app/api/sms/route')

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('POST /api/sms', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    afterCallback = null
  })

  // ── Professional-tier gate ────────────────────────────────────────────────

  it('blocks a basic-tier client with an upgrade message', async () => {
    const requestQuery = mockQuery({ data: { id: 'request-uuid-1' } })
    const clientQuery = mockQuery({ data: { id: 'client-uuid-1', tier: 'basic' } })
    ;(mockSupabase.from as Mock).mockImplementation((table: string) => {
      if (table === 'clients') return clientQuery
      if (table === 'requests') return requestQuery
      return mockQuery({ data: null })
    })

    const res = await POST(makeRequest({ From: '+15551234567', Body: 'Change the headline', NumMedia: '0' }))
    const text = await res.text()

    expect(parseTwiml(text)).toContain('Professional plan')
    // Nothing was inserted, no background parse queued
    expect(requestQuery.insert).not.toHaveBeenCalled()
    expect(afterCallback).toBeNull()
  })

  it('blocks a custom-tier client too (SMS is professional-only)', async () => {
    const clientQuery = mockQuery({ data: { id: 'client-uuid-1', tier: 'custom' } })
    ;(mockSupabase.from as Mock).mockImplementation((table: string) => {
      if (table === 'clients') return clientQuery
      return mockQuery({ data: null })
    })

    const res = await POST(makeRequest({ From: '+15551234567', Body: 'Change the headline', NumMedia: '0' }))
    expect(parseTwiml(await res.text())).toContain('Professional plan')
  })

  it('allows a professional-tier client through', async () => {
    setupHappyPath()

    const res = await POST(makeRequest({ From: '+15551234567', Body: 'Change headline', NumMedia: '0' }))
    const text = await res.text()

    expect(parseTwiml(text)).toBe("Got it — we'll review and update your site shortly.")
  })

  // ── Happy path: plain text message ────────────────────────────────────────

  it('returns 200 TwiML ACK for a valid text message', async () => {
    setupHappyPath()

    const req = makeRequest({ From: '+15551234567', Body: 'Change the headline to Summer Sale', NumMedia: '0' })
    const res = await POST(req)
    const text = await res.text()

    expect(res.status).toBe(200)
    expect(res.headers.get('content-type')).toContain('text/xml')
    expect(parseTwiml(text)).toBe("Got it — we'll review and update your site shortly.")
  })

  it('saves the request record with source=sms', async () => {
    setupHappyPath()

    await POST(makeRequest({ From: '+15551234567', Body: 'Update the footer', NumMedia: '0' }))

    const insertCall = (mockSupabase.from as Mock).mock.calls.find(([t]: string[]) => t === 'requests')
    expect(insertCall).toBeTruthy()

    // Retrieve what was inserted by following the chain
    const requestChain = (mockSupabase.from as Mock).mock.results.find(
      (_: unknown, i: number) => (mockSupabase.from as Mock).mock.calls[i][0] === 'requests'
    )?.value
    const insertedData = (requestChain?.insert as Mock)?.mock.calls[0][0]

    expect(insertedData).toMatchObject({
      message_text: 'Update the footer',
      status: 'pending',
      source: 'sms',
      attachments: [],
    })
  })

  it('triggers background Claude parse via after()', async () => {
    setupHappyPath()

    await POST(makeRequest({ From: '+15551234567', Body: 'Resize the hero image', NumMedia: '0' }))

    expect(afterCallback).toBeTypeOf('function')

    // Run the background task
    await afterCallback!()

    const { parseRequest } = await import('@/lib/claude')
    expect(parseRequest).toHaveBeenCalledOnce()
    expect(parseRequest).toHaveBeenCalledWith(
      'Resize the hero image',
      expect.any(Object), // siteFiles
      []                  // no attachments
    )
  })

  it('saves a suggestion record after background parse completes', async () => {
    setupHappyPath()

    await POST(makeRequest({ From: '+15551234567', Body: 'Change the CTA text', NumMedia: '0' }))
    await afterCallback!()

    const suggestCall = (mockSupabase.from as Mock).mock.calls.find(([t]: string[]) => t === 'suggestions')
    expect(suggestCall).toBeTruthy()

    const suggestChain = (mockSupabase.from as Mock).mock.results.find(
      (_: unknown, i: number) => (mockSupabase.from as Mock).mock.calls[i][0] === 'suggestions'
    )?.value
    const insertedSuggestion = (suggestChain?.insert as Mock)?.mock.calls[0][0]

    expect(insertedSuggestion).toMatchObject({
      target_file: 'index.html',
      risk_level: 'low',
      confidence: 0.95,
    })
  })

  // ── MMS / image attachment ─────────────────────────────────────────────────

  it('handles MMS image — downloads media and saves attachment', async () => {
    setupHappyPath()

    // Mock the Twilio media fetch
    const fakeImageBuffer = Buffer.from('fake-image-data')
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      arrayBuffer: async () => fakeImageBuffer.buffer,
    } as unknown as Response)

    // Mock Supabase Storage upload
    const uploadMock = vi.fn().mockResolvedValue({ error: null })
    ;(mockSupabase.storage.from as Mock).mockReturnValue({ upload: uploadMock })

    const req = makeRequest({
      From: '+15551234567',
      Body: 'Here is my new logo',
      NumMedia: '1',
      MediaUrl0: 'https://api.twilio.com/media/fake-image',
      MediaContentType0: 'image/jpeg',
    })

    const res = await POST(req)
    const text = await res.text()

    expect(res.status).toBe(200)
    expect(parseTwiml(text)).toContain("Got it")
    expect(uploadMock).toHaveBeenCalledOnce()
  })

  it('saves attachment metadata when MMS is received', async () => {
    setupHappyPath()

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      arrayBuffer: async () => Buffer.from('img').buffer,
    } as unknown as Response)
    ;(mockSupabase.storage.from as Mock).mockReturnValue({ upload: vi.fn().mockResolvedValue({ error: null }) })

    await POST(makeRequest({
      From: '+15551234567',
      Body: '',
      NumMedia: '1',
      MediaUrl0: 'https://api.twilio.com/media/photo',
      MediaContentType0: 'image/png',
    }))

    const requestChain = (mockSupabase.from as Mock).mock.results.find(
      (_: unknown, i: number) => (mockSupabase.from as Mock).mock.calls[i][0] === 'requests'
    )?.value
    const insertedData = (requestChain?.insert as Mock)?.mock.calls[0][0]

    expect(insertedData.attachments).toHaveLength(1)
    expect(insertedData.attachments[0]).toMatchObject({
      type: 'image/png',
      name: expect.stringMatching(/^sms-.*\.png$/),
      url: expect.stringContaining('request-attachments'),
    })
  })

  it('uses placeholder text when no Body but image is present', async () => {
    setupHappyPath()

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      arrayBuffer: async () => Buffer.from('img').buffer,
    } as unknown as Response)
    ;(mockSupabase.storage.from as Mock).mockReturnValue({ upload: vi.fn().mockResolvedValue({ error: null }) })

    await POST(makeRequest({
      From: '+15551234567',
      Body: '',
      NumMedia: '1',
      MediaUrl0: 'https://api.twilio.com/media/photo',
      MediaContentType0: 'image/jpeg',
    }))

    const requestChain = (mockSupabase.from as Mock).mock.results.find(
      (_: unknown, i: number) => (mockSupabase.from as Mock).mock.calls[i][0] === 'requests'
    )?.value
    const insertedData = (requestChain?.insert as Mock)?.mock.calls[0][0]

    expect(insertedData.message_text).toMatch(/1 image/)
  })

  it('continues without attachment if Twilio media download fails', async () => {
    setupHappyPath()

    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 403,
    } as unknown as Response)

    const req = makeRequest({
      From: '+15551234567',
      Body: 'Here is a photo',
      NumMedia: '1',
      MediaUrl0: 'https://api.twilio.com/media/broken',
      MediaContentType0: 'image/jpeg',
    })

    const res = await POST(req)
    // Should still succeed (media failure is non-fatal)
    expect(res.status).toBe(200)
    expect(parseTwiml(await res.text())).toContain("Got it")
  })

  // ── Unregistered / unknown number ─────────────────────────────────────────

  it('returns "not registered" TwiML when phone number is unknown', async () => {
    const clientQuery = mockQuery({ data: null })
    ;(mockSupabase.from as Mock).mockImplementation((table: string) => {
      if (table === 'clients') return clientQuery
      return mockQuery({ data: null })
    })

    const req = makeRequest({ From: '+19995550000', Body: 'Hello', NumMedia: '0' })
    const res = await POST(req)
    const text = await res.text()

    expect(res.status).toBe(200)
    expect(parseTwiml(text)).toContain("isn't registered")
  })

  // ── Client has no website / GitHub repo ───────────────────────────────────

  it('returns fallback TwiML when client has no website linked', async () => {
    const clientQuery  = mockQuery({ data: { id: 'client-uuid-1', tier: 'professional' } })
    const websiteQuery = mockQuery({ data: null })
    ;(mockSupabase.from as Mock).mockImplementation((table: string) => {
      if (table === 'clients')  return clientQuery
      if (table === 'websites') return websiteQuery
      return mockQuery({ data: null })
    })

    const req = makeRequest({ From: '+15551234567', Body: 'Update something', NumMedia: '0' })
    const res = await POST(req)

    expect(parseTwiml(await res.text())).toContain("follow up")
  })

  it('returns fallback TwiML when website has no github_repo_url', async () => {
    const clientQuery  = mockQuery({ data: { id: 'client-uuid-1', tier: 'professional' } })
    const websiteQuery = mockQuery({ data: { id: 'website-uuid-1', github_repo_url: null } })
    ;(mockSupabase.from as Mock).mockImplementation((table: string) => {
      if (table === 'clients')  return clientQuery
      if (table === 'websites') return websiteQuery
      return mockQuery({ data: null })
    })

    const req = makeRequest({ From: '+15551234567', Body: 'Update the prices', NumMedia: '0' })
    const res = await POST(req)

    expect(parseTwiml(await res.text())).toContain("follow up")
  })

  // ── Empty message with no media ───────────────────────────────────────────

  it('returns "could not process" TwiML for empty body with no media', async () => {
    setupHappyPath()

    const req = makeRequest({ From: '+15551234567', Body: '', NumMedia: '0' })
    const res = await POST(req)

    expect(parseTwiml(await res.text())).toContain("couldn't process")
  })

  // ── Missing From field ────────────────────────────────────────────────────

  it('returns error TwiML when From field is missing', async () => {
    const req = makeRequest({ Body: 'Hello', NumMedia: '0' })
    const res = await POST(req)

    expect(parseTwiml(await res.text())).toContain("Unable to process")
  })

  // ── Signature validation (non-mock mode) ──────────────────────────────────

  it('returns 403 when Twilio signature is invalid', async () => {
    // Temporarily disable mock mode
    const original = process.env.MOCK_TWILIO
    process.env.MOCK_TWILIO = 'false'

    const { validateRequest } = await import('twilio')
    ;(validateRequest as Mock).mockReturnValueOnce(false)

    const req = makeRequest({ From: '+15551234567', Body: 'Hello', NumMedia: '0' })
    const res = await POST(req)

    expect(res.status).toBe(403)

    process.env.MOCK_TWILIO = original
  })

  // ── Database error on request insert ──────────────────────────────────────

  it('returns fallback TwiML if DB insert fails', async () => {
    const clientQuery  = mockQuery({ data: { id: 'client-uuid-1', tier: 'professional' } })
    const websiteQuery = mockQuery({ data: { id: 'website-uuid-1', github_repo_url: 'owner/repo' } })
    const requestQuery = mockQuery({ data: null, error: { message: 'DB error' } })

    ;(mockSupabase.from as Mock).mockImplementation((table: string) => {
      if (table === 'clients')  return clientQuery
      if (table === 'websites') return websiteQuery
      if (table === 'requests') return requestQuery
      return mockQuery({ data: null })
    })

    const req = makeRequest({ From: '+15551234567', Body: 'Update the site', NumMedia: '0' })
    const res = await POST(req)

    expect(parseTwiml(await res.text())).toContain("follow up")
    // after() should NOT be called when request save fails
    expect(afterCallback).toBeNull()
  })
})
