import Stripe from 'stripe'

function getStripe() {
  if (!process.env.STRIPE_SECRET_KEY) throw new Error('STRIPE_SECRET_KEY is not set')
  return new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: '2026-03-25.dahlia',
  })
}

let _stripe: Stripe | null = null
export function stripe() {
  if (!_stripe) _stripe = getStripe()
  return _stripe
}

export async function findOrCreateCustomer(name: string, email: string): Promise<string> {
  // Check if customer already exists in Stripe
  const existing = await stripe().customers.list({ email, limit: 1 })
  if (existing.data.length > 0) return existing.data[0].id
  const customer = await stripe().customers.create({ name, email })
  return customer.id
}

export async function createCheckoutSession(
  customerId: string,
  clientId: string,
  priceId: string,
  baseUrl: string
): Promise<string> {
  const session = await stripe().checkout.sessions.create({
    customer: customerId,
    mode: 'subscription',
    line_items: [{ price: priceId, quantity: 1 }],
    client_reference_id: clientId,
    success_url: `${baseUrl}/admin/billing?success=1`,
    cancel_url:  `${baseUrl}/admin/billing?cancelled=1`,
    subscription_data: {
      metadata: { clientId },
    },
  })
  return session.url!
}

export async function cancelSubscription(subscriptionId: string): Promise<void> {
  await stripe().subscriptions.cancel(subscriptionId)
}
