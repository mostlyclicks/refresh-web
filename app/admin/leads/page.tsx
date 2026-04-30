import { supabaseAdmin } from '@/lib/db'

export const dynamic = 'force-dynamic'

const planLabel: Record<string, string> = {
  basic: 'Basic — $49/mo',
  professional: 'Professional — $99/mo',
  design: 'Website Design',
}

export default async function LeadsPage() {
  const { data: leads } = await supabaseAdmin
    .from('leads')
    .select('*')
    .order('created_at', { ascending: false })

  return (
    <div className="px-8 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold mb-1">Leads</h1>
        <p className="text-slate-400 text-sm">Inquiries from the Get Started form</p>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-4 mb-10">
        {[
          { label: 'Total Inquiries', value: leads?.length ?? 0 },
          { label: 'This Month', value: leads?.filter(l => new Date(l.created_at) >= new Date(new Date().getFullYear(), new Date().getMonth(), 1)).length ?? 0 },
          { label: 'With Plan Interest', value: leads?.filter(l => l.plan).length ?? 0 },
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

      {/* Leads table */}
      <div className="rounded-2xl overflow-hidden" style={{ border: '1px solid rgba(255,255,255,0.08)' }}>
        <div
          className="grid grid-cols-[1.5fr_1.5fr_1.5fr_1.5fr_1fr] px-5 py-3 text-[11px] font-semibold uppercase tracking-widest text-slate-500"
          style={{ background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}
        >
          <span>Name</span>
          <span>Email</span>
          <span>Business</span>
          <span>Plan Interest</span>
          <span>Date</span>
        </div>

        <div className="divide-y divide-white/5">
          {!leads || leads.length === 0 ? (
            <div className="px-5 py-12 text-center text-slate-500 text-sm">
              No inquiries yet — they'll appear here when someone fills out the Get Started form.
            </div>
          ) : (
            leads.map((lead) => (
              <div
                key={lead.id}
                className="grid grid-cols-[1.5fr_1.5fr_1.5fr_1.5fr_1fr] px-5 py-4 items-start hover:bg-white/[0.03] transition-colors"
              >
                <span className="font-medium text-white text-sm">{lead.name}</span>
                <a
                  href={`mailto:${lead.email}`}
                  className="text-[#3B82F6] text-sm hover:underline"
                >
                  {lead.email}
                </a>
                <span className="text-slate-300 text-sm">{lead.business}</span>
                <span className="text-slate-400 text-sm">
                  {lead.plan ? planLabel[lead.plan] ?? lead.plan : <span className="text-slate-600">—</span>}
                </span>
                <div>
                  <span className="text-slate-400 text-sm">
                    {new Date(lead.created_at).toLocaleDateString('en-US', {
                      month: 'short', day: 'numeric', year: 'numeric',
                    })}
                  </span>
                  {lead.message && (
                    <p className="text-slate-500 text-xs mt-1 leading-snug line-clamp-2">{lead.message}</p>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
