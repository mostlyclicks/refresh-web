import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/db'
import { parseRequest } from '@/lib/claude'
import { normaliseRepo, listGitHubFiles, fetchAllSiteFiles } from '@/lib/github'

export async function POST(req: NextRequest) {
  try {
    const { message_text, clientId, websiteId, attachments = [] } = await req.json()

    if (!message_text || !clientId || !websiteId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
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

    const suggestion = process.env.MOCK_CLAUDE === 'true'
      ? {
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
