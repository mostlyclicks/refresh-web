import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/db'
import { parseRequest } from '@/lib/claude'
import { Octokit } from '@octokit/rest'

const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN })

async function fetchGitHubFile(repoPath: string, filePath: string): Promise<string> {
  const [owner, repo] = repoPath.split('/')
  const { data } = await octokit.repos.getContent({ owner, repo, path: filePath })
  if (Array.isArray(data) || data.type !== 'file') throw new Error('Expected a file')
  return Buffer.from(data.content, 'base64').toString('utf8')
}

async function listGitHubFiles(repoPath: string): Promise<string[]> {
  const [owner, repo] = repoPath.split('/')
  const { data } = await octokit.repos.getContent({ owner, repo, path: '' })
  if (!Array.isArray(data)) return []
  return data.map((f) => f.name)
}

export async function POST(req: NextRequest) {
  try {
    const { message_text, clientId, websiteId, attachments = [] } = await req.json()

    if (!message_text || !clientId || !websiteId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // 1. Save request to DB
    const { data: request, error: reqError } = await supabaseAdmin
      .from('requests')
      .insert({ client_id: clientId, website_id: websiteId, message_text, status: 'pending', attachments })
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
      return NextResponse.json({ error: 'Website not found or missing GitHub repo' }, { status: 404 })
    }

    // 3. Fetch file list + primary file from GitHub
    const fileList = await listGitHubFiles(website.github_repo_url)
    const primaryFile = fileList.includes('index.html') ? 'index.html'
      : fileList.includes('styles.css') ? 'styles.css'
      : fileList[0]

    const currentCode = await fetchGitHubFile(website.github_repo_url, primaryFile)

    // 4. Call Claude (or mock if MOCK_CLAUDE=true in .env.local)
    const suggestion = process.env.MOCK_CLAUDE === 'true'
      ? {
          understood: true,
          request_summary: `Mock: ${message_text}`,
          target_file: primaryFile,
          target_section: 'body',
          old_code: currentCode.split('\n').slice(0, 3).join('\n'),
          new_code: `<!-- Updated: ${message_text} -->\n` + currentCode.split('\n').slice(0, 3).join('\n'),
          risk_level: 'low' as const,
          risk_description: 'Mock suggestion — no real changes',
          confidence: 0.99,
          notes: 'This is a mock response for testing. Set MOCK_CLAUDE=false to use real Claude.',
        }
      : await parseRequest(message_text, currentCode, fileList, attachments)

    // 5. Save suggestion to DB
    const { data: savedSuggestion, error: sugError } = await supabaseAdmin
      .from('suggestions')
      .insert({
        request_id: request.id,
        claude_response: suggestion,
        target_file: suggestion.target_file,
        old_code: suggestion.old_code,
        new_code: suggestion.new_code,
        risk_level: suggestion.risk_level,
        confidence: suggestion.confidence,
      })
      .select()
      .single()

    if (sugError) {
      console.error('Failed to save suggestion:', sugError)
    }

    return NextResponse.json({
      success: true,
      request,
      suggestion: savedSuggestion,
    })
  } catch (err: any) {
    console.error('parse-request error:', err)
    return NextResponse.json({ error: err.message || 'Failed to parse request' }, { status: 500 })
  }
}
