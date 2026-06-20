'use client';

import { useState, useMemo, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import PublicLayout from '@/components/layout/PublicLayout';
import { PageHeader, Card, Input } from '@/components/ui';
import {
  KB_CATEGORIES,
  KNOWLEDGE_BASE_ARTICLES,
  getKbArticlesByCategory,
} from '@/data/knowledge-base';

function KnowledgeBaseContent() {
  const searchParams = useSearchParams();
  const categoryFilter = searchParams.get('category');
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    let articles = categoryFilter
      ? getKbArticlesByCategory(categoryFilter)
      : KNOWLEDGE_BASE_ARTICLES;

    if (search.trim()) {
      const q = search.toLowerCase();
      articles = articles.filter(
        (a) =>
          a.title.toLowerCase().includes(q) ||
          a.excerpt.toLowerCase().includes(q) ||
          a.category.toLowerCase().includes(q)
      );
    }
    return articles;
  }, [search, categoryFilter]);

  return (
    <PublicLayout>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <PageHeader
          title="Knowledge Base"
          description="Advice, answers, and guides for every Feed Forge service."
        />

        <div className="mb-8">
          <Input
            placeholder="Search articles..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="flex flex-wrap gap-2 mb-10">
          <Link
            href="/knowledge-base"
            className={`px-3 py-1.5 rounded-lg text-sm border transition-colors ${
              !categoryFilter ? 'bg-white text-black border-white' : 'border-neutral-700 text-neutral-400 hover:border-neutral-500'
            }`}
          >
            All
          </Link>
          {KB_CATEGORIES.map((cat) => (
            <Link
              key={cat.id}
              href={`/knowledge-base?category=${cat.id}`}
              className={`px-3 py-1.5 rounded-lg text-sm border transition-colors ${
                categoryFilter === cat.id ? 'bg-white text-black border-white' : 'border-neutral-700 text-neutral-400 hover:border-neutral-500'
              }`}
            >
              {cat.name}
            </Link>
          ))}
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
          {KB_CATEGORIES.filter((c) => !categoryFilter || c.id === categoryFilter).map((cat) => (
            <Card key={cat.id} hover>
              <h2 className="text-lg font-semibold text-white mb-1">{cat.name}</h2>
              <p className="text-neutral-500 text-sm mb-4">{cat.description}</p>
              <ul className="space-y-2">
                {getKbArticlesByCategory(cat.id)
                  .filter((a) => filtered.some((f) => f.slug === a.slug))
                  .slice(0, 5)
                  .map((article) => (
                    <li key={article.slug}>
                      <Link href={`/knowledge-base/${article.slug}`} className="text-neutral-400 hover:text-white text-sm transition-colors">
                        {article.title}
                      </Link>
                    </li>
                  ))}
              </ul>
              <Link href={`/knowledge-base?category=${cat.id}`} className="text-xs text-neutral-500 hover:text-white mt-4 inline-block">
                View all →
              </Link>
            </Card>
          ))}
        </div>

        {filtered.length > 0 && (
          <>
            <h2 className="text-xl font-bold text-white mb-6">
              {search ? `Search results (${filtered.length})` : 'All articles'}
            </h2>
            <div className="space-y-3">
              {filtered.map((article) => (
                <Link key={article.slug} href={`/knowledge-base/${article.slug}`}>
                  <Card hover className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                    <div>
                      <span className="text-xs text-neutral-500 uppercase">{getKbArticlesByCategory(article.category)[0] ? KB_CATEGORIES.find((c) => c.id === article.category)?.name : article.category}</span>
                      <h3 className="text-white font-medium">{article.title}</h3>
                      <p className="text-neutral-400 text-sm">{article.excerpt}</p>
                    </div>
                    <span className="text-xs text-neutral-500 shrink-0">{article.readTime}</span>
                  </Card>
                </Link>
              ))}
            </div>
          </>
        )}

        <div className="mt-16 grid sm:grid-cols-2 gap-6">
          <Card>
            <h3 className="text-white font-semibold mb-2">Legal & Policies</h3>
            <p className="text-neutral-400 text-sm mb-4">Privacy, refunds, terms, SLA, and acceptable use.</p>
            <div className="flex flex-wrap gap-3">
              <Link href="/privacy-policy" className="text-sm text-neutral-300 hover:text-white underline">Privacy Policy</Link>
              <Link href="/refund-policy" className="text-sm text-neutral-300 hover:text-white underline">Refund Policy</Link>
              <Link href="/terms" className="text-sm text-neutral-300 hover:text-white underline">Terms</Link>
            </div>
          </Card>
          <Card>
            <h3 className="text-white font-semibold mb-2">Need more help?</h3>
            <p className="text-neutral-400 text-sm mb-4">Browse tutorials or contact our support team.</p>
            <div className="flex gap-3">
              <Link href="/tutorials" className="text-sm text-white hover:underline">Tutorials</Link>
              <Link href="/contact" className="text-sm text-white hover:underline">Contact us</Link>
            </div>
          </Card>
        </div>
      </div>
    </PublicLayout>
  );
}

export default function KnowledgeBasePage() {
  return (
    <Suspense fallback={<PublicLayout><div className="flex justify-center py-24 text-neutral-400">Loading...</div></PublicLayout>}>
      <KnowledgeBaseContent />
    </Suspense>
  );
}
