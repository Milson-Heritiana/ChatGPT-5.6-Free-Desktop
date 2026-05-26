import { NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth'

export async function middleware(request) {
  const { pathname } = request.nextUrl

  // Protéger toutes les routes /admin
  if (pathname.startsWith('/admin')) {
    try {
      const token = request.cookies.get('void_auth')?.value
      
      if (!token) {
        console.log('[v0] [middleware] No token found for', pathname)
        return NextResponse.redirect(new URL('/login', request.url))
      }

      const payload = await verifyToken(token)
      
      if (!payload) {
        console.log('[v0] [middleware] Invalid token for', pathname)
        return NextResponse.redirect(new URL('/login', request.url))
      }

      if (payload.role !== 'admin') {
        console.log('[v0] [middleware] Unauthorized role:', payload.role)
        return NextResponse.redirect(new URL('/login', request.url))
      }

      console.log('[v0] [middleware] Authorized access to', pathname)
      return NextResponse.next()
    } catch (err) {
      console.error('[v0] [middleware] Error:', err.message)
      return NextResponse.redirect(new URL('/login', request.url))
    }
  }

  // Protéger les API admin
  if (pathname.startsWith('/api/photos') && request.method !== 'GET') {
    try {
      const token = request.cookies.get('void_auth')?.value
      if (!token) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }
      const payload = await verifyToken(token)
      if (!payload || payload.role !== 'admin') {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }
    } catch (err) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/admin/:path*', '/api/photos/:path*'],
}
