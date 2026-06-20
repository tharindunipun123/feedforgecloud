'use client';

import Link from 'next/link';
import PublicLayout from '@/components/layout/PublicLayout';
import { PageHeader, Card, Button } from '@/components/ui';
import { HELP_ARTICLES, FAQ_ITEMS } from '@/data/constants';
import { KB_CATEGORIES, KNOWLEDGE_BASE_ARTICLES } from '@/data/knowledge-base';
import { TUTORIALS } from '@/data/tutorials';

export default function HelpPage() {
  const categories = [...new Set(HELP_ARTICLES.map((a) => a.category))];

  return (
    <PublicLayout>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <PageHeader
          title="Help Center"
          description="Find answers, guides, and support resources for every Feed Forge service."
        />

        <div className="grid sm:grid-cols-3 gap-4 mb-12">
          <Link href="/knowledge-base">
            <Card hover className="h-full text-center">
              <h2 className="text-lg font-semibold text-white mb-2">Knowledge Base</h2>
              <p className="text-neutral-400 text-sm mb-3">{KNOWLEDGE_BASE_ARTICLES.length} articles across {KB_CATEGORIES.length} categories</p>
              <span className="text-sm text-white">Browse articles →</span>
            </Card>
          </Link>
          <Link href="/tutorials">
            <Card hover className="h-full text-center">
              <h2 className="text-lg font-semibold text-white mb-2">Tutorials</h2>
              <p className="text-neutral-400 text-sm mb-3">{TUTORIALS.length} guides with multi-language code examples</p>
              <span className="text-sm text-white">View tutorials →</span>
            </Card>
          </Link>
          <Link href="/contact">
            <Card hover className="h-full text-center">
              <h2 className="text-lg font-semibold text-white mb-2">Contact Support</h2>
              <p className="text-neutral-400 text-sm mb-3">24/7 tickets and live chat from your dashboard</p>
              <span className="text-sm text-white">Get in touch →</span>
            </Card>
          </Link>
        </div>

        <div className="grid sm:grid-cols-2 gap-4 mb-12">
          <Card>
            <h3 className="text-white font-semibold mb-3">Domain & DNS tools</h3>
            <div className="flex flex-wrap gap-3">
              <Link href="/domain-check" className="text-sm text-neutral-400 hover:text-white">Domain check</Link>
              <Link href="/whois-lookup" className="text-sm text-neutral-400 hover:text-white">WHOIS lookup</Link>
              <Link href="/dns-lookup" className="text-sm text-neutral-400 hover:text-white">DNS lookup</Link>
            </div>
          </Card>
          <Card>
            <h3 className="text-white font-semibold mb-3">Legal & policies</h3>
            <div className="flex flex-wrap gap-3">
              <Link href="/privacy-policy" className="text-sm text-neutral-400 hover:text-white">Privacy</Link>
              <Link href="/refund-policy" className="text-sm text-neutral-400 hover:text-white">Refunds</Link>
              <Link href="/terms" className="text-sm text-neutral-400 hover:text-white">Terms</Link>
              <Link href="/knowledge-base?category=legal-policies" className="text-sm text-neutral-400 hover:text-white">Legal guides</Link>
            </div>
          </Card>
        </div>

        <div className="grid md:grid-cols-2 gap-6 mb-16">
          {categories.map((cat) => (
            <Card key={cat} hover>
              <h2 className="text-lg font-semibold text-white mb-4">{cat}</h2>
              <ul className="space-y-2">
                {HELP_ARTICLES.filter((a) => a.category === cat).map((article) => (
                  <li key={article.slug}>
                    <Link href={`/help/${article.slug}`} className="text-neutral-400 hover:text-white text-sm transition-colors">
                      {article.title}
                    </Link>
                  </li>
                ))}
              </ul>
            </Card>
          ))}
        </div>

        <h2 className="text-2xl font-bold text-white mb-6">Frequently asked questions</h2>
        <div className="space-y-3">
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

        <div className="mt-12 text-center">
          <p className="text-neutral-400 mb-4">Still need help?</p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Link href="/knowledge-base"><Button variant="secondary">Knowledge Base</Button></Link>
            <Link href="/contact"><Button>Contact support</Button></Link>
          </div>
        </div>
      </div>
    </PublicLayout>
  );
}
