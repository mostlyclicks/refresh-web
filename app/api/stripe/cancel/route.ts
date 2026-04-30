import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/db'
import { cancelSubscription } from '@/lib/stripe'

export async function POST(req: NextRequest) {
  try {
    const { clientId } = await req.json()

    if (!clientId) {
      return NextResponse.json({ error: 'Missing clientId' }, { status: 400 })
    }

    const { data: client, error } = await supabaseAdmin
      .from('clients')
      .select('id, stripe_subscription_id')
      .eq('id', clientId)
      .single()

    if (error || !client) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 })
    }

    if (!client.stripe_subscription_id) {
      return NextResponse.json({ error: 'No active subscription' }, { status: 400 })
    }

    await cancelSubscription(client.stripe_subscription_id)

    // Webhook will handle updating status, but update optimistically too
    await supabaseAdmin
      .from('clients')
      .update({ status: 'paused', stripe_subscription_id: null })
      .eq('id', clientId)

    return NextResponse.json({ success: true })
  } catch (err: any) {
    console.error('Cancel subscription error:', err)
    return NextResponse.json({ error: err.message || 'Failed to cancel subscription' }, { status: 500 })
  }
}
