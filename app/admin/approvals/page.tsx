import { supabaseAdmin } from '@/lib/db'
import ApprovalsClient from '@/components/admin/ApprovalsClient'

export const dynamic = 'force-dynamic'

export default async function ApprovalsPage() {
  // Fetch pending requests with their suggestions and client/website info
  const { data: requests, error } = await supabaseAdmin
    .from('requests')
    .select(`
      *,
      clients (id, name),
      websites (id, name, deployed_url, github_repo_url),
      suggestions (*)
    `)
    .eq('status', 'pending')
    .order('created_at', { ascending: false })

  if (error) console.error('Failed to load approvals:', error)

  return <ApprovalsClient initialRequests={requests ?? []} />
}
