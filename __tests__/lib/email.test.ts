/**
 * Email lib tests — Resend API wrapper.
 *
 * Core contract: sendEmail NEVER throws. Missing key, API errors, and
 * network failures all resolve to { sent: false }.
 *
 * Run: npx vitest __tests__/lib/email.test.ts
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { sendEmail, sendUpdateLiveEmail, updateLiveEmailHtml } from '@/lib/email'

const mockFetch = vi.fn()
vi.stubGlobal('fetch', mockFetch)

const args = { to: 'client@example.com', subject: 'Test', html: '<p>Hi</p>' }

describe('sendEmail', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    process.env.RESEND_API_KEY = 're_test_key'
    delete process.env.EMAIL_FROM
    delete process.env.EMAIL_REPLY_TO
    mockFetch.mockResolvedValue({ ok: true, json: async () => ({ id: 'email_123' }) })
  })

  afterEach(() => {
    delete process.env.RESEND_API_KEY
  })

  it('skips silently when RESEND_API_KEY is not set', async () => {
    delete process.env.RESEND_API_KEY
    const result = await sendEmail(args)
    expect(result.sent).toBe(false)
    expect(result.error).toContain('RESEND_API_KEY')
    expect(mockFetch).not.toHaveBeenCalled()
  })

  it('posts to the Resend API with the right payload', async () => {
    const result = await sendEmail(args)

    expect(result).toEqual({ sent: true, id: 'email_123' })
    expect(mockFetch).toHaveBeenCalledWith(
      'https://api.resend.com/emails',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({ Authorization: 'Bearer re_test_key' }),
      })
    )
    const body = JSON.parse(mockFetch.mock.calls[0][1].body)
    expect(body.to).toEqual(['client@example.com'])
    expect(body.subject).toBe('Test')
    expect(body.from).toBe('RefreshWeb <notifications@refreshweb.io>')
    expect(body.reply_to).toBeUndefined()
  })

  it('uses EMAIL_FROM and EMAIL_REPLY_TO overrides when set', async () => {
    process.env.EMAIL_FROM = 'Custom <hi@example.com>'
    process.env.EMAIL_REPLY_TO = 'carlos@mostlyclicks.com'

    await sendEmail(args)

    const body = JSON.parse(mockFetch.mock.calls[0][1].body)
    expect(body.from).toBe('Custom <hi@example.com>')
    expect(body.reply_to).toBe('carlos@mostlyclicks.com')
  })

  it('returns sent:false on a Resend API error without throwing', async () => {
    mockFetch.mockResolvedValue({ ok: false, status: 422, text: async () => 'bad domain' })
    const result = await sendEmail(args)
    expect(result.sent).toBe(false)
    expect(result.error).toContain('422')
  })

  it('returns sent:false on a network failure without throwing', async () => {
    mockFetch.mockRejectedValue(new Error('ECONNREFUSED'))
    const result = await sendEmail(args)
    expect(result.sent).toBe(false)
    expect(result.error).toBe('ECONNREFUSED')
  })
})

describe('sendUpdateLiveEmail / template', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    process.env.RESEND_API_KEY = 're_test_key'
    mockFetch.mockResolvedValue({ ok: true, json: async () => ({ id: 'email_456' }) })
  })

  afterEach(() => {
    delete process.env.RESEND_API_KEY
  })

  it('sends with the live-update subject and templated body', async () => {
    const result = await sendUpdateLiveEmail({
      to: 'client@example.com',
      clientName: 'Bill',
      summary: 'Updated the homepage headline',
      siteUrl: 'https://bills-bikes.vercel.app',
    })

    expect(result.sent).toBe(true)
    const body = JSON.parse(mockFetch.mock.calls[0][1].body)
    expect(body.subject).toBe('Your website update is live')
    expect(body.html).toContain('Hi Bill')
    expect(body.html).toContain('Updated the homepage headline')
    expect(body.html).toContain('https://bills-bikes.vercel.app')
  })

  it('omits the site button when siteUrl is null', () => {
    const html = updateLiveEmailHtml({ clientName: 'Bill', summary: 'x', siteUrl: null })
    expect(html).not.toContain('View your site')
  })
})
