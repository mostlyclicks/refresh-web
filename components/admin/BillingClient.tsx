'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Badge } from '@/components/ui/badge'

type Client = {
  id: string
  name: string
  email: string
  tier: string
  status: string
  stripe_subscription_id: string | null
}

type BillingRecord = {
  id: string
  client_id: string
  client_name: string
  stripe_invoice_id: string
  amount_cents: number
  billing_date: string
  status: string
}

type Props = {
  clients: Client[]
  billingRecords: BillingRecord[]
}

export default function BillingClient({ clients, billingRecords }: Props) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [loadingId, setLoadingId] = useState<string | null>(null)
  const [flash, setFlash] = useState<string | null>(null)

  useEffect(() => {
    if (searchParams.get('success') === '1') {
      setFlash('Subscription activated successfully!')
      router.replace('/admin/billing')
    } else if (searchParams.get('cancelled') === '1') {
      setFlash('Checkout cancelled.')
      router.replace('/admin/billing')
    }
  }, [searchParams, router])

  const activeClients = clients.filter(
    (c) => c.stripe_subscription_id && c.status === 'active'
  )

  const tierPrice = (tier: string) => (tier === 'professional' ? 99 : 49)
  const MRR = activeClients.reduce((sum, c) => sum + tierPrice(c.tier), 0)

  async function handleSubscribe(client: Client) {
    setLoadingId(client.id)
    try {
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clientId: client.id, email: client.email }),
      })
      const data = await res.json()
      if (data.url) {
        window.location.href = data.url
      } else {
        alert(data.error || 'Failed to create checkout session')
      }
    } catch {
      alert('Something went wrong')
    } finally {
      setLoadingId(null)
    }
  }

  async function handleCancel(client: Client) {
    if (!confirm(`Cancel ${client.name}'s subscription? This takes effect immediately.`)) return
    setLoadingId(client.id)
    try {
      const res = await fetch('/api/stripe/cancel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clientId: client.id }),
      })
      const data = await res.json()
      if (data.success) {
        setFlash(`Subscription cancelled for ${client.name}.`)
        router.refresh()
      } else {
        alert(data.error || 'Failed to cancel subscription')
      }
    } catch {
      alert('Something went wrong')
    } finally {
      setLoadingId(null)
    }
  }

  return (
    <div className="px-8 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold mb-1">Billing</h1>
        <p className="text-slate-400 text-sm">Revenue overview and client subscriptions</p>
      </div>

      {/* Flash message */}
      {flash && (
        <div
          className="mb-6 px-4 py-3 rounded-xl text-sm flex items-center justify-between"
          style={{ background: 'rgba(59,130,246,0.12)', border: '1px solid rgba(59,130,246,0.3)', color: '#93c5fd' }}
        >
          <span>{flash}</span>
          <button onClick={() => setFlash(null)} className="text-slate-500 hover:text-white ml-4">✕</button>
        </div>
      )}

      {/* MRR Cards */}
      <div className="grid grid-cols-3 gap-4 mb-10">
        {[
          {
            label: 'Monthly Recurring Revenue',
            value: `$${MRR.toLocaleString()}`,
            sub: `${activeClients.length} active subscription${activeClients.length !== 1 ? 's' : ''}`,
            accent: true,
          },
          {
            label: 'Annual Run Rate',
            value: `$${(MRR * 12).toLocaleString()}`,
            sub: 'Based on current MRR',
            accent: false,
          },
          {
            label: 'Avg per Client',
            value: activeClients.length > 0 ? `$${Math.round(MRR / activeClients.length)}` : '—',
            sub: 'Across active subscriptions',
            accent: false,
          },
        ].map((card) => (
          <div
            key={card.label}
            className="p-6 rounded-2xl"
            style={{
              background: card.accent ? 'rgba(59,130,246,0.1)' : 'rgba(255,255,255,0.04)',
              border: card.accent ? '1px solid rgba(59,130,246,0.25)' : '1px solid rgba(255,255,255,0.08)',
            }}
          >
            <p className="text-slate-400 text-xs font-medium mb-3">{card.label}</p>
            <p className={`text-4xl font-bold mb-1 ${card.accent ? 'text-[#3B82F6]' : 'text-white'}`}>
              {card.value}
            </p>
            <p className="text-xs text-slate-500">{card.sub}</p>
          </div>
        ))}
      </div>

      {/* Client Subscriptions */}
      <div className="mb-10">
        <h2 className="text-base font-semibold mb-4">Client Subscriptions</h2>
        <div className="rounded-2xl overflow-hidden" style={{ border: '1px solid rgba(255,255,255,0.08)' }}>
          <div
            className="grid grid-cols-[2fr_1fr_1fr_1fr_auto] px-5 py-3 text-[11px] font-semibold uppercase tracking-widest text-slate-500"
            style={{ background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}
          >
            <span>Client</span>
            <span>Plan</span>
            <span>Amount</span>
            <span>Status</span>
            <span className="w-28"></span>
          </div>
          <div className="divide-y divide-white/5">
            {clients.length === 0 && (
              <div className="px-5 py-8 text-center text-slate-500 text-sm">No clients yet</div>
            )}
            {clients.map((client) => {
              const isActive = !!client.stripe_subscription_id && client.status === 'active'
              const isLoading = loadingId === client.id
              return (
                <div
                  key={client.id}
                  className="grid grid-cols-[2fr_1fr_1fr_1fr_auto] px-5 py-4 items-center hover:bg-white/[0.03] transition-colors"
                >
                  <div>
                    <p className="font-medium text-white text-sm">{client.name}</p>
                    <p className="text-slate-500 text-xs">{client.email}</p>
                  </div>
                  <span className="text-slate-400 text-sm capitalize">{client.tier}</span>
                  <span className="font-mono text-slate-300 text-sm">
                    ${tierPrice(client.tier)}/mo
                  </span>
                  <div className="flex items-center gap-1.5">
                    {isActive ? (
                      <>
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                        <span className="text-sm text-slate-300">Active</span>
                      </>
                    ) : (
                      <>
                        <span className="w-1.5 h-1.5 rounded-full bg-slate-600"></span>
                        <span className="text-sm text-slate-500 capitalize">{client.status}</span>
                      </>
                    )}
                  </div>
                  <div className="w-28 flex justify-end">
                    {isActive ? (
                      <button
                        onClick={() => handleCancel(client)}
                        disabled={isLoading}
                        className="px-3 py-1.5 rounded-lg text-xs font-medium text-red-400 border border-red-400/30 hover:bg-red-400/10 transition-colors disabled:opacity-50"
                      >
                        {isLoading ? 'Cancelling…' : 'Cancel'}
                      </button>
                    ) : (
                      <button
                        onClick={() => handleSubscribe(client)}
                        disabled={isLoading}
                        className="px-3 py-1.5 rounded-lg text-xs font-medium text-white bg-[#3B82F6] hover:bg-blue-500 transition-colors disabled:opacity-50"
                      >
                        {isLoading ? 'Loading…' : 'Subscribe'}
                      </button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Payment History */}
      <div>
        <h2 className="text-base font-semibold mb-4">Payment History</h2>
        <div className="rounded-2xl overflow-hidden" style={{ border: '1px solid rgba(255,255,255,0.08)' }}>
          <div
            className="grid grid-cols-[1fr_2fr_1fr_1.2fr_1fr] px-5 py-3 text-[11px] font-semibold uppercase tracking-widest text-slate-500"
            style={{ background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}
          >
            <span>Invoice</span>
            <span>Client</span>
            <span>Amount</span>
            <span>Date</span>
            <span>Status</span>
          </div>
          <div className="divide-y divide-white/5">
            {billingRecords.length === 0 && (
              <div className="px-5 py-8 text-center text-slate-500 text-sm">No payment history yet</div>
            )}
            {billingRecords.map((record) => (
              <div
                key={record.id}
                className="grid grid-cols-[1fr_2fr_1fr_1.2fr_1fr] px-5 py-4 items-center hover:bg-white/[0.03] transition-colors"
              >
                <span className="font-mono text-xs text-slate-600 truncate">{record.stripe_invoice_id}</span>
                <span className="text-white text-sm">{record.client_name}</span>
                <span className="font-mono text-slate-300 text-sm">
                  ${(record.amount_cents / 100).toFixed(2)}
                </span>
                <span className="text-slate-400 text-sm">
                  {new Date(record.billing_date).toLocaleDateString('en-US', {
                    month: 'short', day: 'numeric', year: 'numeric',
                  })}
                </span>
                <div className="flex items-center gap-1.5">
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      record.status === 'paid' ? 'bg-emerald-400' : 'bg-red-400'
                    }`}
                  ></span>
                  <span
                    className={`text-sm capitalize ${
                      record.status === 'paid' ? 'text-slate-300' : 'text-red-400'
                    }`}
                  >
                    {record.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
