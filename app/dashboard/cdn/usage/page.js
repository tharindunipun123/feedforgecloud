'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { PageHeader, LoadingSpinner, EmptyState, Button, StatusBadge } from '@/components/ui';
import { getUserCdnSubscription, getUserCdnUsageLogs } from '@/lib/firebase/cdn';
import { formatBillingDate } from '@/lib/billing/helpers';
import { formatCreditsMB } from '@/data/cdn';

export default function CdnUsagePage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [subscription, setSubscription] = useState(null);
  const [logs, setLogs] = useState([]);

  useEffect(() => {
    if (!user) return;
    async function load() {
      const [sub, usageLogs] = await Promise.all([
        getUserCdnSubscription(user.uid),
        getUserCdnUsageLogs(user.uid),
      ]);
      setSubscription(sub);
      setLogs(usageLogs);
      setLoading(false);
    }
    load();
  }, [user]);

  if (loading) {
    return <div className="flex justify-center py-24"><LoadingSpinner size="lg" /></div>;
  }

  if (!subscription) {
    return (
      <div>
        <PageHeader title="CDN Usage" description="Track uploads, deletes, and credit consumption." />
        <EmptyState
          title="No active CDN subscription"
          description="Subscribe to a CDN plan to view usage logs."
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
        title="CDN Usage"
        description="Activity log for uploads, deletions, and credit changes."
      />
      {logs.length === 0 ? (
        <EmptyState title="No usage logs yet" description="Activity will appear here after your first upload." />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-neutral-800 text-neutral-400 text-left">
                <th className="py-3 pr-4">Date</th>
                <th className="py-3 pr-4">Action</th>
                <th className="py-3 pr-4">File</th>
                <th className="py-3 pr-4">Credits</th>
                <th className="py-3">Source</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => (
                <tr key={log.id} className="border-b border-neutral-800">
                  <td className="py-3 pr-4 text-white">{formatBillingDate(log.createdAt)}</td>
                  <td className="py-3 pr-4"><StatusBadge status={log.action} /></td>
                  <td className="py-3 pr-4 text-neutral-300">{log.fileName || '—'}</td>
                  <td className="py-3 pr-4 text-neutral-300">
                    {log.creditsUsed > 0 ? '+' : ''}{formatCreditsMB(Math.abs(log.creditsUsed || 0))}
                    {log.creditsUsed < 0 ? ' (refunded)' : ''}
                  </td>
                  <td className="py-3 text-neutral-400">{log.source || 'dashboard'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
