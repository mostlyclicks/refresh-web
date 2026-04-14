'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const NAV = [
  {
    label: 'Approvals',
    href: '/admin/approvals',
    badge: 3,
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/>
      </svg>
    ),
  },
  {
    label: 'Clients',
    href: '/admin/clients',
    badge: null,
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/>
      </svg>
    ),
  },
  {
    label: 'Billing',
    href: '/admin/billing',
    badge: null,
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/>
      </svg>
    ),
  },
]

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  return (
    <div className="min-h-screen bg-[#0F172A] text-white flex">
      {/* Sidebar */}
      <aside className="w-60 shrink-0 flex flex-col" style={{ background: 'rgba(255,255,255,0.03)', borderRight: '1px solid rgba(255,255,255,0.07)' }}>
        {/* Logo */}
        <div className="px-6 py-6">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-[#3B82F6] flex items-center justify-center">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/>
                <path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15"/>
              </svg>
            </div>
            <span className="font-bold text-[15px] tracking-tight">
              Refresh<span className="text-[#3B82F6]">Web</span>
            </span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1 ml-9">Admin</p>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 space-y-0.5">
          <p className="text-[10px] font-semibold text-slate-600 uppercase tracking-widest px-3 mb-2">Menu</p>
          {NAV.map((item) => {
            const active = pathname === item.href || pathname.startsWith(item.href)
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-all cursor-pointer ${
                  active
                    ? 'bg-[#3B82F6]/15 text-white'
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <span className="flex items-center gap-2.5">
                  <span className={active ? 'text-[#3B82F6]' : 'text-slate-500'}>{item.icon}</span>
                  {item.label}
                </span>
                {item.badge !== null && (
                  <span className="bg-[#3B82F6] text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full leading-none">
                    {item.badge}
                  </span>
                )}
              </Link>
            )
          })}
        </nav>

        {/* Footer */}
        <div className="px-6 py-5" style={{ borderTop: '1px solid rgba(255,255,255,0.07)' }}>
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-full bg-[#3B82F6]/20 flex items-center justify-center text-[#3B82F6] text-xs font-bold">
              C
            </div>
            <div>
              <p className="text-sm font-medium leading-none">Carlos</p>
              <p className="text-xs text-slate-500 mt-0.5">Owner</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  )
}
