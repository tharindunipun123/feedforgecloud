'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { PageHeader, Card, LoadingSpinner, StatusBadge, Button } from '@/components/ui';
import { getInvoice, getUserData } from '@/lib/firebase/firestore';
import { generateInvoicePDF } from '@/lib/billing/invoice-pdf';
import { formatCurrency, formatBillingDate, isPastDue, getDaysOverdue } from '@/lib/billing/helpers';

export default function AdminInvoiceDetailPage() {
  const { id } = useParams();
  const [invoice, setInvoice] = useState(null);
  const [customer, setCustomer] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    getInvoice(id).then(async (inv) => {
      setInvoice(inv);
      if (inv?.userId) {
        const user = await getUserData(inv.userId);
        setCustomer(user);
      }
      setLoading(false);
    });
  }, [id]);

  if (loading) return <div className="flex justify-center py-24"><LoadingSpinner size="lg" /></div>;

  if (!invoice) {
    return (
      <div className="text-center py-24">
        <h1 className="text-xl text-white mb-4">Invoice not found</h1>
        <Link href="/admin/invoices"><Button>Back</Button></Link>
      </div>
    );
  }

  const overdue = isPastDue(invoice.dueDate, invoice.status);

  return (
    <div>
      <PageHeader
        title={invoice.invoiceNumber}
        description={`Customer: ${customer?.email || invoice.userId}`}
        action={<Button onClick={() => generateInvoicePDF(invoice, customer)}>Download PDF</Button>}
      />
      <div className="grid lg:grid-cols-3 gap-4 mb-8">
        <Card><p className="text-sm text-neutral-400">Status</p><StatusBadge status={overdue ? 'overdue' : invoice.status} /></Card>
        <Card><p className="text-sm text-neutral-400">Due date</p><p className="text-white">{formatBillingDate(invoice.dueDate)}{overdue && ` (${getDaysOverdue(invoice.dueDate, invoice.status)}d overdue)`}</p></Card>
        <Card><p className="text-sm text-neutral-400">Total</p><p className="text-2xl font-bold text-white">{formatCurrency(invoice.total)}</p></Card>
      </div>
      <Card>
        <h2 className="text-lg font-semibold text-white mb-4">Line items</h2>
        {(invoice.lineItems || []).map((item, i) => (
          <div key={i} className="flex justify-between py-2 border-b border-neutral-800 text-sm">
            <span className="text-white">{item.name || item.description}</span>
            <span className="text-neutral-300">{formatCurrency(item.amount || item.price)}</span>
          </div>
        ))}
      </Card>
    </div>
  );
}
