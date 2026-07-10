import { Octokit } from '@octokit/rest'

const octokit = new Octokit({
  auth: process.env.GITHUB_TOKEN,
})

export function normaliseRepo(raw: string): string {
  return raw
    .trim()
    .replace(/^https?:\/\/github\.com\//, '')
    .replace(/\.git$/, '')
    .replace(/\/$/, '')
    .replace(/^\//, '')
}

export async function fetchGitHubFile(repoPath: string, filePath: string): Promise<string> {
  const [owner, repo] = repoPath.split('/')
  try {
    const { data } = await octokit.repos.getContent({ owner, repo, path: filePath })
    if (Array.isArray(data) || data.type !== 'file') throw new Error('Expected a file')
    return Buffer.from(data.content, 'base64').toString('utf8')
  } catch (err: any) {
    throw new Error(`GitHub: could not fetch "${filePath}" from ${owner}/${repo} — ${err.message}`)
  }
}

export async function listGitHubFiles(repoPath: string): Promise<string[]> {
  const [owner, repo] = repoPath.split('/')
  try {
    const { data } = await octokit.repos.getContent({ owner, repo, path: '' })
    if (!Array.isArray(data)) return []
    return data.map((f) => f.name)
  } catch (err: any) {
    throw new Error(
      `GitHub: could not list files in ${owner}/${repo} — ${err.message}. Check that the repo exists and GITHUB_TOKEN has access.`
    )
  }
}

export async function fetchAllSiteFiles(repoPath: string, fileList: string[]): Promise<Record<string, string>> {
  const relevant = fileList
    .filter(f => f.endsWith('.html') || f.endsWith('.css') || f.endsWith('.js'))
    .slice(0, 10)

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

export async function commitChange({
  owner,
  repo,
  filePath,
  newContent,
  commitMessage,
  branch = 'main',
}: {
  owner: string
  repo: string
  filePath: string
  newContent: string
  commitMessage: string
  branch?: string
}): Promise<string> {
  // Get current file SHA (required for update)
  const { data: currentFile } = await octokit.repos.getContent({
    owner,
    repo,
    path: filePath,
    ref: branch,
  })

  if (Array.isArray(currentFile) || currentFile.type !== 'file') {
    throw new Error('Expected a file, got a directory')
  }

  // Commit the change
  const { data: commit } = await octokit.repos.createOrUpdateFileContents({
    owner,
    repo,
    path: filePath,
    message: commitMessage,
    content: Buffer.from(newContent).toString('base64'),
    sha: currentFile.sha,
    branch,
  })

  return commit.commit.sha!
}
