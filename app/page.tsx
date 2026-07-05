'use client'

import { useEffect, useState, type CSSProperties } from 'react'
import { Button } from '@/components/ui/button'
import { ScrollReveal } from '@/components/ScrollReveal'
import { MobileNav } from '@/components/MobileNav'
import { ContactModal } from '@/components/ContactModal'
import { ProcessVisual } from '@/components/ProcessVisual'

const theme: CSSProperties = {
  ['--paper' as string]: '#FCF6EC',
  ['--paper-deep' as string]: '#F1E7D3',
  ['--ink' as string]: '#241C13',
  ['--ink-soft' as string]: '#6B5D4C',
  ['--coral' as string]: '#FF5D3A',
  ['--coral-deep' as string]: '#E2431F',
  ['--coral-wash' as string]: '#FFE3D6',
  ['--gold' as string]: '#F0A93D',
  ['--teal' as string]: '#1F6E63',
  ['--teal-wash' as string]: '#DCEFE9',
  ['--line' as string]: 'rgba(36,28,19,0.12)',
}

function Squiggle({ drawn }: { drawn: boolean }) {
  return (
    <svg viewBox="0 0 220 16" className="absolute left-0 -bottom-2 w-full h-4" preserveAspectRatio="none" aria-hidden>
      <path
        d="M2 11 Q 28 2, 55 9 T 110 8 T 165 9 T 218 6"
        fill="none"
        stroke="var(--coral)"
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

function HeroCard() {
  return (
    <div className="relative">
      <div className="absolute -top-10 -right-8 w-56 h-56 rounded-full bg-[var(--coral-wash)] blur-2xl opacity-70" aria-hidden />
      <div className="absolute -bottom-12 -left-10 w-48 h-48 rounded-full bg-[var(--teal-wash)] blur-2xl opacity-70" aria-hidden />
      <div className="relative rounded-2xl border border-[var(--line)] bg-white shadow-[0_30px_70px_-20px_rgba(36,28,19,0.28)] overflow-hidden rotate-2">
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
              <span className="w-5 h-5 rounded-full bg-[var(--teal)] text-white text-xs flex items-center justify-center shrink-0">✓</span>
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
            radial-gradient(1100px circle at 12% -8%, var(--coral-wash), transparent 55%),
            radial-gradient(900px circle at 105% 8%, var(--teal-wash), transparent 50%)
          `,
        }}
        aria-hidden
      />

      {/* Nav */}
      <header className="sticky top-0 z-40 border-b border-[var(--line)]" style={{ background: 'color-mix(in srgb, var(--paper) 88%, transparent)', backdropFilter: 'blur(10px)' }}>
        <nav className="px-6 py-4 relative">
          <div className="max-w-6xl mx-auto flex items-center justify-between">
            <span className="text-2xl" style={{ fontFamily: 'var(--font-display)' }}>
              Refresh<span className="text-[var(--coral)]">Web</span>
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
              <span className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-sm font-medium mb-6 bg-[var(--coral-wash)] text-[var(--coral-deep)]">
                <span className="w-1.5 h-1.5 rounded-full bg-[var(--coral)]" />
                Website help for real small businesses
              </span>
            </ScrollReveal>
            <ScrollReveal delay={100}>
              <h1 className="text-5xl md:text-6xl leading-[1.05] mb-6" style={{ fontFamily: 'var(--font-display)' }}>
                Your website,{' '}
                <span className="relative inline-block">
                  always up to date
                  <Squiggle drawn={squiggleDrawn} />
                </span>
                .
              </h1>
            </ScrollReveal>
            <ScrollReveal delay={200}>
              <p className="text-lg mb-10 max-w-md text-[var(--ink-soft)] leading-relaxed">
                Text us what you need changed — new hours, a fresh photo, updated pricing.
                We check it over, and it&rsquo;s live in about 30 seconds. No tickets, no logins, no fuss.
              </p>
            </ScrollReveal>
            <ScrollReveal delay={300}>
              <div className="flex items-center gap-6 flex-wrap">
                <Button
                  size="lg"
                  className="rounded-full px-8 h-12 text-base bg-[var(--coral)] hover:bg-[var(--coral-deep)] text-white"
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
              <div className="flex gap-10 mt-14 pt-8 border-t border-[var(--line)] flex-wrap">
                {[
                  ['~30 sec', 'typical time to go live'],
                  ['Plain English', 'no forms, no logins'],
                  ['You approve', 'every single change'],
                ].map(([stat, label]) => (
                  <div key={stat}>
                    <p className="text-xl font-semibold text-[var(--ink)]" style={{ fontFamily: 'var(--font-display)' }}>{stat}</p>
                    <p className="text-sm text-[var(--ink-soft)]">{label}</p>
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

      {/* How it works — scroll-driven process visual */}
      <section id="how-it-works" className="px-6 py-24 md:py-32 border-t border-[var(--line)]">
        <div className="max-w-6xl mx-auto">
          <ScrollReveal>
            <div className="max-w-xl mb-16 md:mb-20">
              <p className="text-xs font-bold tracking-[0.18em] uppercase mb-3 text-[var(--coral-deep)]">How it works</p>
              <h2 className="text-3xl md:text-4xl mb-4" style={{ fontFamily: 'var(--font-display)' }}>
                Simple as sending a text.
              </h2>
              <p className="text-[var(--ink-soft)] text-lg">Scroll along — this is genuinely the whole process.</p>
            </div>
          </ScrollReveal>
          <ProcessVisual />
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="px-6 py-24 md:py-32 border-t border-[var(--line)]">
        <div className="max-w-5xl mx-auto">
          <ScrollReveal>
            <div className="text-center mb-16">
              <p className="text-xs font-bold tracking-[0.18em] uppercase mb-3 text-[var(--coral-deep)]">Pricing</p>
              <h2 className="text-3xl md:text-4xl mb-4" style={{ fontFamily: 'var(--font-display)' }}>Transparent, always.</h2>
              <p className="text-[var(--ink-soft)] text-lg">One-time design fee, then a simple monthly plan for ongoing updates.</p>
            </div>
          </ScrollReveal>

          <ScrollReveal delay={100}>
            <div className="mb-8 p-8 rounded-3xl border border-[var(--line)] bg-white text-center">
              <p className="text-[var(--ink-soft)] text-sm uppercase tracking-widest mb-2">One-time</p>
              <div className="text-4xl mb-2" style={{ fontFamily: 'var(--font-display)' }}>$2,500</div>
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
                      ? 'border-[var(--coral)] bg-[var(--coral-wash)]/50'
                      : 'border-[var(--line)] bg-white'
                  }`}
                >
                  {tier.highlight && (
                    <span className="inline-flex w-fit mb-4 px-3 py-1 rounded-full text-xs font-semibold bg-[var(--coral)] text-white">
                      Most popular
                    </span>
                  )}
                  <div className="mb-6">
                    <p className="text-[var(--ink-soft)] text-sm mb-1">{tier.name}</p>
                    <div className="flex items-end gap-1">
                      <span className="text-4xl" style={{ fontFamily: 'var(--font-display)' }}>{tier.price}</span>
                      <span className="text-[var(--ink-soft)] mb-1">/month</span>
                    </div>
                  </div>
                  <ul className="space-y-3 mb-8 flex-1">
                    {tier.features.map((f) => (
                      <li key={f} className="flex items-center gap-3 text-sm text-[var(--ink)]">
                        <span className="text-[var(--teal)] text-lg leading-none">✓</span>
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                  <Button
                    onClick={() => openModal(tier.plan)}
                    className={`w-full rounded-full h-11 ${
                      tier.highlight
                        ? 'bg-[var(--coral)] hover:bg-[var(--coral-deep)] text-white'
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
          <span className="text-sm" style={{ fontFamily: 'var(--font-display)' }}>
            Refresh<span className="text-[var(--coral)]">Web</span>
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
