'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import PublicLayout from '@/components/layout/PublicLayout';
import { PageHeader } from '@/components/ui';
import { AI_WEBSITE_PACKAGES } from '@/data/constants';
import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/contexts/AuthContext';
import { createServiceCartItem } from '@/lib/cart/helpers';

function CheckIcon() {
  return (
    <svg className="w-4 h-4 text-white shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
    </svg>
  );
}

export default function AiWebsiteBuilderPage() {
  const { addItem } = useCart();
  const { user } = useAuth();
  const router = useRouter();

  async function handlePaidPlan(pkg) {
    await addItem(createServiceCartItem(pkg, 'ai-website'));
    router.push('/cart');
  }

  function handleFree() {
    if (user) {
      router.push('/dashboard/ai-website/new');
    } else {
      router.push('/register?redirect=/dashboard/ai-website/new');
    }
  }

  return (
    <PublicLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <PageHeader
          title="AI Website Builder"
          description="Launch professional websites with AI-powered design and content generation. Start free, upgrade when you grow."
        />

        {/* Pricing cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto mb-16">
          {AI_WEBSITE_PACKAGES.map((pkg) => (
            <div
              key={pkg.id}
              className={`relative bg-neutral-950 border rounded-2xl p-6 flex flex-col ${
                pkg.popular ? 'border-white shadow-lg shadow-white/5' : 'border-neutral-800'
              }`}
            >
              {pkg.popular && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-white text-black">
                    Most Popular
                  </span>
                </div>
              )}
              {pkg.isFree && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-neutral-700 text-white border border-neutral-600">
                    Free Forever
                  </span>
                </div>
              )}

              <div className="mb-6">
                <h3 className="text-lg font-semibold text-white mb-1">{pkg.name}</h3>
                <div className="flex items-end gap-1">
                  <span className="text-4xl font-bold text-white">
                    {pkg.monthlyPrice === 0 ? 'Free' : `$${pkg.monthlyPrice}`}
                  </span>
                  {pkg.monthlyPrice > 0 && (
                    <span className="text-neutral-400 mb-1">/month</span>
                  )}
                </div>
              </div>

              <ul className="space-y-2.5 flex-1 mb-6">
                {pkg.features.map((f) => (
                  <li key={f} className="flex items-start gap-2.5 text-sm text-neutral-300">
                    <CheckIcon />
                    {f}
                  </li>
                ))}
              </ul>

              {pkg.isFree ? (
                <button
                  onClick={handleFree}
                  className="w-full py-2.5 rounded-xl text-sm font-semibold border border-neutral-700 text-white hover:border-white hover:bg-neutral-900 transition-all"
                >
                  {user ? 'Start Building Free' : 'Get Started Free'}
                </button>
              ) : (
                <button
                  onClick={() => handlePaidPlan(pkg)}
                  className={`w-full py-2.5 rounded-xl text-sm font-semibold transition-all ${
                    pkg.popular
                      ? 'bg-white text-black hover:bg-neutral-200'
                      : 'border border-neutral-700 text-white hover:border-white hover:bg-neutral-900'
                  }`}
                >
                  Get {pkg.name.replace('AI Website ', '')}
                </button>
              )}
            </div>
          ))}
        </div>

        {/* Feature highlights */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          {[
            {
              icon: 'M13 10V3L4 14h7v7l9-11h-7z',
              title: 'AI-Powered Generation',
              desc: 'Describe your vision in plain English and get a complete, professional website in seconds.',
            },
            {
              icon: 'M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z',
              title: 'Multiple Design Styles',
              desc: 'Choose from modern, corporate, creative, elegant, tech, and warm design presets.',
            },
            {
              icon: 'M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4',
              title: 'Export HTML',
              desc: 'Download your generated website as a clean HTML file, ready to deploy anywhere.',
            },
          ].map((f) => (
            <div key={f.title} className="bg-neutral-950 border border-neutral-800 rounded-xl p-6">
              <div className="w-10 h-10 bg-neutral-800 rounded-lg flex items-center justify-center mb-4">
                <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={f.icon} />
                </svg>
              </div>
              <h3 className="text-white font-semibold mb-2">{f.title}</h3>
              <p className="text-sm text-neutral-400">{f.desc}</p>
            </div>
          ))}
        </div>

        {/* How it works */}
        <div className="bg-neutral-950 border border-neutral-800 rounded-xl p-8">
          <h2 className="text-xl font-semibold text-white mb-6">How it works</h2>
          <ol className="grid grid-cols-1 sm:grid-cols-4 gap-6">
            {[
              { step: '01', title: 'Choose a plan', desc: 'Start free or pick a paid plan for more pages and generations.' },
              { step: '02', title: 'Describe your site', desc: 'Tell the AI your business, goals, and design preferences.' },
              { step: '03', title: 'Generate instantly', desc: 'AI creates a full, responsive website with real content.' },
              { step: '04', title: 'Export & deploy', desc: 'Download the HTML or upgrade to host directly with us.' },
            ].map((s) => (
              <li key={s.step} className="flex flex-col gap-2">
                <span className="text-3xl font-bold text-neutral-700">{s.step}</span>
                <h4 className="text-white font-medium">{s.title}</h4>
                <p className="text-sm text-neutral-400">{s.desc}</p>
              </li>
            ))}
          </ol>
        </div>

        {/* CTA */}
        <div className="text-center mt-12">
          <button
            onClick={handleFree}
            className="inline-flex items-center gap-2 px-8 py-3.5 bg-white text-black font-semibold rounded-xl hover:bg-neutral-200 transition-colors text-sm"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            {user ? 'Open Builder' : 'Try it free — no credit card needed'}
          </button>
        </div>
      </div>
    </PublicLayout>
  );
}
