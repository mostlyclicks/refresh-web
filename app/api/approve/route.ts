import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const { suggestionId, action, notes } = await req.json()
    // action: 'approve' | 'reject' | 'clarify'

    if (!suggestionId || !action) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // TODO: Update suggestion in database
    // await supabase.from('suggestions').update({
    //   approved_at: action === 'approve' ? new Date().toISOString() : null,
    //   approved_by: 'carlos',
    // }).eq('id', suggestionId)

    // TODO: Update request status
    // await supabase.from('requests').update({ status: action === 'approve' ? 'approved' : 'rejected' })

    if (action === 'approve') {
      // TODO: Trigger deployment pipeline
      // await fetch('/api/deploy', { method: 'POST', body: JSON.stringify({ suggestionId }) })
    }

    return NextResponse.json({ success: true, action })
  } catch (err) {
    console.error('approve error:', err)
    return NextResponse.json({ error: 'Failed to process approval' }, { status: 500 })
  }
}
