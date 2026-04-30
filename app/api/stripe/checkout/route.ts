import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/db'
import { findOrCreateCustomer, createCheckoutSession } from '@/lib/stripe'

export async function POST(req: NextRequest) {
  try {
    const { clientId, email } = await req.json()

    if (!clientId || !email) {
      return NextResponse.json({ error: 'Missing clientId or email' }, { status: 400 })
    }

    // Fetch client from Supabase
    const { data: client, error } = await supabaseAdmin
      .from('clients')
      .select('id, name, email, tier, stripe_customer_id')
      .eq('id', clientId)
      .single()

    if (error || !client) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 })
    }

    // Pick price based on tier
    const priceId = client.tier === 'professional'
      ? process.env.STRIPE_PRICE_ID_PRO
      : process.env.STRIPE_PRICE_ID_BASIC

    if (!priceId) {
      return NextResponse.json(
        { error: `Price ID not set for tier: ${client.tier}. Add STRIPE_PRICE_ID_BASIC and STRIPE_PRICE_ID_PRO to env vars.` },
        { status: 500 }
      )
    }

    // Find or create Stripe customer
    let customerId = client.stripe_customer_id
    if (!customerId) {
      customerId = await findOrCreateCustomer(client.name, email)

      // Save customer ID back to Supabase
      await supabaseAdmin
        .from('clients')
        .update({ stripe_customer_id: customerId })
        .eq('id', clientId)
    }

    // Create checkout session
    const baseUrl = req.nextUrl.origin
    const checkoutUrl = await createCheckoutSession(customerId, clientId, priceId, baseUrl)

    return NextResponse.json({ url: checkoutUrl })
  } catch (err: any) {
    console.error('Stripe checkout error:', err)
    return NextResponse.json({ error: err.message || 'Failed to create checkout session' }, { status: 500 })
  }
}
