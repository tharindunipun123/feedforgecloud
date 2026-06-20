'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { PageHeader, LoadingSpinner, StatusBadge } from '@/components/ui';
import { getAllInvoices } from '@/lib/firebase/firestore';
import { formatCurrency, formatBillingDate, isPastDue, getDaysOverdue } from '@/lib/billing/helpers';

export default function AdminInvoicesPage() {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getAllInvoices().then(setInvoices).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex justify-center py-24"><LoadingSpinner size="lg" /></div>;

  return (
    <div>
      <PageHeader title="Invoices" description="All platform invoices." />
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-neutral-800 text-neutral-400 text-left">
              <th className="py-3 pr-4">Invoice</th>
              <th className="py-3 pr-4">User</th>
              <th className="py-3 pr-4">Status</th>
              <th className="py-3 pr-4">Due</th>
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
                  <td className="py-3 pr-4 text-neutral-400">{inv.userId?.slice(0, 8)}...</td>
                  <td className="py-3 pr-4"><StatusBadge status={overdue ? 'overdue' : inv.status} /></td>
                  <td className="py-3 pr-4 text-neutral-400">
                    {formatBillingDate(inv.dueDate)}
                    {overdue && <span className="block text-xs">{getDaysOverdue(inv.dueDate, inv.status)}d overdue</span>}
                  </td>
                  <td className="py-3 pr-4 text-white">{formatCurrency(inv.total)}</td>
                  <td className="py-3"><Link href={`/admin/invoices/${inv.id}`} className="text-white hover:underline">View</Link></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
