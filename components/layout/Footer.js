import Link from 'next/link';
import Image from 'next/image';
import { BRAND_NAME, NAV_SERVICES, LEGAL_PAGES } from '@/data/constants';
import { NAV_SUPPORT, NAV_TOOLS } from '@/data/knowledge-base';

export default function Footer() {
  return (
    <footer className="bg-black border-t border-neutral-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-10">
          <div className="col-span-2 md:col-span-3 lg:col-span-2">
            <div className="flex items-center gap-2.5 mb-4">
              <Image src="/logo.png" alt={BRAND_NAME} width={36} height={36} className="rounded-lg" />
              <span className="font-bold text-white text-lg tracking-tight">{BRAND_NAME}</span>
            </div>
            <p className="text-neutral-400 text-sm leading-relaxed max-w-sm">
              Enterprise-grade EC2 hosting, CDN media delivery, automation, and AI services. Deploy with confidence worldwide.
            </p>
          </div>

          <div>
            <h4 className="text-white font-semibold mb-4 text-sm">Services</h4>
            <ul className="space-y-2">
              {NAV_SERVICES.slice(0, 6).map((s) => (
                <li key={s.href}>
                  <Link href={s.href} className="text-neutral-400 hover:text-white text-sm transition-colors">{s.label}</Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-white font-semibold mb-4 text-sm">Support</h4>
            <ul className="space-y-2">
              {NAV_SUPPORT.map((s) => (
                <li key={s.href}>
                  <Link href={s.href} className="text-neutral-400 hover:text-white text-sm transition-colors">{s.label}</Link>
                </li>
              ))}
              <li>
                <Link href="/dashboard/support" className="text-neutral-400 hover:text-white text-sm transition-colors">Support Tickets</Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-semibold mb-4 text-sm">Tools</h4>
            <ul className="space-y-2">
              {NAV_TOOLS.map((t) => (
                <li key={t.href}>
                  <Link href={t.href} className="text-neutral-400 hover:text-white text-sm transition-colors">{t.label}</Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-white font-semibold mb-4 text-sm">Legal</h4>
            <ul className="space-y-2">
              {Object.values(LEGAL_PAGES).map((page) => (
                <li key={page.slug}>
                  <Link href={`/${page.slug}`} className="text-neutral-400 hover:text-white text-sm transition-colors">
                    {page.title}
                  </Link>
                </li>
              ))}
              <li>
                <Link href="/knowledge-base?category=legal-policies" className="text-neutral-400 hover:text-white text-sm transition-colors">
                  Legal Knowledge Base
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-neutral-800 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-neutral-500 text-sm">© {new Date().getFullYear()} {BRAND_NAME}. All rights reserved.</p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Link href="/privacy-policy" className="text-neutral-500 hover:text-white text-sm">Privacy</Link>
            <Link href="/refund-policy" className="text-neutral-500 hover:text-white text-sm">Refunds</Link>
            <Link href="/terms" className="text-neutral-500 hover:text-white text-sm">Terms</Link>
            <Link href="/knowledge-base" className="text-neutral-500 hover:text-white text-sm">Knowledge Base</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
