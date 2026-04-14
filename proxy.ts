import { NextRequest, NextResponse } from 'next/server'

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD

export function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl

  if (pathname.startsWith('/admin')) {
    const authHeader = req.headers.get('authorization')

    if (!ADMIN_PASSWORD) return NextResponse.next() // dev mode: no password set

    if (!authHeader || authHeader !== `Bearer ${ADMIN_PASSWORD}`) {
      // Check for cookie-based session instead
      const session = req.cookies.get('admin_session')
      if (!session || session.value !== ADMIN_PASSWORD) {
        return NextResponse.redirect(new URL('/admin/login', req.url))
      }
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/admin/:path*'],
}
