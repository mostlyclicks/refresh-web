'use client'

import { useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ClientStatus, ClientTier } from '@/lib/types'

interface ClientRow {
  id: string
  name: string
  email: string
  website: string
  tier: ClientTier
  status: ClientStatus
  nextBilling: string
  mrr: number
}

const mockClients: ClientRow[] = [
  {
    id: '1',
    name: 'Sunrise Bakery',
    email: 'owner@sunrisebakery.com',
    website: 'sunrisebakery.com',
    tier: 'professional',
    status: 'active',
    nextBilling: 'May 1, 2025',
    mrr: 199,
  },
  {
    id: '2',
    name: 'Peak Plumbing Co.',
    email: 'admin@peakplumbing.co',
    website: 'peakplumbing.co',
    tier: 'basic',
    status: 'active',
    nextBilling: 'May 1, 2025',
    mrr: 99,
  },
  {
    id: '3',
    name: 'Green Thumb Landscaping',
    email: 'hello@greenthumb.garden',
    website: 'greenthumb.garden',
    tier: 'basic',
    status: 'paused',
    nextBilling: '—',
    mrr: 0,
  },
]

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
  const initials = name.split(' ').map(w => w[0]).slice(0, 2).join('')
  return (
    <div className="w-8 h-8 rounded-full bg-[#3B82F6]/15 flex items-center justify-center text-[#3B82F6] text-xs font-bold shrink-0">
      {initials}
    </div>
  )
}

export default function ClientsPage() {
  const [clients] = useState(mockClients)
  const activeCount = clients.filter(c => c.status === 'active').length

  return (
    <div className="px-8 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold mb-1">Clients</h1>
          <p className="text-slate-400 text-sm">{clients.length} total · {activeCount} active</p>
        </div>
        <Button className="bg-[#3B82F6] hover:bg-blue-500 text-white font-medium text-sm cursor-pointer">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="mr-1.5">
            <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          Add Client
        </Button>
      </div>

      {/* Table */}
      <div className="rounded-2xl overflow-hidden" style={{ border: '1px solid rgba(255,255,255,0.08)' }}>
        {/* Table header */}
        <div className="grid grid-cols-[2fr_1.5fr_1fr_1fr_1.2fr_80px_80px] px-5 py-3 text-[11px] font-semibold uppercase tracking-widest text-slate-500"
          style={{ background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <span>Client</span>
          <span>Website</span>
          <span>Tier</span>
          <span>Status</span>
          <span>Next Billing</span>
          <span className="text-right">MRR</span>
          <span></span>
        </div>

        {/* Rows */}
        <div className="divide-y divide-white/5">
          {clients.map((client) => (
            <div
              key={client.id}
              className="grid grid-cols-[2fr_1.5fr_1fr_1fr_1.2fr_80px_80px] px-5 py-4 items-center hover:bg-white/[0.03] transition-colors"
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
              <span className="text-slate-400 text-sm">{client.website}</span>

              {/* Tier */}
              <Badge className={`text-[11px] font-medium capitalize w-fit ${tierStyles[client.tier]}`}>
                {client.tier}
              </Badge>

              {/* Status */}
              <div className="flex items-center gap-1.5">
                <span className={`w-1.5 h-1.5 rounded-full ${
                  client.status === 'active' ? 'bg-emerald-400' :
                  client.status === 'paused' ? 'bg-amber-400' : 'bg-slate-500'
                }`}></span>
                <span className="text-sm text-slate-300 capitalize">{client.status}</span>
              </div>

              {/* Next billing */}
              <span className="text-sm text-slate-400">{client.nextBilling}</span>

              {/* MRR */}
              <span className="text-right font-mono text-sm text-slate-300">
                {client.mrr > 0 ? `$${client.mrr}` : '—'}
              </span>

              {/* Actions */}
              <div className="flex justify-end">
                <button className="text-xs text-slate-500 hover:text-white transition-colors cursor-pointer">
                  Manage
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
