'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { PageHeader, Card, Button, Textarea, LoadingSpinner } from '@/components/ui';
import { getLegalPage, saveLegalPage } from '@/lib/firebase/firestore';
import { LEGAL_PAGES } from '@/data/constants';

export default function AdminLegalPage() {
  const { user } = useAuth();
  const [selected, setSelected] = useState('privacy-policy');
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setLoading(true);
    getLegalPage(selected).then((data) => {
      setTitle(data?.title || LEGAL_PAGES[selected]?.title || '');
      setBody(data?.body || (data?.sections ? data.sections.map((s) => `${s.heading}\n\n${s.body}`).join('\n\n') : ''));
      setLoading(false);
    });
  }, [selected]);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setSaved(false);
    try {
      await saveLegalPage(selected, { title, body }, user.uid);
      setSaved(true);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <PageHeader title="Legal Page Editor" description="Edit legal page content stored in Firestore." />
      <div className="flex flex-wrap gap-2 mb-6">
        {Object.entries(LEGAL_PAGES).map(([slug, meta]) => (
          <button
            key={slug}
            onClick={() => setSelected(slug)}
            className={`px-3 py-1.5 rounded-lg text-sm border ${selected === slug ? 'border-white text-white' : 'border-neutral-700 text-neutral-400'}`}
          >
            {meta.title}
          </button>
        ))}
      </div>
      {loading ? (
        <div className="flex justify-center py-12"><LoadingSpinner /></div>
      ) : (
        <Card className="max-w-3xl">
          <form onSubmit={handleSave} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-neutral-300 mb-1.5">Title</label>
              <input value={title} onChange={(e) => setTitle(e.target.value)} className="w-full px-4 py-2.5 bg-neutral-950 border border-neutral-700 rounded-lg text-white" />
            </div>
            <Textarea label="Content" value={body} onChange={(e) => setBody(e.target.value)} rows={16} />
            {saved && <p className="text-sm text-neutral-300">Legal page saved successfully.</p>}
            <Button type="submit" disabled={saving}>{saving ? 'Saving...' : 'Save legal page'}</Button>
          </form>
        </Card>
      )}
    </div>
  );
}
