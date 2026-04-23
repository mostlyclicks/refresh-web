import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function GET() {
  const [
    { count: totalClients },
    { count: pendingCount },
    { count: deployedThisMonth },
    { data: recentRequests },
  ] = await Promise.all([
    supabaseAdmin.from('clients').select('*', { count: 'exact', head: true }),
    supabaseAdmin.from('requests').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
    supabaseAdmin
      .from('requests')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'deployed')
      .gte('created_at', new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString()),
    supabaseAdmin
      .from('requests')
      .select('*, clients(name), websites(name, deployed_url)')
      .order('created_at', { ascending: false })
      .limit(6),
  ])

  return NextResponse.json({
    totalClients: totalClients ?? 0,
    pendingCount: pendingCount ?? 0,
    deployedThisMonth: deployedThisMonth ?? 0,
    recentRequests: recentRequests ?? [],
  })
}
