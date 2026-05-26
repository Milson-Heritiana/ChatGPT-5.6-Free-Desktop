'use client'
import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import styles from './admin.module.css'

const TABS = ['upload', 'photos', 'claude', 'settings']
const TAB_LABELS = { upload: 'UPLOAD', photos: 'PHOTOS', claude: 'CLAUDE MCP', settings: 'PARAMÈTRES' }

export default function AdminPage() {
  const router = useRouter()
  const [tab, setTab] = useState('upload')
  const [photos, setPhotos] = useState([])
  const [pending, setPending] = useState([])
  const [label, setLabel] = useState('')
  const [toast, setToast] = useState(null)
  const [dragging, setDragging] = useState(false)

  // Claude chat
  const [apiKey, setApiKey] = useState('')
  const [apiConnected, setApiConnected] = useState(false)
  const [chatMsgs, setChatMsgs] = useState([{ type: 'sys', text: 'Connecte ta clé API pour démarrer...' }])
  const [chatInput, setChatInput] = useState('')
  const [chatLoading, setChatLoading] = useState(false)
  const chatRef = useRef(null)
  const chatHistory = useRef([])

  // MCP
  const [mcpUrl, setMcpUrl] = useState('')
  const [mcpSecret, setMcpSecret] = useState('')
  const [mcpConfigured, setMcpConfigured] = useState(false)

  useEffect(() => {
    fetchPhotos()
    const savedKey = localStorage.getItem('void_apikey') || ''
    const savedMcp = localStorage.getItem('void_mcpurl') || ''
    const savedSec = localStorage.getItem('void_mcpsec') || ''
    if (savedKey) { setApiKey(savedKey); setApiConnected(true) }
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
    showToast(`${count} photo(s) publiée(s) ✓`, 'ok')
  }

  const deletePhoto = async (id) => {
    await fetch(`/api/photos?id=${id}`, { method: 'DELETE' })
    fetchPhotos()
    showToast('Photo supprimée', 'ok')
  }

  const deleteAll = async () => {
    if (!confirm('Supprimer toutes les photos ?')) return
    await fetch('/api/photos?all=true', { method: 'DELETE' })
    fetchPhotos()
    showToast('Galerie vidée', 'ok')
  }

  const logout = async () => {
    await fetch('/api/auth', { method: 'DELETE' })
    router.push('/login')
  }

  // ── CLAUDE CHAT ──
  const saveApiKey = () => {
    if (!apiKey.startsWith('sk-ant')) { showToast('Clé invalide', 'err'); return }
    localStorage.setItem('void_apikey', apiKey)
    setApiConnected(true)
    showToast('Clé API sauvegardée ✓', 'ok')
  }

  const sendChat = async (text) => {
    if (!text || !apiConnected) return
    setChatInput('')
    setChatMsgs(prev => [...prev, { type: 'user', text }])
    chatHistory.current.push({ role: 'user', content: text })
    setChatLoading(true)

    try {
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
          'anthropic-dangerous-direct-browser-access': 'true',
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 1000,
          system: `Tu es l'assistant IA de VOID Gallery, une galerie photo dark/gothique. Tu aides à créer du contenu viral (hooks, captions, idées Reels), analyser les visuels, et optimiser la stratégie. Sois concis, créatif, avec une touche dark et poétique. Parle en français. ${photos.length} photos publiées.`,
          messages: chatHistory.current,
        }),
      })
      const d = await res.json()
      const reply = d.content?.[0]?.text || 'Erreur'
      chatHistory.current.push({ role: 'assistant', content: reply })
      setChatMsgs(prev => [...prev, { type: 'ai', text: reply }])
    } catch (e) {
      setChatMsgs(prev => [...prev, { type: 'sys', text: 'Erreur: ' + e.message }])
    }
    setChatLoading(false)
  }

  // ── MCP ──
  const saveMcp = () => {
    const url = mcpUrl.trim().replace(/\/$/, '')
    if (!url) { showToast('Entre l\'URL de ton site', 'err'); return }
    localStorage.setItem('void_mcpurl', url)
    localStorage.setItem('void_mcpsec', mcpSecret)
    setMcpConfigured(true)
    showToast('Config MCP sauvegardée ✓', 'ok')
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
    navigator.clipboard.writeText(mcpSnippet).then(() => showToast('Copié ✓', 'ok'))
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
          <a href="/" target="_blank" className={styles.sidebarLink}>↗ Voir la galerie</a>
          <button className={styles.sidebarLink} onClick={logout}>← Déconnexion</button>
        </div>
      </aside>

      {/* MAIN */}
      <div className={styles.main}>
        {/* TOPBAR */}
        <div className={styles.topbar}>
          <span className={styles.topTitle}>{TAB_LABELS[tab]}</span>
          <div className={styles.topRight}>
            <span className={styles.badge}><span className={`${styles.dot} ${styles.on}`} /> ADMIN ACTIF</span>
            <span className={styles.badge}><span className={`${styles.dot} ${mcpConfigured ? styles.on : ''}`} /> CLAUDE MCP</span>
          </div>
        </div>

        {/* ── UPLOAD PANEL ── */}
        {tab === 'upload' && (
          <div className={styles.panel}>
            <div className={styles.statsRow}>
              <div className={styles.statCard}><div className={styles.statNum}>{photos.length}</div><div className={styles.statLabel}>Photos publiées</div></div>
              <div className={styles.statCard}><div className={styles.statNum}>{pending.length}</div><div className={styles.statLabel}>En attente</div></div>
              <div className={styles.statCard}><div className={styles.statNum}>{apiConnected ? '●' : '○'}</div><div className={styles.statLabel}>Claude API</div></div>
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
                <strong>Glisser des photos ici</strong>
                JPG · PNG · WEBP — plusieurs fichiers acceptés
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
                <label className={styles.fieldLabel}>Label / Titre (optionnel)</label>
                <input className={styles.input} value={label} onChange={e => setLabel(e.target.value)} placeholder="ex: Session Studio 01" />
              </div>
            </div>

            <div className={styles.btnRow}>
              <button className={styles.btnPrimary} onClick={publish} disabled={!pending.length}>⬡ PUBLIER {pending.length > 0 ? `(${pending.length})` : ''}</button>
              <button className={styles.btnGhost} onClick={() => { setPending([]); setLabel('') }}>VIDER</button>
            </div>
          </div>
        )}

        {/* ── PHOTOS PANEL ── */}
        {tab === 'photos' && (
          <div className={styles.panel}>
            <div className={styles.photosHeader}>
              <span className={styles.fieldLabel}>{photos.length} PHOTO{photos.length !== 1 ? 'S' : ''}</span>
              <button className={styles.btnDanger} onClick={deleteAll}>TOUT SUPPRIMER</button>
            </div>
            {photos.length === 0
              ? <p className={styles.empty}>Aucune photo publiée.</p>
              : (
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>Aperçu</th><th>Label</th><th>Date</th><th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {photos.map(p => (
                      <tr key={p.id}>
                        <td><img className={styles.thumb} src={p.src} alt="" /></td>
                        <td className={styles.italic}>{p.label || '—'}</td>
                        <td className={styles.mono}>{new Date(p.date).toLocaleDateString('fr-FR')}</td>
                        <td><button className={styles.btnDanger} onClick={() => deletePhoto(p.id)}>SUPPRIMER</button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )
            }
          </div>
        )}

        {/* ── CLAUDE MCP PANEL ── */}
        {tab === 'claude' && (
          <div className={styles.panel}>
            <div className={styles.mcpGrid}>
              {/* MCP Config */}
              <div className={styles.mcpCard}>
                <h2 className={styles.mcpTitle}>CONFIG <span>MCP</span></h2>
                <p className={styles.mcpDesc}>Connecte Claude à cette app via MCP. Entre l'URL de ton site hébergé.</p>
                <div className={styles.statusRow}>
                  <span className={`${styles.dot} ${mcpConfigured ? styles.on : ''}`} />
                  <span className={styles.statusTxt}>{mcpConfigured ? 'CONFIGURÉ' : 'NON CONFIGURÉ'}</span>
                </div>
                <div className={styles.field}>
                  <label className={styles.fieldLabel}>URL du site hébergé</label>
                  <input className={styles.input} value={mcpUrl} onChange={e => setMcpUrl(e.target.value)} placeholder="https://void-gallery.vercel.app" />
                </div>
                <div className={styles.field} style={{ marginTop: 12 }}>
                  <label className={styles.fieldLabel}>Clé MCP secrète (optionnel)</label>
                  <input className={styles.input} type="password" value={mcpSecret} onChange={e => setMcpSecret(e.target.value)} placeholder="Clé partagée" />
                </div>
                <div className={styles.btnRow} style={{ marginTop: 16 }}>
                  <button className={styles.btnPrimary} onClick={saveMcp}>SAUVEGARDER</button>
                </div>
                {mcpSnippet && (
                  <>
                    <p className={styles.fieldLabel} style={{ marginTop: 20, marginBottom: 8 }}>Script pour Claude.ai → Settings → MCP Servers</p>
                    <pre className={styles.codeBox}>{mcpSnippet}</pre>
                    <button className={styles.btnGhost} onClick={copySnippet} style={{ width: '100%', marginTop: 8 }}>COPIER LE SCRIPT</button>
                  </>
                )}
              </div>

              {/* Chat */}
              <div className={styles.mcpCard}>
                <h2 className={styles.mcpTitle}>CHAT <span>CLAUDE</span></h2>
                <p className={styles.mcpDesc}>Génère du contenu viral, des hooks et des captions directement.</p>
                <div className={styles.statusRow}>
                  <span className={`${styles.dot} ${apiConnected ? styles.on : ''}`} />
                  <span className={styles.statusTxt}>{apiConnected ? 'CONNECTÉ' : 'NON CONNECTÉ'}</span>
                </div>
                <div className={styles.field}>
                  <label className={styles.fieldLabel}>Clé API Anthropic</label>
                  <div className={styles.inputRow}>
                    <input className={styles.input} type="password" value={apiKey} onChange={e => setApiKey(e.target.value)} placeholder="sk-ant-api03-..." />
                    <button className={styles.btnGhost} onClick={saveApiKey}>OK</button>
                  </div>
                </div>
                <div className={styles.chatBox} ref={chatRef}>
                  {chatMsgs.map((m, i) => (
                    <div key={i} className={`${styles.chatMsg} ${styles['msg_' + m.type]}`}>{m.text}</div>
                  ))}
                  {chatLoading && <div className={`${styles.chatMsg} ${styles.msg_ai}`}><span className={styles.spin}>⟳</span> En train de répondre...</div>}
                </div>
                <div className={styles.inputRow}>
                  <input
                    className={styles.input}
                    value={chatInput}
                    onChange={e => setChatInput(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && sendChat(chatInput)}
                    placeholder="Demande à Claude..."
                    disabled={!apiConnected || chatLoading}
                  />
                  <button className={styles.btnPrimary} onClick={() => sendChat(chatInput)} disabled={!apiConnected || chatLoading}>SEND</button>
                </div>
                <div className={styles.quickBtns}>
                  {['🔥 Hooks viraux', '◈ Captions IG', '▶ Idées Reels', '✦ Analyse style'].map((q, i) => {
                    const prompts = [
                      'Génère 3 hooks viraux dark pour ma galerie photo',
                      '5 captions Instagram dark/mystérieux pour une photo de galerie',
                      'Idées de vidéos Reels pour une esthétique gothique dark',
                      'Analyse le style visuel dark et donne des conseils pour améliorer l\'engagement',
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
                  <span>Hébergement</span><span>Vercel</span>
                  <span>Claude</span><span>claude-sonnet-4</span>
                  <span>Auth</span><span>JWT HttpOnly</span>
                  <span>Photos</span><span>{photos.length} publiées</span>
                </div>
              </div>
              <div className={styles.settingsCard}>
                <h3 className={styles.settingsTitle}>Danger Zone</h3>
                <p className={styles.settingsDesc}>Ces actions sont irréversibles.</p>
                <button className={styles.btnDanger} onClick={deleteAll}>VIDER TOUTE LA GALERIE</button>
                <button className={styles.btnDanger} style={{ marginTop: 12 }} onClick={logout}>SE DÉCONNECTER</button>
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
