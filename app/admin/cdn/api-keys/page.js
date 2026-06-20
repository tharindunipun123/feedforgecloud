'use client';

import { useEffect, useState } from 'react';
import { PageHeader, LoadingSpinner, StatusBadge, Button, Card } from '@/components/ui';
import { getAllApiKeys, adminRevokeApiKey } from '@/lib/firebase/cdn';
import { maskApiKey } from '@/lib/cdn/helpers';
import { formatBillingDate } from '@/lib/billing/helpers';

export default function AdminCdnApiKeysPage() {
  const [keys, setKeys] = useState([]);
  const [loading, setLoading] = useState(true);
  const [revoking, setRevoking] = useState(null);

  const load = () => getAllApiKeys().then(setKeys).finally(() => setLoading(false));

  useEffect(load, []);

  const handleRevoke = async (keyId) => {
    if (!confirm('Revoke this API key?')) return;
    setRevoking(keyId);
    try {
      await adminRevokeApiKey(keyId);
      load();
    } finally {
      setRevoking(null);
    }
  };

  if (loading) {
    return <div className="flex justify-center py-24"><LoadingSpinner size="lg" /></div>;
  }

  return (
    <div>
      <PageHeader title="CDN API Keys" description="All API keys across users. Keys are shown masked for security." />
      {keys.length === 0 ? (
        <Card><p className="text-neutral-400 text-center py-8">No API keys yet.</p></Card>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-neutral-800 text-neutral-400 text-left">
                <th className="py-3 pr-4">Name</th>
                <th className="py-3 pr-4">User</th>
                <th className="py-3 pr-4">Key</th>
                <th className="py-3 pr-4">Status</th>
                <th className="py-3 pr-4">Created</th>
                <th className="py-3 pr-4">Last used</th>
                <th className="py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {keys.map((key) => (
                <tr key={key.id} className="border-b border-neutral-800">
                  <td className="py-3 pr-4 text-white">{key.name}</td>
                  <td className="py-3 pr-4 text-neutral-400 font-mono text-xs">{key.userId?.slice(0, 12)}…</td>
                  <td className="py-3 pr-4 text-neutral-400 font-mono text-xs">
                    {maskApiKey(key.keyPrefix || 'qscdn_xxxx')}
                  </td>
                  <td className="py-3 pr-4"><StatusBadge status={key.status} /></td>
                  <td className="py-3 pr-4 text-neutral-400">{formatBillingDate(key.createdAt)}</td>
                  <td className="py-3 pr-4 text-neutral-400">{formatBillingDate(key.lastUsedAt) || '—'}</td>
                  <td className="py-3">
                    {key.status === 'active' && (
                      <Button
                        variant="danger"
                        size="sm"
                        disabled={revoking === key.id}
                        onClick={() => handleRevoke(key.id)}
                      >
                        Revoke
                      </Button>
                    )}
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
