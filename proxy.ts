import { NextRequest, NextResponse } from 'next/server'
import { createHash } from 'crypto'

export function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl

  // Exclude the login page itself from protection
  if (pathname.startsWith('/admin/login')) return NextResponse.next()

  if (pathname.startsWith('/admin')) {
    const adminPassword = process.env.ADMIN_PASSWORD

    // No password set — allow through in dev
    if (!adminPassword) return NextResponse.next()

    const expectedToken = createHash('sha256').update(adminPassword).digest('hex')
    const session = req.cookies.get('admin_session')

    if (!session || session.value !== expectedToken) {
      return NextResponse.redirect(new URL('/admin/login', req.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/admin/:path*'],
}
