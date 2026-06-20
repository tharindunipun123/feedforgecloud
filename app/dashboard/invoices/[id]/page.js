'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { PageHeader, Card, LoadingSpinner, StatusBadge, Button } from '@/components/ui';
import { getInvoice } from '@/lib/firebase/firestore';
import { generateInvoicePDF } from '@/lib/billing/invoice-pdf';
import { formatCurrency, formatBillingDate, isPastDue, getDaysOverdue } from '@/lib/billing/helpers';

export default function InvoiceDetailPage() {
  const { id } = useParams();
  const { user, userData } = useAuth();
  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || !id) return;
    getInvoice(id).then((inv) => {
      if (inv?.userId === user.uid) setInvoice(inv);
      setLoading(false);
    });
  }, [user, id]);

  if (loading) return <div className="flex justify-center py-24"><LoadingSpinner size="lg" /></div>;

  if (!invoice) {
    return (
      <div className="text-center py-24">
        <h1 className="text-xl text-white mb-4">Invoice not found</h1>
        <Link href="/dashboard/invoices"><Button>Back to invoices</Button></Link>
      </div>
    );
  }

  const overdue = isPastDue(invoice.dueDate, invoice.status);

  return (
    <div>
      <PageHeader
        title={invoice.invoiceNumber}
        description={`Issued ${formatBillingDate(invoice.issueDate)}`}
        action={
          <Button onClick={() => generateInvoicePDF(invoice, userData || user)}>Download PDF</Button>
        }
      />

      <div className="grid lg:grid-cols-3 gap-6 mb-8">
        <Card>
          <p className="text-sm text-neutral-400 mb-1">Status</p>
          <StatusBadge status={overdue ? 'overdue' : invoice.status} />
          {overdue && <p className="text-xs text-neutral-500 mt-2">{getDaysOverdue(invoice.dueDate, invoice.status)} days overdue</p>}
        </Card>
        <Card>
          <p className="text-sm text-neutral-400 mb-1">Due date</p>
          <p className="text-white">{formatBillingDate(invoice.dueDate)}</p>
        </Card>
        <Card>
          <p className="text-sm text-neutral-400 mb-1">Total</p>
          <p className="text-2xl font-bold text-white">{formatCurrency(invoice.total)}</p>
        </Card>
      </div>

      <Card>
        <h2 className="text-lg font-semibold text-white mb-4">Line items</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-neutral-800 text-neutral-400 text-left">
                <th className="py-2 pr-4">Description</th>
                <th className="py-2 text-right">Amount</th>
              </tr>
            </thead>
            <tbody>
              {(invoice.lineItems || []).map((item, i) => (
                <tr key={i} className="border-b border-neutral-800">
                  <td className="py-2 pr-4 text-white">{item.name || item.description}</td>
                  <td className="py-2 text-right text-white">{formatCurrency(item.amount || item.price)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="mt-6 space-y-2 text-sm max-w-xs ml-auto">
          <div className="flex justify-between"><span className="text-neutral-400">Subtotal</span><span className="text-white">{formatCurrency(invoice.subtotal)}</span></div>
          <div className="flex justify-between"><span className="text-neutral-400">Tax</span><span className="text-white">{formatCurrency(invoice.tax)}</span></div>
          <div className="flex justify-between"><span className="text-neutral-400">Discount</span><span className="text-white">{formatCurrency(invoice.discount)}</span></div>
          <div className="flex justify-between font-semibold pt-2 border-t border-neutral-800">
            <span className="text-white">Total</span><span className="text-white">{formatCurrency(invoice.total)}</span>
          </div>
        </div>
      </Card>
    </div>
  );
}
