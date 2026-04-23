import { supabaseAdmin } from '@/lib/db'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Client, Website, ClientStatus, ClientTier } from '@/lib/types'

export const dynamic = 'force-dynamic'

const statusStyles: Record<ClientStatus, string> = {
  active:   'bg-emerald-400/10 text-emerald-400 border-emerald-400/20',
  paused:   'bg-amber-400/10 text-amber-400 border-amber-400/20',
  archived: 'bg-slate-400/10 text-slate-400 border-slate-400/20',
}

const tierStyles: Record<ClientTier, string> = {
  basic:        'bg-white/8 text-slate-400 border-white/10',
  professional: 'bg-[#3B82F6]/10 text-[#3B82F6] border-[#3B82F6]/20',
  custom:       'bg-violet-400/10 text-violet-400 border-violet-400/20',
}

function Avatar({ name }: { name: string }) {
  const initials = name.split(' ').map((w: string) => w[0]).slice(0, 2).join('')
  return (
    <div className="w-8 h-8 rounded-full bg-[#3B82F6]/15 flex items-center justify-center text-[#3B82F6] text-xs font-bold shrink-0">
      {initials}
    </div>
  )
}

interface ClientWithWebsite extends Client {
  websites: Website[]
  request_count: number
}

export default async function ClientsPage() {
  // Fetch clients with their websites
  const { data: clients, error } = await supabaseAdmin
    .from('clients')
    .select('*, websites(*)')
    .order('created_at', { ascending: false })

  if (error) console.error('Failed to load clients:', error)

  const rows = (clients ?? []) as (Client & { websites: Website[] })[]

  // Fetch request counts per client
  const { data: requestCounts } = await supabaseAdmin
    .from('requests')
    .select('client_id')

  const countMap: Record<string, number> = {}
  for (const r of requestCounts ?? []) {
    countMap[r.client_id] = (countMap[r.client_id] ?? 0) + 1
  }

  const activeCount = rows.filter(c => c.status === 'active').length

  return (
    <div className="px-8 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold mb-1">Clients</h1>
          <p className="text-slate-400 text-sm">
            {rows.length} total · {activeCount} active
          </p>
        </div>
        <Button className="bg-[#3B82F6] hover:bg-blue-500 text-white font-medium text-sm cursor-pointer">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="mr-1.5">
            <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          Add Client
        </Button>
      </div>

      {rows.length === 0 ? (
        <div
          className="rounded-2xl px-6 py-16 text-center"
          style={{ border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.02)' }}
        >
          <p className="text-slate-500 text-sm">No clients yet.</p>
          <p className="text-slate-600 text-xs mt-1">Add your first client to get started.</p>
        </div>
      ) : (
        <div className="rounded-2xl overflow-hidden" style={{ border: '1px solid rgba(255,255,255,0.08)' }}>
          {/* Table header */}
          <div
            className="grid grid-cols-[2fr_1.5fr_1fr_1fr_80px_80px_60px] px-5 py-3 text-[11px] font-semibold uppercase tracking-widest text-slate-500"
            style={{ background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}
          >
            <span>Client</span>
            <span>Website</span>
            <span>Tier</span>
            <span>Status</span>
            <span className="text-right">Requests</span>
            <span className="text-right">Since</span>
            <span />
          </div>

          {/* Rows */}
          <div className="divide-y divide-white/5">
            {rows.map((client) => {
              const website = client.websites?.[0]
              const reqCount = countMap[client.id] ?? 0
              const since = new Date(client.created_at).toLocaleString('en-US', { month: 'short', year: 'numeric' })

              return (
                <div
                  key={client.id}
                  className="grid grid-cols-[2fr_1.5fr_1fr_1fr_80px_80px_60px] px-5 py-4 items-center hover:bg-white/[0.03] transition-colors"
                >
                  {/* Client */}
                  <div className="flex items-center gap-3 min-w-0">
                    <Avatar name={client.name} />
                    <div className="min-w-0">
                      <p className="font-medium text-white text-sm truncate">{client.name}</p>
                      <p className="text-xs text-slate-500 truncate">{client.email}</p>
                    </div>
                  </div>

                  {/* Website */}
                  <div className="min-w-0">
                    {website?.deployed_url ? (
                      <a
                        href={website.deployed_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-slate-400 text-sm truncate hover:text-[#3B82F6] transition-colors block"
                      >
                        {website.deployed_url.replace('https://', '')}
                      </a>
                    ) : (
                      <span className="text-slate-600 text-sm">No website</span>
                    )}
                  </div>

                  {/* Tier */}
                  <Badge className={`text-[11px] font-medium capitalize w-fit ${tierStyles[client.tier]}`}>
                    {client.tier}
                  </Badge>

                  {/* Status */}
                  <div className="flex items-center gap-1.5">
                    <span className={`w-1.5 h-1.5 rounded-full ${
                      client.status === 'active' ? 'bg-emerald-400' :
                      client.status === 'paused' ? 'bg-amber-400' : 'bg-slate-500'
                    }`} />
                    <span className="text-sm text-slate-300 capitalize">{client.status}</span>
                  </div>

                  {/* Request count */}
                  <span className="text-right font-mono text-sm text-slate-400">{reqCount}</span>

                  {/* Since */}
                  <span className="text-right text-xs text-slate-500">{since}</span>

                  {/* Actions */}
                  <div className="flex justify-end">
                    <button className="text-xs text-slate-500 hover:text-white transition-colors cursor-pointer">
                      View
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
