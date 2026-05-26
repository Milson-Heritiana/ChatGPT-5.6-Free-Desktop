import { NextResponse } from 'next/server'
import { signToken, verifyToken } from '@/lib/auth'

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'Mdpadmin1'

export async function GET(request) {
  try {
    const token = request.cookies.get('void_auth')?.value
    if (!token) {
      return NextResponse.json({ authenticated: false, error: 'No token' }, { status: 401 })
    }
    const payload = await verifyToken(token)
    if (!payload) {
      return NextResponse.json({ authenticated: false, error: 'Invalid token' }, { status: 401 })
    }
    return NextResponse.json({ authenticated: true, role: payload.role })
  } catch (err) {
    return NextResponse.json({ authenticated: false, error: err.message }, { status: 401 })
  }
}

export async function POST(request) {
  try {
    const { password } = await request.json()

    if (password !== ADMIN_PASSWORD) {
      return NextResponse.json({ error: 'Mot de passe incorrect' }, { status: 401 })
    }

    const token = await signToken({ role: 'admin', user: 'admin' })

    const response = NextResponse.json({ success: true })
    response.cookies.set('void_auth', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 60 * 60 * 24, // 24h
      path: '/',
    })

    return response
  } catch (err) {
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

export async function DELETE() {
  const response = NextResponse.json({ success: true })
  response.cookies.delete('void_auth')
  return response
}
