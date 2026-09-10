import { NextResponse } from 'next/server'
import { verifyToken, getAuthCookie } from '@/lib/auth'
import { getPhotos, addPhoto, deletePhoto, clearPhotos } from '@/lib/photos'

const MAX_IMAGE_BYTES = 5 * 1024 * 1024
const ALLOWED_IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif'])

function validatePhotoInput(src, label) {
  if (typeof src !== 'string') return 'Image is required'

  const match = src.match(/^data:(image\/(?:jpeg|png|webp|gif));base64,([A-Za-z0-9+/=]+)$/)
  if (!match || !ALLOWED_IMAGE_TYPES.has(match[1])) return 'Only JPEG, PNG, WEBP, and GIF images are allowed'

  const bytes = Math.floor((match[2].length * 3) / 4)
  if (bytes > MAX_IMAGE_BYTES) return 'Images must be 5 MB or smaller'
  if (label !== undefined && (typeof label !== 'string' || label.length > 120)) return 'Labels must be 120 characters or fewer'

  return null
}

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
  if (!authed) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const { src, label } = await request.json()
    const validationError = validatePhotoInput(src, label)
    if (validationError) return NextResponse.json({ error: validationError }, { status: 400 })

    const photo = addPhoto({ src, label })
    return NextResponse.json({ photo })
  } catch {
    return NextResponse.json({ error: 'Error' }, { status: 500 })
  }
}

// DELETE - admin only
export async function DELETE(request) {
  const authed = await isAuthenticated(request)
  if (!authed) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')
  const all = searchParams.get('all')

  if (all === 'true') {
    clearPhotos()
    return NextResponse.json({ success: true })
  }

  if (!id) return NextResponse.json({ error: 'Photo ID is required' }, { status: 400 })
  deletePhoto(id)
  return NextResponse.json({ success: true })
}
