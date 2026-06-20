'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { PageHeader, Card, Button, Input } from '@/components/ui';
import { createAiWebsiteProject, getUserAiWebsitePlan } from '@/lib/firebase/ai-website';

const WEBSITE_TYPES = [
  { id: 'business', label: 'Business / Corporate', icon: '🏢' },
  { id: 'portfolio', label: 'Portfolio / Personal', icon: '👤' },
  { id: 'ecommerce', label: 'E-commerce / Shop', icon: '🛍️' },
  { id: 'blog', label: 'Blog / Magazine', icon: '✍️' },
  { id: 'restaurant', label: 'Restaurant / Food', icon: '🍽️' },
  { id: 'agency', label: 'Agency / Creative', icon: '🎨' },
  { id: 'saas', label: 'SaaS / Tech Product', icon: '⚡' },
  { id: 'other', label: 'Other', icon: '🌐' },
];

export default function NewAiWebsiteProjectPage() {
  const { user, userData } = useAuth();
  const router = useRouter();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [websiteType, setWebsiteType] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleCreate(e) {
    e.preventDefault();
    if (!name.trim()) { setError('Project name is required.'); return; }
    if (!websiteType) { setError('Please select a website type.'); return; }
    setError('');
    setLoading(true);
    try {
      const plan = await getUserAiWebsitePlan(userData);
      const projectId = await createAiWebsiteProject(user.uid, {
        name: name.trim(),
        description: description.trim() || websiteType,
        planId: plan.id,
      });
      router.push(`/dashboard/ai-website/builder/${projectId}`);
    } catch (err) {
      setError(err.message || 'Failed to create project.');
      setLoading(false);
    }
  }

  return (
    <div className="max-w-2xl">
      <div className="mb-6">
        <Link href="/dashboard/ai-website" className="inline-flex items-center text-sm text-neutral-400 hover:text-white transition-colors mb-4">
          <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to projects
        </Link>
        <PageHeader title="New AI Website Project" description="Tell us about your website and we'll set up your builder." />
      </div>

      <form onSubmit={handleCreate} className="space-y-6">
        <Card>
          <div className="space-y-4">
            <Input
              label="Project Name"
              placeholder="My Awesome Website"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
            <div>
              <label className="block text-sm font-medium text-neutral-300 mb-1.5">
                Short description <span className="text-neutral-500">(optional)</span>
              </label>
              <textarea
                className="w-full px-4 py-2.5 bg-neutral-950 border border-neutral-700 rounded-lg text-white placeholder-neutral-500 focus:outline-none focus:border-white focus:ring-1 focus:ring-white/20 transition-colors min-h-[80px] resize-none"
                placeholder="e.g. A modern portfolio for a freelance photographer in NYC..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
          </div>
        </Card>

        <Card>
          <h3 className="text-white font-medium mb-4">What type of website?</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {WEBSITE_TYPES.map((type) => (
              <button
                key={type.id}
                type="button"
                onClick={() => setWebsiteType(type.id)}
                className={`flex flex-col items-center gap-2 p-3 rounded-lg border text-sm font-medium transition-all ${
                  websiteType === type.id
                    ? 'border-white bg-neutral-800 text-white'
                    : 'border-neutral-700 bg-neutral-900 text-neutral-400 hover:border-neutral-500 hover:text-white'
                }`}
              >
                <span className="text-2xl">{type.icon}</span>
                <span className="text-center leading-tight">{type.label}</span>
              </button>
            ))}
          </div>
        </Card>

        {error && (
          <p className="text-sm text-red-400 bg-red-900/20 border border-red-900/40 rounded-lg px-4 py-2.5">{error}</p>
        )}

        <div className="flex items-center gap-3">
          <Button type="submit" disabled={loading} className="min-w-[140px]">
            {loading ? (
              <span className="flex items-center gap-2">
                <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Creating...
              </span>
            ) : (
              'Create & Open Builder'
            )}
          </Button>
          <Link href="/dashboard/ai-website">
            <Button variant="ghost" type="button">Cancel</Button>
          </Link>
        </div>
      </form>
    </div>
  );
}
