'use client';

import Link from 'next/link';
import { useState, useMemo } from 'react';
import PublicLayout from '@/components/layout/PublicLayout';
import { PageHeader, Card } from '@/components/ui';
import { TUTORIALS, TUTORIAL_CATEGORIES } from '@/data/tutorials';

export default function TutorialsPage() {
  const [category, setCategory] = useState('all');
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    let list = TUTORIALS;
    if (category !== 'all') list = list.filter((t) => t.category === category);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (t) =>
          t.title.toLowerCase().includes(q) ||
          t.service.toLowerCase().includes(q) ||
          t.excerpt.toLowerCase().includes(q)
      );
    }
    return list;
  }, [category, search]);

  return (
    <PublicLayout>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <PageHeader
          title="Tutorials"
          description="Step-by-step guides for every service — with code examples in JavaScript, Python, PHP, Bash, and more."
        />

        <div className="mb-6">
          <input
            type="text"
            placeholder="Search tutorials..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full px-4 py-3 bg-neutral-950 border border-neutral-800 rounded-lg text-white placeholder-neutral-500 focus:outline-none focus:border-neutral-600"
          />
        </div>

        <div className="flex flex-wrap gap-2 mb-10">
          <button
            type="button"
            onClick={() => setCategory('all')}
            className={`px-3 py-1.5 rounded-lg text-sm border transition-colors ${
              category === 'all' ? 'bg-white text-black border-white' : 'border-neutral-700 text-neutral-400 hover:border-neutral-500'
            }`}
          >
            All
          </button>
          {TUTORIAL_CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setCategory(cat.id)}
              className={`px-3 py-1.5 rounded-lg text-sm border transition-colors ${
                category === cat.id ? 'bg-white text-black border-white' : 'border-neutral-700 text-neutral-400 hover:border-neutral-500'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
          {TUTORIAL_CATEGORIES.map((cat) => (
            <Card key={cat.id}>
              <h2 className="text-lg font-semibold text-white mb-3">{cat.name}</h2>
              <ul className="space-y-2">
                {TUTORIALS.filter((t) => t.category === cat.id).slice(0, 4).map((t) => (
                  <li key={t.slug}>
                    <Link href={`/tutorials/${t.slug}`} className="text-neutral-400 hover:text-white text-sm transition-colors">
                      {t.title}
                    </Link>
                  </li>
                ))}
              </ul>
            </Card>
          ))}
        </div>

        <h2 className="text-xl font-bold text-white mb-6">
          {search ? `Results (${filtered.length})` : 'All tutorials'}
        </h2>
        <div className="grid md:grid-cols-2 gap-4">
          {filtered.map((tutorial) => (
            <Link key={tutorial.slug} href={`/tutorials/${tutorial.slug}`}>
              <Card hover>
                <span className="text-xs text-neutral-500 uppercase">{tutorial.service}</span>
                <h3 className="text-white font-medium mt-1 mb-2">{tutorial.title}</h3>
                <p className="text-neutral-400 text-sm mb-3">{tutorial.excerpt}</p>
                <div className="flex flex-wrap gap-2 items-center">
                  {tutorial.languages.map((lang) => (
                    <span key={lang} className="px-2 py-0.5 bg-neutral-900 border border-neutral-800 rounded text-xs text-neutral-400">
                      {lang}
                    </span>
                  ))}
                  <span className="text-xs text-neutral-500 ml-auto">{tutorial.duration}</span>
                </div>
              </Card>
            </Link>
          ))}
        </div>

        {filtered.length === 0 && (
          <p className="text-neutral-500 text-center py-12">No tutorials match your search.</p>
        )}
      </div>
    </PublicLayout>
  );
}
