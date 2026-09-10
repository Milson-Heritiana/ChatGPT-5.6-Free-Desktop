import { NextResponse } from 'next/server'
import { getPhotos } from '@/lib/photos'

function isAuthorized(request) {
  const configuredSecret = process.env.MCP_SECRET
  if (!configuredSecret) return false
  return request.headers.get('x-mcp-secret') === configuredSecret
}

const MCP_TOOLS = [
  {
    name: 'get_gallery_stats',
    description: 'Get VOID gallery statistics',
    inputSchema: { type: 'object', properties: {} },
  },
  {
    name: 'get_photos',
    description: 'Get all gallery photos',
    inputSchema: {
      type: 'object',
      properties: { limit: { type: 'number' } },
    },
  },
  {
    name: 'generate_caption',
    description: 'Generate Instagram caption',
    inputSchema: {
      type: 'object',
      properties: { style: { type: 'string' }, mood: { type: 'string' } },
    },
  },
  {
    name: 'generate_hooks',
    description: 'Generate viral hooks',
    inputSchema: {
      type: 'object',
      properties: { count: { type: 'number' }, topic: { type: 'string' } },
    },
  },
]

export async function POST(request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ jsonrpc: '2.0', error: { code: -32001, message: 'Unauthorized' } }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { jsonrpc, method, params, id } = body

    if (method === 'initialize') {
      return NextResponse.json({
        jsonrpc: '2.0',
        result: {
          protocolVersion: '2024-11-05',
          capabilities: { resources: {}, tools: {}, prompts: {} },
          serverInfo: { name: 'void-gallery-mcp', version: '1.0.0' },
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
      const { name, arguments: args } = params || {}
      let content = 'Success'
      const photos = getPhotos()

      if (name === 'get_gallery_stats') {
        content = JSON.stringify({ totalPhotos: photos.length, status: 'active' })
      } else if (name === 'get_photos') {
        const limit = Math.min(Math.max(Number(args?.limit) || 50, 1), 100)
        content = JSON.stringify({ photos: photos.slice(0, limit), count: Math.min(photos.length, limit) })
      } else if (name === 'generate_caption') {
        content = JSON.stringify({ caption: 'Dark and mysterious photography' })
      } else if (name === 'generate_hooks') {
        content = JSON.stringify({ hooks: ['Hook 1', 'Hook 2', 'Hook 3'] })
      }

      return NextResponse.json({
        jsonrpc: '2.0',
        result: { content: [{ type: 'text', text: content }] },
        id,
      })
    }

    return NextResponse.json({
      jsonrpc: '2.0',
      error: { code: -32601, message: 'Method not found' },
      id,
    })
  } catch (err) {
    return NextResponse.json(
      { jsonrpc: '2.0', error: { code: -32700, message: 'Parse error' } },
      { status: 400 }
    )
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'VOID Gallery MCP Server',
    tools: MCP_TOOLS.length,
    configured: Boolean(process.env.MCP_SECRET),
  })
}
