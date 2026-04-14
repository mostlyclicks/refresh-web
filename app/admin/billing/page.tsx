import { Badge } from '@/components/ui/badge'

const mockSubscriptions = [
  { client: 'Sunrise Bakery',     tier: 'Professional', amount: 199, nextDate: 'May 1, 2025', status: 'active' },
  { client: 'Peak Plumbing Co.',  tier: 'Basic',        amount: 99,  nextDate: 'May 1, 2025', status: 'active' },
]

const mockPayments = [
  { id: 'inv_001', client: 'Sunrise Bakery',           amount: 199, date: 'Apr 1, 2025', status: 'paid' },
  { id: 'inv_002', client: 'Peak Plumbing Co.',        amount: 99,  date: 'Apr 1, 2025', status: 'paid' },
  { id: 'inv_003', client: 'Green Thumb Landscaping',  amount: 99,  date: 'Mar 1, 2025', status: 'failed' },
  { id: 'inv_004', client: 'Sunrise Bakery',           amount: 199, date: 'Mar 1, 2025', status: 'paid' },
  { id: 'inv_005', client: 'Peak Plumbing Co.',        amount: 99,  date: 'Mar 1, 2025', status: 'paid' },
]

const MRR = mockSubscriptions.reduce((sum, s) => sum + s.amount, 0)

export default function BillingPage() {
  return (
    <div className="px-8 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold mb-1">Billing</h1>
        <p className="text-slate-400 text-sm">Revenue overview and payment history</p>
      </div>

      {/* MRR Cards */}
      <div className="grid grid-cols-3 gap-4 mb-10">
        {[
          {
            label: 'Monthly Recurring Revenue',
            value: `$${MRR}`,
            sub: `${mockSubscriptions.length} active subscriptions`,
            accent: true,
          },
          {
            label: 'Annual Run Rate',
            value: `$${(MRR * 12).toLocaleString()}`,
            sub: 'Based on current MRR',
            accent: false,
          },
          {
            label: 'Avg per Client',
            value: `$${Math.round(MRR / mockSubscriptions.length)}`,
            sub: 'Across active subscriptions',
            accent: false,
          },
        ].map((card) => (
          <div
            key={card.label}
            className="p-6 rounded-2xl"
            style={{
              background: card.accent ? 'rgba(59,130,246,0.1)' : 'rgba(255,255,255,0.04)',
              border: card.accent ? '1px solid rgba(59,130,246,0.25)' : '1px solid rgba(255,255,255,0.08)',
            }}
          >
            <p className="text-slate-400 text-xs font-medium mb-3">{card.label}</p>
            <p className={`text-4xl font-bold mb-1 ${card.accent ? 'text-[#3B82F6]' : 'text-white'}`}>
              {card.value}
            </p>
            <p className="text-xs text-slate-500">{card.sub}</p>
          </div>
        ))}
      </div>

      {/* Active subscriptions */}
      <div className="mb-10">
        <h2 className="text-base font-semibold mb-4">Active Subscriptions</h2>
        <div className="rounded-2xl overflow-hidden" style={{ border: '1px solid rgba(255,255,255,0.08)' }}>
          <div className="grid grid-cols-[2fr_1fr_1fr_1.2fr_1fr] px-5 py-3 text-[11px] font-semibold uppercase tracking-widest text-slate-500"
            style={{ background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
            <span>Client</span>
            <span>Plan</span>
            <span>Amount</span>
            <span>Next Billing</span>
            <span>Status</span>
          </div>
          <div className="divide-y divide-white/5">
            {mockSubscriptions.map((sub) => (
              <div key={sub.client} className="grid grid-cols-[2fr_1fr_1fr_1.2fr_1fr] px-5 py-4 items-center hover:bg-white/[0.03] transition-colors">
                <span className="font-medium text-white text-sm">{sub.client}</span>
                <span className="text-slate-400 text-sm">{sub.tier}</span>
                <span className="font-mono text-slate-300 text-sm">${sub.amount}/mo</span>
                <span className="text-slate-400 text-sm">{sub.nextDate}</span>
                <div className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                  <span className="text-sm text-slate-300">Active</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Payment history */}
      <div>
        <h2 className="text-base font-semibold mb-4">Payment History</h2>
        <div className="rounded-2xl overflow-hidden" style={{ border: '1px solid rgba(255,255,255,0.08)' }}>
          <div className="grid grid-cols-[1fr_2fr_1fr_1.2fr_1fr] px-5 py-3 text-[11px] font-semibold uppercase tracking-widest text-slate-500"
            style={{ background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
            <span>Invoice</span>
            <span>Client</span>
            <span>Amount</span>
            <span>Date</span>
            <span>Status</span>
          </div>
          <div className="divide-y divide-white/5">
            {mockPayments.map((pay) => (
              <div key={pay.id} className="grid grid-cols-[1fr_2fr_1fr_1.2fr_1fr] px-5 py-4 items-center hover:bg-white/[0.03] transition-colors">
                <span className="font-mono text-xs text-slate-600">{pay.id}</span>
                <span className="text-white text-sm">{pay.client}</span>
                <span className="font-mono text-slate-300 text-sm">${pay.amount}</span>
                <span className="text-slate-400 text-sm">{pay.date}</span>
                <div className="flex items-center gap-1.5">
                  <span className={`w-1.5 h-1.5 rounded-full ${pay.status === 'paid' ? 'bg-emerald-400' : 'bg-red-400'}`}></span>
                  <span className={`text-sm capitalize ${pay.status === 'paid' ? 'text-slate-300' : 'text-red-400'}`}>
                    {pay.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
