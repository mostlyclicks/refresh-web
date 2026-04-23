import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/db'
import { Octokit } from '@octokit/rest'

const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN })

async function applyChange(
  repoPath: string,
  filePath: string,
  oldCode: string,
  newCode: string,
  commitMessage: string
): Promise<string> {
  const [owner, repo] = repoPath.split('/')

  // Get current file content + SHA
  const { data: currentFile } = await octokit.repos.getContent({ owner, repo, path: filePath })
  if (Array.isArray(currentFile) || currentFile.type !== 'file') {
    throw new Error('Expected a file at ' + filePath)
  }

  const currentContent = Buffer.from(currentFile.content, 'base64').toString('utf8')

  // Apply the change — replace old_code with new_code
  if (!currentContent.includes(oldCode)) {
    throw new Error(`Could not find the target code in ${filePath} — it may have already been changed.`)
  }

  const updatedContent = currentContent.replace(oldCode, newCode)

  // Commit to GitHub
  const { data: commit } = await octokit.repos.createOrUpdateFileContents({
    owner,
    repo,
    path: filePath,
    message: commitMessage,
    content: Buffer.from(updatedContent).toString('base64'),
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

    const commitMessage = `RefreshWeb: ${suggestion.claude_response?.request_summary ?? 'Update from client request'}`

    // Commit the change to GitHub (Vercel auto-deploys on push)
    const commitHash = await applyChange(
      website.github_repo_url,
      suggestion.target_file,
      suggestion.old_code,
      suggestion.new_code,
      commitMessage
    )

    // Save to changes table
    await supabaseAdmin.from('changes').insert({
      suggestion_id: suggestion.id,
      website_id: website.id,
      git_commit_hash: commitHash,
      deployed_url: website.deployed_url,
    })

    // Update request status to deployed
    await supabaseAdmin
      .from('requests')
      .update({ status: 'deployed' })
      .eq('id', suggestion.requests.id)

    return NextResponse.json({
      success: true,
      commitHash,
      deployedUrl: website.deployed_url,
    })
  } catch (err: any) {
    console.error('deploy error:', err)
    return NextResponse.json({ error: err.message || 'Deployment failed' }, { status: 500 })
  }
}
