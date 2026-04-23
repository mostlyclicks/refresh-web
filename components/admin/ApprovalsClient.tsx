'use client'

import { useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'

type RiskLevel = 'low' | 'medium' | 'high'

const riskConfig: Record<RiskLevel, { label: string; dot: string; badge: string }> = {
  low:    { label: 'Low risk',    dot: 'bg-emerald-400', badge: 'bg-emerald-400/10 text-emerald-400 border-emerald-400/20' },
  medium: { label: 'Medium risk', dot: 'bg-amber-400',   badge: 'bg-amber-400/10 text-amber-400 border-amber-400/20' },
  high:   { label: 'High risk',   dot: 'bg-red-400',     badge: 'bg-red-400/10 text-red-400 border-red-400/20' },
}

function DiffView({ oldCode, newCode }: { oldCode: string; newCode: string }) {
  return (
    <div className="grid grid-cols-2 gap-3">
      <div>
        <div className="flex items-center gap-2 mb-1.5">
          <span className="w-2 h-2 rounded-full bg-red-400 inline-block"></span>
          <span className="text-xs text-slate-500 font-medium">Before</span>
        </div>
        <pre className="rounded-xl p-4 overflow-x-auto text-xs leading-relaxed whitespace-pre-wrap font-mono text-red-300"
          style={{ background: 'rgba(248,113,113,0.06)', border: '1px solid rgba(248,113,113,0.15)' }}>
          {oldCode}
        </pre>
      </div>
      <div>
        <div className="flex items-center gap-2 mb-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block"></span>
          <span className="text-xs text-slate-500 font-medium">After</span>
        </div>
        <pre className="rounded-xl p-4 overflow-x-auto text-xs leading-relaxed whitespace-pre-wrap font-mono text-emerald-300"
          style={{ background: 'rgba(52,211,153,0.06)', border: '1px solid rgba(52,211,153,0.15)' }}>
          {newCode}
        </pre>
      </div>
    </div>
  )
}

function ApprovalCard({ item, onAction }: { item: any; onAction: (id: string, suggestionId: string, action: string, notes: string) => Promise<void> }) {
  const [notes, setNotes] = useState('')
  const [expanded, setExpanded] = useState(true)
  const [loading, setLoading] = useState<string | null>(null)

  const suggestion = item.suggestions?.[0]
  const claudeResponse = suggestion?.claude_response
  const risk = riskConfig[(suggestion?.risk_level as RiskLevel) ?? 'low']

  const handle = async (action: string) => {
    setLoading(action)
    await onAction(item.id, suggestion?.id, action, notes)
    setLoading(null)
  }

  return (
    <div className="rounded-2xl overflow-hidden" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
      <div className="px-6 py-5 flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <span className="font-semibold text-white text-[15px]">{item.clients?.name}</span>
            <span className="text-slate-600">·</span>
            <span className="text-slate-400 text-sm">{item.websites?.deployed_url?.replace('https://', '')}</span>
            {suggestion?.target_file && (
              <>
                <span className="text-slate-600">·</span>
                <span className="font-mono text-[11px] text-slate-500 bg-white/5 px-2 py-0.5 rounded">{suggestion.target_file}</span>
              </>
            )}
          </div>
          <p className="text-slate-300 text-sm leading-relaxed">&ldquo;{item.message_text}&rdquo;</p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          {suggestion && (
            <Badge className={`text-xs font-medium ${risk.badge}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${risk.dot} mr-1.5 inline-block`}></span>
              {risk.label}
            </Badge>
          )}
          <button onClick={() => setExpanded(!expanded)} className="text-slate-500 hover:text-slate-300 text-xs transition-colors cursor-pointer">
            {expanded ? 'Collapse' : 'Expand'}
          </button>
        </div>
      </div>

      {expanded && (
        <div className="px-6 pb-6 space-y-5" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          {suggestion ? (
            <>
              <div className="pt-4 flex items-center gap-4 flex-wrap">
                <span className="text-xs text-slate-500">
                  Confidence: <span className="text-slate-200 font-medium">{Math.round((suggestion.confidence ?? 0) * 100)}%</span>
                </span>
                {claudeResponse?.request_summary && (
                  <span className="text-xs text-slate-500">
                    Summary: <span className="text-slate-200">{claudeResponse.request_summary}</span>
                  </span>
                )}
              </div>

              {suggestion.risk_level !== 'low' && claudeResponse?.risk_description && (
                <div className="flex items-start gap-3 text-sm rounded-xl px-4 py-3"
                  style={{ background: 'rgba(251,191,36,0.07)', border: '1px solid rgba(251,191,36,0.2)' }}>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#FBBF24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 mt-0.5">
                    <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
                  </svg>
                  <span className="text-amber-300">{claudeResponse.risk_description}</span>
                </div>
              )}

              <DiffView oldCode={suggestion.old_code ?? ''} newCode={suggestion.new_code ?? ''} />
            </>
          ) : (
            <div className="pt-4 text-sm text-slate-500 italic">Claude is still processing this request…</div>
          )}

          <div>
            <label className="text-xs text-slate-500 mb-2 block font-medium">Notes (optional)</label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add context for the change log..."
              className="text-sm resize-none placeholder:text-slate-600"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
              rows={2}
            />
          </div>

          <div className="flex items-center gap-2 pt-1">
            <Button
              onClick={() => handle('approve')}
              disabled={!!loading || !suggestion}
              className="bg-[#3B82F6] hover:bg-blue-500 text-white font-medium text-sm cursor-pointer"
            >
              {loading === 'approve' ? 'Approving…' : (
                <>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="mr-1.5">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                  Approve & Deploy
                </>
              )}
            </Button>
            <Button
              onClick={() => handle('reject')}
              disabled={!!loading}
              variant="outline"
              className="font-medium text-sm cursor-pointer"
              style={{ border: '1px solid rgba(255,255,255,0.1)', background: 'transparent', color: '#94a3b8' }}
            >
              {loading === 'reject' ? 'Rejecting…' : 'Reject'}
            </Button>
            <Button
              onClick={() => handle('clarify')}
              disabled={!!loading}
              variant="outline"
              className="font-medium text-sm cursor-pointer"
              style={{ border: '1px solid rgba(255,255,255,0.08)', background: 'transparent', color: '#64748b' }}
            >
              Request Clarification
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

export default function ApprovalsClient({ initialRequests }: { initialRequests: any[] }) {
  const [requests, setRequests] = useState(initialRequests)

  const handleAction = async (requestId: string, suggestionId: string, action: string, notes: string) => {
    const res = await fetch('/api/approve', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ requestId, suggestionId, action, notes }),
    })

    if (res.ok) {
      setRequests((prev) => prev.filter((r) => r.id !== requestId))
    }
  }

  return (
    <div className="px-8 py-8 max-w-5xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold mb-1">Pending Approvals</h1>
        <p className="text-slate-400 text-sm">
          {requests.length} request{requests.length !== 1 ? 's' : ''} waiting for review
        </p>
      </div>

      {requests.length === 0 ? (
        <div className="text-center py-28 rounded-2xl" style={{ border: '1px dashed rgba(255,255,255,0.08)' }}>
          <div className="w-12 h-12 rounded-full bg-emerald-400/10 flex items-center justify-center mx-auto mb-4">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#34d399" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
          </div>
          <p className="font-semibold text-white mb-1">All caught up</p>
          <p className="text-sm text-slate-500">No pending requests right now.</p>
        </div>
      ) : (
        <div className="space-y-5">
          {requests.map((item) => (
            <ApprovalCard key={item.id} item={item} onAction={handleAction} />
          ))}
        </div>
      )}
    </div>
  )
}
