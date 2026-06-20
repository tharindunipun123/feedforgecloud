'use client';

import { useEffect, useState } from 'react';
import { PageHeader, LoadingSpinner, StatusBadge, EmptyState } from '@/components/ui';
import { getAllServices } from '@/lib/firebase/firestore';
import { formatBillingDate } from '@/lib/billing/helpers';

export default function AdminAiChatbotPage() {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getAllServices().then((all) => setServices(all.filter((s) => s.type === 'ai-chatbot'))).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex justify-center py-24"><LoadingSpinner size="lg" /></div>;

  return (
    <div>
      <PageHeader title="AI Chatbot Orders" description="Manage AI chatbot service orders." />
      {services.length === 0 ? (
        <EmptyState title="No AI chatbot orders" />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-neutral-800 text-neutral-400 text-left">
                <th className="py-3 pr-4">Service</th>
                <th className="py-3 pr-4">User</th>
                <th className="py-3 pr-4">Status</th>
                <th className="py-3">Created</th>
              </tr>
            </thead>
            <tbody>
              {services.map((s) => (
                <tr key={s.id} className="border-b border-neutral-800">
                  <td className="py-3 pr-4 text-white">{s.name}</td>
                  <td className="py-3 pr-4 text-neutral-400">{s.userId?.slice(0, 8)}...</td>
                  <td className="py-3 pr-4"><StatusBadge status={s.status} /></td>
                  <td className="py-3 text-neutral-400">{formatBillingDate(s.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
