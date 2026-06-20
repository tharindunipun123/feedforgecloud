'use client';

import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { PageHeader, Card, LoadingSpinner, StatusBadge, Button, Textarea } from '@/components/ui';
import { getTicket, getTicketMessages, addTicketMessage } from '@/lib/firebase/firestore';
import { formatBillingDate } from '@/lib/billing/helpers';

export default function TicketDetailPage() {
  const { id } = useParams();
  const { user, userData } = useAuth();
  const [ticket, setTicket] = useState(null);
  const [messages, setMessages] = useState([]);
  const [reply, setReply] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const endRef = useRef(null);

  const load = async () => {
    if (!user || !id) return;
    const t = await getTicket(id);
    if (t?.userId !== user.uid) {
      setTicket(null);
    } else {
      setTicket(t);
      const msgs = await getTicketMessages(id);
      setMessages(msgs.length ? msgs : [{ id: 'initial', message: t.message, sender: 'user', senderName: userData?.name, createdAt: t.createdAt }]);
    }
    setLoading(false);
  };

  useEffect(() => { load(); }, [user, id]);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const handleReply = async (e) => {
    e.preventDefault();
    if (!reply.trim() || !user) return;
    setSending(true);
    try {
      await addTicketMessage(id, {
        message: reply.trim(),
        sender: 'user',
        senderName: userData?.name || user.email,
        userId: user.uid,
      });
      setReply('');
      const msgs = await getTicketMessages(id);
      setMessages(msgs);
    } finally {
      setSending(false);
    }
  };

  if (loading) return <div className="flex justify-center py-24"><LoadingSpinner size="lg" /></div>;

  if (!ticket) {
    return (
      <div className="text-center py-24">
        <h1 className="text-xl text-white mb-4">Ticket not found</h1>
        <Link href="/dashboard/support"><Button>Back to tickets</Button></Link>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title={ticket.subject}
        description={`${ticket.category} · ${ticket.priority} priority`}
        action={<StatusBadge status={ticket.status} />}
      />

      <Card className="mb-6">
        <div className="h-96 overflow-y-auto space-y-4 mb-4">
          {messages.map((msg) => (
            <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[80%] px-4 py-3 rounded-lg text-sm ${msg.sender === 'user' ? 'bg-white text-black' : 'bg-neutral-800 text-white'}`}>
                <p className="text-xs opacity-70 mb-1">{msg.senderName || msg.sender} · {formatBillingDate(msg.createdAt)}</p>
                <p>{msg.message}</p>
              </div>
            </div>
          ))}
          <div ref={endRef} />
        </div>
        {ticket.status !== 'closed' && (
          <form onSubmit={handleReply} className="flex gap-2">
            <Textarea value={reply} onChange={(e) => setReply(e.target.value)} placeholder="Type your reply..." className="min-h-[80px]" />
            <Button type="submit" disabled={sending || !reply.trim()} className="self-end">{sending ? '...' : 'Send'}</Button>
          </form>
        )}
      </Card>
    </div>
  );
}
