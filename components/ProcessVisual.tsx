'use client'

import { useEffect, useRef, useState, type CSSProperties } from 'react'

// The section this lives in overrides the palette vars to dark values —
// the mockup re-declares the light ones so its contents render as a real
// light-mode browser window against the dark band.
const lightVars: CSSProperties = {
  ['--paper' as string]: '#FAFCF5',
  ['--paper-deep' as string]: '#EFF3E4',
  ['--ink' as string]: '#20252D',
  ['--ink-soft' as string]: '#616876',
  ['--line' as string]: 'rgba(32,37,45,0.12)',
}

const STEPS = [
  {
    label: 'You ask',
    title: 'Tell us what to change',
    desc: '"Can you update our hours to 8am–6pm?" Type it, text it, however’s easiest — plain English is all it takes.',
  },
  {
    label: 'We check',
    title: 'A real person reviews it',
    desc: 'Every change gets looked at before it goes anywhere near your live site. No AI let loose unsupervised.',
  },
  {
    label: "It's live",
    title: 'Your site updates itself',
    desc: 'Approved changes deploy automatically — you get a confirmation with a link the moment it’s done.',
  },
] as const

export function ProcessVisual() {
  const refs = useRef<(HTMLDivElement | null)[]>([])
  const [active, setActive] = useState(0)

  useEffect(() => {
    const observers: IntersectionObserver[] = []
    refs.current.forEach((el, i) => {
      if (!el) return
      const obs = new IntersectionObserver(
        (entries) => {
          if (entries[0].isIntersecting) setActive(i)
        },
        { rootMargin: '-42% 0px -42% 0px', threshold: 0 }
      )
      obs.observe(el)
      observers.push(obs)
    })
    return () => observers.forEach((o) => o.disconnect())
  }, [])

  return (
    <div className="grid lg:grid-cols-[0.95fr_1.05fr] gap-14 lg:gap-20 items-start">
      {/* Steps + timeline */}
      <div className="relative">
        <div className="absolute left-[15px] top-2 bottom-2 w-[2px] rounded-full bg-[var(--line)]" aria-hidden>
          <div
            className="w-full rounded-full bg-[var(--purple)] transition-[height] duration-500 ease-out"
            style={{ height: `${(active / (STEPS.length - 1)) * 100}%` }}
          />
        </div>
        <div className="space-y-16 md:space-y-20">
          {STEPS.map((step, i) => (
            <div key={step.title} ref={(el) => { refs.current[i] = el }} className="relative pl-12">
              <div
                className={`absolute left-0 top-0.5 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold border-2 transition-colors duration-300 ${
                  i <= active
                    ? 'bg-[var(--purple)] border-[var(--purple)] text-white'
                    : 'bg-[var(--paper)] border-[var(--line)] text-[var(--ink-soft)]'
                }`}
              >
                {i + 1}
              </div>
              <p className="text-xs font-bold tracking-[0.18em] uppercase mb-2 text-[var(--purple)]">
                {step.label}
              </p>
              <h3 className="text-2xl mb-3 font-display">
                {step.title}
              </h3>
              <p className="text-[var(--ink-soft)] leading-relaxed max-w-sm">{step.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Sticky browser mockup that morphs with the active step */}
      <div className="lg:sticky lg:top-28">
        <BrowserMockup active={active} />
      </div>
    </div>
  )
}

function BrowserMockup({ active }: { active: number }) {
  return (
    <div className="rounded-2xl bg-white shadow-[0_30px_70px_-24px_rgba(0,0,0,0.55)] overflow-hidden" style={lightVars}>
      <div className="flex items-center gap-2 px-4 py-3 border-b border-[var(--line)] bg-[var(--paper-deep)]">
        <span className="w-2.5 h-2.5 rounded-full bg-[#FF6159]" />
        <span className="w-2.5 h-2.5 rounded-full bg-[#FEBC2E]" />
        <span className="w-2.5 h-2.5 rounded-full bg-[#28C840]" />
        <div className="ml-3 flex-1 rounded-md bg-white border border-[var(--line)] px-3 py-1 text-xs text-[var(--ink-soft)] truncate">
          yourbusiness.com
        </div>
      </div>

      <div className="relative h-[320px] sm:h-[300px] p-6 overflow-hidden">
        {/* Step 0: chat request */}
        <Frame show={active === 0}>
          <p className="text-xs font-semibold text-[var(--ink-soft)] mb-3">Your message</p>
          <div className="rounded-2xl rounded-tl-sm bg-[var(--blue-wash)] px-4 py-3 max-w-[85%] text-sm text-[var(--ink)] leading-relaxed">
            Can you update our hours to 8am–6pm?
            <span className="inline-block w-[2px] h-4 align-middle ml-0.5 bg-[var(--ink)] animate-pulse" />
          </div>
        </Frame>

        {/* Step 1: review / diff */}
        <Frame show={active === 1}>
          <p className="text-xs font-semibold text-[var(--ink-soft)] mb-3">Reviewing your request…</p>
          <div className="rounded-xl border border-red-200 p-3 mb-2 text-sm line-through text-red-400 bg-red-50/70">
            Open 9am – 5pm
          </div>
          <div className="rounded-xl border border-[var(--lime-deep)] p-3 mb-4 text-sm bg-[var(--lime-wash)] text-[var(--ink)] font-medium">
            Open 8am – 6pm
          </div>
          <div className="flex gap-2">
            <span className="px-3 py-1.5 rounded-full text-xs font-bold bg-[var(--lime)] text-[var(--ink)]">✓ Approve</span>
            <span className="px-3 py-1.5 rounded-full text-xs font-semibold border border-[var(--line)] text-[var(--ink-soft)]">Reject</span>
          </div>
        </Frame>

        {/* Step 2: live */}
        <Frame show={active === 2}>
          <div className="flex items-center gap-2 mb-4">
            <span className="w-2 h-2 rounded-full bg-[var(--lime-deep)] animate-pulse" />
            <span className="text-xs font-bold tracking-wide uppercase text-[var(--lime-ink)]">Live now</span>
          </div>
          <div className="rounded-xl border border-[var(--line)] p-5 bg-[var(--paper)]">
            <p className="text-xs text-[var(--ink-soft)] mb-1">Hours</p>
            <p className="text-lg font-semibold text-[var(--ink)]">Open 8am – 6pm</p>
          </div>
          <p className="text-xs text-[var(--ink-soft)] mt-4">Deployed just now ✨</p>
        </Frame>
      </div>
    </div>
  )
}

function Frame({ show, children }: { show: boolean; children: React.ReactNode }) {
  return (
    <div
      className={`absolute inset-6 transition-all duration-500 ${
        show ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3 pointer-events-none'
      }`}
    >
      {children}
    </div>
  )
}
