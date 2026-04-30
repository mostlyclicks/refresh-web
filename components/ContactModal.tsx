'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'

type Props = {
  open: boolean
  initialPlan?: string
  onClose: () => void
}

export function ContactModal({ open, initialPlan, onClose }: Props) {
  const [form, setForm] = useState({ name: '', email: '', business: '', plan: initialPlan ?? '', message: '' })
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Sync plan if opened from a pricing button
  useEffect(() => {
    if (open) {
      setForm((f) => ({ ...f, plan: initialPlan ?? f.plan }))
      setDone(false)
      setError(null)
    }
  }, [open, initialPlan])

  // Close on Escape
  useEffect(() => {
    if (!open) return
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [open, onClose])

  if (!open) return null

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (data.success) {
        setDone(true)
      } else {
        setError(data.error || 'Something went wrong')
      }
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const field = 'w-full px-4 py-3 rounded-xl text-sm text-white placeholder-slate-500 outline-none focus:ring-2 focus:ring-blue-500/50'
  const fieldStyle = { background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div
        className="w-full max-w-md rounded-2xl p-8 relative"
        style={{ background: '#0F172A', border: '1px solid rgba(255,255,255,0.1)' }}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-500 hover:text-white text-lg leading-none"
        >
          ✕
        </button>

        {done ? (
          <div className="text-center py-8">
            <div className="text-4xl mb-4">👋</div>
            <h2 className="text-xl font-bold mb-2">We'll be in touch!</h2>
            <p className="text-slate-400 text-sm">Thanks for reaching out. Carlos will get back to you within 1 business day.</p>
            <Button
              onClick={onClose}
              className="mt-6 bg-[#3B82F6] hover:bg-blue-500 text-white px-8"
            >
              Done
            </Button>
          </div>
        ) : (
          <>
            <h2 className="text-xl font-bold mb-1">Get started with RefreshWeb</h2>
            <p className="text-slate-400 text-sm mb-6">Tell us about your business and we'll reach out within 1 business day.</p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <input
                required
                className={field}
                style={fieldStyle}
                placeholder="Your name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
              <input
                required
                type="email"
                className={field}
                style={fieldStyle}
                placeholder="Email address"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
              <input
                required
                className={field}
                style={fieldStyle}
                placeholder="Business name"
                value={form.business}
                onChange={(e) => setForm({ ...form, business: e.target.value })}
              />
              <select
                className={field}
                style={{ ...fieldStyle, color: form.plan ? 'white' : '#64748b' }}
                value={form.plan}
                onChange={(e) => setForm({ ...form, plan: e.target.value })}
              >
                <option value="">Interested in... (optional)</option>
                <option value="basic">Basic — $49/mo</option>
                <option value="professional">Professional — $99/mo</option>
                <option value="design">Website Design — $2,500 one-time</option>
              </select>
              <textarea
                rows={3}
                className={field}
                style={fieldStyle}
                placeholder="Anything else you'd like us to know? (optional)"
                value={form.message}
                onChange={(e) => setForm({ ...form, message: e.target.value })}
              />

              {error && (
                <p className="text-red-400 text-sm">{error}</p>
              )}

              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-[#3B82F6] hover:bg-blue-500 text-white py-3 disabled:opacity-50"
              >
                {loading ? 'Sending…' : 'Send inquiry'}
              </Button>
            </form>
          </>
        )}
      </div>
    </div>
  )
}
