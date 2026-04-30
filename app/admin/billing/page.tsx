import { supabaseAdmin } from '@/lib/db'
import BillingClient from '@/components/admin/BillingClient'

export const dynamic = 'force-dynamic'

export default async function BillingPage() {
  // Fetch all clients
  const { data: clients } = await supabaseAdmin
    .from('clients')
    .select('id, name, email, tier, status, stripe_subscription_id')
    .order('name')

  // Fetch billing records joined with client names
  const { data: billing } = await supabaseAdmin
    .from('billing')
    .select('id, client_id, stripe_invoice_id, amount_cents, billing_date, status, clients(name)')
    .order('billing_date', { ascending: false })
    .limit(50)

  const billingRecords = (billing ?? []).map((b: any) => ({
    id: b.id,
    client_id: b.client_id,
    client_name: b.clients?.name ?? 'Unknown',
    stripe_invoice_id: b.stripe_invoice_id,
    amount_cents: b.amount_cents,
    billing_date: b.billing_date,
    status: b.status,
  }))

  return (
    <BillingClient
      clients={clients ?? []}
      billingRecords={billingRecords}
    />
  )
}
