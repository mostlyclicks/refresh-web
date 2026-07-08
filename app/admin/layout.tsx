'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'

const NAV = [
  {
    label: 'Overview',
    href: '/admin',
    exactMatch: true,
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
        <rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>
      </svg>
    ),
    bottomIcon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
        <rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>
      </svg>
    ),
  },
  {
    label: 'Approvals',
    href: '/admin/approvals',
    exactMatch: false,
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/>
      </svg>
    ),
    bottomIcon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/>
      </svg>
    ),
  },
  {
    label: 'Clients',
    href: '/admin/clients',
    exactMatch: false,
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/>
        <path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/>
      </svg>
    ),
    bottomIcon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/>
        <path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/>
      </svg>
    ),
  },
  {
    label: 'Billing',
    href: '/admin/billing',
    exactMatch: false,
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/>
      </svg>
    ),
    bottomIcon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/>
      </svg>
    ),
  },
  {
    label: 'Leads',
    href: '/admin/leads',
    exactMatch: false,
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.81a19.79 19.79 0 01-3.07-8.68A2 2 0 012 .94h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L6.09 8.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 16.92z"/>
      </svg>
    ),
  },
]

// Only the 4 most-used tabs for the mobile bottom nav
const BOTTOM_NAV = NAV.slice(0, 4)

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const [pendingCount, setPendingCount] = useState<number | null>(null)

  useEffect(() => {
    async function fetchPending() {
      try {
        const res = await fetch('/api/admin/stats')
        if (!res.ok) return
        const data = await res.json()
        setPendingCount(data.pendingCount ?? 0)
      } catch {
        // silently ignore
      }
    }
    fetchPending()
    const interval = setInterval(fetchPending, 30000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="min-h-screen bg-[#0F172A] text-white flex">
      {/* Sidebar — hidden on mobile, visible on md+ */}
      <aside className="hidden md:flex w-60 shrink-0 flex-col" style={{ background: 'rgba(255,255,255,0.03)', borderRight: '1px solid rgba(255,255,255,0.07)' }}>
        {/* Logo */}
        <div className="px-6 py-6">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-[#20252D] flex items-center justify-center">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#C8F05B" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/>
                <path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15"/>
              </svg>
            </div>
            <span className="font-bold text-[15px] tracking-tight">
              Refresh<span className="text-[#C8F05B]">Web</span>
            </span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1 ml-9">Admin</p>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 space-y-0.5">
          <p className="text-[10px] font-semibold text-slate-600 uppercase tracking-widest px-3 mb-2">Menu</p>
          {NAV.map((item) => {
            const active = item.exactMatch
              ? pathname === item.href
              : pathname.startsWith(item.href)
            const showBadge = item.label === 'Approvals' && pendingCount !== null && pendingCount > 0

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
                {showBadge && (
                  <span className="bg-[#3B82F6] text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full leading-none">
                    {pendingCount}
                  </span>
                )}
              </Link>
            )
          })}
        </nav>

        {/* Footer */}
        <div className="px-6 py-5" style={{ borderTop: '1px solid rgba(255,255,255,0.07)' }}>
          <div className="flex items-center justify-between gap-2.5">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-full bg-[#3B82F6]/20 flex items-center justify-center text-[#3B82F6] text-xs font-bold">
                C
              </div>
              <div>
                <p className="text-sm font-medium leading-none">Carlos</p>
                <p className="text-xs text-slate-500 mt-0.5">Owner</p>
              </div>
            </div>
            <button
              onClick={async () => {
                await fetch('/api/admin/logout', { method: 'POST' })
                window.location.href = '/admin/login'
              }}
              title="Sign out"
              className="text-slate-600 hover:text-red-400 transition-colors cursor-pointer"
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/>
                <polyline points="16 17 21 12 16 7"/>
                <line x1="21" y1="12" x2="9" y2="12"/>
              </svg>
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile top bar — logo + sign out, only visible on mobile */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-40 flex items-center justify-between px-4 py-3" style={{ background: '#0F172A', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-md bg-[#20252D] flex items-center justify-center">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#C8F05B" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/>
              <path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15"/>
            </svg>
          </div>
          <span className="font-bold text-sm tracking-tight">
            Refresh<span className="text-[#C8F05B]">Web</span>
          </span>
          <span className="text-[11px] text-slate-600 ml-1">Admin</span>
        </div>
        <button
          onClick={async () => {
            await fetch('/api/admin/logout', { method: 'POST' })
            window.location.href = '/admin/login'
          }}
          title="Sign out"
          className="text-slate-600 hover:text-red-400 transition-colors cursor-pointer p-2"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/>
            <polyline points="16 17 21 12 16 7"/>
            <line x1="21" y1="12" x2="9" y2="12"/>
          </svg>
        </button>
      </div>

      {/* Main content — top padding on mobile for the fixed top bar, bottom padding for bottom nav */}
      <main className="flex-1 overflow-auto pt-14 md:pt-0 pb-20 md:pb-0">{children}</main>

      {/* Bottom tab bar — mobile only */}
      <nav
        className="md:hidden fixed bottom-0 left-0 right-0 z-50 flex items-stretch justify-around"
        style={{
          background: '#0A1120',
          borderTop: '1px solid rgba(255,255,255,0.08)',
          paddingBottom: 'max(0.75rem, env(safe-area-inset-bottom))',
        }}
      >
        {BOTTOM_NAV.map((item) => {
          const active = item.exactMatch
            ? pathname === item.href
            : pathname.startsWith(item.href)
          const showBadge = item.label === 'Approvals' && pendingCount !== null && pendingCount > 0

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center gap-1 flex-1 pt-2.5 relative transition-colors ${
                active ? 'text-[#3B82F6]' : 'text-slate-500'
              }`}
            >
              <span className="relative">
                {item.bottomIcon}
                {showBadge && (
                  <span className="absolute -top-1.5 -right-2.5 min-w-[16px] h-4 bg-[#3B82F6] rounded-full text-[9px] font-bold flex items-center justify-center text-white px-1 leading-none">
                    {(pendingCount ?? 0) > 9 ? '9+' : pendingCount}
                  </span>
                )}
              </span>
              <span className={`text-[10px] font-medium ${active ? 'text-[#3B82F6]' : 'text-slate-600'}`}>
                {item.label}
              </span>
            </Link>
          )
        })}
      </nav>
    </div>
  )
}
