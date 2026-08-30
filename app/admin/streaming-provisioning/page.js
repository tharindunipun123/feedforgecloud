'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { PageHeader, Card, LoadingSpinner, Button, Input, Select, EmptyState } from '@/components/ui';
import { getAllServices, updateService } from '@/lib/firebase/firestore';
import { STREAMING_REGIONS } from '@/data/streaming';
import { serverTimestamp } from 'firebase/firestore';

export default function StreamingProvisioningPage() {
  const { user } = useAuth();
  const [services, setServices] = useState([]);
  const [selected, setSelected] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [creds, setCreds] = useState({
    streamUrl: '',
    mountPoint: '/live',
    sourcePassword: '',
    adminUrl: '',
    adminPassword: '',
    serverIp: '',
    region: STREAMING_REGIONS[0].id,
    notes: '',
  });

  useEffect(() => {
    getAllServices()
      .then((all) => setServices(all.filter((s) => s.type === 'live_streaming' && s.status === 'provisioning')))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!selected) return;
    const svc = services.find((s) => s.id === selected);
    if (svc?.config?.region) {
      setCreds((c) => ({ ...c, region: svc.config.region }));
    }
  }, [selected, services]);

  const handleSave = async (e) => {
    e.preventDefault();
    if (!selected) return;
    setSaving(true);
    try {
      const svc = services.find((s) => s.id === selected);
      await updateService(
        selected,
        {
          credentials: creds,
          config: { ...(svc?.config || {}), region: creds.region },
          status: 'active',
          billingStatus: 'active',
          activatedAt: serverTimestamp(),
          onDemandUsage: svc?.config?.payAsYouGo
            ? { ...(svc?.onDemandUsage || {}), enabled: true, enabledAt: serverTimestamp(), enabledBy: 'checkout' }
            : svc?.onDemandUsage,
        },
        user.uid
      );
      setServices((prev) => prev.filter((s) => s.id !== selected));
      setSelected('');
      setCreds({
        streamUrl: '',
        mountPoint: '/live',
        sourcePassword: '',
        adminUrl: '',
        adminPassword: '',
        serverIp: '',
        region: STREAMING_REGIONS[0].id,
        notes: '',
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="flex justify-center py-24"><LoadingSpinner size="lg" /></div>;

  return (
    <div>
      <PageHeader
        title="Streaming Provisioning"
        description="Activate live streaming servers — Icecast2 + Liquidsoap on Node.js platforms."
      />
      {services.length === 0 ? (
        <EmptyState title="No streaming services awaiting provisioning" description="All streaming orders are active or none yet." />
      ) : (
        <Card className="max-w-2xl">
          <form onSubmit={handleSave} className="space-y-4">
            <Select
              label="Select service"
              value={selected}
              onChange={(e) => setSelected(e.target.value)}
              options={[
                { value: '', label: 'Choose a service...' },
                ...services.map((s) => ({
                  value: s.id,
                  label: `${s.name} · ${s.config?.organizationName || 'No org'} · ${s.config?.region || 'no region'}`,
                })),
              ]}
            />
            {selected && (
              <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-3 text-xs text-neutral-400 space-y-1">
                {(() => {
                  const svc = services.find((s) => s.id === selected);
                  if (!svc) return null;
                  return (
                    <>
                      <p><span className="text-neutral-500">Organization:</span> {svc.config?.organizationName || '—'}</p>
                      <p><span className="text-neutral-500">BR:</span> {svc.config?.brNumber || '—'}</p>
                      <p><span className="text-neutral-500">PAYG:</span> {svc.config?.payAsYouGo ? 'Enabled' : 'Disabled'}</p>
                    </>
                  );
                })()}
              </div>
            )}
            <div className="grid sm:grid-cols-2 gap-4">
              <Input label="Stream URL (HTTPS)" value={creds.streamUrl} onChange={(e) => setCreds({ ...creds, streamUrl: e.target.value })} required placeholder="https://stream.example.com/live" className="sm:col-span-2" />
              <Input label="Mount point" value={creds.mountPoint} onChange={(e) => setCreds({ ...creds, mountPoint: e.target.value })} required />
              <Input label="Source password" value={creds.sourcePassword} onChange={(e) => setCreds({ ...creds, sourcePassword: e.target.value })} required />
              <Input label="Admin panel URL" value={creds.adminUrl} onChange={(e) => setCreds({ ...creds, adminUrl: e.target.value })} />
              <Input label="Admin password" value={creds.adminPassword} onChange={(e) => setCreds({ ...creds, adminPassword: e.target.value })} />
              <Input label="Server IP" value={creds.serverIp} onChange={(e) => setCreds({ ...creds, serverIp: e.target.value })} />
              <Select label="Region" value={creds.region} onChange={(e) => setCreds({ ...creds, region: e.target.value })} options={STREAMING_REGIONS.map((r) => ({ value: r.id, label: r.name }))} />
              <Input label="Notes" value={creds.notes} onChange={(e) => setCreds({ ...creds, notes: e.target.value })} className="sm:col-span-2" />
            </div>
            <Button type="submit" disabled={saving || !selected}>{saving ? 'Saving...' : 'Activate streaming server'}</Button>
          </form>
        </Card>
      )}
    </div>
  );
}
