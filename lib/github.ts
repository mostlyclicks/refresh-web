import { Octokit } from '@octokit/rest'

const octokit = new Octokit({
  auth: process.env.GITHUB_TOKEN,
})

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
