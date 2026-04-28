'use client'

import Link from 'next/link'
import { useState } from 'react'
import { ClientTier } from '@/lib/types'

type SortOption = 'name' | 'plan' | 'status' | 'start_date' | 'last_update' | 'requests'

export interface ClientCardData {
  id: string
  name: string
  tier: ClientTier
  createdAt: string
  websiteDisplayName: string | null
  vercelUrl: string | null
  pendingCount: number
  totalRequests: number
  lastUpdate: string | null
}

export interface TierInfo {
  label: string
  className: string
}

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: 'name',        label: 'Client Name (A–Z)' },
  { value: 'plan',        label: 'Plan' },
  { value: 'status',      label: 'Approval Status' },
  { value: 'start_date',  label: 'Start Date' },
  { value: 'last_update', label: 'Last Update' },
  { value: 'requests',    label: 'Number of Requests' },
]

const TIER_ORDER: Record<ClientTier, number> = {
  custom: 0,
  professional: 1,
  basic: 2,
}

function sortCards(cards: ClientCardData[], sort: SortOption): ClientCardData[] {
  return [...cards].sort((a, b) => {
    switch (sort) {
      case 'name':
        return a.name.localeCompare(b.name)
      case 'plan':
        return TIER_ORDER[a.tier] - TIER_ORDER[b.tier]
      case 'status':
        if (a.pendingCount > 0 && b.pendingCount === 0) return -1
        if (a.pendingCount === 0 && b.pendingCount > 0) return 1
        return a.name.localeCompare(b.name)
      case 'start_date':
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      case 'last_update':
        if (!a.lastUpdate && !b.lastUpdate) return 0
        if (!a.lastUpdate) return 1
        if (!b.lastUpdate) return -1
        return new Date(b.lastUpdate).getTime() - new Date(a.lastUpdate).getTime()
      case 'requests':
        return b.totalRequests - a.totalRequests
      default:
        return 0
    }
  })
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

interface Props {
  cards: ClientCardData[]
  tierConfig: Record<ClientTier, TierInfo>
}

export default function ClientCards({ cards, tierConfig }: Props) {
  const [sort, setSort] = useState<SortOption>('name')
  const sorted = sortCards(cards, sort)

  return (
    <div className="mb-10">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-base font-semibold">Clients</h2>
        <div className="flex items-center gap-3">
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as SortOption)}
            className="text-xs bg-white/5 border border-white/10 text-slate-300 rounded-lg px-3 py-1.5 outline-none cursor-pointer hover:bg-white/[0.08] transition-colors"
          >
            {SORT_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value} className="bg-[#0f1117]">
                {opt.label}
              </option>
            ))}
          </select>
          <Link href="/admin/clients" className="text-xs text-[#3B82F6] hover:text-blue-400 transition-colors">
            Manage clients →
          </Link>
        </div>
      </div>

      {cards.length === 0 ? (
        <div
          className="rounded-2xl px-6 py-12 text-center"
          style={{ border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.02)' }}
        >
          <p className="text-slate-500 text-sm">No clients yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-4">
          {sorted.map((client) => {
            const tier = tierConfig[client.tier] ?? tierConfig.basic
            return (
              <div
                key={client.id}
                className="relative rounded-2xl p-5 flex flex-col gap-3 transition-all hover:scale-[1.02]"
                style={{
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.08)',
                }}
              >
                {/* Full-card portal link sits behind interactive elements */}
                <Link
                  href={`/portal/${client.id}`}
                  className="absolute inset-0 rounded-2xl z-0"
                  aria-label={`Open ${client.name} portal`}
                />

                {/* Name + status badge */}
                <div className="relative z-10 flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-semibold text-white text-sm truncate">{client.name}</p>
                    {client.websiteDisplayName && (
                      <p className="text-xs text-slate-500 truncate mt-0.5">{client.websiteDisplayName}</p>
                    )}
                  </div>
                  {client.pendingCount > 0 ? (
                    <span className="shrink-0 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-400 border border-amber-500/20">
                      {client.pendingCount} Pending
                    </span>
                  ) : (
                    <span className="shrink-0 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/20">
                      Up to date
                    </span>
                  )}
                </div>

                <div className="relative z-10" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }} />

                {/* Stats + Vercel link */}
                <div className="relative z-10 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${tier.className}`}>
                      {tier.label}
                    </span>
                    <span className="text-xs text-slate-500">
                      {client.totalRequests} update{client.totalRequests !== 1 ? 's' : ''}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-600">
                      {client.lastUpdate ? formatDate(client.lastUpdate) : 'No activity'}
                    </span>
                    {client.vercelUrl && (
                      <a
                        href={client.vercelUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        title="Open live site"
                        className="relative z-20 text-slate-600 hover:text-slate-300 transition-colors"
                      >
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6"/>
                          <polyline points="15 3 21 3 21 9"/>
                          <line x1="10" y1="14" x2="21" y2="3"/>
                        </svg>
                      </a>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
