'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { PageHeader, Card, LoadingSpinner, EmptyState, Button, Input, StatusBadge } from '@/components/ui';
import { getUserCdnSubscription, createApiKey, getUserApiKeys, revokeApiKey } from '@/lib/firebase/cdn';
import { maskApiKey } from '@/lib/cdn/helpers';
import { formatBillingDate } from '@/lib/billing/helpers';

export default function CdnApiKeysPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [subscription, setSubscription] = useState(null);
  const [keys, setKeys] = useState([]);
  const [name, setName] = useState('');
  const [creating, setCreating] = useState(false);
  const [newKey, setNewKey] = useState(null);
  const [revoking, setRevoking] = useState(null);

  const load = async () => {
    if (!user) return;
    const [sub, userKeys] = await Promise.all([
      getUserCdnSubscription(user.uid),
      getUserApiKeys(user.uid),
    ]);
    setSubscription(sub);
    setKeys(userKeys.filter((k) => k.status !== 'revoked'));
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, [user]);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    setCreating(true);
    try {
      const result = await createApiKey(user.uid, name.trim());
      setNewKey(result);
      setName('');
      await load();
    } catch (err) {
      alert(err.message || 'Failed to create API key');
    } finally {
      setCreating(false);
    }
  };

  const handleRevoke = async (keyId) => {
    if (!confirm('Revoke this API key? Applications using it will stop working.')) return;
    setRevoking(keyId);
    try {
      await revokeApiKey(user.uid, keyId);
      await load();
    } catch (err) {
      alert(err.message || 'Failed to revoke key');
    } finally {
      setRevoking(null);
    }
  };

  const copyNewKey = async () => {
    if (!newKey?.fullKey) return;
    await navigator.clipboard.writeText(newKey.fullKey);
  };

  if (loading) {
    return <div className="flex justify-center py-24"><LoadingSpinner size="lg" /></div>;
  }

  if (!subscription) {
    return (
      <div>
        <PageHeader title="API Keys" description="Create keys for programmatic CDN access." />
        <EmptyState
          title="No active CDN subscription"
          description="Subscribe to a CDN plan to create API keys."
          action={
            <Link href="/cdn-pricing"><Button>Browse CDN plans</Button></Link>
          }
        />
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="API Keys"
        description="Manage API keys for uploading and managing assets programmatically."
        action={
          <Link href="/dashboard/cdn/api-docs">
            <Button variant="secondary" size="sm">View API docs</Button>
          </Link>
        }
      />

      <Card className="mb-8">
        <h2 className="text-lg font-semibold text-white mb-4">Create new key</h2>
        <form onSubmit={handleCreate} className="flex flex-col sm:flex-row gap-4">
          <Input
            placeholder="Key name (e.g. Production app)"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="flex-1"
          />
          <Button type="submit" disabled={creating || !name.trim()}>
            {creating ? 'Creating…' : 'Create key'}
          </Button>
        </form>
      </Card>

      {newKey && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
          <Card className="max-w-lg w-full">
            <h2 className="text-lg font-semibold text-white mb-2">API key created</h2>
            <p className="text-neutral-400 text-sm mb-4">
              Copy this key now. It will not be shown again.
            </p>
            <div className="bg-neutral-900 border border-neutral-700 rounded-lg p-4 mb-4">
              <code className="text-white text-sm break-all">{newKey.fullKey}</code>
            </div>
            <div className="flex gap-3">
              <Button onClick={copyNewKey}>Copy key</Button>
              <Button variant="secondary" onClick={() => setNewKey(null)}>Done</Button>
            </div>
          </Card>
        </div>
      )}

      {keys.length === 0 ? (
        <EmptyState title="No API keys yet" description="Create a key to use the CDN REST API." />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-neutral-800 text-neutral-400 text-left">
                <th className="py-3 pr-4">Name</th>
                <th className="py-3 pr-4">Key</th>
                <th className="py-3 pr-4">Status</th>
                <th className="py-3 pr-4">Created</th>
                <th className="py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {keys.map((key) => (
                <tr key={key.id} className="border-b border-neutral-800">
                  <td className="py-3 pr-4 text-white">{key.name}</td>
                  <td className="py-3 pr-4 text-neutral-400 font-mono text-xs">
                    {maskApiKey(key.keyPrefix || 'qscdn_xxxx')}
                  </td>
                  <td className="py-3 pr-4"><StatusBadge status={key.status} /></td>
                  <td className="py-3 pr-4 text-neutral-400">{formatBillingDate(key.createdAt)}</td>
                  <td className="py-3">
                    <Button
                      variant="danger"
                      size="sm"
                      disabled={revoking === key.id}
                      onClick={() => handleRevoke(key.id)}
                    >
                      Revoke
                    </Button>
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
