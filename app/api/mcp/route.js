import { NextResponse } from 'next/server'

const VOID_MCP_SECRET = process.env.VOID_MCP_SECRET || 'void-mcp-secret-default'

// MCP Server Endpoints
const MCP_TOOLS = [
  {
    name: 'get_gallery_stats',
    description: 'Obtenir les statistiques de la galerie VOID',
    inputSchema: {
      type: 'object',
      properties: {},
    },
  },
  {
    name: 'get_photos',
    description: 'Récupérer toutes les photos de la galerie',
    inputSchema: {
      type: 'object',
      properties: {
        limit: { type: 'number', description: 'Nombre max de photos (default: 10)' },
      },
    },
  },
  {
    name: 'generate_caption',
    description: 'Générer une caption Instagram pour une photo',
    inputSchema: {
      type: 'object',
      properties: {
        style: { type: 'string', enum: ['dark', 'poetic', 'viral', 'minimalist'] },
        mood: { type: 'string', description: 'Mood ou thème' },
      },
    },
  },
  {
    name: 'generate_hooks',
    description: 'Générer des hooks viraux pour Reels/TikTok',
    inputSchema: {
      type: 'object',
      properties: {
        count: { type: 'number', description: 'Nombre de hooks (1-5)' },
        topic: { type: 'string', description: 'Sujet ou style' },
      },
    },
  },
]

export async function POST(request) {
  try {
    const { jsonrpc, method, params, id } = await request.json()

    // Vérifier le secret MCP
    const authHeader = request.headers.get('authorization')
    const headerSecret = request.headers.get('x-mcp-secret')

    if (headerSecret && headerSecret !== VOID_MCP_SECRET) {
      return NextResponse.json(
        { jsonrpc: '2.0', error: { code: -32600, message: 'Invalid secret' }, id },
        { status: 401 }
      )
    }

    // Handle different MCP methods
    if (method === 'initialize') {
      return NextResponse.json({
        jsonrpc: '2.0',
        result: {
          protocolVersion: '2024-11-05',
          capabilities: { resources: {}, tools: {}, prompts: {} },
          serverInfo: {
            name: 'void-gallery-mcp',
            version: '1.0.0',
          },
        },
        id,
      })
    }

    if (method === 'resources/list') {
      return NextResponse.json({
        jsonrpc: '2.0',
        result: {
          resources: [
            {
              uri: 'void://gallery',
              name: 'VOID Gallery',
              description: 'Dark archive photography gallery',
              mimeType: 'application/json',
            },
          ],
        },
        id,
      })
    }

    if (method === 'tools/list') {
      return NextResponse.json({
        jsonrpc: '2.0',
        result: { tools: MCP_TOOLS },
        id,
      })
    }

    if (method === 'tools/call') {
      const { name, arguments: args } = params
      let result = {}

      if (name === 'get_gallery_stats') {
        result = {
          totalPhotos: 0,
          status: 'active',
          host: 'void-gallery.vercel.app',
        }
      } else if (name === 'get_photos') {
        result = {
          photos: [],
          count: 0,
        }
      } else if (name === 'generate_caption') {
        const styles = {
          dark: 'Sombre et mystérieux, avec une touche poétique.',
          poetic: 'Lyrique et évocateur, riche en métaphores.',
          viral: 'Accrochez-moi avec un hook puissant et émojis engageants.',
          minimalist: 'Sobre et épuré, minimaliste et puissant.',
        }
        result = {
          caption: `[${args.style?.toUpperCase()}] ${styles[args.style] || styles.dark}`,
        }
      } else if (name === 'generate_hooks') {
        result = {
          hooks: Array.from({ length: args.count || 3 }, (_, i) => `Hook ${i + 1}: Une accroche puissante et virale`),
        }
      }

      return NextResponse.json({
        jsonrpc: '2.0',
        result: { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] },
        id,
      })
    }

    // SSE support pour live updates
    if (request.headers.get('accept') === 'text/event-stream') {
      const encoder = new TextEncoder()
      const stream = new ReadableStream({
        start(controller) {
          controller.enqueue(encoder.encode('data: {"type": "ready"}\n\n'))
          controller.close()
        },
      })
      return new Response(stream, {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
        },
      })
    }

    return NextResponse.json(
      { jsonrpc: '2.0', error: { code: -32601, message: 'Method not found' }, id },
      { status: 400 }
    )
  } catch (err) {
    return NextResponse.json(
      { jsonrpc: '2.0', error: { code: -32700, message: 'Parse error' } },
      { status: 400 }
    )
  }
}

export async function GET(request) {
  // Servir la liste des outils en GET pour faciliter le testing
  const url = new URL(request.url)
  if (url.searchParams.get('tools') === '1') {
    return NextResponse.json({ tools: MCP_TOOLS })
  }

  return NextResponse.json({
    message: 'VOID Gallery MCP Server',
    endpoints: {
      POST: '/api/mcp - MCP Protocol',
      'GET ?tools=1': 'List all tools',
    },
  })
}
