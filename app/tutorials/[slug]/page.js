'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useState } from 'react';
import PublicLayout from '@/components/layout/PublicLayout';
import { Button, Card } from '@/components/ui';
import { getTutorial, TUTORIAL_CONTENT, TUTORIALS } from '@/data/tutorials';

const LANG_LABELS = {
  bash: 'Bash',
  javascript: 'JavaScript',
  python: 'Python',
  php: 'PHP',
  html: 'HTML',
};

export default function TutorialDetailPage() {
  const { slug } = useParams();
  const tutorial = getTutorial(slug);
  const content = TUTORIAL_CONTENT[slug];
  const [activeLang, setActiveLang] = useState(tutorial?.languages?.[0] || 'bash');

  if (!tutorial) {
    return (
      <PublicLayout>
        <div className="max-w-3xl mx-auto px-4 py-24 text-center">
          <h1 className="text-2xl font-bold text-white mb-4">Tutorial not found</h1>
          <Link href="/tutorials"><Button>Back to Tutorials</Button></Link>
        </div>
      </PublicLayout>
    );
  }

  const related = TUTORIALS.filter((t) => t.category === tutorial.category && t.slug !== tutorial.slug).slice(0, 3);
  const codeBlocks = content?.code || {};
  const languages = tutorial.languages.filter((l) => codeBlocks[l]);

  return (
    <PublicLayout>
      <article className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <Link href="/tutorials" className="text-sm text-neutral-400 hover:text-white mb-6 inline-block">
          ← Tutorials
        </Link>
        <span className="text-xs text-neutral-500 uppercase tracking-wide">{tutorial.service}</span>
        <h1 className="text-3xl font-bold text-white mt-2 mb-2">{tutorial.title}</h1>
        <p className="text-neutral-400 mb-2">{tutorial.excerpt}</p>
        <p className="text-neutral-500 text-sm mb-8">{tutorial.duration}</p>

        {content?.intro && (
          <p className="text-neutral-300 leading-relaxed mb-8">{content.intro}</p>
        )}

        {content?.steps && (
          <Card className="mb-8">
            <h2 className="text-lg font-semibold text-white mb-4">Steps</h2>
            <ol className="list-decimal list-inside space-y-2 text-neutral-300 text-sm">
              {content.steps.map((step, i) => (
                <li key={i}>{step}</li>
              ))}
            </ol>
          </Card>
        )}

        {languages.length > 0 && (
          <div>
            <h2 className="text-lg font-semibold text-white mb-4">Code examples</h2>
            <div className="flex flex-wrap gap-2 mb-4">
              {languages.map((lang) => (
                <button
                  key={lang}
                  type="button"
                  onClick={() => setActiveLang(lang)}
                  className={`px-3 py-1.5 rounded-lg text-sm border transition-colors ${
                    activeLang === lang ? 'bg-white text-black border-white' : 'border-neutral-700 text-neutral-400 hover:border-neutral-500'
                  }`}
                >
                  {LANG_LABELS[lang] || lang}
                </button>
              ))}
            </div>
            <pre className="bg-neutral-950 border border-neutral-800 rounded-xl p-4 overflow-x-auto text-sm text-neutral-300">
              <code>{codeBlocks[activeLang] || '// Code example coming soon.'}</code>
            </pre>
          </div>
        )}

        {!content && (
          <Card>
            <p className="text-neutral-400 text-sm">
              Full tutorial content is being expanded. Check the Knowledge Base for related guides, or contact support for help with {tutorial.service}.
            </p>
            <Link href="/knowledge-base" className="text-white text-sm hover:underline mt-3 inline-block">
              Browse Knowledge Base →
            </Link>
          </Card>
        )}

        {related.length > 0 && (
          <div className="mt-12 pt-8 border-t border-neutral-800">
            <h3 className="text-lg font-semibold text-white mb-4">Related tutorials</h3>
            <ul className="space-y-2">
              {related.map((t) => (
                <li key={t.slug}>
                  <Link href={`/tutorials/${t.slug}`} className="text-neutral-400 hover:text-white text-sm">
                    {t.title}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}
      </article>
    </PublicLayout>
  );
}
