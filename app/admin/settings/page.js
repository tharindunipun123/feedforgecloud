'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { PageHeader, Card, Button, LoadingSpinner } from '@/components/ui';
import { getPlatformSettings, savePlatformSettings } from '@/lib/firebase/firestore';

export default function AdminSettingsPage() {
  const { user } = useAuth();
  const [settings, setSettings] = useState({ adminOnline: true, supportEmail: 'support@quantumserver.cloud' });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    getPlatformSettings().then((s) => setSettings({ adminOnline: true, supportEmail: 'support@quantumserver.cloud', ...s })).finally(() => setLoading(false));
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setSaved(false);
    try {
      await savePlatformSettings(settings, user.uid);
      setSaved(true);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="flex justify-center py-24"><LoadingSpinner size="lg" /></div>;

  return (
    <div>
      <PageHeader title="Settings" description="Platform configuration." />
      <Card className="max-w-lg">
        <form onSubmit={handleSave} className="space-y-4">
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={settings.adminOnline !== false}
              onChange={(e) => setSettings({ ...settings, adminOnline: e.target.checked })}
              className="w-4 h-4 accent-white"
            />
            <span className="text-white text-sm">Support team online (live chat indicator)</span>
          </label>
          <div>
            <label className="block text-sm font-medium text-neutral-300 mb-1.5">Support email</label>
            <input
              value={settings.supportEmail || ''}
              onChange={(e) => setSettings({ ...settings, supportEmail: e.target.value })}
              className="w-full px-4 py-2.5 bg-neutral-950 border border-neutral-700 rounded-lg text-white"
            />
          </div>
          {saved && <p className="text-sm text-neutral-300">Settings saved.</p>}
          <Button type="submit" disabled={saving}>{saving ? 'Saving...' : 'Save settings'}</Button>
        </form>
      </Card>
    </div>
  );
}
