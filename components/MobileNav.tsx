'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'

export function MobileNav() {
  const [open, setOpen] = useState(false)

  return (
    <>
      {/* Desktop nav links */}
      <div className="hidden md:flex items-center gap-8">
        <a href="#how-it-works" className="text-sm font-medium text-[var(--ink-soft)] hover:text-[var(--ink)] transition-colors">How it works</a>
        <a href="#pricing" className="text-sm font-medium text-[var(--ink-soft)] hover:text-[var(--ink)] transition-colors">Pricing</a>
        <Button size="sm" className="rounded-full px-5 bg-[var(--coral)] hover:bg-[var(--coral-deep)] text-white">
          Get started
        </Button>
      </div>

      {/* Mobile hamburger */}
      <button
        className="md:hidden flex flex-col justify-center items-center w-9 h-9 gap-1.5 cursor-pointer"
        onClick={() => setOpen(!open)}
        aria-label="Toggle menu"
      >
        <span className={`block w-5 h-0.5 rounded-full bg-[var(--ink)] transition-all duration-300 ${open ? 'rotate-45 translate-y-2' : ''}`} />
        <span className={`block w-5 h-0.5 rounded-full bg-[var(--ink)] transition-all duration-300 ${open ? 'opacity-0' : ''}`} />
        <span className={`block w-5 h-0.5 rounded-full bg-[var(--ink)] transition-all duration-300 ${open ? '-rotate-45 -translate-y-2' : ''}`} />
      </button>

      {/* Mobile menu dropdown */}
      {open && (
        <div
          className="md:hidden absolute top-full left-0 right-0 border-b border-[var(--line)] px-6 py-5 flex flex-col gap-4 bg-[var(--paper)]"
          style={{ zIndex: 50 }}
        >
          <a
            href="#how-it-works"
            onClick={() => setOpen(false)}
            className="text-sm font-medium text-[var(--ink-soft)] hover:text-[var(--ink)] transition-colors py-1"
          >
            How it works
          </a>
          <a
            href="#pricing"
            onClick={() => setOpen(false)}
            className="text-sm font-medium text-[var(--ink-soft)] hover:text-[var(--ink)] transition-colors py-1"
          >
            Pricing
          </a>
          <Button className="rounded-full bg-[var(--coral)] hover:bg-[var(--coral-deep)] text-white w-full">
            Get started
          </Button>
        </div>
      )}
    </>
  )
}
