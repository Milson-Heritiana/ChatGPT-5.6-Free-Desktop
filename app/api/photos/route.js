import { NextResponse } from 'next/server'
import { verifyToken, getAuthCookie } from '@/lib/auth'
import { getPhotos, addPhoto, deletePhoto, clearPhotos } from '@/lib/photos'

async function isAuthenticated(request) {
  const token = getAuthCookie(request)
  if (!token) return false
  const payload = await verifyToken(token)
  return payload?.role === 'admin'
}

// GET - public, returns all photos
export async function GET() {
  const photos = getPhotos()
  return NextResponse.json({ photos })
}

// POST - admin only, add photo
export async function POST(request) {
  const authed = await isAuthenticated(request)
  if (!authed) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  try {
    const { src, label } = await request.json()
    if (!src) return NextResponse.json({ error: 'Image requise' }, { status: 400 })

    const photo = addPhoto({ src, label })
    return NextResponse.json({ photo })
  } catch {
    return NextResponse.json({ error: 'Erreur' }, { status: 500 })
  }
}

// DELETE - admin only
export async function DELETE(request) {
  const authed = await isAuthenticated(request)
  if (!authed) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')
  const all = searchParams.get('all')

  if (all === 'true') {
    clearPhotos()
    return NextResponse.json({ success: true })
  }

  if (!id) return NextResponse.json({ error: 'ID requis' }, { status: 400 })
  deletePhoto(id)
  return NextResponse.json({ success: true })
}
