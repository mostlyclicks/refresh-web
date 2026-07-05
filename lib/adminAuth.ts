import { NextRequest, NextResponse } from 'next/server'
import { createHash } from 'crypto'

// Same auth model as proxy.ts: the admin_session cookie must hold the
// SHA-256 hash of ADMIN_PASSWORD. proxy.ts protects the admin *pages*;
// this protects the admin *APIs*, which are otherwise callable by anyone.
export function isAdminRequest(req: NextRequest): boolean {
  const adminPassword = process.env.ADMIN_PASSWORD
  // No password configured — allow through in dev (mirrors proxy.ts)
  if (!adminPassword) return true

  const expected = createHash('sha256').update(adminPassword).digest('hex')
  return req.cookies.get('admin_session')?.value === expected
}

/** Returns a 401 response to short-circuit with, or null when authorized. */
export function requireAdmin(req: NextRequest): NextResponse | null {
  if (isAdminRequest(req)) return null
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
}
