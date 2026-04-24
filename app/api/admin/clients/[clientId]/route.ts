import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/db'

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ clientId: string }> }
) {
  try {
    const { clientId } = await params
    const { name, email, tier, status, githubRepo, deployedUrl, websiteId } = await req.json()

    // Update client
    const { error: clientError } = await supabaseAdmin
      .from('clients')
      .update({ name, email, tier, status })
      .eq('id', clientId)

    if (clientError) {
      return NextResponse.json({ error: 'Failed to update client' }, { status: 500 })
    }

    // Update or create website record
    if (websiteId) {
      // Update existing website
      await supabaseAdmin
        .from('websites')
        .update({
          github_repo_url: githubRepo?.trim() || null,
          deployed_url: deployedUrl?.trim() || null,
        })
        .eq('id', websiteId)
    } else if (githubRepo || deployedUrl) {
      // Create new website record for this client
      await supabaseAdmin
        .from('websites')
        .insert({
          client_id: clientId,
          name: name,
          github_repo_url: githubRepo?.trim() || null,
          deployed_url: deployedUrl?.trim() || null,
        })
    }

    // Return updated client + website
    const { data: client } = await supabaseAdmin
      .from('clients')
      .select('*, websites(*)')
      .eq('id', clientId)
      .single()

    return NextResponse.json({ client })
  } catch (err: any) {
    console.error('update client error:', err)
    return NextResponse.json({ error: err.message || 'Failed to update client' }, { status: 500 })
  }
}
