'use client'

import { useEffect, useState, type CSSProperties } from 'react'
import { Button } from '@/components/ui/button'
import { ScrollReveal } from '@/components/ScrollReveal'
import { MobileNav } from '@/components/MobileNav'
import { ContactModal } from '@/components/ContactModal'
import { ProcessVisual } from '@/components/ProcessVisual'

const theme: CSSProperties = {
  ['--paper' as string]: '#FAFCF5',
  ['--paper-deep' as string]: '#EFF3E4',
  ['--ink' as string]: '#20252D',
  ['--ink-soft' as string]: '#616876',
  ['--lime' as string]: '#C8F05B',
  ['--lime-deep' as string]: '#B1E23A',
  ['--lime-wash' as string]: '#EDFACD',
  ['--lime-ink' as string]: '#517E00',
  ['--purple' as string]: '#A795F6',
  ['--purple-deep' as string]: '#7C66E3',
  ['--purple-wash' as string]: '#ECE8FD',
  ['--blue' as string]: '#7DB9F0',
  ['--blue-wash' as string]: '#E3F0FC',
  ['--line' as string]: 'rgba(32,37,45,0.12)',
}

function Squiggle({ drawn }: { drawn: boolean }) {
  return (
    <svg viewBox="0 0 220 16" className="absolute left-0 -bottom-2 w-full h-4" preserveAspectRatio="none" aria-hidden>
      <path
        d="M2 11 Q 28 2, 55 9 T 110 8 T 165 9 T 218 6"
        fill="none"
        stroke="var(--purple)"
        strokeWidth="5"
        strokeLinecap="round"
        pathLength={100}
        style={{
          strokeDasharray: 100,
          strokeDashoffset: drawn ? 0 : 100,
          transition: 'stroke-dashoffset 900ms ease 550ms',
        }}
      />
    </svg>
  )
}

const heroCards = [
  {
    title: 'No complicated CMS',
    sub: 'No logins, no dashboards to learn, nothing to break.',
    wash: 'var(--blue-wash)',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
        <rect x="3" y="4" width="18" height="16" rx="3" />
        <path d="M3 9h18" />
        <path d="m9 18 6-5" />
      </svg>
    ),
    iconColor: '#2E6FB4',
  },
  {
    title: 'Plain English',
    sub: 'Just say what you need changed, like texting a friend.',
    wash: 'var(--purple-wash)',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
        <path d="M21 12a8 8 0 0 1-8 8H4l2-3a8 8 0 1 1 15-5Z" />
        <path d="M9 11h6" />
      </svg>
    ),
    iconColor: 'var(--purple-deep)',
  },
  {
    title: 'A human in the loop',
    sub: 'Every change is reviewed by a person before it goes live.',
    wash: 'var(--lime-wash)',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
        <circle cx="9" cy="8" r="4" />
        <path d="M3 21c0-3.3 2.7-6 6-6s6 2.7 6 6" />
        <path d="m15 10 2 2 4-4" />
      </svg>
    ),
    iconColor: 'var(--lime-ink)',
  },
] as const

