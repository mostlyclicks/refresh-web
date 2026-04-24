import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/db'
import { CodeChange } from '@/lib/types'
import { Octokit } from '@octokit/rest'

const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN })

async function applyChangesToFile(
  owner: string,
  repo: string,
  filePath: string,
  changes: CodeChange[],
  commitMessage: string
): Promise<string> {
  // Fetch current file once
  const { data: currentFile } = await octokit.repos.getContent({ owner, repo, path: filePath })
  if (Array.isArray(currentFile) || currentFile.type !== 'file') {
    throw new Error('Expected a file at ' + filePath)
  }

  let content = Buffer.from(currentFile.content, 'base64').toString('utf8')

  // Apply all changes for this file in sequence
  for (const change of changes) {
    if (!content.includes(change.old_code)) {
      throw new Error(
        `Could not find target code in ${filePath}:\n${change.old_code}\n\nIt may have already been changed.`
      )
    }
    content = content.replace(change.old_code, change.new_code)
  }

  // Single commit for all changes to this file
  const { data: commit } = await octokit.repos.createOrUpdateFileContents({
    owner,
    repo,
    path: filePath,
    message: commitMessage,
    content: Buffer.from(content).toString('base64'),
    sha: currentFile.sha,
    branch: 'main',
  })

  return commit.commit.sha!
}

export async function POST(req: NextRequest) {
  try {
    const { suggestionId } = await req.json()

    if (!suggestionId) {
      return NextResponse.json({ error: 'Missing suggestionId' }, { status: 400 })
    }

    // Fetch suggestion + request + website
    const { data: suggestion, error: sugError } = await supabaseAdmin
      .from('suggestions')
      .select('*, requests(*, websites(*))')
      .eq('id', suggestionId)
      .single()

    if (sugError || !suggestion) {
      return NextResponse.json({ error: 'Suggestion not found' }, { status: 404 })
    }

    const website = suggestion.requests?.websites
    if (!website?.github_repo_url) {
      return NextResponse.json({ error: 'Website has no GitHub repo configured' }, { status: 400 })
    }

    const repoSlug = website.github_repo_url
      .trim()
      .replace(/^https?:\/\/github\.com\//, '')
      .replace(/\.git$/, '')
      .replace(/\/$/, '')
    const [owner, repo] = repoSlug.split('/')
    const commitMessage = `RefreshWeb: ${suggestion.claude_response?.request_summary ?? 'Update from client request'}`

    // Resolve changes — prefer claude_response.changes, fall back to legacy single-change columns
    const rawChanges: CodeChange[] = suggestion.claude_response?.changes?.length
      ? suggestion.claude_response.changes
      : [{
          target_file:    suggestion.target_file,
          target_section: '',
          old_code:       suggestion.old_code,
          new_code:       suggestion.new_code,
        }]

    // Group changes by file so we fetch + commit each file only once
    const byFile = new Map<string, CodeChange[]>()
    for (const change of rawChanges) {
      if (!byFile.has(change.target_file)) byFile.set(change.target_file, [])
      byFile.get(change.target_file)!.push(change)
    }

    const commitHashes: string[] = []
    for (const [filePath, changes] of byFile) {
      const hash = await applyChangesToFile(owner, repo, filePath, changes, commitMessage)
      commitHashes.push(hash)
    }

    const lastCommitHash = commitHashes[commitHashes.length - 1]

    // Save to changes table
    await supabaseAdmin.from('changes').insert({
      suggestion_id: suggestion.id,
      website_id:    website.id,
      git_commit_hash: lastCommitHash,
      deployed_url:  website.deployed_url,
    })

    // Update request status to deployed
    await supabaseAdmin
      .from('requests')
      .update({ status: 'deployed' })
      .eq('id', suggestion.requests.id)

    return NextResponse.json({
      success: true,
      commitHashes,
      filesChanged: [...byFile.keys()],
      deployedUrl: website.deployed_url,
    })
  } catch (err: any) {
    console.error('deploy error:', err)
    return NextResponse.json({ error: err.message || 'Deployment failed' }, { status: 500 })
  }
}
