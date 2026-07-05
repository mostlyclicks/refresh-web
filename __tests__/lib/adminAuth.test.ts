/**
 * Admin API auth tests — the cookie gate shared by all admin-facing routes.
 *
 * Run: npx vitest __tests__/lib/adminAuth.test.ts
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { createHash } from 'crypto'
import { NextRequest } from 'next/server'
import { isAdminRequest, requireAdmin } from '@/lib/adminAuth'

function makeRequest(cookie?: string): NextRequest {
  return new NextRequest('http://localhost/api/approve', {
    method: 'POST',
    headers: cookie ? { cookie } : {},
  })
}

const PASSWORD = 'hunter2'
const VALID_TOKEN = createHash('sha256').update(PASSWORD).digest('hex')

describe('adminAuth', () => {
  beforeEach(() => {
    process.env.ADMIN_PASSWORD = PASSWORD
  })

  afterEach(() => {
    delete process.env.ADMIN_PASSWORD
  })

  it('allows everything through when ADMIN_PASSWORD is not set (dev mode)', () => {
    delete process.env.ADMIN_PASSWORD
    expect(isAdminRequest(makeRequest())).toBe(true)
    expect(requireAdmin(makeRequest())).toBeNull()
  })

  it('rejects a request with no session cookie', () => {
    expect(isAdminRequest(makeRequest())).toBe(false)
    const res = requireAdmin(makeRequest())
    expect(res?.status).toBe(401)
  })

  it('rejects a request with a wrong cookie value', () => {
    expect(isAdminRequest(makeRequest('admin_session=not-the-hash'))).toBe(false)
  })

  it('rejects a hash of a different password', () => {
    const wrongToken = createHash('sha256').update('wrong-password').digest('hex')
    expect(isAdminRequest(makeRequest(`admin_session=${wrongToken}`))).toBe(false)
  })

  it('accepts the correct session cookie', () => {
    expect(isAdminRequest(makeRequest(`admin_session=${VALID_TOKEN}`))).toBe(true)
    expect(requireAdmin(makeRequest(`admin_session=${VALID_TOKEN}`))).toBeNull()
  })
})
