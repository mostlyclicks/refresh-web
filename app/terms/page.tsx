import Link from 'next/link'

export const metadata = {
  title: 'Terms of Service — RefreshWeb',
}

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-[#0F172A] text-white">
      {/* Nav */}
      <nav className="border-b border-white/10 px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <Link href="/" className="text-xl font-bold tracking-tight">
            Refresh<span className="text-[#3B82F6]">Web</span>
          </Link>
          <Link href="/" className="text-sm text-slate-400 hover:text-white transition-colors">
            ← Back to home
          </Link>
        </div>
      </nav>

      <div className="max-w-3xl mx-auto px-6 py-16">
        <h1 className="text-4xl font-bold mb-2">Terms of Service</h1>
        <p className="text-slate-400 text-sm mb-12">Effective date: April 30, 2026</p>

        <div className="space-y-10 text-slate-300 leading-relaxed">

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">1. Overview</h2>
            <p>
              These Terms of Service ("Terms") govern your use of RefreshWeb ("we," "us," or "our"), a web design and maintenance service operated by Carlos Mendez. By using our services or accessing your client portal, you agree to these Terms. If you have questions, contact us at{' '}
              <a href="mailto:carlos@mostlyclicks.com" className="text-[#3B82F6] hover:underline">
                carlos@mostlyclicks.com
              </a>.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">2. Services</h2>
            <p className="mb-4">
              RefreshWeb provides ongoing website maintenance and update services for small business websites. Services include:
            </p>
            <ul className="space-y-2 list-disc list-inside text-slate-400">
              <li>Receiving and processing website update requests through your client portal</li>
              <li>AI-assisted code suggestion and human review of all changes</li>
              <li>Deployment of approved changes to your website via GitHub and Vercel</li>
              <li>A change history log accessible through your portal</li>
            </ul>
            <p className="mt-4">
              We do not guarantee specific turnaround times, but aim to review and deploy approved changes within 1–2 business days.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">3. Plans and Pricing</h2>
            <div className="space-y-4">
              <div className="p-4 rounded-xl" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
                <p className="font-semibold text-white mb-1">Website Design — $2,500 (one-time)</p>
                <p className="text-slate-400 text-sm">Custom website design and build using HTML, CSS, and JavaScript, deployed to Vercel. Required before a maintenance subscription can begin.</p>
              </div>
              <div className="p-4 rounded-xl" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
                <p className="font-semibold text-white mb-1">Basic — $49/month</p>
                <p className="text-slate-400 text-sm">Up to 20 update requests per calendar month. Unused requests do not roll over.</p>
              </div>
              <div className="p-4 rounded-xl" style={{ background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.2)' }}>
                <p className="font-semibold text-white mb-1">Professional — $99/month</p>
                <p className="text-slate-400 text-sm">Unlimited update requests per month with priority review turnaround.</p>
              </div>
            </div>
            <p className="mt-4 text-slate-400 text-sm">
              Prices are in USD and subject to change with 30 days' notice to active subscribers.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">4. Billing and Payment</h2>
            <ul className="space-y-3 list-disc list-inside text-slate-400">
              <li>Subscription fees are billed monthly in advance via Stripe</li>
              <li>Your subscription renews automatically on the same day each month</li>
              <li>If a payment fails, we will attempt to retry. Continued failure may result in service suspension</li>
              <li>All sales are final. We do not offer refunds for partial months if you cancel mid-cycle</li>
              <li>The one-time design fee is due before work begins and is non-refundable once work has started</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">5. Cancellation</h2>
            <p>
              You may cancel your subscription at any time from the billing section of your admin portal or by emailing us. Cancellation takes effect at the end of your current billing period — you retain access to the service until then. We do not prorate refunds for mid-cycle cancellations.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">6. Client Responsibilities</h2>
            <p className="mb-4">As a client, you agree to:</p>
            <ul className="space-y-2 list-disc list-inside text-slate-400">
              <li>Provide clear and accurate information when submitting update requests</li>
              <li>Review and approve or reject proposed changes in a timely manner</li>
              <li>Ensure you have the rights to any content (text, images, files) you provide for use on your website</li>
              <li>Not use the service to publish illegal, harmful, or infringing content</li>
              <li>Keep your portal access credentials confidential</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">7. Intellectual Property</h2>
            <p className="mb-3">
              Upon full payment of the one-time design fee, you own the HTML, CSS, and JavaScript files that make up your website. RefreshWeb retains no ownership of your website content or code.
            </p>
            <p>
              You grant RefreshWeb a limited license to access, modify, and deploy your website files solely for the purpose of fulfilling your update requests.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">8. Limitation of Liability</h2>
            <p className="mb-3">
              All changes are reviewed by a human before deployment. However, RefreshWeb is not liable for any unintended consequences of website changes, including but not limited to lost revenue, downtime, or data loss.
            </p>
            <p>
              Our total liability to you for any claim arising from these Terms or our services shall not exceed the total amount you paid us in the 3 months preceding the claim.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">9. Service Availability</h2>
            <p>
              We strive to keep the client portal and update pipeline available at all times, but do not guarantee uninterrupted service. We are not liable for downtime caused by third-party services (Vercel, GitHub, Supabase, Stripe, or Anthropic).
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">10. Termination</h2>
            <p>
              We reserve the right to suspend or terminate your account if you violate these Terms, fail to pay, or use the service in a way that is harmful or unlawful. We will provide notice where possible.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">11. Changes to These Terms</h2>
            <p>
              We may update these Terms from time to time. We'll notify active subscribers of material changes via email. Continued use of the service after changes take effect constitutes acceptance.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">12. Governing Law</h2>
            <p>
              These Terms are governed by the laws of the State of California. Any disputes shall be resolved in the courts of California.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">13. Contact</h2>
            <p>
              For any questions about these Terms, contact us at{' '}
              <a href="mailto:carlos@mostlyclicks.com" className="text-[#3B82F6] hover:underline">
                carlos@mostlyclicks.com
              </a>.
            </p>
          </section>

        </div>
      </div>

      <footer className="border-t border-white/10 px-6 py-10 mt-8">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <span className="text-sm font-bold">
            Refresh<span className="text-[#3B82F6]">Web</span>
          </span>
          <div className="flex items-center gap-6 text-slate-500 text-sm">
            <Link href="/privacy" className="hover:text-white transition-colors">Privacy</Link>
            <Link href="/terms" className="hover:text-white transition-colors">Terms</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
