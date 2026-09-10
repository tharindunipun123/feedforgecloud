'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui';

export default function RenewalPayButton({ invoiceId, label = 'Pay now', size = 'sm', className = '' }) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handlePay() {
    if (!user || !invoiceId) return;
    setLoading(true);
    setError('');
    try {
      const idToken = await user.getIdToken();
      const res = await fetch('/api/stripe/pay-invoice', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${idToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ invoiceId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Could not start payment.');
      if (data.url) {
        window.location.href = data.url;
        return;
      }
      throw new Error('No checkout URL returned.');
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  }

  return (
    <div className={className}>
      <Button size={size} onClick={handlePay} disabled={loading || !user}>
        {loading ? 'Redirecting…' : label}
      </Button>
      {error ? <p className="text-red-400 text-xs mt-2">{error}</p> : null}
    </div>
  );
}
