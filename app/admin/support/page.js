'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { PageHeader, LoadingSpinner, StatusBadge, EmptyState } from '@/components/ui';
import { getAllTickets } from '@/lib/firebase/firestore';
import { formatBillingDate } from '@/lib/billing/helpers';

export default function AdminSupportPage() {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    getAllTickets().then(setTickets).finally(() => setLoading(false));
  }, []);

  const filtered = filter === 'all' ? tickets : tickets.filter((t) => t.status === filter);

  if (loading) return <div className="flex justify-center py-24"><LoadingSpinner size="lg" /></div>;

  return (
    <div>
      <PageHeader title="Support Tickets" description="Manage customer support requests." />
      <div className="flex gap-2 mb-6">
        {['all', 'open', 'in_progress', 'resolved', 'closed'].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-lg text-sm border ${filter === f ? 'border-white text-white' : 'border-neutral-700 text-neutral-400'}`}
          >
            {f.replace('_', ' ')}
          </button>
        ))}
      </div>
      {filtered.length === 0 ? (
        <EmptyState title="No tickets found" />
      ) : (
        <div className="space-y-3">
          {filtered.map((t) => (
            <Link key={t.id} href={`/admin/support/${t.id}`}>
              <div className="bg-neutral-950 border border-neutral-800 rounded-xl p-4 flex justify-between items-center hover:border-neutral-600 transition-colors">
                <div>
                  <h3 className="text-white font-medium">{t.subject}</h3>
                  <p className="text-sm text-neutral-400">{t.category} · {formatBillingDate(t.createdAt)}</p>
                </div>
                <StatusBadge status={t.status} />
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
