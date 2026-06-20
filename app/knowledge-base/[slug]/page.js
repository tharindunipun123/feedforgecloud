'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import PublicLayout from '@/components/layout/PublicLayout';
import { Button, Card } from '@/components/ui';
import {
  getKbArticle,
  getKbCategory,
  KB_ARTICLE_CONTENT,
  KNOWLEDGE_BASE_ARTICLES,
} from '@/data/knowledge-base';

function getArticleSections(article) {
  const custom = KB_ARTICLE_CONTENT[article.slug];
  if (custom?.sections) return custom.sections;

  return [
    { heading: 'Overview', body: article.excerpt },
    {
      heading: 'How it works on Feed Forge',
      body: `This guide covers ${article.title.toLowerCase()} for ${getKbCategory(article.category)?.name || 'our platform'}. Sign in to your dashboard to manage services, billing, and support tickets.`,
    },
    {
      heading: 'Next steps',
      body: 'Browse related tutorials for step-by-step code examples, or contact support if you need personalized assistance.',
    },
  ];
}

export default function KnowledgeBaseArticlePage() {
  const { slug } = useParams();
  const article = getKbArticle(slug);

  if (!article) {
    return (
      <PublicLayout>
        <div className="max-w-3xl mx-auto px-4 py-24 text-center">
          <h1 className="text-2xl font-bold text-white mb-4">Article not found</h1>
          <Link href="/knowledge-base"><Button>Back to Knowledge Base</Button></Link>
        </div>
      </PublicLayout>
    );
  }

  const category = getKbCategory(article.category);
  const sections = getArticleSections(article);
  const related = KNOWLEDGE_BASE_ARTICLES.filter(
    (a) => a.category === article.category && a.slug !== article.slug
  ).slice(0, 4);

  return (
    <PublicLayout>
      <article className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <Link href="/knowledge-base" className="text-sm text-neutral-400 hover:text-white mb-6 inline-block">
          ← Knowledge Base
        </Link>
        <span className="text-xs text-neutral-500 uppercase tracking-wide">{category?.name}</span>
        <h1 className="text-3xl font-bold text-white mt-2 mb-2">{article.title}</h1>
        <p className="text-neutral-500 text-sm mb-8">{article.readTime} read</p>

        <div className="space-y-8">
          {sections.map((section) => (
            <section key={section.heading}>
              <h2 className="text-xl font-semibold text-white mb-3">{section.heading}</h2>
              <div className="text-neutral-300 whitespace-pre-wrap leading-relaxed">{section.body}</div>
            </section>
          ))}
        </div>

        {article.legalLink && (
          <Card className="mt-10">
            <p className="text-neutral-400 text-sm mb-3">Read the full legal document for complete details.</p>
            <Link href={article.legalLink} className="text-white hover:underline text-sm font-medium">
              View full {article.title.split('—')[0].trim()} →
            </Link>
          </Card>
        )}

        {related.length > 0 && (
          <div className="mt-12 pt-8 border-t border-neutral-800">
            <h3 className="text-lg font-semibold text-white mb-4">Related articles</h3>
            <ul className="space-y-2">
              {related.map((a) => (
                <li key={a.slug}>
                  <Link href={`/knowledge-base/${a.slug}`} className="text-neutral-400 hover:text-white text-sm">
                    {a.title}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="mt-10 flex flex-wrap gap-4">
          <Link href="/tutorials"><Button variant="secondary">Browse tutorials</Button></Link>
          <Link href="/contact"><Button>Contact support</Button></Link>
        </div>
      </article>
    </PublicLayout>
  );
}
