'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { PageHeader, LoadingSpinner, StatusBadge, Button, Input } from '@/components/ui';
import { getAllOrders, confirmPayment } from '@/lib/firebase/firestore';
import { formatCurrency, formatBillingDate } from '@/lib/billing/helpers';

export default function AdminOrdersPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [confirming, setConfirming] = useState(null);
  const [paymentRef, setPaymentRef] = useState('');

  const load = () => getAllOrders().then(setOrders).finally(() => setLoading(false));

  useEffect(load, []);

  const handleConfirm = async (orderId) => {
    if (!paymentRef.trim()) return;
    setConfirming(orderId);
    try {
      await confirmPayment(orderId, paymentRef.trim(), user.uid);
      router.push('/payment/success?orderId=' + orderId);
    } catch (err) {
      alert(err.message || 'Failed to confirm payment');
    } finally {
      setConfirming(null);
      setPaymentRef('');
      load();
    }
  };

  if (loading) return <div className="flex justify-center py-24"><LoadingSpinner size="lg" /></div>;

  return (
    <div>
      <PageHeader title="Orders" description="Manage customer orders and confirm payments." />
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-neutral-800 text-neutral-400 text-left">
              <th className="py-3 pr-4">Date</th>
              <th className="py-3 pr-4">User</th>
              <th className="py-3 pr-4">Country</th>
              <th className="py-3 pr-4">Gateway</th>
              <th className="py-3 pr-4">Status</th>
              <th className="py-3 pr-4">Total</th>
              <th className="py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((o) => (
              <tr key={o.id} className="border-b border-neutral-800">
                <td className="py-3 pr-4 text-white">{formatBillingDate(o.createdAt)}</td>
                <td className="py-3 pr-4 text-neutral-300">{o.customer?.email || o.userId?.slice(0, 8)}</td>
                <td className="py-3 pr-4 text-neutral-300">{o.country || o.customer?.country || '—'}</td>
                <td className="py-3 pr-4 text-neutral-300">{o.paymentGatewayLabel || o.paymentGatewayName || '—'}</td>
                <td className="py-3 pr-4"><StatusBadge status={o.status} /></td>
                <td className="py-3 pr-4 text-white">{formatCurrency(o.total)}</td>
                <td className="py-3">
                  {o.status === 'pending_payment' && (
                    <div className="flex items-center gap-2">
                      <Input
                        placeholder="Payment ref"
                        value={confirming === o.id ? paymentRef : ''}
                        onChange={(e) => { setConfirming(o.id); setPaymentRef(e.target.value); }}
                        className="!py-1.5 !text-xs w-32"
                      />
                      <Button size="sm" onClick={() => handleConfirm(o.id)} disabled={confirming !== o.id || !paymentRef.trim()}>
                        Confirm payment
                      </Button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
