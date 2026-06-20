'use client';

import { useEffect, useState } from 'react';
import { PageHeader, Card, LoadingSpinner, Badge } from '@/components/ui';
import { getAllUsers } from '@/lib/firebase/firestore';
import { formatBillingDate } from '@/lib/billing/helpers';

export default function AdminUsersPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getAllUsers().then(setUsers).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex justify-center py-24"><LoadingSpinner size="lg" /></div>;

  return (
    <div>
      <PageHeader title="Users" description="All registered platform users." />
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-neutral-800 text-neutral-400 text-left">
              <th className="py-3 pr-4">Name</th>
              <th className="py-3 pr-4">Email</th>
              <th className="py-3 pr-4">Role</th>
              <th className="py-3">Joined</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id || u.uid} className="border-b border-neutral-800">
                <td className="py-3 pr-4 text-white">{u.name || '—'}</td>
                <td className="py-3 pr-4 text-neutral-300">{u.email}</td>
                <td className="py-3 pr-4"><Badge variant={u.role === 'admin' ? 'success' : 'default'}>{u.role || 'user'}</Badge></td>
                <td className="py-3 text-neutral-400">{formatBillingDate(u.createdAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
