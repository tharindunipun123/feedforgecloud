'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { PageHeader, Card, LoadingSpinner, Button, Input, Textarea, Select } from '@/components/ui';
import { getAllUsers, getAllServices, createUsageCharge } from '@/lib/firebase/firestore';

export default function UsageChargesPage() {
  const { user } = useAuth();
  const [users, setUsers] = useState([]);
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState('');
  const [form, setForm] = useState({
    userId: '',
    serviceId: '',
    periodStart: '',
    periodEnd: '',
    amount: '',
    description: '',
    notes: '',
  });

  useEffect(() => {
    Promise.all([getAllUsers(), getAllServices()]).then(([u, s]) => {
      setUsers(u);
      setServices(s);
      setLoading(false);
    });
  }, []);

  const userServices = services.filter((s) => s.userId === form.userId);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user) return;
    setSubmitting(true);
    setSuccess('');
    try {
      const result = await createUsageCharge({
        userId: form.userId,
        serviceId: form.serviceId,
        periodStart: form.periodStart,
        periodEnd: form.periodEnd,
        amount: parseFloat(form.amount),
        description: form.description,
        notes: form.notes,
      }, user.uid);
      setSuccess(`Usage charge created. Invoice ID: ${result.invoiceId}`);
      setForm({ userId: '', serviceId: '', periodStart: '', periodEnd: '', amount: '', description: '', notes: '' });
    } catch (err) {
      alert(err.message || 'Failed to create usage charge');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="flex justify-center py-24"><LoadingSpinner size="lg" /></div>;

  return (
    <div>
      <PageHeader title="Usage Charges" description="Create pay-as-you-go usage charges and generate invoices." />
      <Card className="max-w-2xl">
        <form onSubmit={handleSubmit} className="space-y-4">
          <Select
            label="User"
            value={form.userId}
            onChange={(e) => setForm({ ...form, userId: e.target.value, serviceId: '' })}
            options={[{ value: '', label: 'Select user...' }, ...users.map((u) => ({ value: u.uid || u.id, label: `${u.name || u.email} (${u.email})` }))]}
          />
          <Select
            label="Service"
            value={form.serviceId}
            onChange={(e) => setForm({ ...form, serviceId: e.target.value })}
            options={[{ value: '', label: 'Select service...' }, ...userServices.map((s) => ({ value: s.id, label: s.name }))]}
          />
          <div className="grid sm:grid-cols-2 gap-4">
            <Input label="Period start" type="date" value={form.periodStart} onChange={(e) => setForm({ ...form, periodStart: e.target.value })} required />
            <Input label="Period end" type="date" value={form.periodEnd} onChange={(e) => setForm({ ...form, periodEnd: e.target.value })} required />
          </div>
          <Input label="Amount (USD)" type="number" step="0.01" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} required />
          <Input label="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} required />
          <Textarea label="Notes" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
          {success && <p className="text-sm text-neutral-300">{success}</p>}
          <Button type="submit" disabled={submitting}>{submitting ? 'Creating...' : 'Create usage charge & invoice'}</Button>
        </form>
      </Card>
    </div>
  );
}
