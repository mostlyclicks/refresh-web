'use client'

import { useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Client, Website, Request, RequestStatus } from '@/lib/types'

const statusConfig: Record<RequestStatus, { label: string; className: string }> = {
  pending:  { label: 'Pending',  className: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20' },
  approved: { label: 'Approved', className: 'bg-blue-500/10 text-blue-400 border-blue-500/20' },
  deployed: { label: 'Live',     className: 'bg-green-500/10 text-green-400 border-green-500/20' },
  rejected: { label: 'Rejected', className: 'bg-red-500/10 text-red-400 border-red-500/20' },
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
  })
}

interface Props {
  client: Client
  website: Website
  initialRequests: Request[]
}

export default function PortalClient({ client, website, initialRequests }: Props) {
  const [message, setMessage] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [requests, setRequests] = useState<Request[]>(initialRequests)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!message.trim()) return
    setSubmitting(true)
    setError('')

    try {
      const res = await fetch('/api/parse-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message_text: message.trim(),
          clientId: client.id,
          websiteId: website.id,
        }),
      })

      const data = await res.json()
      if (!res.ok) {
        // Extract readable message from Anthropic API errors
        const msg = data.error?.includes('credit')
          ? 'API billing issue — check Anthropic console credits.'
          : data.error || 'Something went wrong'
        throw new Error(msg)
      }

      // Prepend new request to history
      setRequests((prev) => [data.request, ...prev])
      setMessage('')
    } catch (err: any) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#0F172A] text-white">
      {/* Header */}
      <header className="border-b border-white/10 px-6 py-5">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <span className="text-lg font-bold">
            Refresh<span className="text-[#3B82F6]">Web</span>
          </span>
          <div className="text-right">
            <p className="text-sm font-medium">{client.name}</p>
            <p className="text-xs text-slate-500">{website.deployed_url?.replace('https://', '')}</p>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-6 py-12">
        {/* Request form */}
        <div className="mb-12">
          <h1 className="text-2xl font-bold mb-2">Request an update</h1>
          <p className="text-slate-400 text-sm mb-6">
            Describe the change you need in plain English. We&apos;ll review it and get it live.
          </p>
          <form onSubmit={handleSubmit}>
            <Textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder='e.g. "Change the title to Summer Sale 2024"'
              className="bg-white/5 border-white/10 text-white placeholder:text-slate-500 min-h-[120px] resize-none mb-4 focus:border-[#3B82F6]"
              disabled={submitting}
            />
            <div className="flex items-center justify-between gap-4">
              <p className="text-xs text-slate-500">
                Updates are reviewed before going live. Usually within 24 hours.
              </p>
              <Button
                type="submit"
                disabled={submitting || !message.trim()}
                className="bg-[#3B82F6] hover:bg-blue-500 text-white shrink-0"
              >
                {submitting ? 'Sending…' : 'Send Request'}
              </Button>
            </div>
            {error && <p className="text-red-400 text-sm mt-3">⚠ {error}</p>}
          </form>
        </div>

        {/* History */}
        <div>
          <h2 className="text-lg font-semibold mb-4 text-slate-300">Request history</h2>
          {requests.length === 0 ? (
            <p className="text-slate-500 text-sm">No requests yet.</p>
          ) : (
            <div className="space-y-3">
              {requests.map((req) => {
                const status = statusConfig[req.status]
                return (
                  <div key={req.id} className="p-5 rounded-xl border border-white/10 bg-white/5">
                    <div className="flex items-start justify-between gap-4">
                      <p className="text-sm text-slate-200 leading-relaxed">{req.message_text}</p>
                      <Badge className={`shrink-0 text-xs ${status.className}`}>
                        {status.label}
                      </Badge>
                    </div>
                    <p className="text-xs text-slate-500 mt-3">{formatDate(req.created_at)}</p>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
