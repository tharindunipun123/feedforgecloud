'use client';

import { useState } from 'react';
import PublicLayout from '@/components/layout/PublicLayout';
import { Button, Input, Textarea, Card, PageHeader } from '@/components/ui';

export default function ContactPage() {
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' });
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    await new Promise((r) => setTimeout(r, 600));
    setSubmitted(true);
    setLoading(false);
  };

  return (
    <PublicLayout>
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <PageHeader title="Contact us" description="Get in touch with our team. We typically respond within 24 hours." />
        {submitted ? (
          <Card className="text-center py-12">
            <h2 className="text-xl font-semibold text-white mb-2">Message sent</h2>
            <p className="text-neutral-400">Thank you for contacting us. We will get back to you shortly.</p>
          </Card>
        ) : (
          <Card>
            <form onSubmit={handleSubmit} className="space-y-4">
              <Input label="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
              <Input label="Email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
              <Input label="Subject" value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} required />
              <Textarea label="Message" value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} required rows={6} />
              <Button type="submit" disabled={loading}>{loading ? 'Sending...' : 'Send message'}</Button>
            </form>
          </Card>
        )}
        <div className="mt-12 grid sm:grid-cols-2 gap-6">
          <Card>
            <h3 className="text-white font-semibold mb-2">Support</h3>
            <p className="text-neutral-400 text-sm">Existing customers can open a support ticket from the dashboard for faster assistance.</p>
          </Card>
          <Card>
            <h3 className="text-white font-semibold mb-2">Sales</h3>
            <p className="text-neutral-400 text-sm">Questions about plans or enterprise solutions? Email sales@quantumserver.cloud</p>
          </Card>
        </div>
      </div>
    </PublicLayout>
  );
}
