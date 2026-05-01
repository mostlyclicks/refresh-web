import Link from 'next/link'

export const metadata = {
  title: 'Privacy Policy — RefreshWeb',
}

export default function PrivacyPage() {
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
        <h1 className="text-4xl font-bold mb-2">Privacy Policy</h1>
        <p className="text-slate-400 text-sm mb-12">Effective date: April 30, 2026</p>

        <div className="space-y-10 text-slate-300 leading-relaxed">

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">1. Who We Are</h2>
            <p>
              RefreshWeb ("we," "us," or "our") is a web design and maintenance service operated by Carlos Mendez. We provide ongoing website update services to small businesses through a subscription model. You can reach us at{' '}
              <a href="mailto:carlos@mostlyclicks.com" className="text-[#3B82F6] hover:underline">
                carlos@mostlyclicks.com
              </a>.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">2. Information We Collect</h2>
            <p className="mb-4">We collect information you provide directly to us, including:</p>
            <ul className="space-y-2 list-disc list-inside text-slate-400">
              <li><span className="text-slate-300">Contact information</span> — name, email address, and business name when you fill out our Get Started form</li>
              <li><span className="text-slate-300">Account information</span> — name and email address when you are onboarded as a client</li>
              <li><span className="text-slate-300">Website content</span> — text, images, and files you upload when submitting update requests</li>
              <li><span className="text-slate-300">Payment information</span> — billing is processed by Stripe; we never store your card details</li>
              <li><span className="text-slate-300">Usage data</span> — request history and update activity within your client portal</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">3. How We Use Your Information</h2>
            <p className="mb-4">We use the information we collect to:</p>
            <ul className="space-y-2 list-disc list-inside text-slate-400">
              <li>Provide, operate, and maintain our web maintenance services</li>
              <li>Process your update requests and communicate changes to your website</li>
              <li>Process subscription payments and manage billing</li>
              <li>Respond to inquiries submitted through our contact form</li>
              <li>Send service-related notifications (e.g., when an update goes live)</li>
              <li>Improve our services based on how they are used</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">4. Third-Party Services</h2>
            <p className="mb-4">We use the following third-party services to operate RefreshWeb. Each has its own privacy policy:</p>
            <ul className="space-y-2 list-disc list-inside text-slate-400">
              <li><span className="text-slate-300">Supabase</span> — database and file storage</li>
              <li><span className="text-slate-300">Stripe</span> — payment processing and subscription management</li>
              <li><span className="text-slate-300">Vercel</span> — hosting for this platform and client websites</li>
              <li><span className="text-slate-300">GitHub</span> — version control and code deployment for client websites</li>
              <li><span className="text-slate-300">Anthropic (Claude AI)</span> — AI-assisted code suggestions for website updates</li>
            </ul>
            <p className="mt-4">
              Your website content and update requests may be processed by Anthropic's Claude AI to generate suggested code changes. This content is used solely to produce your requested website updates and is subject to{' '}
              <a href="https://www.anthropic.com/privacy" target="_blank" rel="noopener noreferrer" className="text-[#3B82F6] hover:underline">
                Anthropic's privacy policy
              </a>.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">5. Data Retention</h2>
            <p>
              We retain your information for as long as your account is active or as needed to provide services. If you cancel your subscription, we will retain your data for 90 days before deletion, giving you time to export anything you need. You may request earlier deletion by contacting us.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">6. Data Security</h2>
            <p>
              We take reasonable measures to protect your information, including encrypted data storage via Supabase and secure payment processing via Stripe. No method of transmission over the internet is 100% secure, and we cannot guarantee absolute security.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">7. Your Rights</h2>
            <p className="mb-4">You have the right to:</p>
            <ul className="space-y-2 list-disc list-inside text-slate-400">
              <li>Access the personal information we hold about you</li>
              <li>Request correction of inaccurate information</li>
              <li>Request deletion of your data</li>
              <li>Opt out of non-essential communications</li>
            </ul>
            <p className="mt-4">
              To exercise any of these rights, email us at{' '}
              <a href="mailto:carlos@mostlyclicks.com" className="text-[#3B82F6] hover:underline">
                carlos@mostlyclicks.com
              </a>.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">8. Cookies</h2>
            <p>
              We use a single session cookie to keep you logged in to the client portal. This cookie is strictly necessary for the service to function and does not track you across other websites.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">9. Changes to This Policy</h2>
            <p>
              We may update this policy from time to time. When we do, we'll update the effective date at the top of this page. Continued use of our services after changes constitutes acceptance of the updated policy.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">10. Contact</h2>
            <p>
              If you have any questions about this Privacy Policy, please contact us at{' '}
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
