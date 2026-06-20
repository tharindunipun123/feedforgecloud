'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { PageHeader, Card, LoadingSpinner, StatusBadge, EmptyState, Button, Input, Textarea, Select, PromoBanner } from '@/components/ui';
import { getUserTickets, createTicket } from '@/lib/firebase/firestore';
import { TICKET_CATEGORIES, TICKET_PRIORITIES } from '@/data/constants';
import { formatBillingDate } from '@/lib/billing/helpers';

export default function SupportPage() {
  const { user } = useAuth();
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ subject: '', category: TICKET_CATEGORIES[0], priority: 'Medium', message: '' });

  const loadTickets = () => {
    if (!user) return;
    getUserTickets(user.uid).then(setTickets).finally(() => setLoading(false));
  };

  useEffect(loadTickets, [user]);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!user) return;
    setSubmitting(true);
    try {
      await createTicket(user.uid, {
        subject: form.subject,
        category: form.category,
        priority: form.priority,
        message: form.message,
      });
      setShowForm(false);
      setForm({ subject: '', category: TICKET_CATEGORIES[0], priority: 'Medium', message: '' });
      loadTickets();
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="flex justify-center py-24"><LoadingSpinner size="lg" /></div>;

  return (
    <div>
      <PromoBanner section="support" />
      <PageHeader
        title="Support Tickets"
        description="Create and track support requests."
        action={<Button onClick={() => setShowForm(!showForm)}>{showForm ? 'Cancel' : 'New ticket'}</Button>}
      />

      {showForm && (
        <Card className="mb-8">
          <form onSubmit={handleCreate} className="space-y-4">
            <Input label="Subject" value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} required />
            <div className="grid sm:grid-cols-2 gap-4">
              <Select label="Category" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} options={TICKET_CATEGORIES.map((c) => ({ value: c, label: c }))} />
              <Select label="Priority" value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })} options={TICKET_PRIORITIES.map((p) => ({ value: p, label: p }))} />
            </div>
            <Textarea label="Message" value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} required />
            <Button type="submit" disabled={submitting}>{submitting ? 'Creating...' : 'Create ticket'}</Button>
          </form>
        </Card>
      )}

      {tickets.length === 0 ? (
        <EmptyState title="No support tickets" description="Create a ticket if you need help." action={<Button onClick={() => setShowForm(true)}>Create ticket</Button>} />
      ) : (
        <div className="space-y-3">
          {tickets.map((t) => (
            <Link key={t.id} href={`/dashboard/support/${t.id}`}>
              <Card hover className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                  <h3 className="text-white font-medium">{t.subject}</h3>
                  <p className="text-sm text-neutral-400 mt-1">{t.category} · {formatBillingDate(t.createdAt)}</p>
                </div>
                <StatusBadge status={t.status} />
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
