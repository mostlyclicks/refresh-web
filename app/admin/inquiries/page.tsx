import { supabaseAdmin } from '@/lib/db'

export const dynamic = 'force-dynamic'

// This table holds client customers' data (a patient's phone number, a
// symptom description, etc.) — not RefreshWeb's. It exists as a fallback
// in case the notification email silently fails, not as a permanent
// record, so old rows are pruned rather than kept indefinitely.
const RETENTION_DAYS = 60

export default async function InquiriesPage() {
  const cutoff = new Date(Date.now() - RETENTION_DAYS * 24 * 60 * 60 * 1000).toISOString()
  await supabaseAdmin.from('contact_submissions').delete().lt('created_at', cutoff)

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

      <p className="text-slate-500 text-xs mb-3">
        Contact info and messages belong to your clients' customers, not RefreshWeb — kept hidden
        by default and cleared after {RETENTION_DAYS} days. Expand only if you need to debug a
        delivery issue.
      </p>

      {/* Inquiries table */}
      <div className="rounded-2xl overflow-hidden" style={{ border: '1px solid rgba(255,255,255,0.08)' }}>
        <div
          className="grid grid-cols-[1.3fr_1.3fr_1fr] px-5 py-3 text-[11px] font-semibold uppercase tracking-widest text-slate-500"
          style={{ background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}
        >
          <span>Client</span>
          <span>Name</span>
          <span>Date</span>
        </div>

        <div className="divide-y divide-white/5">
          {!submissions || submissions.length === 0 ? (
            <div className="px-5 py-12 text-center text-slate-500 text-sm">
              No inquiries yet — they'll appear here when a visitor submits a contact form on a client site.
            </div>
          ) : (
            submissions.map((s: any) => (
              <details key={s.id} className="group px-5 py-4 hover:bg-white/[0.03] transition-colors">
                <summary className="grid grid-cols-[1.3fr_1.3fr_1fr] items-center cursor-pointer list-none marker:content-none">
                  <span className="text-slate-300 text-sm">{s.clients?.name ?? '—'}</span>
                  <span className="font-medium text-white text-sm">{s.name}</span>
                  <span className="flex items-center justify-between text-slate-400 text-sm">
                    {new Date(s.created_at).toLocaleDateString('en-US', {
                      month: 'short', day: 'numeric', year: 'numeric',
                    })}
                    <span className="text-[11px] text-[#3B82F6] group-open:hidden">Show details</span>
                    <span className="text-[11px] text-slate-500 hidden group-open:inline">Hide details</span>
                  </span>
                </summary>
                <div className="mt-3 pl-1 space-y-1.5">
                  <p className="text-sm">
                    <span className="text-slate-500">Contact: </span>
                    <span className="text-[#3B82F6] break-all">{s.contact}</span>
                  </p>
                  <p className="text-sm">
                    <span className="text-slate-500">Message: </span>
                    <span className="text-slate-300">{s.message || '—'}</span>
                  </p>
                </div>
              </details>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
