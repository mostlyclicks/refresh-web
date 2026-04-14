import { NextRequest, NextResponse } from 'next/server'
import { commitChange } from '@/lib/github'

export async function POST(req: NextRequest) {
  try {
    const { suggestionId } = await req.json()

    if (!suggestionId) {
      return NextResponse.json({ error: 'Missing suggestionId' }, { status: 400 })
    }

    // TODO: Fetch suggestion + website from database
    // const { data: suggestion } = await supabase.from('suggestions').select('*, requests(*, websites(*))').eq('id', suggestionId).single()

    // TODO: Apply code change via GitHub
    // const commitHash = await commitChange({
    //   owner: process.env.GITHUB_ORG!,
    //   repo: suggestion.requests.websites.github_repo_url,
    //   filePath: suggestion.target_file,
    //   newContent: suggestion.new_code,
    //   commitMessage: `RefreshWeb: ${suggestion.claude_response.request_summary}`,
    // })

    // TODO: Vercel auto-deploys on push — wait for deploy status via Vercel API
    // TODO: Save deployed change to database
    // TODO: Update request status to 'deployed'

    return NextResponse.json({
      success: true,
      message: 'Deployment triggered',
      // commitHash,
    })
  } catch (err) {
    console.error('deploy error:', err)
    return NextResponse.json({ error: 'Deployment failed' }, { status: 500 })
  }
}
