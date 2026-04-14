import Stripe from 'stripe'

function getStripe() {
  if (!process.env.STRIPE_SECRET_KEY) throw new Error('STRIPE_SECRET_KEY is not set')
  return new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: '2026-03-25.dahlia',
  })
}

// Lazy singleton
let _stripe: Stripe | null = null
export function stripe() {
  if (!_stripe) _stripe = getStripe()
  return _stripe
}

export async function createCustomer(name: string, email: string): Promise<string> {
  const customer = await stripe().customers.create({ name, email })
  return customer.id
}

export async function createSubscription(
  customerId: string,
  priceId: string
): Promise<Stripe.Subscription> {
  return stripe().subscriptions.create({
    customer: customerId,
    items: [{ price: priceId }],
    payment_behavior: 'default_incomplete',
    expand: ['latest_invoice.payment_intent'],
  })
}

export async function cancelSubscription(subscriptionId: string): Promise<void> {
  await stripe().subscriptions.cancel(subscriptionId)
}

// Price IDs — set these in Stripe dashboard and add to .env
export const PRICE_IDS = {
  basic: process.env.STRIPE_PRICE_BASIC!,       // $99/mo
  professional: process.env.STRIPE_PRICE_PRO!,  // $199/mo
}