function HeroCard() {
  return (
    <div className="relative">
      <div className="absolute -top-10 -right-8 w-56 h-56 rounded-full bg-[var(--purple-wash)] blur-2xl opacity-80" aria-hidden />
      <div className="absolute -bottom-12 -left-10 w-48 h-48 rounded-full bg-[var(--lime-wash)] blur-2xl opacity-90" aria-hidden />
      <div className="relative rounded-2xl border border-[var(--line)] bg-white shadow-[0_30px_70px_-24px_rgba(32,37,45,0.25)] overflow-hidden rotate-2">
        <div className="flex items-center gap-2 px-4 py-3 border-b border-[var(--line)] bg-[var(--paper-deep)]">
          <span className="w-2.5 h-2.5 rounded-full bg-[#FF6159]" />
          <span className="w-2.5 h-2.5 rounded-full bg-[#FEBC2E]" />
          <span className="w-2.5 h-2.5 rounded-full bg-[#28C840]" />
          <div className="ml-3 flex-1 rounded-md bg-white border border-[var(--line)] px-3 py-1 text-xs text-[var(--ink-soft)] truncate">
            yourbusiness.com
          </div>
        </div>
        <div className="p-6 space-y-3">
          <p className="text-xs font-bold tracking-[0.14em] uppercase text-[var(--ink-soft)] mb-1">Recent updates</p>
          {[
            'New hours updated',
            'Hero photo swapped',
            'Spring menu prices refreshed',
          ].map((item) => (
            <div key={item} className="flex items-center gap-3 rounded-xl border border-[var(--line)] bg-[var(--paper)] px-4 py-3">
              <span className="w-5 h-5 rounded-full bg-[var(--lime)] text-[var(--ink)] text-xs flex items-center justify-center shrink-0 font-bold">✓</span>
              <span className="text-sm text-[var(--ink)]">{item}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default function HomePage() {
  const [modalOpen, setModalOpen] = useState(false)
  const [selectedPlan, setSelectedPlan] = useState<string>('')
  const [squiggleDrawn, setSquiggleDrawn] = useState(false)

  useEffect(() => {
    setSquiggleDrawn(true)
  }, [])

  function openModal(plan = '') {
    setSelectedPlan(plan)
    setModalOpen(true)
  }

  return (
    <div className="min-h-screen overflow-x-clip bg-[var(--paper)] text-[var(--ink)]" style={theme}>
      {/* Atmosphere */}
      <div
        className="pointer-events-none fixed inset-0 -z-10"
        style={{
          background: `
            radial-gradient(1100px circle at 10% -10%, var(--lime-wash), transparent 52%),
            radial-gradient(900px circle at 100% 5%, var(--purple-wash), transparent 48%),
            radial-gradient(800px circle at 55% 115%, var(--blue-wash), transparent 50%)
          `,
        }}
        aria-hidden
      />

      {/* Nav */}
      <header className="sticky top-0 z-40 border-b border-[var(--line)]" style={{ background: 'color-mix(in srgb, var(--paper) 88%, transparent)', backdropFilter: 'blur(10px)' }}>
        <nav className="px-6 py-4 relative">
          <div className="max-w-6xl mx-auto flex items-center justify-between">
            <span className="text-xl font-display">
              Refresh<span className="text-[var(--purple-deep)]">Web</span>
            </span>
            <MobileNav />
          </div>
        </nav>
      </header>

      {/* Hero */}
      <section className="px-6 pt-20 pb-24 md:pt-28 md:pb-32 overflow-x-clip">
        <div className="max-w-6xl mx-auto grid md:grid-cols-[1.1fr_0.9fr] gap-16 items-center">
          <div>
            <ScrollReveal delay={0}>
              <span className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-sm font-semibold mb-6 bg-[var(--purple-wash)] text-[var(--purple-deep)]">
                <span className="w-1.5 h-1.5 rounded-full bg-[var(--purple)]" />
                Website help for real small businesses
              </span>
            </ScrollReveal>
            <ScrollReveal delay={100}>
              <h1 className="text-5xl md:text-6xl leading-[1.04] mb-6 font-display">
                Your website,{' '}
                <span className="relative inline-block">
                  always up to date.
                  <Squiggle drawn={squiggleDrawn} />
                </span>
              </h1>
            </ScrollReveal>
            <ScrollReveal delay={200}>
              <p className="text-lg mb-10 max-w-md text-[var(--ink-soft)] leading-relaxed">
                Text us what you need changed — new hours, a fresh photo, updated pricing.
                We review it, you approve it, and it goes live. No tickets, no logins, no fuss.
              </p>
            </ScrollReveal>
            <ScrollReveal delay={300}>
              <div className="flex items-center gap-6 flex-wrap">
                <Button
                  size="lg"
                  className="rounded-full px-8 h-12 text-base font-bold bg-[var(--lime)] hover:bg-[var(--lime-deep)] text-[var(--ink)]"
                  onClick={() => openModal()}
                >
                  Get started
                </Button>
                <button
                  className="text-base font-medium underline underline-offset-4 decoration-[var(--line)] hover:decoration-[var(--ink)] cursor-pointer transition-colors"
                  onClick={() => document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' })}
                >
                  See how it works ↓
                </button>
              </div>
            </ScrollReveal>
            <ScrollReveal delay={380}>
              <div className="grid sm:grid-cols-3 gap-3 mt-14">
                {heroCards.map((card) => (
                  <div key={card.title} className="rounded-2xl border border-[var(--line)] bg-white p-4">
                    <span
                      className="w-9 h-9 rounded-xl flex items-center justify-center mb-3"
                      style={{ background: card.wash, color: card.iconColor }}
                    >
                      {card.icon}
                    </span>
                    <p className="text-[15px] leading-snug font-display mb-1">{card.title}</p>
                    <p className="text-[13px] text-[var(--ink-soft)] leading-snug">{card.sub}</p>
                  </div>
                ))}
              </div>
            </ScrollReveal>
          </div>
          <ScrollReveal delay={200} direction="right">
            <HeroCard />
          </ScrollReveal>
        </div>
      </section>

      {/* How it works — dark band with scroll-driven process visual */}
      <section
        id="how-it-works"
        className="relative px-6 py-24 md:py-32 overflow-x-clip"
        style={{
          background: '#1D222D',
          ['--ink' as string]: '#F5F7F2',
          ['--ink-soft' as string]: '#A9B0BC',
          ['--line' as string]: 'rgba(245,247,242,0.15)',
          ['--paper' as string]: '#1D222D',
        }}
      >
        {/* soft glows so the dark band keeps the energy palette */}
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background: `
              radial-gradient(700px circle at 8% 0%, rgba(200,240,91,0.09), transparent 55%),
              radial-gradient(700px circle at 95% 100%, rgba(167,149,246,0.13), transparent 55%)
            `,
          }}
          aria-hidden
        />
        <div className="relative max-w-6xl mx-auto text-[var(--ink)]">
          <ScrollReveal>
            <div className="max-w-xl mb-16 md:mb-20">
              <p className="text-xs font-bold tracking-[0.18em] uppercase mb-3 text-[var(--lime)]">How it works</p>
              <h2 className="text-3xl md:text-4xl mb-4 font-display">
                Simple as sending a text.
              </h2>
              <p className="text-[var(--ink-soft)] text-lg">Scroll along — this is genuinely the whole process.</p>
            </div>
          </ScrollReveal>
          <ProcessVisual />
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="px-6 py-24 md:py-32">
        <div className="max-w-5xl mx-auto">
          <ScrollReveal>
            <div className="text-center mb-16">
              <p className="text-xs font-bold tracking-[0.18em] uppercase mb-3 text-[var(--purple-deep)]">Pricing</p>
              <h2 className="text-3xl md:text-4xl mb-4 font-display">Transparent, always.</h2>
              <p className="text-[var(--ink-soft)] text-lg">One-time design fee, then a simple monthly plan for ongoing updates.</p>
            </div>
          </ScrollReveal>

          <ScrollReveal delay={100}>
            <div className="mb-8 p-8 rounded-3xl border border-[var(--line)] bg-white text-center">
              <p className="text-[var(--ink-soft)] text-sm uppercase tracking-widest mb-2">One-time</p>
              <div className="text-4xl mb-2 font-display">$2,500</div>
              <p className="text-[var(--ink-soft)]">Custom website design &amp; build — HTML, CSS, JS, deployed to Vercel</p>
            </div>
          </ScrollReveal>

          <div className="grid md:grid-cols-2 gap-6">
            {[
              {
                name: 'Basic',
                plan: 'basic',
                price: '$49',
                features: ['Up to 20 update requests/month', 'Changes reviewed & approved', 'Auto-deploy on approval', 'Change history log'],
                highlight: false,
                delay: 0,
              },
              {
                name: 'Professional',
                plan: 'professional',
                price: '$99',
                features: ['Unlimited update requests', 'Priority review turnaround', 'Auto-deploy on approval', 'Change history log', 'Rollback on request'],
                highlight: true,
                delay: 150,
              },
            ].map((tier) => (
              <ScrollReveal key={tier.name} delay={tier.delay}>
                <div
                  className={`p-8 rounded-3xl border h-full flex flex-col ${
                    tier.highlight
                      ? 'border-[var(--purple)] bg-[var(--purple-wash)]/60'
                      : 'border-[var(--line)] bg-white'
                  }`}
                >
                  {tier.highlight && (
                    <span className="inline-flex w-fit mb-4 px-3 py-1 rounded-full text-xs font-bold bg-[var(--purple-deep)] text-white">
                      Most popular
                    </span>
                  )}
                  <div className="mb-6">
                    <p className="text-[var(--ink-soft)] text-sm mb-1">{tier.name}</p>
                    <div className="flex items-end gap-1">
                      <span className="text-4xl font-display">{tier.price}</span>
                      <span className="text-[var(--ink-soft)] mb-1">/month</span>
                    </div>
                  </div>
                  <ul className="space-y-3 mb-8 flex-1">
                    {tier.features.map((f) => (
                      <li key={f} className="flex items-center gap-3 text-sm text-[var(--ink)]">
                        <span className="text-[var(--lime-ink)] text-lg leading-none">✓</span>
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                  <Button
                    onClick={() => openModal(tier.plan)}
                    className={`w-full rounded-full h-11 font-bold ${
                      tier.highlight
                        ? 'bg-[var(--lime)] hover:bg-[var(--lime-deep)] text-[var(--ink)]'
                        : 'bg-[var(--paper-deep)] hover:bg-[var(--line)] text-[var(--ink)] border-0'
                    }`}
                  >
                    Get started
                  </Button>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[var(--line)] px-6 py-10">
        <div className="max-w-6xl mx-auto flex items-center justify-between flex-wrap gap-4">
          <span className="text-sm font-display">
            Refresh<span className="text-[var(--purple-deep)]">Web</span>
          </span>
          <div className="flex items-center gap-6">
            <a href="/privacy" className="text-[var(--ink-soft)] text-sm hover:text-[var(--ink)] transition-colors">Privacy</a>
            <a href="/terms" className="text-[var(--ink-soft)] text-sm hover:text-[var(--ink)] transition-colors">Terms</a>
            <p className="text-[var(--ink-soft)] text-sm">© {new Date().getFullYear()} RefreshWeb. All rights reserved.</p>
          </div>
        </div>
      </footer>

      <ContactModal
        open={modalOpen}
        initialPlan={selectedPlan}
        onClose={() => setModalOpen(false)}
      />
    </div>
  )
}
