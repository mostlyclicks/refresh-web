import { supabaseAdmin } from '@/lib/db'
import { Client, Website } from '@/lib/types'
import ClientsClient from '@/components/admin/ClientsClient'

export const dynamic = 'force-dynamic'

export default async function ClientsPage() {
  const [{ data: clients, error }, { data: requestCounts }] = await Promise.all([
    supabaseAdmin
      .from('clients')
      .select('*, websites(*)')
      .order('created_at', { ascending: false }),
    supabaseAdmin
      .from('requests')
      .select('client_id'),
  ])

  if (error) console.error('Failed to load clients:', error)

  const rows = (clients ?? []) as (Client & { websites: Website[] })[]

  const countMap: Record<string, number> = {}
  for (const r of requestCounts ?? []) {
    countMap[r.client_id] = (countMap[r.client_id] ?? 0) + 1
  }

  return <ClientsClient initialClients={rows} countMap={countMap} />
}
