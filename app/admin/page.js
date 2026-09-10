'use client'
import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import styles from './admin.module.css'

const TABS = ['upload', 'photos', 'claude', 'settings']
const TAB_LABELS = { upload: 'UPLOAD', photos: 'PHOTOS', claude: 'CLAUDE MCP', settings: 'SETTINGS' }

export default function AdminPage() {
  const router = useRouter()
  const [authChecked, setAuthChecked] = useState(false)
  const [tab, setTab] = useState('upload')
  const [photos, setPhotos] = useState([])
  const [pending, setPending] = useState([])
  const [label, setLabel] = useState('')
  const [toast, setToast] = useState(null)
  const [dragging, setDragging] = useState(false)

  // Claude chat
  const [apiConnected, setApiConnected] = useState(false)
  const [chatMsgs, setChatMsgs] = useState([{ type: 'sys', text: 'Connect your API key to get started...' }])
  const [chatInput, setChatInput] = useState('')
  const [chatLoading, setChatLoading] = useState(false)
  const chatRef = useRef(null)
  const chatHistory = useRef([])

  // MCP
  const [mcpUrl, setMcpUrl] = useState('')
  const [mcpSecret, setMcpSecret] = useState('')
  const [mcpConfigured, setMcpConfigured] = useState(false)

  useEffect(() => {
    // Check that the token exists and is valid.
    const checkAuth = async () => {
      try {
        const res = await fetch('/api/auth', { method: 'GET', credentials: 'include' })
        if (!res.ok && res.status === 401) {
          console.log('[v0] [admin] Not authenticated, redirecting to login')
          router.push('/login')
          return
        }
      } catch (err) {
        console.log('[v0] [admin] Auth check error:', err.message)
      }
      setAuthChecked(true)
    }

    checkAuth()
    fetchPhotos()
    const savedMcp = localStorage.getItem('void_mcpurl') || ''
    const savedSec = localStorage.getItem('void_mcpsec') || ''
    fetch('/api/claude').then(res => res.json()).then(data => setApiConnected(data.configured === true))
    if (savedMcp) { setMcpUrl(savedMcp); setMcpConfigured(true) }
    if (savedSec) setMcpSecret(savedSec)
  }, [])

  useEffect(() => {
    if (chatRef.current) chatRef.current.scrollTop = chatRef.current.scrollHeight
  }, [chatMsgs])

  const showToast = (msg, type = '') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3000)
  }

  const fetchPhotos = async () => {
    const res = await fetch('/api/photos')
    const d = await res.json()
    setPhotos(d.photos || [])
  }

  // ── UPLOAD ──
  const handleFiles = (files) => {
    Array.from(files).forEach(f => {
      const reader = new FileReader()
      reader.onload = (e) => {
        setPending(prev => [...prev, { src: e.target.result, name: f.name, id: Date.now() + Math.random() }])
      }
      reader.readAsDataURL(f)
    })
  }

  const publish = async () => {
    if (!pending.length) return
    let count = 0
    for (const f of pending) {
      const res = await fetch('/api/photos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ src: f.src, label }),
      })
      if (res.ok) count++
      else if (res.status === 401) { router.push('/login'); return }
    }
    setPending([]); setLabel('')
    fetchPhotos()
    showToast(`${count} photo(s) published ✓`, 'ok')
  }

  const deletePhoto = async (id) => {
    await fetch(`/api/photos?id=${id}`, { method: 'DELETE' })
    fetchPhotos()
    showToast('Photo deleted', 'ok')
  }

  const deleteAll = async () => {
    if (!confirm('Delete all photos?')) return
    await fetch('/api/photos?all=true', { method: 'DELETE' })
    fetchPhotos()
    showToast('Gallery cleared', 'ok')
  }

  const logout = async () => {
    await fetch('/api/auth', { method: 'DELETE' })
    router.push('/login')
  }

  // ── LOCAL AI CHAT ──
  const sendChat = async (text) => {
    if (!text || !apiConnected) return
    setChatInput('')
    setChatMsgs(prev => [...prev, { type: 'user', text }])
    chatHistory.current.push({ role: 'user', content: text })
    setChatLoading(true)

    try {
      const res = await fetch('/api/claude', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ messages: chatHistory.current }),
      })
      const d = await res.json()
      if (!res.ok) throw new Error(d.error || 'Local AI request failed')
      const reply = d.reply || 'No response received'
      chatHistory.current.push({ role: 'assistant', content: reply })
      setChatMsgs(prev => [...prev, { type: 'ai', text: reply }])
    } catch (e) {
      setChatMsgs(prev => [...prev, { type: 'sys', text: 'Error: ' + e.message }])
    }
    setChatLoading(false)
  }

  // ── MCP ──
  const saveMcp = () => {
    const url = mcpUrl.trim().replace(/\/$/, '')
    if (!url) { showToast('Enter your site URL', 'err'); return }
    localStorage.setItem('void_mcpurl', url)
    localStorage.setItem('void_mcpsec', mcpSecret)
    setMcpConfigured(true)
    showToast('MCP configuration saved ✓', 'ok')
  }

  const mcpSnippet = mcpUrl
    ? JSON.stringify({
        mcpServers: {
          'void-gallery': {
            url: mcpUrl.trim().replace(/\/$/, '') + '/mcp',
            type: 'sse',
            ...(mcpSecret ? { 'x-mcp-secret': mcpSecret } : {}),
            name: 'VOID Gallery',
          },
        },
      }, null, 2)
    : null

  const copySnippet = () => {
    if (!mcpSnippet) return
    navigator.clipboard.writeText(mcpSnippet).then(() => showToast('Copied ✓', 'ok'))
  }

  return (
    <div className={styles.root}>
      {/* SIDEBAR */}
      <aside className={styles.sidebar}>
        <div className={styles.sidebarLogo}>V<b>O</b>ID</div>
        <p className={styles.sidebarSection}>Navigation</p>
        <nav>
          {TABS.map(t => (
            <button key={t} className={`${styles.navBtn} ${tab === t ? styles.active : ''}`} onClick={() => setTab(t)}>
              <span className={styles.navIcon}>{t === 'upload' ? '⬡' : t === 'photos' ? '◈' : t === 'claude' ? '∴' : '⚙'}</span>
              {TAB_LABELS[t]}
            </button>
          ))}
        </nav>
        <div className={styles.sidebarFooter}>
          <a href="/" target="_blank" className={styles.sidebarLink}>↗ View gallery</a>
          <button className={styles.sidebarLink} onClick={logout}>← Log out</button>
        </div>
      </aside>

      {/* MAIN */}
      <div className={styles.main}>
        {/* TOPBAR */}
        <div className={styles.topbar}>
          <span className={styles.topTitle}>{TAB_LABELS[tab]}</span>
          <div className={styles.topRight}>
            <span className={styles.badge}><span className={`${styles.dot} ${styles.on}`} /> ADMIN ACTIF</span>
            <span className={styles.badge}><span className={`${styles.dot} ${mcpConfigured ? styles.on : ''}`} /> MCP</span>
          </div>
        </div>

        {/* ── UPLOAD PANEL ── */}
        {tab === 'upload' && (
          <div className={styles.panel}>
            <div className={styles.statsRow}>
              <div className={styles.statCard}><div className={styles.statNum}>{photos.length}</div><div className={styles.statLabel}>Published photos</div></div>
              <div className={styles.statCard}><div className={styles.statNum}>{pending.length}</div><div className={styles.statLabel}>Pending</div></div>
              <div className={styles.statCard}><div className={styles.statNum}>{apiConnected ? '●' : '○'}</div><div className={styles.statLabel}>Local AI</div></div>
            </div>

            <div
              className={`${styles.dropZone} ${dragging ? styles.dragging : ''}`}
              onDragOver={e => { e.preventDefault(); setDragging(true) }}
              onDragLeave={() => setDragging(false)}
              onDrop={e => { e.preventDefault(); setDragging(false); handleFiles(e.dataTransfer.files) }}
              onClick={() => document.getElementById('fileInput').click()}
            >
              <input id="fileInput" type="file" accept="image/*" multiple style={{ display: 'none' }} onChange={e => handleFiles(e.target.files)} />
              <div className={styles.dropIcon}>◈</div>
              <div className={styles.dropText}>
                <strong>Drag photos here</strong>
                JPG · PNG · WEBP — multiple files accepted
              </div>
            </div>

            {pending.length > 0 && (
              <div className={styles.previewGrid}>
                {pending.map(f => (
                  <div key={f.id} className={styles.previewItem}>
                    <img src={f.src} alt="" />
                    <button className={styles.previewDel} onClick={() => setPending(p => p.filter(x => x.id !== f.id))}>✕</button>
                  </div>
                ))}
              </div>
            )}

            <div className={styles.formRow}>
              <div className={styles.field}>
                <label className={styles.fieldLabel}>Label / Title (optional)</label>
                <input className={styles.input} value={label} onChange={e => setLabel(e.target.value)} placeholder="ex: Session Studio 01" />
              </div>
            </div>

            <div className={styles.btnRow}>
              <button className={styles.btnPrimary} onClick={publish} disabled={!pending.length}>⬡ PUBLISH {pending.length > 0 ? `(${pending.length})` : ''}</button>
              <button className={styles.btnGhost} onClick={() => { setPending([]); setLabel('') }}>CLEAR</button>
            </div>
          </div>
        )}

        {/* ── PHOTOS PANEL ── */}
        {tab === 'photos' && (
          <div className={styles.panel}>
            <div className={styles.photosHeader}>
              <span className={styles.fieldLabel}>{photos.length} PHOTO{photos.length !== 1 ? 'S' : ''}</span>
              <button className={styles.btnDanger} onClick={deleteAll}>DELETE ALL</button>
            </div>
            {photos.length === 0
              ? <p className={styles.empty}>No photos published.</p>
              : (
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>Preview</th><th>Label</th><th>Date</th><th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {photos.map(p => (
                      <tr key={p.id}>
                        <td><img className={styles.thumb} src={p.src} alt="" /></td>
                        <td className={styles.italic}>{p.label || '—'}</td>
                        <td className={styles.mono}>{new Date(p.date).toLocaleDateString('en-US')}</td>
                        <td><button className={styles.btnDanger} onClick={() => deletePhoto(p.id)}>DELETE</button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )
            }
          </div>
        )}

        {/* ── LOCAL AI AND MCP PANEL ── */}
        {tab === 'claude' && (
          <div className={styles.panel}>
            <div className={styles.mcpGrid}>
              {/* MCP Config */}
              <div className={styles.mcpCard}>
                <h2 className={styles.mcpTitle}>CONFIG <span>MCP</span></h2>
                <p className={styles.mcpDesc}>Connect an external AI tool to this app via MCP.</p>
                <div className={styles.statusRow}>
                  <span className={`${styles.dot} ${mcpConfigured ? styles.on : ''}`} />
                  <span className={styles.statusTxt}>{mcpConfigured ? 'CONFIGURED' : 'NOT CONFIGURED'}</span>
                </div>
                <div className={styles.field}>
                  <label className={styles.fieldLabel}>Hosted site URL</label>
                  <input className={styles.input} value={mcpUrl} onChange={e => setMcpUrl(e.target.value)} placeholder="https://void-gallery.vercel.app" />
                </div>
                <div className={styles.field} style={{ marginTop: 12 }}>
                  <label className={styles.fieldLabel}>MCP secret key (optional)</label>
                  <input className={styles.input} type="password" value={mcpSecret} onChange={e => setMcpSecret(e.target.value)} placeholder="Shared key" />
                </div>
                <div className={styles.btnRow} style={{ marginTop: 16 }}>
                  <button className={styles.btnPrimary} onClick={saveMcp}>SAVE</button>
                </div>
                {mcpSnippet && (
                  <>
                    <p className={styles.fieldLabel} style={{ marginTop: 20, marginBottom: 8 }}>MCP server configuration script</p>
                    <pre className={styles.codeBox}>{mcpSnippet}</pre>
                    <button className={styles.btnGhost} onClick={copySnippet} style={{ width: '100%', marginTop: 8 }}>COPY SCRIPT</button>
                  </>
                )}
              </div>

              {/* Chat */}
              <div className={styles.mcpCard}>
                <h2 className={styles.mcpTitle}>CHAT <span>LOCAL AI</span></h2>
                <p className={styles.mcpDesc}>Generate content locally with a free Ollama model.</p>
                <div className={styles.statusRow}>
                  <span className={`${styles.dot} ${apiConnected ? styles.on : ''}`} />
                  <span className={styles.statusTxt}>{apiConnected ? 'CONNECTED' : 'NOT CONNECTED'}</span>
                </div>
                <div className={styles.field}>
                  <p className={styles.mcpDesc}>No API key or paid provider is required.</p>
                </div>
                <div className={styles.chatBox} ref={chatRef}>
                  {chatMsgs.map((m, i) => (
                    <div key={i} className={`${styles.chatMsg} ${styles['msg_' + m.type]}`}>{m.text}</div>
                  ))}
                  {chatLoading && <div className={`${styles.chatMsg} ${styles.msg_ai}`}><span className={styles.spin}>⟳</span> Responding...</div>}
                </div>
                <div className={styles.inputRow}>
                  <input
                    className={styles.input}
                    value={chatInput}
                    onChange={e => setChatInput(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && sendChat(chatInput)}
                    placeholder="Ask the local AI..."
                    disabled={!apiConnected || chatLoading}
                  />
                  <button className={styles.btnPrimary} onClick={() => sendChat(chatInput)} disabled={!apiConnected || chatLoading}>SEND</button>
                </div>
                <div className={styles.quickBtns}>
                  {['🔥 Viral hooks', '◈ Instagram captions', '▶ Reel ideas', '✦ Style analysis'].map((q, i) => {
                    const prompts = [
                      'Generate 3 dark viral hooks for my photography gallery',
                      'Write 5 dark, mysterious Instagram captions for a gallery photo',
                      'Give me Reel video ideas for a dark gothic aesthetic',
                      'Analyze the dark visual style and give advice to improve engagement',
                    ]
                    return <button key={i} className={styles.qBtn} onClick={() => sendChat(prompts[i])}>{q}</button>
                  })}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── SETTINGS PANEL ── */}
        {tab === 'settings' && (
          <div className={styles.panel}>
            <div className={styles.settingsGrid}>
              <div className={styles.settingsCard}>
                <h3 className={styles.settingsTitle}>Infos</h3>
                <div className={styles.infoGrid}>
                  <span>Framework</span><span>Next.js 14</span>
                  <span>Hosting</span><span>Vercel</span>
                  <span>AI</span><span>Ollama / llama3.2</span>
                  <span>Auth</span><span>JWT HttpOnly</span>
                  <span>Photos</span><span>{photos.length} published</span>
                </div>
              </div>
              <div className={styles.settingsCard}>
                <h3 className={styles.settingsTitle}>Danger Zone</h3>
                <p className={styles.settingsDesc}>These actions cannot be undone.</p>
                <button className={styles.btnDanger} onClick={deleteAll}>CLEAR ENTIRE GALLERY</button>
                <button className={styles.btnDanger} style={{ marginTop: 12 }} onClick={logout}>LOG OUT</button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* TOAST */}
      {toast && (
        <div className={`${styles.toast} ${toast.type === 'ok' ? styles.toastOk : toast.type === 'err' ? styles.toastErr : ''}`}>
          {toast.type === 'ok' ? '✓' : '✕'} {toast.msg}
        </div>
      )}
    </div>
  )
}
