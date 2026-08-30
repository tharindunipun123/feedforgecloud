'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { PageHeader, Card, LoadingSpinner, StatusBadge, Button } from '@/components/ui';
import { getAllServices, updateService } from '@/lib/firebase/firestore';
import { useAuth } from '@/contexts/AuthContext';
import { serverTimestamp } from 'firebase/firestore';

export default function AdminServicesPage() {
  const { user } = useAuth();
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = () => getAllServices().then(setServices).finally(() => setLoading(false));
  useEffect(load, []);

  const activateService = async (service) => {
    await updateService(
      service.id,
      {
        status: 'active',
        billingStatus: 'active',
        activatedAt: serverTimestamp(),
      },
      user.uid
    );

    if (service.type === 'cdn_hosting' && !service.cdnSubscriptionId) {
      const { createCdnSubscription } = await import('@/lib/firebase/cdn');
      await createCdnSubscription(service.userId, service.id, service.orderId, service.packageId);
    }

    load();
  };

  const updateStatus = async (id, status) => {
    const patch = { status };
    if (status === 'active') patch.billingStatus = 'active';
    if (status === 'cancelled' || status === 'suspended') patch.billingStatus = status;
    await updateService(id, patch, user.uid);
    load();
  };

  if (loading) return <div className="flex justify-center py-24"><LoadingSpinner size="lg" /></div>;

  return (
    <div>
      <PageHeader title="Services" description="Manage all customer services." />
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-neutral-800 text-neutral-400 text-left">
              <th className="py-3 pr-4">Service</th>
              <th className="py-3 pr-4">Type</th>
              <th className="py-3 pr-4">Status</th>
              <th className="py-3 pr-4">User</th>
              <th className="py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {services.map((s) => (
              <tr key={s.id} className="border-b border-neutral-800">
                <td className="py-3 pr-4 text-white">{s.name}</td>
                <td className="py-3 pr-4 text-neutral-400 capitalize">{s.type}</td>
                <td className="py-3 pr-4"><StatusBadge status={s.status} /></td>
                <td className="py-3 pr-4 text-neutral-400">{s.userId?.slice(0, 8)}...</td>
                <td className="py-3 flex flex-wrap gap-2">
                  {s.status === 'provisioning' && (
                    <Button size="sm" onClick={() => activateService(s)}>Mark active</Button>
                  )}
                  {s.status === 'active' && (
                    <Button size="sm" variant="secondary" onClick={() => updateStatus(s.id, 'suspended')}>Suspend</Button>
                  )}
                  {s.status === 'suspended' && (
                    <Button size="sm" onClick={() => updateStatus(s.id, 'active')}>Reactivate</Button>
                  )}
                  <Button size="sm" variant="ghost" onClick={() => updateStatus(s.id, 'cancelled')}>Cancel</Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
