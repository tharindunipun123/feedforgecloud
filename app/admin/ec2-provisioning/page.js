'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { PageHeader, Card, LoadingSpinner, Button, Input, Select, EmptyState } from '@/components/ui';
import { getAllServices, updateService } from '@/lib/firebase/firestore';
import { OS_OPTIONS, SERVER_LOCATIONS } from '@/data/constants';
import { serverTimestamp } from 'firebase/firestore';

export default function Ec2ProvisioningPage() {
  const { user } = useAuth();
  const [services, setServices] = useState([]);
  const [selected, setSelected] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [creds, setCreds] = useState({
    ip: '', username: 'root', password: '', sshPort: '22', os: OS_OPTIONS[0], location: SERVER_LOCATIONS[0].id, controlPanelUrl: '', notes: '',
  });

  useEffect(() => {
    getAllServices()
      .then((all) => setServices(all.filter((s) => s.type === 'ec2' && s.status === 'provisioning')))
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    if (!selected) return;
    setSaving(true);
    try {
      await updateService(selected, {
        credentials: creds,
        status: 'active',
        activatedAt: serverTimestamp(),
      }, user.uid);
      setServices((prev) => prev.filter((s) => s.id !== selected));
      setSelected('');
      setCreds({ ip: '', username: 'root', password: '', sshPort: '22', os: OS_OPTIONS[0], location: SERVER_LOCATIONS[0].id, controlPanelUrl: '', notes: '' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="flex justify-center py-24"><LoadingSpinner size="lg" /></div>;

  return (
    <div>
      <PageHeader title="EC2 Provisioning" description="Add credentials and activate EC2 instances." />
      {services.length === 0 ? (
        <EmptyState title="No EC2 instances awaiting provisioning" description="All EC2 instances are provisioned or no orders yet." />
      ) : (
        <Card className="max-w-2xl">
          <form onSubmit={handleSave} className="space-y-4">
            <Select
              label="Select service"
              value={selected}
              onChange={(e) => setSelected(e.target.value)}
              options={[{ value: '', label: 'Choose a service...' }, ...services.map((s) => ({ value: s.id, label: `${s.name} (${s.userId?.slice(0, 8)})` }))]}
            />
            <div className="grid sm:grid-cols-2 gap-4">
              <Input label="IP address" value={creds.ip} onChange={(e) => setCreds({ ...creds, ip: e.target.value })} required />
              <Input label="Username" value={creds.username} onChange={(e) => setCreds({ ...creds, username: e.target.value })} required />
              <Input label="Password" value={creds.password} onChange={(e) => setCreds({ ...creds, password: e.target.value })} required />
              <Input label="SSH port" value={creds.sshPort} onChange={(e) => setCreds({ ...creds, sshPort: e.target.value })} />
              <Select label="OS" value={creds.os} onChange={(e) => setCreds({ ...creds, os: e.target.value })} options={OS_OPTIONS.map((o) => ({ value: o, label: o }))} />
              <Select label="Location" value={creds.location} onChange={(e) => setCreds({ ...creds, location: e.target.value })} options={SERVER_LOCATIONS.map((l) => ({ value: l.id, label: l.name }))} />
              <Input label="Control panel URL" value={creds.controlPanelUrl} onChange={(e) => setCreds({ ...creds, controlPanelUrl: e.target.value })} className="sm:col-span-2" />
              <Input label="Notes" value={creds.notes} onChange={(e) => setCreds({ ...creds, notes: e.target.value })} className="sm:col-span-2" />
            </div>
            <Button type="submit" disabled={saving || !selected}>{saving ? 'Saving...' : 'Save credentials & activate'}</Button>
          </form>
        </Card>
      )}
    </div>
  );
}
