'use client';

import { useEffect, useState } from 'react';
import { PageHeader, LoadingSpinner, EmptyState } from '@/components/ui';
import { getAdminLogs } from '@/lib/firebase/firestore';
import { formatBillingDate } from '@/lib/billing/helpers';

export default function AdminLogsPage() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getAdminLogs().then(setLogs).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex justify-center py-24"><LoadingSpinner size="lg" /></div>;

  return (
    <div>
      <PageHeader title="Admin Logs" description="Audit trail of admin actions." />
      {logs.length === 0 ? (
        <EmptyState title="No admin logs yet" description="Actions will be logged as admins perform operations." />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-neutral-800 text-neutral-400 text-left">
                <th className="py-3 pr-4">Date</th>
                <th className="py-3 pr-4">Admin</th>
                <th className="py-3 pr-4">Action</th>
                <th className="py-3">Details</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => (
                <tr key={log.id} className="border-b border-neutral-800">
                  <td className="py-3 pr-4 text-neutral-400 whitespace-nowrap">{formatBillingDate(log.createdAt)}</td>
                  <td className="py-3 pr-4 text-neutral-300">{log.adminId?.slice(0, 8)}...</td>
                  <td className="py-3 pr-4 text-white">{log.action}</td>
                  <td className="py-3 text-neutral-500 text-xs font-mono">{JSON.stringify(log.details || {})}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
