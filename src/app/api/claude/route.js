import { NextResponse } from 'next/server'
import { verifyToken, getAuthCookie } from '@/lib/auth'

const OLLAMA_URL = process.env.OLLAMA_BASE_URL || 'http://127.0.0.1:11434'
const MODEL = process.env.OLLAMA_MODEL || 'llama3.2'

async function isAuthenticated(request) {
  const token = getAuthCookie(request)
  if (!token) return false
  const payload = await verifyToken(token)
  return payload?.role === 'admin'
}

export async function GET(request) {
  if (!(await isAuthenticated(request))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const response = await fetch(`${OLLAMA_URL}/api/tags`, { cache: 'no-store' })
    const data = await response.json()
    const configured = response.ok && data.models?.some(model => model.name.startsWith(MODEL))
    return NextResponse.json({ configured, provider: 'Ollama', model: MODEL })
  } catch {
    return NextResponse.json({ configured: false, provider: 'Ollama', model: MODEL })
  }
}

export async function POST(request) {
  if (!(await isAuthenticated(request))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { messages } = await request.json()
    if (!Array.isArray(messages) || messages.length === 0 || messages.length > 30) {
      return NextResponse.json({ error: 'A valid message history is required' }, { status: 400 })
    }

    const response = await fetch(`${OLLAMA_URL}/api/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: MODEL,
        stream: false,
        messages: [
          { role: 'system', content: 'You are the AI assistant for VOID Gallery, a dark/gothic photography gallery. Help create viral content, analyze visuals, and optimize strategy. Be concise and creative, with a dark poetic edge. Respond in English.' },
          ...messages,
        ],
      }),
    })

    const data = await response.json()
    if (!response.ok) {
      return NextResponse.json({ error: data.error || 'Local AI request failed' }, { status: response.status })
    }

    return NextResponse.json({ reply: data.message?.content || 'No response received' })
  } catch {
    return NextResponse.json({ error: `Cannot connect to Ollama at ${OLLAMA_URL}` }, { status: 502 })
  }
}