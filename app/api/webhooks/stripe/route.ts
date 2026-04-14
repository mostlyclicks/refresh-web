import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import Stripe from 'stripe'

export async function POST(req: NextRequest) {
  const body = await req.text()
  const sig = req.headers.get('stripe-signature')!

  let event: Stripe.Event

  try {
    event = stripe().webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!)
  } catch (err) {
    console.error('Stripe webhook signature verification failed:', err)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  switch (event.type) {
    case 'customer.subscription.created': {
      const subscription = event.data.object as Stripe.Subscription
      // TODO: Find client by stripe_customer_id and mark as active
      console.log('Subscription created:', subscription.id)
      break
    }

    case 'customer.subscription.deleted': {
      const subscription = event.data.object as Stripe.Subscription
      // TODO: Find client and mark as paused/archived
      console.log('Subscription cancelled:', subscription.id)
      break
    }

    case 'invoice.payment_succeeded': {
      const invoice = event.data.object as Stripe.Invoice
      // TODO: Log billing record in database
      console.log('Payment succeeded:', invoice.id)
      break
    }

    case 'invoice.payment_failed': {
      const invoice = event.data.object as Stripe.Invoice
      // TODO: Log failed billing record, send email reminder
      console.log('Payment failed:', invoice.id)
      break
    }

    default:
      console.log('Unhandled event type:', event.type)
  }

  return NextResponse.json({ received: true })
}
