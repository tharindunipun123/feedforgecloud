'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

const PROMOS = {
  'overview': {
    icon: '🚀',
    title: 'Deploy your first EC2 instance',
    desc: 'Get started with Starter EC2 at $19/mo — NVMe SSD, full root access, DDoS protection, global locations.',
    cta: 'View EC2 Plans',
    href: '/ec2-pricing',
    gradient: 'from-blue-950 to-neutral-950',
    border: 'border-blue-800/40',
    tag: 'New User Offer',
  },
  'ec2': {
    icon: '⚡',
    title: 'Upgrade to Business EC2 — double your power',
    desc: '2 vCPU, 4 GB RAM, daily backups & priority support. Only $35/mo. Upgrade in seconds, no downtime.',
    cta: 'Upgrade Now',
    href: '/ec2-pricing',
    gradient: 'from-indigo-950 to-neutral-950',
    border: 'border-indigo-800/40',
    tag: 'Performance Boost',
  },
  'ai-website': {
    icon: '✨',
    title: 'Unlock unlimited AI generations with Pro',
    desc: '20 pages, unlimited AI generations, SEO optimization & custom domain. All for $24.99/mo.',
    cta: 'Upgrade to Pro',
    href: '/ai-website-builder',
    gradient: 'from-purple-950 to-neutral-950',
    border: 'border-purple-800/40',
    tag: 'Creator Offer',
  },
  'cdn': {
    icon: '🌍',
    title: 'Scale your CDN globally with Pro',
    desc: '50 GB storage, 500 GB bandwidth, worldwide edge delivery. Start at $49.99/mo.',
    cta: 'View CDN Plans',
    href: '/cdn-pricing',
    gradient: 'from-emerald-950 to-neutral-950',
    border: 'border-emerald-800/40',
    tag: 'Global Delivery',
  },
  'n8n': {
    icon: '🤖',
    title: 'Automate everything with n8n Pro',
    desc: '50 active workflows, 25,000 executions/month, custom domain. Only $29.99/mo.',
    cta: 'Explore n8n Plans',
    href: '/n8n-hosting',
    gradient: 'from-orange-950 to-neutral-950',
    border: 'border-orange-800/40',
    tag: 'Automation',
  },
  'billing': {
    icon: '💳',
    title: 'Save 17% with annual billing',
    desc: 'Switch to annual billing and get 2 months free on any plan. Lock in today\'s price.',
    cta: 'View Annual Plans',
    href: '/ec2-pricing',
    gradient: 'from-yellow-950 to-neutral-950',
    border: 'border-yellow-800/40',
    tag: 'Limited Offer',
  },
  'support': {
    icon: '💬',
    title: 'Get priority support on Business & Pro plans',
    desc: 'Upgrade your plan for dedicated support, faster response times, and a dedicated account manager.',
    cta: 'Compare Plans',
    href: '/ec2-pricing',
    gradient: 'from-rose-950 to-neutral-950',
    border: 'border-rose-800/40',
    tag: 'Priority Support',
  },
};

const STORAGE_KEY_PREFIX = 'qsc_promo_dismissed_v2_';

export default function PromoBanner({ section, forceShow = false }) {
  const [visible, setVisible] = useState(false);
  const promo = PROMOS[section];

  useEffect(() => {
    if (!promo) return;
    if (forceShow) { setVisible(true); return; }
    try {
      const dismissed = localStorage.getItem(`${STORAGE_KEY_PREFIX}${section}`);
      if (!dismissed) setVisible(true);
    } catch {
      setVisible(true);
    }
  }, [promo, section, forceShow]);

  function dismiss() {
    setVisible(false);
    try {
      localStorage.setItem(`${STORAGE_KEY_PREFIX}${section}`, '1');
    } catch { /* ignore */ }
  }

  if (!visible || !promo) return null;

  return (
    <div className={`relative mb-6 rounded-xl border ${promo.border} bg-gradient-to-r ${promo.gradient} p-4 sm:p-5 overflow-hidden`}>
      {/* Background decoration */}
      <div className="absolute inset-0 opacity-5 pointer-events-none select-none flex items-center justify-end pr-8">
        <span className="text-[120px]">{promo.icon}</span>
      </div>

      <div className="relative flex items-start justify-between gap-4">
        <div className="flex items-start gap-3 min-w-0">
          <span className="text-2xl shrink-0 mt-0.5">{promo.icon}</span>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-white/10 text-white border border-white/10">
                {promo.tag}
              </span>
            </div>
            <h3 className="text-white font-semibold text-sm sm:text-base leading-tight mb-1">{promo.title}</h3>
            <p className="text-neutral-400 text-xs sm:text-sm leading-relaxed">{promo.desc}</p>
            <div className="mt-3">
              <Link
                href={promo.href}
                className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-white text-black text-xs sm:text-sm font-semibold rounded-lg hover:bg-neutral-200 transition-colors"
              >
                {promo.cta}
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            </div>
          </div>
        </div>

        <button
          onClick={dismiss}
          className="shrink-0 p-1.5 rounded-lg text-neutral-500 hover:text-white hover:bg-white/10 transition-colors"
          aria-label="Dismiss"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
}
