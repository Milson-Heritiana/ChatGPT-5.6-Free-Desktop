import { NextResponse } from 'next/server'
import { signToken } from '@/lib/auth'

function getAdminPassword() {
  return process.env.ADMIN_PASSWORD
}

export async function POST(request) {
  try {
    const { password } = await request.json()
    const adminPassword = getAdminPassword()

    if (!adminPassword) {
      return NextResponse.json({ error: 'Authentication is not configured' }, { status: 500 })
    }

    if (typeof password !== 'string' || password !== adminPassword) {
      return NextResponse.json({ error: 'Incorrect password' }, { status: 401 })
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
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

export async function DELETE() {
  const response = NextResponse.json({ success: true })
  response.cookies.delete('void_auth')
  return response
}
