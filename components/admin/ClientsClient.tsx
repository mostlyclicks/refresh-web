'use client'

import { useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Client, Website, ClientStatus, ClientTier } from '@/lib/types'

// ─── Styles ──────────────────────────────────────────────────────────────────

const statusDot: Record<ClientStatus, string> = {
  active:   'bg-emerald-400',
  paused:   'bg-amber-400',
  archived: 'bg-slate-500',
}

const tierStyles: Record<ClientTier, string> = {
  basic:        'bg-white/8 text-slate-400 border-white/10',
  professional: 'bg-[#3B82F6]/10 text-[#3B82F6] border-[#3B82F6]/20',
  custom:       'bg-violet-400/10 text-violet-400 border-violet-400/20',
}

// ─── Avatar ───────────────────────────────────────────────────────────────────

function Avatar({ name }: { name: string }) {
  const initials = name.split(' ').map((w: string) => w[0]).slice(0, 2).join('')
  return (
    <div className="w-8 h-8 rounded-full bg-[#3B82F6]/15 flex items-center justify-center text-[#3B82F6] text-xs font-bold shrink-0">
      {initials}
    </div>
  )
}

// ─── Add Client Modal ─────────────────────────────────────────────────────────

interface NewClient {
  client: Client
  website: Website | null
}

