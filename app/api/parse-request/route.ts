import { NextRequest, NextResponse } from 'next/server'
import { parseRequest } from '@/lib/claude'

export async function POST(req: NextRequest) {
  try {
    const { requestText, currentCode, fileStructure, clientId, websiteId } = await req.json()

    if (!requestText || !currentCode || !fileStructure) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const suggestion = await parseRequest(requestText, currentCode, fileStructure)

    // TODO: Save request + suggestion to database
    // const request = await supabase.from('requests').insert({ client_id: clientId, ... })
    // const saved = await supabase.from('suggestions').insert({ request_id: request.id, ... })

    return NextResponse.json({ success: true, suggestion })
  } catch (err) {
    console.error('parse-request error:', err)
    return NextResponse.json({ error: 'Failed to parse request' }, { status: 500 })
  }
}
