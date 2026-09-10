'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import styles from './login.module.css'

export default function LoginPage() {
  const router = useRouter()
  const [pw, setPw] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleLogin = async () => {
    if (!pw) return
    setLoading(true); setError('')
    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: pw }),
        credentials: 'include',
      })
      if (res.ok) {
        // Give the cookie a moment to be set before redirecting.
        setTimeout(() => {
          router.push('/admin')
        }, 100)
      } else {
        const d = await res.json()
        setError(d.error || 'Error')
        setPw('')
      }
    } catch {
      setError('Network error')
    }
    setLoading(false)
  }

  return (
    <div className={styles.root}>
      <div className={styles.bgLines}>
        {[...Array(5)].map((_, i) => <span key={i} />)}
      </div>
      <div className={styles.bgGlow} />

      <div className={styles.box}>
        <p className={styles.eyebrow}>Restricted access</p>
        <h1 className={styles.title}>ADMIN<br />ACCESS</h1>
        <p className={styles.sub}>Private area — authentication required.</p>

        <label className={styles.label}>Password</label>
        <input
          className={styles.input}
          type="password"
          value={pw}
          onChange={e => setPw(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleLogin()}
          placeholder="••••••••••"
          autoFocus
        />

        <button className={styles.btn} onClick={handleLogin} disabled={loading}>
          {loading ? '...' : 'ENTRER'}
        </button>

        {error && <p className={styles.err}>{error}</p>}

        <a href="/" className={styles.back}>← back to gallery</a>
        <span className={styles.tag}>VOID.ADMIN</span>
      </div>
    </div>
  )
}