function AddClientModal({ onClose, onCreated }: {
  onClose: () => void
  onCreated: (result: NewClient) => void
}) {
  const [form, setForm] = useState({
    name: '',
    email: '',
    tier: 'basic' as ClientTier,
    websiteName: '',
    githubRepo: '',
    deployedUrl: '',
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [created, setCreated] = useState<NewClient | null>(null)
  const [copied, setCopied] = useState(false)

  const set = (field: string, value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }))

  const portalUrl = created
    ? `${window.location.origin}/portal/${created.client.id}`
    : ''

  const handleCopy = () => {
    navigator.clipboard.writeText(portalUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError('')

    const res = await fetch('/api/admin/clients', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })

    const data = await res.json()
    setSaving(false)

    if (!res.ok) {
      setError(data.error || 'Something went wrong')
      return
    }

    setCreated(data)
    onCreated(data)
  }

  const inputClass = `w-full px-3 py-2.5 rounded-lg text-sm text-white placeholder:text-slate-600 outline-none focus:ring-1 focus:ring-[#3B82F6]`
  const inputStyle = { background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }
  const labelClass = 'block text-xs text-slate-400 font-medium mb-1.5'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}>
      <div className="w-full max-w-lg rounded-2xl text-white shadow-2xl" style={{ background: '#131f35', border: '1px solid rgba(255,255,255,0.1)' }}>

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5" style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
          <h2 className="text-lg font-bold">{created ? 'Client Created' : 'Add Client'}</h2>
          <button onClick={onClose} className="text-slate-500 hover:text-white transition-colors cursor-pointer">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        {/* Success state */}
        {created ? (
          <div className="px-6 py-8 space-y-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-emerald-400/10 flex items-center justify-center shrink-0">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#34d399" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
              </div>
              <div>
                <p className="font-semibold text-white">{created.client.name} added</p>
                <p className="text-sm text-slate-400">Share the portal link below with your client.</p>
              </div>
            </div>

            <div>
              <p className="text-xs text-slate-500 font-medium mb-2">Client portal link</p>
              <div className="flex items-center gap-2 px-3 py-2.5 rounded-lg" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
                <span className="flex-1 text-sm text-slate-300 truncate font-mono">{portalUrl}</span>
                <button
                  onClick={handleCopy}
                  className="shrink-0 text-xs text-[#3B82F6] hover:text-blue-400 transition-colors cursor-pointer font-medium"
                >
                  {copied ? '✓ Copied' : 'Copy'}
                </button>
              </div>
            </div>

            {!created.website && (
              <p className="text-xs text-amber-400">
                ⚠ No website was added. You can link one later from the client detail page.
              </p>
            )}

            <Button onClick={onClose} className="w-full bg-[#3B82F6] hover:bg-blue-500 text-white font-medium">
              Done
            </Button>
          </div>
        ) : (
          /* Form */
          <form onSubmit={handleSubmit} className="px-6 py-5 space-y-5">
            {/* Client info */}
            <div>
              <p className="text-[11px] font-semibold text-slate-600 uppercase tracking-widest mb-3">Client Info</p>
              <div className="space-y-3">
                <div>
                  <label className={labelClass}>Name <span className="text-red-400">*</span></label>
                  <input
                    value={form.name}
                    onChange={(e) => set('name', e.target.value)}
                    placeholder="Sunrise Bakery"
                    required
                    className={inputClass}
                    style={inputStyle}
                  />
                </div>
                <div>
                  <label className={labelClass}>Email <span className="text-red-400">*</span></label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => set('email', e.target.value)}
                    placeholder="owner@sunrisebakery.com"
                    required
                    className={inputClass}
                    style={inputStyle}
                  />
                </div>
                <div>
                  <label className={labelClass}>Tier <span className="text-red-400">*</span></label>
                  <select
                    value={form.tier}
                    onChange={(e) => set('tier', e.target.value)}
                    className={inputClass}
                    style={inputStyle}
                  >
                    <option value="basic">Basic — $99/mo</option>
                    <option value="professional">Professional — $199/mo</option>
                    <option value="custom">Custom</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Website info */}
            <div>
              <p className="text-[11px] font-semibold text-slate-600 uppercase tracking-widest mb-3">Website <span className="text-slate-700 normal-case font-normal">(optional — can add later)</span></p>
              <div className="space-y-3">
                <div>
                  <label className={labelClass}>GitHub Repo</label>
                  <input
                    value={form.githubRepo}
                    onChange={(e) => set('githubRepo', e.target.value)}
                    placeholder="owner/repo-name"
                    className={inputClass}
                    style={inputStyle}
                  />
                  <p className="text-[11px] text-slate-600 mt-1">Format: owner/repo — e.g. mostlyclicks/sunrise-bakery</p>
                </div>
                <div>
                  <label className={labelClass}>Deployed URL</label>
                  <input
                    value={form.deployedUrl}
                    onChange={(e) => set('deployedUrl', e.target.value)}
                    placeholder="https://sunrise-bakery.vercel.app"
                    className={inputClass}
                    style={inputStyle}
                  />
                </div>
              </div>
            </div>

            {error && <p className="text-red-400 text-sm">⚠ {error}</p>}

            <div className="flex gap-3 pt-1">
              <Button
                type="button"
                onClick={onClose}
                variant="outline"
                className="flex-1 font-medium text-sm cursor-pointer"
                style={{ border: '1px solid rgba(255,255,255,0.1)', background: 'transparent', color: '#94a3b8' }}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={saving}
                className="flex-1 bg-[#3B82F6] hover:bg-blue-500 text-white font-medium text-sm cursor-pointer"
              >
                {saving ? 'Creating…' : 'Create Client'}
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}

// ─── Edit Client Modal ────────────────────────────────────────────────────────

