'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { PageHeader, LoadingSpinner, StatusBadge, EmptyState } from '@/components/ui';
import { getOverdueInvoices } from '@/lib/firebase/firestore';
import { formatCurrency, formatBillingDate, isPastDue, getDaysOverdue } from '@/lib/billing/helpers';

export default function AdminOverduePage() {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getOverdueInvoices()
      .then((all) => setInvoices(all.filter((i) => isPastDue(i.dueDate, i.status))))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex justify-center py-24"><LoadingSpinner size="lg" /></div>;

  return (
    <div>
      <PageHeader title="Overdue Services" description="Invoices past due date with unpaid status." />
      {invoices.length === 0 ? (
        <EmptyState title="No overdue invoices" description="All unpaid invoices are within payment terms." />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-neutral-800 text-neutral-400 text-left">
                <th className="py-3 pr-4">Invoice</th>
                <th className="py-3 pr-4">User</th>
                <th className="py-3 pr-4">Due date</th>
                <th className="py-3 pr-4">Days overdue</th>
                <th className="py-3 pr-4">Total</th>
                <th className="py-3"></th>
              </tr>
            </thead>
            <tbody>
              {invoices.map((inv) => (
                <tr key={inv.id} className="border-b border-neutral-800">
                  <td className="py-3 pr-4 text-white">{inv.invoiceNumber}</td>
                  <td className="py-3 pr-4 text-neutral-400">{inv.userId?.slice(0, 8)}...</td>
                  <td className="py-3 pr-4 text-neutral-400">{formatBillingDate(inv.dueDate)}</td>
                  <td className="py-3 pr-4 text-neutral-400">{getDaysOverdue(inv.dueDate, inv.status)} days</td>
                  <td className="py-3 pr-4 text-white">{formatCurrency(inv.total)}</td>
                  <td className="py-3"><Link href={`/admin/invoices/${inv.id}`} className="text-white hover:underline">View</Link></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
