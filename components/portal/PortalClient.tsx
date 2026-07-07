'use client'

import { useState, useEffect, useRef } from 'react'
import { Client, Website, Request, RequestStatus, Attachment } from '@/lib/types'
import { energyTheme } from '@/lib/theme'

const statusConfig: Record<RequestStatus, { label: string; icon: string; color: string }> = {
  pending:  { label: 'Under review',       icon: '🕐', color: '#946200' },
  approved: { label: 'Approved',           icon: '✓',  color: 'var(--purple-deep)' },
  deployed: { label: 'Live on your site',  icon: '✓',  color: 'var(--lime-ink)' },
  rejected: { label: 'Needs more info',    icon: '↩',  color: 'var(--ink-soft)' },
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
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: '#C0503F' }}>
        <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/>
        <line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/>
      </svg>
    )
  }
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--blue-deep)' }}>
      <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/>
      <polyline points="21 15 16 10 5 21"/>
    </svg>
  )
}

interface StagedFile {
  file: File
  previewUrl: string | null
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
  const messagesContainerRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Newest request is shown first — keep the list scrolled to the top so it's
  // visible without scrolling whenever a new request comes in.
  useEffect(() => {
    messagesContainerRef.current?.scrollTo({ top: 0, behavior: 'smooth' })
  }, [requests])

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
      stagedFiles.forEach((f) => { if (f.previewUrl) URL.revokeObjectURL(f.previewUrl) })
      setStagedFiles([])
      if (textareaRef.current) textareaRef.current.style.height = 'auto'
    } catch (err: any) {
      setError(err.message)
    } finally {
      setSubmitting(false)
      setUploadProgress('')
    }
  }

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setMessage(e.target.value)
  }

  const screenshotUrl = website.deployed_url
    ? `https://s0.wp.com/mshots/v1/${encodeURIComponent(website.deployed_url)}?w=800&h=600`
    : null

  // Newest first — requests state already comes back newest-first from the API
  const chatMessages = requests

  return (
    <div
      className="flex flex-col bg-[var(--paper)] text-[var(--ink)]"
      style={{ minHeight: '100dvh', ...energyTheme }}
    >

      {/* Header */}
      <header className="sticky top-0 z-10 shrink-0 border-b border-[var(--line)] px-4 py-3 bg-[var(--paper)]">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <span className="text-base font-display">
            Refresh<span className="text-[var(--purple-deep)]">Web</span>
          </span>
          <div className="text-right">
            <p className="text-sm font-medium leading-tight">{client.name}</p>
            {website.deployed_url && (
              <p className="text-xs text-[var(--ink-soft)] truncate max-w-[160px]">
                {website.deployed_url.replace('https://', '')}
              </p>
            )}
          </div>
        </div>
      </header>

      {/* Two-column layout on lg+, single-column chat on mobile */}
      <div className="flex-1 flex min-h-0 lg:max-w-6xl lg:mx-auto lg:w-full">

        {/* ── Chat column ── */}
        <div className="flex-1 flex flex-col min-h-0">

          {/* Mobile site status strip */}
          {website.deployed_url && (
            <div className="lg:hidden shrink-0 flex items-center justify-between px-4 py-2.5 bg-[var(--paper-deep)] border-b border-[var(--line)]">
              <div className="flex items-center gap-2 min-w-0">
                <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: 'var(--lime-ink)' }}></span>
                <span className="text-xs text-[var(--ink-soft)] truncate">{website.deployed_url.replace('https://', '')}</span>
              </div>
              <a
                href={website.deployed_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs font-semibold text-[var(--purple-deep)] hover:opacity-70 transition-opacity shrink-0 ml-3 min-h-[44px] flex items-center"
              >
                View site →
              </a>
            </div>
          )}

          {/* ── Input area ── */}
          <div className="shrink-0 border-b border-[var(--line)] bg-[var(--paper)]">
            {/* Staged files preview */}
            {stagedFiles.length > 0 && (
              <div className="px-3 pt-3 space-y-1.5">
                {stagedFiles.map((sf, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-2.5 px-3 py-2 rounded-xl bg-[var(--paper-deep)] border border-[var(--line)]"
                  >
                    {sf.previewUrl ? (
                      <img src={sf.previewUrl} alt={sf.file.name} className="w-9 h-9 rounded-lg object-cover shrink-0" />
                    ) : (
                      <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0 bg-white">
                        <FileIcon type={sf.file.type} />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-[var(--ink)] truncate">{sf.file.name}</p>
                      <p className="text-xs text-[var(--ink-soft)]">{formatBytes(sf.file.size)}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeFile(i)}
                      disabled={submitting}
                      className="text-[var(--ink-soft)] hover:text-red-500 transition-colors shrink-0 cursor-pointer min-w-[44px] min-h-[44px] flex items-center justify-center"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            )}

            {uploadProgress && (
              <p className="px-4 pt-2 text-xs text-[var(--ink-soft)]">{uploadProgress}</p>
            )}

            {/* Input row */}
            <form onSubmit={handleSubmit}>
              <div className="flex items-end gap-2 px-3 py-3">
                {/* Attach button */}
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
                  title="Attach files"
                  className="shrink-0 w-10 h-10 flex items-center justify-center rounded-full text-[var(--ink-soft)] hover:text-[var(--ink)] hover:bg-[var(--paper-deep)] transition-colors cursor-pointer disabled:opacity-40"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66l-9.2 9.19a2 2 0 01-2.83-2.83l8.49-8.48"/>
                  </svg>
                </button>

                {/* Textarea */}
                <textarea
                  ref={textareaRef}
                  value={message}
                  onChange={handleTextareaChange}
                  placeholder='e.g. "Change the title to Summer Sale 2024"'
                  disabled={submitting}
                  rows={3}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault()
                      if (message.trim() && !submitting) handleSubmit(e as any)
                    }
                  }}
                  className="flex-1 bg-[var(--paper-deep)] border border-[var(--line)] text-[var(--ink)] placeholder:text-[var(--ink-soft)] text-base rounded-2xl px-4 py-2.5 outline-none focus:border-[var(--purple)] resize-none transition-colors disabled:opacity-60"
                />

                {/* Send button */}
                <button
                  type="submit"
                  disabled={submitting || !message.trim()}
                  className="shrink-0 w-10 h-10 flex items-center justify-center rounded-full bg-[var(--lime)] hover:bg-[var(--lime-deep)] text-[var(--ink)] transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                >
                  {submitting ? (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="animate-spin">
                      <path d="M21 12a9 9 0 11-6.219-8.56"/>
                    </svg>
                  ) : (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="22" y1="2" x2="11" y2="13"/>
                      <polygon points="22 2 15 22 11 13 2 9 22 2"/>
                    </svg>
                  )}
                </button>
              </div>

              {error && <p className="text-red-600 text-xs px-4 pb-2">⚠ {error}</p>}
            </form>
          </div>

          {/* Messages scroll area */}
          <div ref={messagesContainerRef} className="flex-1 overflow-y-auto px-4 py-6 space-y-4">
            {/* Welcome */}
            <div className="text-center mb-2">
              <div className="inline-block px-4 py-2 rounded-full text-xs text-[var(--ink-soft)] bg-[var(--paper-deep)]">
                Your request history is below.
              </div>
            </div>

            {/* Empty state */}
            {chatMessages.length === 0 && (
              <div className="text-center py-12">
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-4" style={{ background: 'var(--purple-wash)' }}>
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--purple-deep)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
                  </svg>
                </div>
                <p className="text-[var(--ink)] text-sm font-medium">No requests yet</p>
                <p className="text-[var(--ink-soft)] text-xs mt-1">Send your first request below.</p>
              </div>
            )}

            {/* Chat bubbles */}
            {chatMessages.map((req) => {
              const status = statusConfig[req.status]
              return (
                <div key={req.id} className="flex flex-col max-w-[85%] sm:max-w-[75%]">
                  {/* Message bubble */}
                  <div className="rounded-2xl rounded-tl-sm px-4 py-3 text-sm text-[var(--ink)] leading-relaxed bg-[var(--paper-deep)] border border-[var(--line)]">
                    {req.message_text}

                    {/* Attachments inside bubble */}
                    {req.attachments?.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-[var(--line)]">
                        {req.attachments.map((att, i) => (
                          att.type.startsWith('image/') ? (
                            <a key={i} href={att.url} target="_blank" rel="noopener noreferrer">
                              <img src={att.url} alt={att.name} className="h-14 w-14 rounded-lg object-cover border border-[var(--line)] hover:opacity-80 transition-opacity" />
                            </a>
                          ) : (
                            <a
                              key={i}
                              href={att.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-[var(--ink)] hover:opacity-70 transition-opacity bg-white border border-[var(--line)]"
                            >
                              <FileIcon type={att.type} />
                              {att.name}
                            </a>
                          )
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Status + timestamp below bubble */}
                  <div className="flex items-center gap-2 mt-1.5 ml-1">
                    <span className="text-[11px] font-semibold" style={{ color: status.color }}>
                      {status.icon} {status.label}
                    </span>
                    <span className="text-[11px] text-[var(--ink-soft)]">{formatDate(req.created_at)}</span>
                  </div>
                </div>
              )
            })}
          </div>

        </div>

        {/* ── Desktop sidebar: site preview ── */}
        {website.deployed_url && (
          <div className="hidden lg:block w-[340px] shrink-0 p-6 sticky top-[57px] self-start border-l border-[var(--line)]"
            style={{ maxHeight: 'calc(100dvh - 57px)', overflowY: 'auto' }}>
            <div className="rounded-2xl overflow-hidden bg-white border border-[var(--line)] shadow-[0_20px_50px_-20px_rgba(32,37,45,0.18)]">
              {/* Screenshot */}
              <div className="relative w-full aspect-[4/3] bg-[var(--paper-deep)] overflow-hidden">
                {screenshotUrl && (
                  <img
                    src={screenshotUrl}
                    alt={`${client.name} website preview`}
                    className="w-full h-full object-cover object-top"
                    onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
                  />
                )}
                <div className="absolute inset-x-0 bottom-0 h-12 pointer-events-none"
                  style={{ background: 'linear-gradient(to bottom, transparent, rgba(255,255,255,0.85))' }} />
              </div>

              {/* Site info */}
              <div className="px-5 py-4 space-y-4">
                <div>
                  <p className="font-semibold text-[var(--ink)] text-sm">{client.name}</p>
                  <p className="text-xs text-[var(--ink-soft)] truncate mt-0.5">
                    {website.deployed_url.replace('https://', '')}
                  </p>
                </div>

                <a
                  href={website.deployed_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 w-full py-2.5 rounded-lg text-sm font-semibold transition-colors"
                  style={{ background: 'var(--purple-wash)', color: 'var(--purple-deep)' }}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6"/>
                    <polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/>
                  </svg>
                  Open live site
                </a>
              </div>
            </div>

            {/* Recent activity */}
            {requests.length > 0 && (
              <div className="mt-6">
                <h3 className="text-xs font-semibold text-[var(--ink-soft)] uppercase tracking-widest mb-3">Recent Activity</h3>
                <div className="space-y-2">
                  {requests.slice(0, 5).map((req) => {
                    const s = statusConfig[req.status]
                    return (
                      <div key={req.id} className="flex items-start gap-2">
                        <span className="text-[11px] mt-0.5" style={{ color: s.color }}>{s.icon}</span>
                        <div className="min-w-0">
                          <p className="text-xs text-[var(--ink)] truncate">{req.message_text}</p>
                          <p className="text-[11px] text-[var(--ink-soft)] mt-0.5">{formatDate(req.created_at)}</p>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
