'use client';

import { useEffect, useState } from 'react';
import { PageHeader, LoadingSpinner, StatusBadge, Button, Input, Card } from '@/components/ui';
import { getAllCdnSubscriptions, updateCdnSubscription } from '@/lib/firebase/cdn';
import { formatCreditsMB } from '@/data/cdn';
import { formatBillingDate } from '@/lib/billing/helpers';

export default function AdminCdnSubscriptionsPage() {
  const [subscriptions, setSubscriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [creditsForm, setCreditsForm] = useState({ totalCredits: '', remainingCredits: '' });
  const [saving, setSaving] = useState(false);

  const load = () => getAllCdnSubscriptions().then(setSubscriptions).finally(() => setLoading(false));

  useEffect(load, []);

  const handleSuspend = async (sub) => {
    const action = sub.status === 'active' ? 'suspend' : 'reactivate';
    if (!confirm(`${action.charAt(0).toUpperCase() + action.slice(1)} this subscription?`)) return;
    await updateCdnSubscription(sub.id, {
      status: sub.status === 'active' ? 'suspended' : 'active',
    });
    load();
  };

  const openCreditsForm = (sub) => {
    setEditing(sub.id);
    setCreditsForm({
      totalCredits: String(sub.totalCredits || 0),
      remainingCredits: String(sub.remainingCredits || 0),
    });
  };

  const handleSaveCredits = async (subId) => {
    setSaving(true);
    try {
      const total = parseInt(creditsForm.totalCredits, 10);
      const remaining = parseInt(creditsForm.remainingCredits, 10);
      if (isNaN(total) || isNaN(remaining)) return;
      await updateCdnSubscription(subId, {
        totalCredits: total,
        remainingCredits: remaining,
        usedCredits: Math.max(0, total - remaining),
      });
      setEditing(null);
      load();
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="flex justify-center py-24"><LoadingSpinner size="lg" /></div>;
  }

  return (
    <div>
      <PageHeader title="CDN Subscriptions" description="Manage customer CDN subscriptions and credits." />
      {subscriptions.length === 0 ? (
        <Card><p className="text-neutral-400 text-center py-8">No CDN subscriptions yet.</p></Card>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-neutral-800 text-neutral-400 text-left">
                <th className="py-3 pr-4">User</th>
                <th className="py-3 pr-4">Plan</th>
                <th className="py-3 pr-4">Status</th>
                <th className="py-3 pr-4">Credits</th>
                <th className="py-3 pr-4">Storage used</th>
                <th className="py-3 pr-4">Reset date</th>
                <th className="py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {subscriptions.map((sub) => (
                <tr key={sub.id} className="border-b border-neutral-800">
                  <td className="py-3 pr-4 text-neutral-300 font-mono text-xs">{sub.userId?.slice(0, 12)}…</td>
                  <td className="py-3 pr-4 text-white">{sub.planName}</td>
                  <td className="py-3 pr-4"><StatusBadge status={sub.status} /></td>
                  <td className="py-3 pr-4 text-neutral-300">
                    {formatCreditsMB(sub.remainingCredits || 0)} / {formatCreditsMB(sub.totalCredits || 0)}
                  </td>
                  <td className="py-3 pr-4 text-neutral-300">{formatCreditsMB(sub.storageUsedMB || 0)}</td>
                  <td className="py-3 pr-4 text-neutral-400">{formatBillingDate(sub.monthlyResetDate)}</td>
                  <td className="py-3">
                    <div className="flex flex-col gap-2">
                      <Button variant="secondary" size="sm" onClick={() => handleSuspend(sub)}>
                        {sub.status === 'active' ? 'Suspend' : 'Reactivate'}
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => openCreditsForm(sub)}>
                        Adjust credits
                      </Button>
                      {editing === sub.id && (
                        <div className="mt-2 p-3 bg-neutral-900 rounded-lg border border-neutral-800 space-y-2">
                          <Input
                            label="Total credits (MB)"
                            value={creditsForm.totalCredits}
                            onChange={(e) => setCreditsForm((f) => ({ ...f, totalCredits: e.target.value }))}
                            className="!py-1.5 !text-xs"
                          />
                          <Input
                            label="Remaining credits (MB)"
                            value={creditsForm.remainingCredits}
                            onChange={(e) => setCreditsForm((f) => ({ ...f, remainingCredits: e.target.value }))}
                            className="!py-1.5 !text-xs"
                          />
                          <div className="flex gap-2">
                            <Button size="sm" disabled={saving} onClick={() => handleSaveCredits(sub.id)}>
                              Save
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => setEditing(null)}>Cancel</Button>
                          </div>
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
