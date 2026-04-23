export const dynamic = 'force-dynamic'

import { notFound } from 'next/navigation'
import { supabaseAdmin } from '@/lib/db'
import PortalClient from '@/components/portal/PortalClient'
import { Client, Website, Request } from '@/lib/types'

export default async function PortalPage({ params }: { params: Promise<{ clientId: string }> }) {
  const { clientId } = await params

  // Fetch client
  const { data: client, error: clientError } = await supabaseAdmin
    .from('clients')
    .select('*')
    .eq('id', clientId)
    .single()

  if (clientError || !client) return notFound()

  // Fetch website for this client
  const { data: website, error: websiteError } = await supabaseAdmin
    .from('websites')
    .select('*')
    .eq('client_id', clientId)
    .single()

  if (websiteError || !website) return notFound()

  // Fetch existing requests (newest first)
  const { data: requests } = await supabaseAdmin
    .from('requests')
    .select('*')
    .eq('client_id', clientId)
    .order('created_at', { ascending: false })

  return (
    <PortalClient
      client={client as Client}
      website={website as Website}
      initialRequests={(requests ?? []) as Request[]}
    />
  )
}
