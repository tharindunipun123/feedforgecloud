'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { PageHeader, Card, LoadingSpinner, Button, Input, Select, EmptyState } from '@/components/ui';
import { getAllServices, updateService } from '@/lib/firebase/firestore';
import { serverTimestamp } from 'firebase/firestore';

export default function SslProvisioningPage() {
  const { user } = useAuth();
  const [services, setServices] = useState([]);
  const [selected, setSelected] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [creds, setCreds] = useState({
    domain: '',
    certificateUrl: '',
    privateKeyUrl: '',
    caBundleUrl: '',
    issuedAt: '',
    expiresAt: '',
    status: 'active',
    notes: '',
  });

  useEffect(() => {
    getAllServices()
      .then((all) => setServices(all.filter((s) => s.type === 'ssl_certificate' && s.status === 'provisioning')))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!selected) return;
    const svc = services.find((s) => s.id === selected);
    if (svc?.config?.domain) {
      setCreds((c) => ({ ...c, domain: svc.config.domain }));
    }
  }, [selected, services]);

  const handleSave = async (e) => {
    e.preventDefault();
    if (!selected) return;
    setSaving(true);
    try {
      await updateService(
        selected,
        {
          credentials: creds,
          status: 'active',
          activatedAt: serverTimestamp(),
        },
        user.uid
      );
      setServices((prev) => prev.filter((s) => s.id !== selected));
      setSelected('');
      setCreds({
        domain: '',
        certificateUrl: '',
        privateKeyUrl: '',
        caBundleUrl: '',
        issuedAt: '',
        expiresAt: '',
        status: 'active',
        notes: '',
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="flex justify-center py-24"><LoadingSpinner size="lg" /></div>;

  return (
    <div>
      <PageHeader title="SSL Provisioning" description="Issue and activate SSL certificates after payment." />
      {services.length === 0 ? (
        <EmptyState title="No SSL orders awaiting provisioning" description="All SSL certificates are active or no orders yet." />
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
                  label: `${s.name} · ${s.config?.domain || 'no domain yet'}`,
                })),
              ]}
            />
            <div className="grid sm:grid-cols-2 gap-4">
              <Input label="Domain" value={creds.domain} onChange={(e) => setCreds({ ...creds, domain: e.target.value })} required className="sm:col-span-2" />
              <Input label="Certificate file URL" value={creds.certificateUrl} onChange={(e) => setCreds({ ...creds, certificateUrl: e.target.value })} required className="sm:col-span-2" />
              <Input label="Private key URL" value={creds.privateKeyUrl} onChange={(e) => setCreds({ ...creds, privateKeyUrl: e.target.value })} />
              <Input label="CA bundle URL" value={creds.caBundleUrl} onChange={(e) => setCreds({ ...creds, caBundleUrl: e.target.value })} />
              <Input label="Issued date" type="date" value={creds.issuedAt} onChange={(e) => setCreds({ ...creds, issuedAt: e.target.value })} />
              <Input label="Expiry date" type="date" value={creds.expiresAt} onChange={(e) => setCreds({ ...creds, expiresAt: e.target.value })} required />
              <Input label="Notes" value={creds.notes} onChange={(e) => setCreds({ ...creds, notes: e.target.value })} className="sm:col-span-2" />
            </div>
            <Button type="submit" disabled={saving || !selected}>{saving ? 'Saving...' : 'Activate SSL certificate'}</Button>
          </form>
        </Card>
      )}
    </div>
  );
}
