'use client';

import { useEffect, useState, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { PageHeader, Card, LoadingSpinner, StatusBadge, EmptyState, Button, PromoBanner } from '@/components/ui';
import { getUserOrders, getUserInvoices, getOrder } from '@/lib/firebase/firestore';
import { formatCurrency, formatBillingDate } from '@/lib/billing/helpers';

function BillingContent() {
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const pendingOrderId = searchParams.get('orderId');
  const [orders, setOrders] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [pendingOrder, setPendingOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    async function load() {
      const [o, i] = await Promise.all([getUserOrders(user.uid), getUserInvoices(user.uid)]);
      setOrders(o);
      setInvoices(i);
      if (pendingOrderId) {
        const order = await getOrder(pendingOrderId);
        if (order?.userId === user.uid) setPendingOrder(order);
      }
      setLoading(false);
    }
    load();
  }, [user, pendingOrderId]);

  if (loading) return <div className="flex justify-center py-24"><LoadingSpinner size="lg" /></div>;

  return (
    <div>
      <PromoBanner section="billing" />
      <PageHeader title="Billing" description="View orders and payment history." />

      {pendingOrder && (
        <Card className="mb-8 border-neutral-600">
          <h2 className="text-lg font-semibold text-white mb-2">Order pending payment</h2>
          <p className="text-neutral-400 text-sm mb-4">
            Your order has been created and is awaiting payment confirmation. Services will be provisioned after payment is verified.
          </p>
          <div className="flex flex-wrap gap-4 text-sm mb-4">
            <div>
              <span className="text-neutral-500">Order total: </span>
              <span className="text-white font-semibold">{formatCurrency(pendingOrder.total)}</span>
            </div>
            {pendingOrder.country && (
              <div>
                <span className="text-neutral-500">Country: </span>
                <span className="text-white">{pendingOrder.country}</span>
              </div>
            )}
            {pendingOrder.paymentGatewayLabel && (
              <div>
                <span className="text-neutral-500">Gateway: </span>
                <span className="text-white">{pendingOrder.paymentGatewayLabel}</span>
              </div>
            )}
          </div>
          <StatusBadge status={pendingOrder.status} />
        </Card>
      )}

      <h2 className="text-lg font-semibold text-white mb-4">Recent orders</h2>
      {orders.length === 0 ? (
        <EmptyState title="No orders yet" action={<Link href="/ec2-pricing"><Button>Browse plans</Button></Link>} />
      ) : (
        <div className="overflow-x-auto mb-8">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-neutral-800 text-neutral-400 text-left">
                <th className="py-3 pr-4">Date</th>
                <th className="py-3 pr-4">Status</th>
                <th className="py-3 pr-4">Gateway</th>
                <th className="py-3">Total</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((o) => (
                <tr key={o.id} className="border-b border-neutral-800">
                  <td className="py-3 pr-4 text-white">{formatBillingDate(o.createdAt)}</td>
                  <td className="py-3 pr-4"><StatusBadge status={o.status} /></td>
                  <td className="py-3 pr-4 text-neutral-400">{o.paymentGatewayLabel || '—'}</td>
                  <td className="py-3 text-white">{formatCurrency(o.total)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <h2 className="text-lg font-semibold text-white mb-4">Recent invoices</h2>
      <Link href="/dashboard/invoices" className="text-sm text-neutral-400 hover:text-white mb-4 inline-block">View all invoices →</Link>
      {invoices.slice(0, 5).map((inv) => (
        <Link key={inv.id} href={`/dashboard/invoices/${inv.id}`}>
          <Card hover className="mb-3 flex justify-between items-center">
            <span className="text-white">{inv.invoiceNumber}</span>
            <div className="flex items-center gap-3">
              <StatusBadge status={inv.status} />
              <span className="text-neutral-400">{formatCurrency(inv.total)}</span>
            </div>
          </Card>
        </Link>
      ))}
    </div>
  );
}

export default function BillingPage() {
  return (
    <Suspense fallback={<div className="flex justify-center py-24"><LoadingSpinner size="lg" /></div>}>
      <BillingContent />
    </Suspense>
  );
}
