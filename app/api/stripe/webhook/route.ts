import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { supabaseAdmin } from '@/lib/db'
import Stripe from 'stripe'

// Required for Stripe signature verification — must read raw body
export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  const body = await req.text()
  const sig  = req.headers.get('stripe-signature')
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET

  if (!sig || !webhookSecret) {
    return NextResponse.json({ error: 'Missing signature or webhook secret' }, { status: 400 })
  }

  let event: Stripe.Event
  try {
    event = stripe().webhooks.constructEvent(body, sig, webhookSecret)
  } catch (err: any) {
    console.error('Stripe webhook signature error:', err.message)
    return NextResponse.json({ error: `Webhook error: ${err.message}` }, { status: 400 })
  }

  try {
    switch (event.type) {

      // ── Subscription started ──────────────────────────────────────────────
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        const clientId = session.client_reference_id
        const customerId = session.customer as string
        const subscriptionId = session.subscription as string

        if (!clientId) break

        await supabaseAdmin
          .from('clients')
          .update({
            stripe_customer_id: customerId,
            stripe_subscription_id: subscriptionId,
            status: 'active',
          })
          .eq('id', clientId)

        // Record in billing table
        await supabaseAdmin.from('billing').insert({
          client_id: clientId,
          stripe_invoice_id: session.invoice ?? `session_${session.id}`,
          amount_cents: session.amount_total ?? 4900,
          billing_date: new Date().toISOString(),
          status: 'paid',
        })

        console.log(`Subscription activated for client ${clientId}`)
        break
      }

      // ── Subscription cancelled ────────────────────────────────────────────
      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription
        const customerId = subscription.customer as string

        // Find client by Stripe customer ID
        const { data: client } = await supabaseAdmin
          .from('clients')
          .select('id')
          .eq('stripe_customer_id', customerId)
          .single()

        if (client) {
          await supabaseAdmin
            .from('clients')
            .update({
              status: 'paused',
              stripe_subscription_id: null,
            })
            .eq('id', client.id)

          console.log(`Subscription cancelled for client ${client.id}`)
        }
        break
      }

      // ── Payment failed ────────────────────────────────────────────────────
      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice
        const customerId = invoice.customer as string

        const { data: client } = await supabaseAdmin
          .from('clients')
          .select('id')
          .eq('stripe_customer_id', customerId)
          .single()

        if (client) {
          // Log the failed payment in billing table
          await supabaseAdmin.from('billing').insert({
            client_id: client.id,
            stripe_invoice_id: invoice.id,
            amount_cents: invoice.amount_due,
            billing_date: new Date().toISOString(),
            status: 'failed',
          })

          console.log(`Payment failed for client ${client.id}`)
        }
        break
      }

      default:
        console.log(`Unhandled Stripe event: ${event.type}`)
    }
  } catch (err: any) {
    console.error('Webhook handler error:', err)
    return NextResponse.json({ error: 'Webhook handler failed' }, { status: 500 })
  }

  return NextResponse.json({ received: true })
}
