import Link from 'next/link'
import { supabaseAdmin } from '@/lib/db'
import { RequestStatus, ClientTier } from '@/lib/types'
import ClientCards from '@/components/admin/ClientCards'

export const dynamic = 'force-dynamic'

const statusConfig: Record<RequestStatus, { label: string; dot: string }> = {
  pending:  { label: 'Pending',  dot: 'bg-yellow-400' },
  approved: { label: 'Approved', dot: 'bg-blue-400' },
  deployed: { label: 'Live',     dot: 'bg-emerald-400' },
  rejected: { label: 'Rejected', dot: 'bg-red-400' },
}

function formatDate(iso: string) {
  const d = new Date(iso)
  const month = d.toLocaleString('en-US', { month: 'short' })
  const day = d.getDate()
  const h = d.getHours()
  const m = d.getMinutes().toString().padStart(2, '0')
  const ampm = h >= 12 ? 'PM' : 'AM'
  const hour = h % 12 || 12
  return `${month} ${day}, ${hour}:${m} ${ampm}`
}

export default async function AdminOverviewPage() {
  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()

  const [
    { count: totalClients },
    { count: pendingCount },
    { count: deployedThisMonth },
    { count: totalRequests },
    { data: recentRequests },
    { data: rawClients },
  ] = await Promise.all([
    supabaseAdmin.from('clients').select('*', { count: 'exact', head: true }),
    supabaseAdmin.from('requests').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
    supabaseAdmin
      .from('requests')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'deployed')
      .gte('created_at', startOfMonth),
    supabaseAdmin.from('requests').select('*', { count: 'exact', head: true }),
    supabaseAdmin
      .from('requests')
      .select('*, clients(name), websites(name, deployed_url)')
      .order('created_at', { ascending: false })
      .limit(8),
    supabaseAdmin
      .from('clients')
      .select('id, name, tier, created_at, websites(name, deployed_url), requests(id, status, created_at)')
      .order('name'),
  ])

  const tierConfig: Record<ClientTier, { label: string; className: string }> = {
    basic:        { label: 'Basic',        className: 'text-slate-400 bg-white/5' },
    professional: { label: 'Professional', className: 'text-blue-400 bg-blue-500/10' },
    custom:       { label: 'Custom',       className: 'text-purple-400 bg-purple-500/10' },
  }

  const clientCards = (rawClients ?? []).map((client: any) => {
    const requests: any[] = client.requests ?? []
    const pending = requests.filter((r) => r.status === 'pending').length
    const last = requests
      .map((r) => r.created_at as string)
      .sort((a, b) => new Date(b).getTime() - new Date(a).getTime())[0] ?? null
    const website = (client.websites as any[])?.[0] ?? null
    const vercelUrl = (website?.deployed_url as string | null) ?? null
    return {
      id: client.id as string,
      name: client.name as string,
      tier: client.tier as ClientTier,
      createdAt: client.created_at as string,
      websiteDisplayName: vercelUrl?.replace('https://', '') ?? (website?.name as string | null),
      vercelUrl,
      pendingCount: pending,
      totalRequests: requests.length,
      lastUpdate: last,
    }
  })

  const stats = [
    {
      label: 'Active Clients',
      value: totalClients ?? 0,
      href: '/admin/clients',
      accent: false,
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/>
          <circle cx="9" cy="7" r="4"/>
          <path d="M23 21v-2a4 4 0 00-3-3.87"/>
          <path d="M16 3.13a4 4 0 010 7.75"/>
        </svg>
      ),
    },
    {
      label: 'Pending Approvals',
      value: pendingCount ?? 0,
      href: '/admin/approvals',
      accent: (pendingCount ?? 0) > 0,
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M9 11l3 3L22 4"/>
          <path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/>
        </svg>
      ),
    },
    {
      label: 'Deployed This Month',
      value: deployedThisMonth ?? 0,
      href: '/admin/approvals',
      accent: false,
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="23 4 23 10 17 10"/>
          <polyline points="1 20 1 14 7 14"/>
          <path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15"/>
        </svg>
      ),
    },
    {
      label: 'Total Requests',
      value: totalRequests ?? 0,
      href: '/admin/approvals',
      accent: false,
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
        </svg>
      ),
    },
  ]

  return (
    <div className="px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold mb-1">Overview</h1>
        <p className="text-slate-400 text-sm">
          {now.toLocaleString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
        </p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-4 gap-4 mb-10">
        {stats.map((stat) => (
          <Link
            key={stat.label}
            href={stat.href}
            className="p-5 rounded-2xl flex flex-col gap-3 transition-all hover:scale-[1.02]"
            style={{
              background: stat.accent ? 'rgba(59,130,246,0.1)' : 'rgba(255,255,255,0.04)',
              border: stat.accent ? '1px solid rgba(59,130,246,0.3)' : '1px solid rgba(255,255,255,0.08)',
            }}
          >
            <span className={stat.accent ? 'text-[#3B82F6]' : 'text-slate-400'}>
              {stat.icon}
            </span>
            <div>
              <p className={`text-3xl font-bold ${stat.accent ? 'text-[#3B82F6]' : 'text-white'}`}>
                {stat.value}
              </p>
              <p className="text-xs text-slate-500 mt-0.5">{stat.label}</p>
            </div>
          </Link>
        ))}
      </div>

      {/* Client cards */}
      <ClientCards cards={clientCards} tierConfig={tierConfig} />

      {/* Recent requests */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold">Recent Requests</h2>
          <Link href="/admin/approvals" className="text-xs text-[#3B82F6] hover:text-blue-400 transition-colors">
            View pending →
          </Link>
        </div>

        {!recentRequests || recentRequests.length === 0 ? (
          <div
            className="rounded-2xl px-6 py-12 text-center"
            style={{ border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.02)' }}
          >
            <p className="text-slate-500 text-sm">No requests yet.</p>
            <p className="text-slate-600 text-xs mt-1">They&apos;ll show up here once clients start submitting.</p>
          </div>
        ) : (
          <div className="rounded-2xl overflow-hidden" style={{ border: '1px solid rgba(255,255,255,0.08)' }}>
            {/* Table header */}
            <div
              className="grid grid-cols-[2fr_1.5fr_3fr_1fr_1.2fr] px-5 py-3 text-[11px] font-semibold uppercase tracking-widest text-slate-500"
              style={{ background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}
            >
              <span>Client</span>
              <span>Website</span>
              <span>Request</span>
              <span>Status</span>
              <span>Date</span>
            </div>

            <div className="divide-y divide-white/5">
              {(recentRequests as any[]).map((req) => {
                const status = statusConfig[req.status as RequestStatus]
                return (
                  <div
                    key={req.id}
                    className="grid grid-cols-[2fr_1.5fr_3fr_1fr_1.2fr] px-5 py-4 items-center hover:bg-white/[0.03] transition-colors"
                  >
                    <span className="font-medium text-white text-sm truncate pr-2">
                      {req.clients?.name ?? '—'}
                    </span>
                    <span className="text-slate-400 text-sm truncate pr-2">
                      {req.websites?.deployed_url?.replace('https://', '') ?? req.websites?.name ?? '—'}
                    </span>
                    <p className="text-slate-300 text-sm truncate pr-4">{req.message_text}</p>
                    <div className="flex items-center gap-1.5">
                      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${status.dot}`} />
                      <span className="text-sm text-slate-300">{status.label}</span>
                    </div>
                    <span className="text-xs text-slate-500">{formatDate(req.created_at)}</span>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
