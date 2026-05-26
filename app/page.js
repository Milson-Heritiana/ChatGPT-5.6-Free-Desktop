'use client'
import { useState, useEffect, useCallback } from 'react'
import styles from './page.module.css'

export default function GalleryPage() {
  const [photos, setPhotos] = useState([])
  const [lightbox, setLightbox] = useState(null)
  const [lbIdx, setLbIdx] = useState(0)
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    fetch('/api/photos')
      .then(r => r.json())
      .then(d => { setPhotos(d.photos || []); setLoaded(true) })
      .catch(() => setLoaded(true))
  }, [])

  const openLb = useCallback((idx) => {
    setLbIdx(idx)
    setLightbox(photos[idx])
  }, [photos])

  useEffect(() => {
    const handler = (e) => {
      if (!lightbox) return
      if (e.key === 'Escape') setLightbox(null)
      if (e.key === 'ArrowLeft') { const i = (lbIdx - 1 + photos.length) % photos.length; setLbIdx(i); setLightbox(photos[i]) }
      if (e.key === 'ArrowRight') { const i = (lbIdx + 1) % photos.length; setLbIdx(i); setLightbox(photos[i]) }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [lightbox, lbIdx, photos])

  return (
    <div className={styles.root}>
      {/* NAV */}
      <nav className={styles.nav}>
        <span className={styles.logo}>V<b>O</b>ID</span>
        <a href="/login" className={styles.adminLink}>⬡ ADMIN</a>
      </nav>

      {/* HERO */}
      <section className={styles.hero}>
        <div className={styles.heroGlow} />
        <div className={styles.heroLine} />
        <p className={styles.heroEye}>001 — COLLECTION</p>
        <h1 className={styles.heroTitle}>
          DARK<span className={styles.heroOutline}>ARCHIVE</span>
        </h1>
        <p className={styles.heroSub}>Une galerie sans compromis. Des visuels bruts, intenses, authentiques.</p>
        <div className={styles.scrollHint}>SCROLL DOWN</div>
      </section>

      {/* GALLERY */}
      <section className={styles.gallerySection}>
        <div className={styles.galleryHeader}>
          <span className={styles.galleryLabel}>Collection Complète</span>
          <span className={styles.galleryCount}>{photos.length} photo{photos.length !== 1 ? 's' : ''}</span>
        </div>

        {!loaded && <p className={styles.empty}>Chargement...</p>}
        {loaded && photos.length === 0 && (
          <p className={styles.empty}>Aucune photo publiée pour l'instant.</p>
        )}

        {photos.length > 0 && (
          <div className={styles.masonry}>
            {photos.map((photo, i) => (
              <div
                key={photo.id}
                className={styles.photoCard}
                style={{ animationDelay: `${i * 0.06}s` }}
                onClick={() => openLb(i)}
              >
                <img src={photo.src} alt={photo.label || ''} />
                <div className={styles.cardOverlay}>
                  <span className={styles.cardLabel}>
                    {photo.label || `VOID.${String(i + 1).padStart(3, '0')}`}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <footer className={styles.footer}>
        <p>© 2026 VOID Gallery</p>
        <p>Dark Archive</p>
      </footer>

      {/* LIGHTBOX */}
      {lightbox && (
        <div className={styles.lb} onClick={() => setLightbox(null)}>
          <button className={styles.lbClose} onClick={() => setLightbox(null)}>✕</button>
          <button className={styles.lbPrev} onClick={e => { e.stopPropagation(); const i = (lbIdx - 1 + photos.length) % photos.length; setLbIdx(i); setLightbox(photos[i]) }}>‹</button>
          <img src={lightbox.src} alt="" onClick={e => e.stopPropagation()} />
          <button className={styles.lbNext} onClick={e => { e.stopPropagation(); const i = (lbIdx + 1) % photos.length; setLbIdx(i); setLightbox(photos[i]) }}>›</button>
        </div>
      )}
    </div>
  )
}
