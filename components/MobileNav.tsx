'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'

export function MobileNav() {
  const [open, setOpen] = useState(false)

  return (
    <>
      {/* Desktop nav links */}
      <div className="hidden md:flex items-center gap-6">
        <a href="#how-it-works" className="text-sm text-slate-400 hover:text-white transition-colors">How it works</a>
        <a href="#pricing" className="text-sm text-slate-400 hover:text-white transition-colors">Pricing</a>
        <Button size="sm" className="bg-[#3B82F6] hover:bg-blue-500 text-white">
          Get Started
        </Button>
      </div>

      {/* Mobile hamburger */}
      <button
        className="md:hidden flex flex-col justify-center items-center w-9 h-9 gap-1.5 cursor-pointer"
        onClick={() => setOpen(!open)}
        aria-label="Toggle menu"
      >
        <span className={`block w-5 h-0.5 bg-white transition-all duration-300 ${open ? 'rotate-45 translate-y-2' : ''}`} />
        <span className={`block w-5 h-0.5 bg-white transition-all duration-300 ${open ? 'opacity-0' : ''}`} />
        <span className={`block w-5 h-0.5 bg-white transition-all duration-300 ${open ? '-rotate-45 -translate-y-2' : ''}`} />
      </button>

      {/* Mobile menu dropdown */}
      {open && (
        <div
          className="md:hidden absolute top-full left-0 right-0 border-b border-white/10 px-6 py-5 flex flex-col gap-4"
          style={{ background: '#0F172A', zIndex: 50 }}
        >
          <a
            href="#how-it-works"
            onClick={() => setOpen(false)}
            className="text-sm text-slate-300 hover:text-white transition-colors py-1"
          >
            How it works
          </a>
          <a
            href="#pricing"
            onClick={() => setOpen(false)}
            className="text-sm text-slate-300 hover:text-white transition-colors py-1"
          >
            Pricing
          </a>
          <Button className="bg-[#3B82F6] hover:bg-blue-500 text-white w-full">
            Get Started
          </Button>
        </div>
      )}
    </>
  )
}
