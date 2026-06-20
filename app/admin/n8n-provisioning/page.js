'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { PageHeader, Card, LoadingSpinner, Button, Input, EmptyState } from '@/components/ui';
import { getAllServices, updateService } from '@/lib/firebase/firestore';
import { serverTimestamp } from 'firebase/firestore';

export default function N8nProvisioningPage() {
  const { user } = useAuth();
  const [services, setServices] = useState([]);
  const [selected, setSelected] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [creds, setCreds] = useState({ url: '', username: '', password: '', notes: '' });

  useEffect(() => {
    getAllServices()
      .then((all) => setServices(all.filter((s) => s.type === 'n8n' && s.status === 'provisioning')))
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    if (!selected) return;
    setSaving(true);
    try {
      await updateService(selected, { credentials: creds, status: 'active', activatedAt: serverTimestamp() }, user.uid);
      setServices((prev) => prev.filter((s) => s.id !== selected));
      setSelected('');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="flex justify-center py-24"><LoadingSpinner size="lg" /></div>;

  return (
    <div>
      <PageHeader title="n8n Provisioning" description="Configure and activate n8n instances." />
      {services.length === 0 ? (
        <EmptyState title="No n8n services awaiting provisioning" />
      ) : (
        <Card className="max-w-lg">
          <form onSubmit={handleSave} className="space-y-4">
            <select value={selected} onChange={(e) => setSelected(e.target.value)} className="w-full px-4 py-2.5 bg-neutral-950 border border-neutral-700 rounded-lg text-white">
              <option value="">Choose a service...</option>
              {services.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
            <Input label="Instance URL" value={creds.url} onChange={(e) => setCreds({ ...creds, url: e.target.value })} required />
            <Input label="Admin username" value={creds.username} onChange={(e) => setCreds({ ...creds, username: e.target.value })} />
            <Input label="Admin password" value={creds.password} onChange={(e) => setCreds({ ...creds, password: e.target.value })} />
            <Input label="Notes" value={creds.notes} onChange={(e) => setCreds({ ...creds, notes: e.target.value })} />
            <Button type="submit" disabled={saving || !selected}>{saving ? 'Saving...' : 'Activate n8n instance'}</Button>
          </form>
        </Card>
      )}
    </div>
  );
}
