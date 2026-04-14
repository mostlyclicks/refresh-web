import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ScrollReveal } from '@/components/ScrollReveal'
import { MobileNav } from '@/components/MobileNav'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-[#0F172A] text-white">
      {/* Nav */}
      <nav className="border-b border-white/10 px-6 py-4 relative">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <span className="text-xl font-bold tracking-tight">
            Refresh<span className="text-[#3B82F6]">Web</span>
          </span>
          <MobileNav />
        </div>
      </nav>

      {/* Hero */}
      <section className="px-6 py-28 text-center">
        <div className="max-w-3xl mx-auto">
          <ScrollReveal delay={0}>
            <Badge className="mb-6 bg-blue-500/10 text-blue-400 border-blue-500/20 hover:bg-blue-500/10">
              Website maintenance, handled.
            </Badge>
          </ScrollReveal>
          <ScrollReveal delay={100}>
            <h1 className="text-5xl md:text-6xl font-bold leading-tight mb-6">
              Your website,{' '}
              <span className="text-[#3B82F6]">always up to date.</span>
            </h1>
          </ScrollReveal>
          <ScrollReveal delay={200}>
            <p className="text-lg text-slate-400 mb-10 max-w-xl mx-auto">
              Request a change in plain English. We handle the code, the deploy, and the details — so you can focus on your business.
            </p>
          </ScrollReveal>
          <ScrollReveal delay={300}>
            <div className="flex items-center justify-center gap-4 flex-wrap">
              <Button size="lg" className="bg-[#3B82F6] hover:bg-blue-500 text-white px-8">
                Get Started
              </Button>
              <Button size="lg" variant="outline" className="border-white/20 text-white hover:bg-white/5 px-8">
                See how it works
              </Button>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="px-6 py-24 border-t border-white/10">
        <div className="max-w-5xl mx-auto">
          <ScrollReveal>
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold mb-4">Simple as sending a text</h2>
              <p className="text-slate-400">Three steps from request to live update.</p>
            </div>
          </ScrollReveal>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                step: '01',
                title: 'Request',
                desc: 'Tell us what you need in plain English — "change the phone number", "update the hero headline", "make the button red."',
                delay: 0,
              },
              {
                step: '02',
                title: 'Review',
                desc: "We review every change before it goes live. You'll see exactly what's being modified and can approve or reject.",
                delay: 120,
              },
              {
                step: '03',
                title: 'Live',
                desc: 'Approved changes deploy automatically. You get a confirmation with a direct link to see the update live.',
                delay: 240,
              },
            ].map((item) => (
              <ScrollReveal key={item.step} delay={item.delay}>
                <div className="relative p-8 rounded-2xl border border-white/10 bg-white/5 h-full">
                  <div className="text-5xl font-black text-[#3B82F6]/20 mb-4">{item.step}</div>
                  <h3 className="text-xl font-semibold mb-3">{item.title}</h3>
                  <p className="text-slate-400 leading-relaxed">{item.desc}</p>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="px-6 py-24 border-t border-white/10">
        <div className="max-w-5xl mx-auto">
          <ScrollReveal>
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold mb-4">Transparent pricing</h2>
              <p className="text-slate-400">One-time design fee, then a simple monthly plan for ongoing updates.</p>
            </div>
          </ScrollReveal>

          <ScrollReveal delay={100}>
            <div className="mb-8 p-8 rounded-2xl border border-white/10 bg-white/5 text-center">
              <p className="text-slate-400 text-sm uppercase tracking-widest mb-2">One-time</p>
              <div className="text-4xl font-bold mb-2">$2,500</div>
              <p className="text-slate-400">Custom website design &amp; build — HTML, CSS, JS, deployed to Vercel</p>
            </div>
          </ScrollReveal>

          <div className="grid md:grid-cols-2 gap-6">
            {[
              {
                name: 'Basic',
                price: '$99',
                features: ['Up to 5 update requests/month', 'Changes reviewed & approved', 'Auto-deploy on approval', 'Change history log'],
                highlight: false,
                delay: 0,
              },
              {
                name: 'Professional',
                price: '$199',
                features: ['Unlimited update requests', 'Priority review turnaround', 'Auto-deploy on approval', 'Change history log', 'Rollback on request'],
                highlight: true,
                delay: 150,
              },
            ].map((tier) => (
              <ScrollReveal key={tier.name} delay={tier.delay}>
                <div
                  className={`p-8 rounded-2xl border h-full flex flex-col ${
                    tier.highlight
                      ? 'border-[#3B82F6] bg-[#3B82F6]/10'
                      : 'border-white/10 bg-white/5'
                  }`}
                >
                  {tier.highlight && (
                    <Badge className="mb-4 bg-[#3B82F6] text-white border-0">Most popular</Badge>
                  )}
                  <div className="mb-6">
                    <p className="text-slate-400 text-sm mb-1">{tier.name}</p>
                    <div className="flex items-end gap-1">
                      <span className="text-4xl font-bold">{tier.price}</span>
                      <span className="text-slate-400 mb-1">/month</span>
                    </div>
                  </div>
                  <ul className="space-y-3 mb-8 flex-1">
                    {tier.features.map((f) => (
                      <li key={f} className="flex items-center gap-3 text-sm text-slate-300">
                        <span className="text-[#3B82F6] text-lg leading-none">✓</span>
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                  <Button
                    className={`w-full ${
                      tier.highlight
                        ? 'bg-[#3B82F6] hover:bg-blue-500 text-white'
                        : 'bg-white/10 hover:bg-white/20 text-white border-0'
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
      <footer className="border-t border-white/10 px-6 py-10">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <span className="text-sm font-bold">
            Refresh<span className="text-[#3B82F6]">Web</span>
          </span>
          <p className="text-slate-500 text-sm">© 2025 RefreshWeb. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}
