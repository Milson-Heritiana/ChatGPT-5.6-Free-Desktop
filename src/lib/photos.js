// In-memory store for demo (Vercel edge compatible)
// In production, swap with Vercel KV, PlanetScale, or Supabase

let photosStore = []

export function getPhotos() {
  return [...photosStore].sort((a, b) => new Date(b.date) - new Date(a.date))
}

export function addPhoto(photo) {
  const newPhoto = {
    id: Date.now().toString() + Math.random().toString(36).slice(2),
    src: photo.src,
    label: photo.label || '',
    date: new Date().toISOString(),
  }
  photosStore.unshift(newPhoto)
  return newPhoto
}

export function deletePhoto(id) {
  const before = photosStore.length
  photosStore = photosStore.filter(p => p.id !== id)
  return photosStore.length < before
}

export function clearPhotos() {
  photosStore = []
}
