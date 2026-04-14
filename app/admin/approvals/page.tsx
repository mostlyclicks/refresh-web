'use client'

import { useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'

type RiskLevel = 'low' | 'medium' | 'high'

interface Approval {
  id: string
  client: string
  website: string
  request: string
  summary: string
  targetFile: string
  oldCode: string
  newCode: string
  risk: RiskLevel
  riskDescription: string
  confidence: number
  createdAt: string
}

const mockApprovals: Approval[] = [
  {
    id: '1',
    client: 'Sunrise Bakery',
    website: 'sunrisebakery.com',
    request: 'Change the hero headline to "Summer Sale 2024 — Up to 50% Off"',
    summary: 'Update hero headline text',
    targetFile: 'index.html',
    oldCode: '<h1 class="hero-title">Fresh Baked Every Morning</h1>',
    newCode: '<h1 class="hero-title">Summer Sale 2024 — Up to 50% Off</h1>',
    risk: 'low',
    riskDescription: 'Simple text replacement, no structural changes.',
    confidence: 0.98,
    createdAt: '2025-04-13T10:15:00Z',
  },
  {
    id: '2',
    client: 'Peak Plumbing Co.',
    website: 'peakplumbing.co',
    request: 'Update phone number to (555) 867-5309',
    summary: 'Replace phone number across footer',
    targetFile: 'index.html',
    oldCode: `<div class="footer-contact">
  <span>Call us: (555) 123-0000</span>
</div>`,
    newCode: `<div class="footer-contact">
  <span>Call us: (555) 867-5309</span>
</div>`,
    risk: 'low',
    riskDescription: 'Text-only change in footer. No layout impact.',
    confidence: 0.96,
    createdAt: '2025-04-13T08:42:00Z',
  },
  {
    id: '3',
    client: 'Green Thumb Landscaping',
    website: 'greenthumb.garden',
    request: 'Remove the testimonials section entirely',
    summary: 'Delete testimonials section block',
    targetFile: 'index.html',
    oldCode: `<section id="testimonials" class="testimonials-section">
  <div class="container">
    <h2>What Our Clients Say</h2>
    <div class="testimonials-grid">
      <!-- 6 testimonial cards -->
    </div>
  </div>
</section>`,
    newCode: `<!-- Testimonials section removed per client request -->`,
    risk: 'high',
    riskDescription: 'Removes entire section (~45 lines). If CSS references this section, orphaned styles will remain. Verify no JS depends on #testimonials selector.',
    confidence: 0.82,
    createdAt: '2025-04-12T16:30:00Z',
  },
]

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

function ApprovalCard({ item, onAction }: { item: Approval; onAction: (id: string, action: string) => void }) {
  const [notes, setNotes] = useState('')
  const [expanded, setExpanded] = useState(true)
  const risk = riskConfig[item.risk]

  return (
    <div className="rounded-2xl overflow-hidden" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
      {/* Card header */}
      <div className="px-6 py-5 flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <span className="font-semibold text-white text-[15px]">{item.client}</span>
            <span className="text-slate-600">·</span>
            <span className="text-slate-400 text-sm">{item.website}</span>
            <span className="text-slate-600">·</span>
            <span className="font-mono text-[11px] text-slate-500 bg-white/5 px-2 py-0.5 rounded">{item.targetFile}</span>
          </div>
          <p className="text-slate-300 text-sm leading-relaxed">&ldquo;{item.request}&rdquo;</p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <Badge className={`text-xs font-medium ${risk.badge}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${risk.dot} mr-1.5 inline-block`}></span>
            {risk.label}
          </Badge>
          <button
            onClick={() => setExpanded(!expanded)}
            className="text-slate-500 hover:text-slate-300 text-xs transition-colors cursor-pointer"
          >
            {expanded ? 'Collapse' : 'Expand'}
          </button>
        </div>
      </div>

      {expanded && (
        <div className="px-6 pb-6 space-y-5" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          <div className="pt-4 flex items-center gap-4">
            <span className="text-xs text-slate-500">
              Confidence: <span className="text-slate-200 font-medium">{Math.round(item.confidence * 100)}%</span>
            </span>
            <span className="text-xs text-slate-500">
              Summary: <span className="text-slate-200">{item.summary}</span>
            </span>
          </div>

          {/* Risk warning */}
          {item.risk !== 'low' && (
            <div className="flex items-start gap-3 text-sm rounded-xl px-4 py-3"
              style={{ background: 'rgba(251,191,36,0.07)', border: '1px solid rgba(251,191,36,0.2)' }}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#FBBF24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 mt-0.5">
                <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
              </svg>
              <span className="text-amber-300">{item.riskDescription}</span>
            </div>
          )}

          {/* Diff */}
          <DiffView oldCode={item.oldCode} newCode={item.newCode} />

          {/* Notes */}
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

          {/* Actions */}
          <div className="flex items-center gap-2 pt-1">
            <Button
              onClick={() => onAction(item.id, 'approve')}
              className="bg-[#3B82F6] hover:bg-blue-500 text-white font-medium text-sm cursor-pointer"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="mr-1.5">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
              Approve & Deploy
            </Button>
            <Button
              onClick={() => onAction(item.id, 'reject')}
              variant="outline"
              className="font-medium text-sm cursor-pointer"
              style={{ border: '1px solid rgba(255,255,255,0.1)', background: 'transparent', color: '#94a3b8' }}
            >
              Reject
            </Button>
            <Button
              onClick={() => onAction(item.id, 'clarify')}
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

export default function ApprovalsPage() {
  const [approvals, setApprovals] = useState(mockApprovals)

  const handleAction = (id: string, action: string) => {
    setApprovals((prev) => prev.filter((a) => a.id !== id))
  }

  return (
    <div className="px-8 py-8 max-w-5xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold mb-1">Pending Approvals</h1>
        <p className="text-slate-400 text-sm">
          {approvals.length} request{approvals.length !== 1 ? 's' : ''} waiting for review
        </p>
      </div>

      {approvals.length === 0 ? (
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
          {approvals.map((item) => (
            <ApprovalCard key={item.id} item={item} onAction={handleAction} />
          ))}
        </div>
      )}
    </div>
  )
}
