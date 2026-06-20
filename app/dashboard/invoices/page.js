'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { PageHeader, Card, LoadingSpinner, StatusBadge, EmptyState, Button } from '@/components/ui';
import { getUserInvoices } from '@/lib/firebase/firestore';
import { formatCurrency, formatBillingDate, isPastDue, getDaysOverdue } from '@/lib/billing/helpers';

export default function InvoicesPage() {
  const { user } = useAuth();
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    getUserInvoices(user.uid).then(setInvoices).finally(() => setLoading(false));
  }, [user]);

  if (loading) return <div className="flex justify-center py-24"><LoadingSpinner size="lg" /></div>;

  return (
    <div>
      <PageHeader title="Invoices" description="View and download your invoices." />
      {invoices.length === 0 ? (
        <EmptyState title="No invoices yet" description="Invoices appear after payment confirmation." />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-neutral-800 text-neutral-400 text-left">
                <th className="py-3 pr-4">Invoice</th>
                <th className="py-3 pr-4">Issue date</th>
                <th className="py-3 pr-4">Due date</th>
                <th className="py-3 pr-4">Status</th>
                <th className="py-3 pr-4">Total</th>
                <th className="py-3"></th>
              </tr>
            </thead>
            <tbody>
              {invoices.map((inv) => {
                const overdue = isPastDue(inv.dueDate, inv.status);
                return (
                  <tr key={inv.id} className="border-b border-neutral-800">
                    <td className="py-3 pr-4 text-white">{inv.invoiceNumber}</td>
                    <td className="py-3 pr-4 text-neutral-400">{formatBillingDate(inv.issueDate)}</td>
                    <td className="py-3 pr-4 text-neutral-400">
                      {formatBillingDate(inv.dueDate)}
                      {overdue && <span className="block text-xs text-neutral-500">{getDaysOverdue(inv.dueDate, inv.status)} days overdue</span>}
                    </td>
                    <td className="py-3 pr-4"><StatusBadge status={overdue ? 'overdue' : inv.status} /></td>
                    <td className="py-3 pr-4 text-white">{formatCurrency(inv.total)}</td>
                    <td className="py-3">
                      <Link href={`/dashboard/invoices/${inv.id}`} className="text-white hover:underline">View</Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