function EditClientModal({ client, onClose, onSaved }: {
  client: Client & { websites: Website[] }
  onClose: () => void
  onSaved: (updated: Client & { websites: Website[] }) => void
}) {
  const website = client.websites?.[0]
  const [form, setForm] = useState({
    name:        client.name,
    email:       client.email,
    tier:        client.tier,
    status:      client.status,
    githubRepo:  website?.github_repo_url ?? '',
    deployedUrl: website?.deployed_url ?? '',
  })
  const [saving, setSaving] = useState(false)
  const [error, setError]   = useState('')

  const set = (field: string, value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }))

  const portalUrl = `${window.location.origin}/portal/${client.id}`
  const [copied, setCopied] = useState(false)
  const handleCopy = () => {
    navigator.clipboard.writeText(portalUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError('')

    const res = await fetch(`/api/admin/clients/${client.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, websiteId: website?.id }),
    })

    const data = await res.json()
    setSaving(false)

    if (!res.ok) {
      setError(data.error || 'Something went wrong')
      return
    }

    onSaved(data.client)
    onClose()
  }

  const inputClass = `w-full px-3 py-2.5 rounded-lg text-sm text-white placeholder:text-slate-600 outline-none focus:ring-1 focus:ring-[#3B82F6]`
  const inputStyle = { background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }
  const labelClass = 'block text-xs text-slate-400 font-medium mb-1.5'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}>
      <div className="w-full max-w-lg rounded-2xl text-white shadow-2xl" style={{ background: '#131f35', border: '1px solid rgba(255,255,255,0.1)' }}>

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5" style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
          <div>
            <h2 className="text-lg font-bold">Edit Client</h2>
            <p className="text-xs text-slate-500 mt-0.5">{client.name}</p>
          </div>
          <button onClick={onClose} className="text-slate-500 hover:text-white transition-colors cursor-pointer">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-5">
          {/* Portal link */}
          <div>
            <p className="text-[11px] font-semibold text-slate-600 uppercase tracking-widest mb-3">Portal Link</p>
            <div className="flex items-center gap-2 px-3 py-2.5 rounded-lg" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
              <span className="flex-1 text-sm text-slate-400 truncate font-mono">{portalUrl}</span>
              <button type="button" onClick={handleCopy} className="shrink-0 text-xs text-[#3B82F6] hover:text-blue-400 transition-colors cursor-pointer font-medium">
                {copied ? '✓ Copied' : 'Copy'}
              </button>
            </div>
          </div>

          {/* Client info */}
          <div>
            <p className="text-[11px] font-semibold text-slate-600 uppercase tracking-widest mb-3">Client Info</p>
            <div className="space-y-3">
              <div>
                <label className={labelClass}>Name</label>
                <input value={form.name} onChange={(e) => set('name', e.target.value)} required className={inputClass} style={inputStyle} />
              </div>
              <div>
                <label className={labelClass}>Email</label>
                <input type="email" value={form.email} onChange={(e) => set('email', e.target.value)} required className={inputClass} style={inputStyle} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelClass}>Tier</label>
                  <select value={form.tier} onChange={(e) => set('tier', e.target.value)} className={inputClass} style={inputStyle}>
                    <option value="basic">Basic</option>
                    <option value="professional">Professional</option>
                    <option value="custom">Custom</option>
                  </select>
                </div>
                <div>
                  <label className={labelClass}>Status</label>
                  <select value={form.status} onChange={(e) => set('status', e.target.value)} className={inputClass} style={inputStyle}>
                    <option value="active">Active</option>
                    <option value="paused">Paused</option>
                    <option value="archived">Archived</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Website */}
          <div>
            <p className="text-[11px] font-semibold text-slate-600 uppercase tracking-widest mb-3">Website</p>
            <div className="space-y-3">
              <div>
                <label className={labelClass}>GitHub Repo</label>
                <input
                  value={form.githubRepo}
                  onChange={(e) => set('githubRepo', e.target.value)}
                  placeholder="owner/repo-name"
                  className={inputClass}
                  style={inputStyle}
                />
                <p className="text-[11px] text-slate-600 mt-1">e.g. mostlyclicks/sunrise-bakery</p>
              </div>
              <div>
                <label className={labelClass}>Deployed URL</label>
                <input
                  value={form.deployedUrl}
                  onChange={(e) => set('deployedUrl', e.target.value)}
                  placeholder="https://sunrise-bakery.vercel.app"
                  className={inputClass}
                  style={inputStyle}
                />
              </div>
            </div>
          </div>

          {error && <p className="text-red-400 text-sm">⚠ {error}</p>}

          <div className="flex gap-3 pt-1">
            <Button
              type="button"
              onClick={onClose}
              variant="outline"
              className="flex-1 font-medium text-sm cursor-pointer"
              style={{ border: '1px solid rgba(255,255,255,0.1)', background: 'transparent', color: '#94a3b8' }}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={saving}
              className="flex-1 bg-[#3B82F6] hover:bg-blue-500 text-white font-medium text-sm cursor-pointer"
            >
              {saving ? 'Saving…' : 'Save Changes'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────

interface Props {
  initialClients: (Client & { websites: Website[] })[]
  countMap: Record<string, number>
}

export default function ClientsClient({ initialClients, countMap }: Props) {
  const [clients, setClients] = useState(initialClients)
  const [showModal, setShowModal] = useState(false)
  const [editingClient, setEditingClient] = useState<(Client & { websites: Website[] }) | null>(null)

  const handleCreated = ({ client, website }: NewClient) => {
    setClients((prev) => [{ ...client, websites: website ? [website] : [] }, ...prev])
  }

  const handleSaved = (updated: Client & { websites: Website[] }) => {
    setClients((prev) => prev.map((c) => c.id === updated.id ? updated : c))
  }

  const activeCount = clients.filter(c => c.status === 'active').length

  return (
    <div className="px-8 py-8">
      {showModal && (
        <AddClientModal
          onClose={() => setShowModal(false)}
          onCreated={handleCreated}
        />
      )}
      {editingClient && (
        <EditClientModal
          client={editingClient}
          onClose={() => setEditingClient(null)}
          onSaved={handleSaved}
        />
      )}

      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold mb-1">Clients</h1>
          <p className="text-slate-400 text-sm">{clients.length} total · {activeCount} active</p>
        </div>
        <Button
          onClick={() => setShowModal(true)}
          className="bg-[#3B82F6] hover:bg-blue-500 text-white font-medium text-sm cursor-pointer"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="mr-1.5">
            <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          Add Client
        </Button>
      </div>

      {/* Empty state */}
      {clients.length === 0 ? (
        <div
          className="rounded-2xl px-6 py-16 text-center"
          style={{ border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.02)' }}
        >
          <p className="text-slate-500 text-sm">No clients yet.</p>
          <p className="text-slate-600 text-xs mt-1">Click Add Client to get started.</p>
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
            {clients.map((client) => {
              const website = client.websites?.[0]
              const reqCount = countMap[client.id] ?? 0
              const since = new Date(client.created_at).toLocaleString('en-US', { month: 'short', year: 'numeric' })

              return (
                <div
                  key={client.id}
                  className="grid grid-cols-[2fr_1.5fr_1fr_1fr_80px_80px_60px] px-5 py-4 items-center hover:bg-white/[0.03] transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <Avatar name={client.name} />
                    <div className="min-w-0">
                      <p className="font-medium text-white text-sm truncate">{client.name}</p>
                      <p className="text-xs text-slate-500 truncate">{client.email}</p>
                    </div>
                  </div>

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

                  <Badge className={`text-[11px] font-medium capitalize w-fit ${tierStyles[client.tier]}`}>
                    {client.tier}
                  </Badge>

                  <div className="flex items-center gap-1.5">
                    <span className={`w-1.5 h-1.5 rounded-full ${statusDot[client.status]}`} />
                    <span className="text-sm text-slate-300 capitalize">{client.status}</span>
                  </div>

                  <span className="text-right font-mono text-sm text-slate-400">{reqCount}</span>
                  <span className="text-right text-xs text-slate-500">{since}</span>

                  <div className="flex justify-end items-center gap-3">
                    <a
                      href={`/portal/${client.id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      title="Open client portal"
                      className="text-slate-600 hover:text-[#3B82F6] transition-colors cursor-pointer"
                    >
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6"/>
                        <polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/>
                      </svg>
                    </a>
                    <button
                      onClick={() => setEditingClient(client)}
                      className="text-xs text-slate-500 hover:text-white transition-colors cursor-pointer"
                    >
                      Edit
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
