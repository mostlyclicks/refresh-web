import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/db'
import { parseRequest } from '@/lib/claude'
import { Octokit } from '@octokit/rest'

const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN })

/** Normalise any GitHub URL format to "owner/repo" */
function normaliseRepo(raw: string): string {
  return raw
    .trim()
    .replace(/^https?:\/\/github\.com\//, '')
    .replace(/\.git$/, '')
    .replace(/\/$/, '')
}

async function fetchGitHubFile(repoPath: string, filePath: string): Promise<string> {
  const [owner, repo] = repoPath.split('/')
  try {
    const { data } = await octokit.repos.getContent({ owner, repo, path: filePath })
    if (Array.isArray(data) || data.type !== 'file') throw new Error('Expected a file')
    return Buffer.from(data.content, 'base64').toString('utf8')
  } catch (err: any) {
    throw new Error(`GitHub: could not fetch "${filePath}" from ${owner}/${repo} — ${err.message}`)
  }
}

async function listGitHubFiles(repoPath: string): Promise<string[]> {
  const [owner, repo] = repoPath.split('/')
  try {
    const { data } = await octokit.repos.getContent({ owner, repo, path: '' })
    if (!Array.isArray(data)) return []
    return data.map((f) => f.name)
  } catch (err: any) {
    throw new Error(`GitHub: could not list files in ${owner}/${repo} — ${err.message}. Check that the repo exists and GITHUB_TOKEN has access.`)
  }
}

/** Fetch all HTML and CSS files in the repo, returned as a map of filename → content */
async function fetchAllSiteFiles(repoPath: string, fileList: string[]): Promise<Record<string, string>> {
  const relevant = fileList.filter(f =>
    f.endsWith('.html') || f.endsWith('.css') || f.endsWith('.js')
  ).slice(0, 10) // cap at 10 files to stay within token limits

  const entries = await Promise.all(
    relevant.map(async (file) => {
      try {
        const content = await fetchGitHubFile(repoPath, file)
        return [file, content] as [string, string]
      } catch {
        return null
      }
    })
  )

  return Object.fromEntries(entries.filter(Boolean) as [string, string][])
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
