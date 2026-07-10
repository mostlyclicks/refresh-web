import { supabaseAdmin } from '@/lib/db'

export const dynamic = 'force-dynamic'

export default async function InquiriesPage() {
  const { data: submissions } = await supabaseAdmin
    .from('contact_submissions')
    .select('*, clients(name)')
    .order('created_at', { ascending: false })

  const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1)

  return (
    <div className="px-8 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold mb-1">Inquiries</h1>
        <p className="text-slate-400 text-sm">Contact-form submissions from client sites</p>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-4 mb-10">
        {[
          { label: 'Total Inquiries', value: submissions?.length ?? 0 },
          { label: 'This Month', value: submissions?.filter(s => new Date(s.created_at) >= monthStart).length ?? 0 },
          { label: 'Clients Reached', value: new Set(submissions?.map(s => s.client_id)).size },
        ].map((card) => (
          <div
            key={card.label}
            className="p-6 rounded-2xl"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
          >
            <p className="text-slate-400 text-xs font-medium mb-3">{card.label}</p>
            <p className="text-4xl font-bold text-white">{card.value}</p>
          </div>
        ))}
      </div>

      {/* Inquiries table */}
      <div className="rounded-2xl overflow-hidden" style={{ border: '1px solid rgba(255,255,255,0.08)' }}>
        <div
          className="grid grid-cols-[1.3fr_1.3fr_1.3fr_2fr_1fr] px-5 py-3 text-[11px] font-semibold uppercase tracking-widest text-slate-500"
          style={{ background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}
        >
          <span>Client</span>
          <span>Name</span>
          <span>Contact</span>
          <span>Message</span>
          <span>Date</span>
        </div>

        <div className="divide-y divide-white/5">
          {!submissions || submissions.length === 0 ? (
            <div className="px-5 py-12 text-center text-slate-500 text-sm">
              No inquiries yet — they'll appear here when a visitor submits a contact form on a client site.
            </div>
          ) : (
            submissions.map((s: any) => (
              <div
                key={s.id}
                className="grid grid-cols-[1.3fr_1.3fr_1.3fr_2fr_1fr] px-5 py-4 items-start hover:bg-white/[0.03] transition-colors"
              >
                <span className="text-slate-300 text-sm">{s.clients?.name ?? '—'}</span>
                <span className="font-medium text-white text-sm">{s.name}</span>
                <span className="text-[#3B82F6] text-sm break-all">{s.contact}</span>
                <p className="text-slate-400 text-sm leading-snug line-clamp-2">{s.message || <span className="text-slate-600">—</span>}</p>
                <span className="text-slate-400 text-sm">
                  {new Date(s.created_at).toLocaleDateString('en-US', {
                    month: 'short', day: 'numeric', year: 'numeric',
                  })}
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
