'use client'

import { useState, useEffect, useRef } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Client, Website, Request, RequestStatus, Attachment } from '@/lib/types'

const statusConfig: Record<RequestStatus, { label: string; className: string }> = {
  pending:  { label: 'Pending',  className: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20' },
  approved: { label: 'Approved', className: 'bg-blue-500/10 text-blue-400 border-blue-500/20' },
  deployed: { label: 'Live',     className: 'bg-green-500/10 text-green-400 border-green-500/20' },
  rejected: { label: 'Rejected', className: 'bg-red-500/10 text-red-400 border-red-500/20' },
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

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function FileIcon({ type }: { type: string }) {
  if (type === 'application/pdf') {
    return (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-red-400">
        <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/>
        <line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/>
      </svg>
    )
  }
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-400">
      <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/>
      <polyline points="21 15 16 10 5 21"/>
    </svg>
  )
}

interface StagedFile {
  file: File
  previewUrl: string | null // null for PDFs
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
  const [stagedFiles, setStagedFiles] = useState<StagedFile[]>([])
  const [uploadProgress, setUploadProgress] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // Poll for status updates on pending/approved requests
  useEffect(() => {
    const hasPending = requests.some((r) => r.status === 'pending' || r.status === 'approved')
    if (!hasPending) return

    pollRef.current = setInterval(async () => {
      try {
        const res = await fetch(`/api/request-status?clientId=${client.id}`)
        if (!res.ok) return
        const { requests: fresh } = await res.json()
        setRequests(fresh)
      } catch {
        // silently ignore poll errors
      }
    }, 15000)

    return () => {
      if (pollRef.current) clearInterval(pollRef.current)
    }
  }, [requests, client.id])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? [])
    const newStaged: StagedFile[] = files.map((file) => ({
      file,
      previewUrl: file.type.startsWith('image/') ? URL.createObjectURL(file) : null,
    }))
    setStagedFiles((prev) => [...prev, ...newStaged])
    // Reset input so the same file can be re-added if removed
    e.target.value = ''
  }

  const removeFile = (index: number) => {
    setStagedFiles((prev) => {
      const copy = [...prev]
      if (copy[index].previewUrl) URL.revokeObjectURL(copy[index].previewUrl!)
      copy.splice(index, 1)
      return copy
    })
  }

  const uploadFiles = async (): Promise<Attachment[]> => {
    const results: Attachment[] = []
    for (let i = 0; i < stagedFiles.length; i++) {
      setUploadProgress(`Uploading file ${i + 1} of ${stagedFiles.length}…`)
      const form = new FormData()
      form.append('file', stagedFiles[i].file)
      form.append('clientId', client.id)

      const res = await fetch('/api/upload', { method: 'POST', body: form })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Upload failed')
      results.push(data as Attachment)
    }
    setUploadProgress('')
    return results
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!message.trim()) return
    setSubmitting(true)
    setError('')

    try {
      // Upload files first if any
      const attachments = stagedFiles.length > 0 ? await uploadFiles() : []

      const res = await fetch('/api/parse-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message_text: message.trim(),
          clientId: client.id,
          websiteId: website.id,
          attachments,
        }),
      })

      const data = await res.json()
      if (!res.ok) {
        const msg = data.error?.includes('credit')
          ? 'API billing issue — check Anthropic console credits.'
          : data.error || 'Something went wrong'
        throw new Error(msg)
      }

      setRequests((prev) => [data.request, ...prev])
      setMessage('')
      // Clean up staged files
      stagedFiles.forEach((f) => { if (f.previewUrl) URL.revokeObjectURL(f.previewUrl) })
      setStagedFiles([])
    } catch (err: any) {
      setError(err.message)
    } finally {
      setSubmitting(false)
      setUploadProgress('')
    }
  }

  const lastDeployed = requests.find(r => r.status === 'deployed')?.created_at ?? null
  const screenshotUrl = website.deployed_url
    ? `https://s0.wp.com/mshots/v1/${encodeURIComponent(website.deployed_url)}?w=800&h=600`
    : null

  return (
    <div className="min-h-screen bg-[#0F172A] text-white">
      {/* Header */}
      <header className="border-b border-white/10 px-6 py-5">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <span className="text-lg font-bold">
            Refresh<span className="text-[#3B82F6]">Web</span>
          </span>
          <div className="text-right">
            <p className="text-sm font-medium">{client.name}</p>
            <p className="text-xs text-slate-500">{website.deployed_url?.replace('https://', '')}</p>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-10 lg:grid lg:grid-cols-[1fr_340px] lg:gap-10 lg:items-start">

        {/* ── Left: form + history ── */}
        <div>
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
              className="bg-white/5 border-white/10 text-white placeholder:text-slate-500 min-h-[120px] resize-none mb-3 focus:border-[#3B82F6]"
              disabled={submitting}
            />

            {/* Staged files */}
            {stagedFiles.length > 0 && (
              <div className="mb-3 space-y-2">
                {stagedFiles.map((sf, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-3 px-3 py-2 rounded-lg"
                    style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}
                  >
                    {sf.previewUrl ? (
                      <img src={sf.previewUrl} alt={sf.file.name} className="w-10 h-10 rounded object-cover shrink-0" />
                    ) : (
                      <div className="w-10 h-10 rounded flex items-center justify-center shrink-0" style={{ background: 'rgba(255,255,255,0.05)' }}>
                        <FileIcon type={sf.file.type} />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-slate-200 truncate">{sf.file.name}</p>
                      <p className="text-xs text-slate-500">{formatBytes(sf.file.size)}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeFile(i)}
                      disabled={submitting}
                      className="text-slate-600 hover:text-red-400 transition-colors shrink-0 cursor-pointer"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/gif,image/webp,application/pdf"
                  multiple
                  className="hidden"
                  onChange={handleFileChange}
                  disabled={submitting}
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={submitting}
                  className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-300 transition-colors cursor-pointer disabled:opacity-40"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66l-9.2 9.19a2 2 0 01-2.83-2.83l8.49-8.48"/>
                  </svg>
                  Attach files
                </button>
                {uploadProgress && (
                  <span className="text-xs text-slate-500">{uploadProgress}</span>
                )}
                {!uploadProgress && (
                  <p className="text-xs text-slate-600">JPG, PNG, PDF · max 10 MB</p>
                )}
              </div>
              <Button
                type="submit"
                disabled={submitting || !message.trim()}
                className="bg-[#3B82F6] hover:bg-blue-500 text-white shrink-0"
              >
                {submitting ? (uploadProgress || 'Sending…') : 'Send Request'}
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
                    {req.attachments?.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-3">
                        {req.attachments.map((att, i) => (
                          att.type.startsWith('image/') ? (
                            <a key={i} href={att.url} target="_blank" rel="noopener noreferrer">
                              <img src={att.url} alt={att.name} className="h-14 w-14 rounded object-cover border border-white/10 hover:opacity-80 transition-opacity" />
                            </a>
                          ) : (
                            <a
                              key={i}
                              href={att.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-slate-300 hover:text-white transition-colors"
                              style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}
                            >
                              <FileIcon type={att.type} />
                              {att.name}
                            </a>
                          )
                        ))}
                      </div>
                    )}
                    <p className="text-xs text-slate-500 mt-3">{formatDate(req.created_at)}</p>
                  </div>
                )
              })}
            </div>
          )}
        </div>
        </div>{/* end left column */}

        {/* ── Right: site preview ── */}
        {website.deployed_url && (
          <div className="mt-10 lg:mt-0 lg:sticky lg:top-8">
            <div
              className="rounded-2xl overflow-hidden"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
            >
              {/* Screenshot */}
              <div className="relative w-full aspect-[4/3] bg-slate-900 overflow-hidden">
                {screenshotUrl && (
                  <img
                    src={screenshotUrl}
                    alt={`${client.name} website preview`}
                    className="w-full h-full object-cover object-top"
                    onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
                  />
                )}
                {/* Overlay gradient at bottom */}
                <div className="absolute inset-x-0 bottom-0 h-12 pointer-events-none"
                  style={{ background: 'linear-gradient(to bottom, transparent, rgba(15,23,42,0.8))' }} />
              </div>

              {/* Site info */}
              <div className="px-5 py-4 space-y-4">
                <div>
                  <p className="font-semibold text-white text-sm">{client.name}</p>
                  <p className="text-xs text-slate-500 truncate mt-0.5">
                    {website.deployed_url.replace('https://', '')}
                  </p>
                </div>

                <a
                  href={website.deployed_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 w-full py-2.5 rounded-lg text-sm font-medium text-white transition-colors"
                  style={{ background: 'rgba(59,130,246,0.15)', border: '1px solid rgba(59,130,246,0.3)' }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'rgba(59,130,246,0.25)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'rgba(59,130,246,0.15)')}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6"/>
                    <polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/>
                  </svg>
                  Open live site
                </a>

                {lastDeployed && (
                  <p className="text-[11px] text-slate-600 text-center">
                    Last updated {formatDate(lastDeployed)}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

      </main>
    </div>
  )
}
