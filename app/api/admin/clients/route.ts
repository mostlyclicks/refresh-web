import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/db'

export async function POST(req: NextRequest) {
  try {
    const { name, email, tier, websiteName, githubRepo, deployedUrl } = await req.json()

    if (!name || !email || !tier) {
      return NextResponse.json({ error: 'Name, email, and tier are required' }, { status: 400 })
    }

    // Create client record
    const { data: client, error: clientError } = await supabaseAdmin
      .from('clients')
      .insert({
        name: name.trim(),
        email: email.trim().toLowerCase(),
        tier,
        status: 'active',
      })
      .select()
      .single()

    if (clientError || !client) {
      console.error('Failed to create client:', clientError)
      return NextResponse.json({ error: 'Failed to create client' }, { status: 500 })
    }

    // Create website record if any website info was provided
    let website = null
    if (websiteName || githubRepo || deployedUrl) {
      const { data: w, error: websiteError } = await supabaseAdmin
        .from('websites')
        .insert({
          client_id: client.id,
          name: (websiteName || name).trim(),
          github_repo_url: githubRepo?.trim() || null,
          deployed_url: deployedUrl?.trim() || null,
        })
        .select()
        .single()

      if (websiteError) {
        console.error('Failed to create website:', websiteError)
        // Don't fail — client was created, website can be added later
      } else {
        website = w
      }
    }

    return NextResponse.json({ client, website })
  } catch (err: any) {
    console.error('create client error:', err)
    return NextResponse.json({ error: err.message || 'Failed to create client' }, { status: 500 })
  }
}
