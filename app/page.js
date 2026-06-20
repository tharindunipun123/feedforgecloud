'use client';

import Link from 'next/link';
import Image from 'next/image';
import PublicLayout from '@/components/layout/PublicLayout';
import { Button } from '@/components/ui';
import { VpsPricingCard } from '@/components/home/PricingCard';
import { PricingCard } from '@/components/home/PricingCard';
import {
  EC2_PACKAGES,
  N8N_PACKAGES,
  AI_WEBSITE_PACKAGES,
  AI_CHATBOT_PACKAGES,
  SERVER_LOCATIONS,
  FAQ_ITEMS,
  BRAND_NAME,
} from '@/data/constants';
import { CDN_PLANS } from '@/data/cdn';
import CdnPlanCard from '@/components/cdn/CdnPlanCard';
import CdnNetworkMap from '@/components/home/CdnNetworkMap';
import { useCart } from '@/contexts/CartContext';
import { createVpsCartItem, createServiceCartItem, createCdnCartItem } from '@/lib/cart/helpers';
import { useRouter } from 'next/navigation';

export default function HomePage() {
  const { addItem } = useCart();
  const router = useRouter();

  const handleAddVps = async (pkg) => {
    await addItem(createVpsCartItem(pkg));
    router.push('/cart');
  };

  return (
    <PublicLayout>
      {/* Hero */}
      <section className="relative overflow-hidden">
        {/* Subtle radial glow behind the image */}
        <div className="absolute right-0 top-0 w-[900px] h-[900px] rounded-full bg-blue-900/10 blur-3xl pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-20">
          <div className="grid lg:grid-cols-[1fr_1.15fr] gap-8 lg:gap-10 items-center">
            {/* Left — copy */}
            <div>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white leading-tight mb-6">
                Deploy powerful<br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-400">EC2 hosting</span><br />
                in minutes
              </h1>

              <p className="text-lg text-neutral-400 mb-8 leading-relaxed max-w-lg">
                {BRAND_NAME} delivers enterprise-grade EC2 instances, automation hosting, and AI-powered services with transparent pricing and 24/7 support.
              </p>

              {/* Feature pills */}
              <div className="flex flex-wrap gap-2 mb-8">
                {['Performance Optimized', 'Auto Scaling', 'Security Enhanced', 'DDoS Protected', 'NVMe SSD'].map((f) => (
                  <span key={f} className="px-3 py-1 text-xs rounded-full border border-neutral-700 text-neutral-300 bg-neutral-900">
                    {f}
                  </span>
                ))}
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                <Link href="/register">
                  <Button size="lg">Start now — it&apos;s free</Button>
                </Link>
                <Link href="/ec2-pricing">
                  <Button variant="secondary" size="lg">View EC2 plans</Button>
                </Link>
              </div>

              {/* Trust stats */}
              <div className="flex gap-8 mt-10 pt-8 border-t border-neutral-800">
                {[
                  { value: '99.9%', label: 'Uptime SLA' },
                  { value: '<15min', label: 'Provisioning' },
                  { value: '6+', label: 'Global Locations' },
                ].map((s) => (
                  <div key={s.label}>
                    <p className="text-xl font-bold text-white">{s.value}</p>
                    <p className="text-xs text-neutral-500 mt-0.5">{s.label}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Right — hero image */}
            <div className="relative flex items-center justify-center lg:justify-end">
              <div className="relative w-full max-w-[640px] lg:max-w-none lg:w-[115%] lg:-mr-8 xl:-mr-12">
                {/* Glow ring */}
                <div className="absolute inset-4 lg:inset-0 rounded-full bg-blue-600/15 blur-3xl pointer-events-none" />
                <Image
                  src="/ec2-hero.png"
                  alt="EC2 Cloud Instance — Performance Optimized, Auto Scaling, Security Enhanced"
                  width={800}
                  height={800}
                  priority
                  className="w-full h-auto object-contain relative z-10 drop-shadow-2xl scale-105 lg:scale-110"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="border-t border-neutral-800 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-white text-center mb-4">Why choose {BRAND_NAME}</h2>
          <p className="text-neutral-400 text-center mb-12 max-w-2xl mx-auto">
            Built for developers, agencies, and businesses who need reliable infrastructure without complexity.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { title: 'NVMe Storage', desc: 'Lightning-fast NVMe SSD storage on all EC2 plans.' },
              { title: 'Global Locations', desc: 'Deploy in US, EU, and Asia data centers.' },
              { title: 'DDoS Protection', desc: 'Enterprise-grade protection included at no extra cost.' },
              { title: '24/7 Support', desc: 'Expert support via tickets and live chat.' },
            ].map((f) => (
              <div key={f.title} className="bg-neutral-950 border border-neutral-800 rounded-xl p-6">
                <h3 className="text-white font-semibold mb-2">{f.title}</h3>
                <p className="text-neutral-400 text-sm">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* EC2 Pricing Preview */}
      <section className="border-t border-neutral-800 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-12">
            <div>
              <h2 className="text-3xl font-bold text-white mb-2">EC2 Hosting Plans</h2>
              <p className="text-neutral-400">Scalable EC2 instances for every workload.</p>
            </div>
            <Link href="/ec2-pricing">
              <Button variant="secondary">View all plans</Button>
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {EC2_PACKAGES.map((pkg) => (
              <VpsPricingCard key={pkg.id} pkg={pkg} onAddToCart={handleAddVps} />
            ))}
          </div>
        </div>
      </section>

      {/* Pay-as-you-go */}
      <section className="border-t border-neutral-800 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold text-white mb-4">Pay-as-you-go EC2</h2>
              <p className="text-neutral-400 mb-6">
                Build your own configuration with hourly billing. Scale resources up or down and pay only for what you use.
              </p>
              <Link href="/pay-as-you-go">
                <Button>Open calculator</Button>
              </Link>
            </div>
            <div className="bg-neutral-950 border border-neutral-800 rounded-xl p-8">
              <div className="space-y-4 text-sm">
                <div className="flex justify-between"><span className="text-neutral-400">Starting from</span><span className="text-white font-semibold">$0.01/hr</span></div>
                <div className="flex justify-between"><span className="text-neutral-400">vCPU</span><span className="text-white">1–16 cores</span></div>
                <div className="flex justify-between"><span className="text-neutral-400">RAM</span><span className="text-white">2–32 GB</span></div>
                <div className="flex justify-between"><span className="text-neutral-400">Storage</span><span className="text-white">40–640 GB NVMe</span></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* n8n */}
      <section className="border-t border-neutral-800 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-white mb-4">n8n Automation Hosting</h2>
          <p className="text-neutral-400 mb-12 max-w-2xl">Managed n8n instances with SSL, backups, and dedicated resources.</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {N8N_PACKAGES.map((pkg) => (
              <PricingCard
                key={pkg.id}
                pkg={pkg}
                onAddToCart={async (p) => { await addItem(createServiceCartItem(p, 'n8n')); router.push('/cart'); }}
                detailHref="/n8n-hosting"
              />
            ))}
          </div>
        </div>
      </section>

      {/* AI Website Builder */}
      <section className="border-t border-neutral-800 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-white mb-4">AI Website Builder</h2>
          <p className="text-neutral-400 mb-12 max-w-2xl">Launch professional websites with AI-powered design and content generation.</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl">
            {AI_WEBSITE_PACKAGES.map((pkg) => (
              <PricingCard
                key={pkg.id}
                pkg={pkg}
                onAddToCart={async (p) => { await addItem(createServiceCartItem(p, 'ai-website')); router.push('/cart'); }}
                detailHref="/ai-website-builder"
              />
            ))}
          </div>
        </div>
      </section>

      {/* AI Chatbot */}
      <section className="border-t border-neutral-800 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-white mb-4">AI Chatbot Service</h2>
          <p className="text-neutral-400 mb-12 max-w-2xl">Deploy intelligent chatbots for your website with custom branding and analytics.</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl">
            {AI_CHATBOT_PACKAGES.map((pkg) => (
              <PricingCard
                key={pkg.id}
                pkg={pkg}
                onAddToCart={async (p) => { await addItem(createServiceCartItem(p, 'ai-chatbot')); router.push('/cart'); }}
                detailHref="/ai-chatbot"
              />
            ))}
          </div>
        </div>
      </section>

      {/* CDN Hosting */}
      <section className="border-t border-neutral-800 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-12">
            <div>
              <h2 className="text-3xl font-bold text-white mb-2">CDN Hosting</h2>
              <p className="text-neutral-400 max-w-2xl">
                Credit-based media delivery for images, videos, and files with dashboard uploads and REST API access.
              </p>
            </div>
            <Link href="/cdn-pricing">
              <Button variant="secondary">View all plans</Button>
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {CDN_PLANS.map((plan) => (
              <CdnPlanCard
                key={plan.id}
                plan={plan}
                onAddToCart={async (p) => { await addItem(createCdnCartItem(p)); router.push('/cart'); }}
              />
            ))}
          </div>
        </div>
      </section>

      {/* CDN Global Network */}
      <section className="border-t border-neutral-800 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center mb-10">
            <div>
              <h2 className="text-3xl font-bold text-white mb-4">Worldwide CDN network</h2>
              <p className="text-neutral-400 mb-6">
                Deliver media from edge locations across North America, Europe, Asia-Pacific, and beyond. Low latency, high availability, black-and-white clarity on where your content is served.
              </p>
              <Link href="/cdn-hosting">
                <Button variant="secondary">Explore CDN hosting</Button>
              </Link>
            </div>
            <CdnNetworkMap />
          </div>
        </div>
      </section>

      {/* Security */}
      <section className="border-t border-neutral-800 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">Security you can trust</h2>
          <p className="text-neutral-400 mb-12 max-w-2xl mx-auto">
            DDoS protection, encrypted connections, automated backups, and compliance-ready infrastructure.
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {['DDoS Protection', 'SSL Certificates', 'Daily Backups', 'Firewall Rules'].map((s) => (
              <div key={s} className="bg-neutral-950 border border-neutral-800 rounded-xl p-6">
                <p className="text-white font-medium">{s}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Locations */}
      <section className="border-t border-neutral-800 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-white mb-4 text-center">Server locations</h2>
          <p className="text-neutral-400 mb-12 text-center">Deploy closer to your users for lower latency.</p>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {SERVER_LOCATIONS.map((loc) => (
              <div key={loc.id} className="bg-neutral-950 border border-neutral-800 rounded-xl p-4 text-center">
                <p className="text-white font-medium text-sm">{loc.name}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Support */}
      <section className="border-t border-neutral-800 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-neutral-950 border border-neutral-800 rounded-2xl p-8 lg:p-12 text-center">
            <h2 className="text-3xl font-bold text-white mb-4">Customer support</h2>
            <p className="text-neutral-400 mb-8 max-w-xl mx-auto">
              Our team is available 24/7 via support tickets and live chat to help you with any issue.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/knowledge-base"><Button variant="secondary">Knowledge Base</Button></Link>
              <Link href="/tutorials"><Button variant="secondary">Tutorials</Button></Link>
              <Link href="/contact"><Button>Contact us</Button></Link>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="border-t border-neutral-800 py-20">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-white mb-12 text-center">Frequently asked questions</h2>
          <div className="space-y-4">
            {FAQ_ITEMS.map((item) => (
              <details key={item.question} className="bg-neutral-950 border border-neutral-800 rounded-xl group">
                <summary className="px-6 py-4 cursor-pointer text-white font-medium list-none flex justify-between items-center">
                  {item.question}
                  <svg className="w-5 h-5 text-neutral-400 group-open:rotate-180 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </summary>
                <div className="px-6 pb-4 text-neutral-400 text-sm">{item.answer}</div>
              </details>
            ))}
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}
