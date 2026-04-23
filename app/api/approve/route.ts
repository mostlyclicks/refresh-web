import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/db'

export async function POST(req: NextRequest) {
  try {
    const { requestId, suggestionId, action, notes } = await req.json()

    if (!requestId || !action) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const newStatus = action === 'approve' ? 'approved'
      : action === 'reject' ? 'rejected'
      : 'pending' // clarify keeps it pending

    // Update request status
    const { error: reqError } = await supabaseAdmin
      .from('requests')
      .update({ status: newStatus })
      .eq('id', requestId)

    if (reqError) {
      return NextResponse.json({ error: 'Failed to update request' }, { status: 500 })
    }

    // If approving, stamp the suggestion
    if (action === 'approve' && suggestionId) {
      await supabaseAdmin
        .from('suggestions')
        .update({
          approved_at: new Date().toISOString(),
          approved_by: 'carlos',
        })
        .eq('id', suggestionId)

      // Trigger deployment pipeline
      const deployRes = await fetch(new URL('/api/deploy', req.url).toString(), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ suggestionId }),
      })

      if (!deployRes.ok) {
        const deployErr = await deployRes.json()
        console.error('Deploy failed:', deployErr)
        // Don't fail the approval — log it and continue
      }
    }

    return NextResponse.json({ success: true, action, newStatus })
  } catch (err: any) {
    console.error('approve error:', err)
    return NextResponse.json({ error: err.message || 'Failed to process approval' }, { status: 500 })
  }
}
