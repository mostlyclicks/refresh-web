import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/db'
import { parseRequest } from '@/lib/claude'
import { normaliseRepo, listGitHubFiles, fetchAllSiteFiles } from '@/lib/github'

// Abuse brakes on the one endpoint that spends Claude tokens.
const HOURLY_LIMIT = 10          // per client, any tier
const BASIC_MONTHLY_LIMIT = 20   // the "20 updates/month" promise on the pricing page

async function countRequestsSince(clientId: string, sinceIso: string): Promise<number> {
  const { count } = await supabaseAdmin
    .from('requests')
    .select('*', { count: 'exact', head: true })
    .eq('client_id', clientId)
    .gte('created_at', sinceIso)
  return count ?? 0
}

export async function POST(req: NextRequest) {
  try {
    const { message_text, clientId, websiteId, attachments = [] } = await req.json()

    if (!message_text || !clientId || !websiteId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // 0. Gate before anything is saved or spent
    const { data: client } = await supabaseAdmin
      .from('clients')
      .select('id, tier, status')
      .eq('id', clientId)
      .single()

    if (!client) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 })
    }
    if (client.status !== 'active') {
      return NextResponse.json(
        { error: 'Your account is currently paused. Contact us to reactivate it.' },
        { status: 403 }
      )
    }

    const hourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString()
    if (await countRequestsSince(clientId, hourAgo) >= HOURLY_LIMIT) {
      return NextResponse.json(
        { error: 'Too many requests in the past hour — please wait a bit and try again.' },
        { status: 429 }
      )
    }

    if (client.tier === 'basic') {
      const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString()
      if (await countRequestsSince(clientId, monthStart) >= BASIC_MONTHLY_LIMIT) {
        return NextResponse.json(
          { error: `You've used all ${BASIC_MONTHLY_LIMIT} updates included this month. Upgrade to Professional for unlimited updates, or send your next request on the 1st.` },
          { status: 429 }
        )
      }
    }

    // 1. Save request to DB
    const { data: request, error: reqError } = await supabaseAdmin
      .from('requests')
      .insert({ client_id: clientId, website_id: websiteId, message_text, status: 'pending', attachments, source: 'chat' })
      .select()
      .single()

    if (reqError || !request) {
      return NextResponse.json({ error: 'Failed to save request' }, { status: 500 })
    }

    // 2. Fetch website record for GitHub repo info
    const { data: website, error: siteError } = await supabaseAdmin
      .from('websites')
      .select('*')
      .eq('id', websiteId)
      .single()

    if (siteError || !website?.github_repo_url) {
      return NextResponse.json({ error: 'Website not found or missing GitHub repo — add it in /admin/clients' }, { status: 404 })
    }

    // Normalise to "owner/repo" regardless of what was saved
    const repoPath = normaliseRepo(website.github_repo_url)

    // 3. Fetch all site files from GitHub
    const fileList = await listGitHubFiles(repoPath)
    const siteFiles = await fetchAllSiteFiles(repoPath, fileList)

    // 4. Call Claude (or mock if MOCK_CLAUDE=true)
    const primaryFile = Object.keys(siteFiles)[0] ?? 'index.html'
    const primaryCode = siteFiles[primaryFile] ?? ''

    const { suggestion, usage } = process.env.MOCK_CLAUDE === 'true'
      ? {
          suggestion: {
            understood: true,
            request_summary: `Mock: ${message_text}`,
            changes: [{
              target_file:    primaryFile,
              target_section: 'body',
              old_code: primaryCode.split('\n').slice(0, 3).join('\n'),
              new_code: `<!-- Updated: ${message_text} -->\n` + primaryCode.split('\n').slice(0, 3).join('\n'),
            }],
            risk_level:       'low' as const,
            risk_description: 'Mock suggestion — no real changes',
            confidence:       0.99,
            notes:            'Mock response. Set MOCK_CLAUDE=false to use real Claude.',
          },
          usage: { input_tokens: 0, output_tokens: 0 },
        }
      : await parseRequest(message_text, siteFiles, attachments)

    // 5. Save suggestion to DB
    const firstChange = suggestion.changes?.[0]
    const { data: savedSuggestion, error: sugError } = await supabaseAdmin
      .from('suggestions')
      .insert({
        request_id:    request.id,
        claude_response: suggestion,
        target_file:   firstChange?.target_file ?? '',
        old_code:      firstChange?.old_code    ?? '',
        new_code:      firstChange?.new_code    ?? '',
        risk_level:    suggestion.risk_level,
        confidence:    suggestion.confidence,
        input_tokens:  usage.input_tokens,
        output_tokens: usage.output_tokens,
      })
      .select()
      .single()

    if (sugError) console.error('Failed to save suggestion:', sugError)

    return NextResponse.json({ success: true, request, suggestion: savedSuggestion })
  } catch (err: any) {
    console.error('parse-request error:', err)
    return NextResponse.json({ error: err.message || 'Failed to parse request' }, { status: 500 })
  }
}
