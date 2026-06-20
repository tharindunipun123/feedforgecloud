'use client';

import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { PageHeader, Card, LoadingSpinner, StatusBadge, Button, Textarea, Select } from '@/components/ui';
import { getTicket, getTicketMessages, addTicketMessage, updateTicket } from '@/lib/firebase/firestore';
import { TICKET_STATUSES } from '@/data/constants';
import { formatBillingDate } from '@/lib/billing/helpers';

export default function AdminTicketDetailPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const [ticket, setTicket] = useState(null);
  const [messages, setMessages] = useState([]);
  const [reply, setReply] = useState('');
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const endRef = useRef(null);

  const load = async () => {
    const t = await getTicket(id);
    setTicket(t);
    setStatus(t?.status || 'open');
    const msgs = await getTicketMessages(id);
    setMessages(msgs.length ? msgs : t ? [{ id: 'initial', message: t.message, sender: 'user', createdAt: t.createdAt }] : []);
    setLoading(false);
  };

  useEffect(() => { load(); }, [id]);
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const handleReply = async (e) => {
    e.preventDefault();
    if (!reply.trim()) return;
    setSending(true);
    try {
      await addTicketMessage(id, { message: reply.trim(), sender: 'admin', senderName: 'Support Team' });
      setReply('');
      load();
    } finally {
      setSending(false);
    }
  };

  const handleStatusChange = async (newStatus) => {
    setStatus(newStatus);
    await updateTicket(id, { status: newStatus });
  };

  if (loading) return <div className="flex justify-center py-24"><LoadingSpinner size="lg" /></div>;

  if (!ticket) {
    return (
      <div className="text-center py-24">
        <Link href="/admin/support"><Button>Back to tickets</Button></Link>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title={ticket.subject}
        description={`${ticket.category} · ${ticket.priority}`}
        action={
          <Select
            value={status}
            onChange={(e) => handleStatusChange(e.target.value)}
            options={TICKET_STATUSES.map((s) => ({ value: s, label: s.replace('_', ' ') }))}
            className="!w-40"
          />
        }
      />
      <Card>
        <div className="h-96 overflow-y-auto space-y-4 mb-4">
          {messages.map((msg) => (
            <div key={msg.id} className={`flex ${msg.sender === 'admin' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[80%] px-4 py-3 rounded-lg text-sm ${msg.sender === 'admin' ? 'bg-white text-black' : 'bg-neutral-800 text-white'}`}>
                <p className="text-xs opacity-70 mb-1">{msg.senderName || msg.sender} · {formatBillingDate(msg.createdAt)}</p>
                <p>{msg.message}</p>
              </div>
            </div>
          ))}
          <div ref={endRef} />
        </div>
        <form onSubmit={handleReply} className="flex gap-2">
          <Textarea value={reply} onChange={(e) => setReply(e.target.value)} placeholder="Admin reply..." className="min-h-[80px]" />
          <Button type="submit" disabled={sending || !reply.trim()} className="self-end">Reply</Button>
        </form>
      </Card>
    </div>
  );
}
