'use client';

import { useEffect, useState } from 'react';
import { PageHeader, LoadingSpinner, StatusBadge, Card } from '@/components/ui';
import { getAllCdnUsageLogs } from '@/lib/firebase/cdn';
import { formatBillingDate } from '@/lib/billing/helpers';
import { formatCreditsMB } from '@/data/cdn';

export default function AdminCdnUsagePage() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getAllCdnUsageLogs().then(setLogs).finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="flex justify-center py-24"><LoadingSpinner size="lg" /></div>;
  }

  return (
    <div>
      <PageHeader title="CDN Usage Logs" description="All CDN activity across users." />
      {logs.length === 0 ? (
        <Card><p className="text-neutral-400 text-center py-8">No usage logs yet.</p></Card>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-neutral-800 text-neutral-400 text-left">
                <th className="py-3 pr-4">Date</th>
                <th className="py-3 pr-4">User</th>
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
                  <td className="py-3 pr-4 text-neutral-400 font-mono text-xs">{log.userId?.slice(0, 12)}…</td>
                  <td className="py-3 pr-4"><StatusBadge status={log.action} /></td>
                  <td className="py-3 pr-4 text-neutral-300">{log.fileName || '—'}</td>
                  <td className="py-3 pr-4 text-neutral-300">
                    {log.creditsUsed > 0 ? '+' : ''}{formatCreditsMB(Math.abs(log.creditsUsed || 0))}
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
