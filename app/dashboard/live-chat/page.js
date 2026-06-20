'use client';

import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { PageHeader, Card, LoadingSpinner } from '@/components/ui';
import {
  collection,
  addDoc,
  query,
  where,
  onSnapshot,
  doc,
  updateDoc,
  serverTimestamp,
  getDocs,
  limit,
} from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { sortByCreatedAt } from '@/lib/firebase/query-helpers';

export default function DashboardLiveChatPage() {
  const { user } = useAuth();
  const [chatId, setChatId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [adminOnline, setAdminOnline] = useState(true);
  const endRef = useRef(null);

  useEffect(() => {
    const unsub = onSnapshot(doc(db, 'settings', 'general'), (snap) => {
      if (snap.exists()) setAdminOnline(snap.data().adminOnline !== false);
    });
    return unsub;
  }, []);

  useEffect(() => {
    if (!user) return;
    async function init() {
      const existing = await getDocs(
        query(collection(db, 'liveChats'), where('userId', '==', user.uid), where('status', '==', 'open'), limit(1))
      );
      if (!existing.empty) {
        setChatId(existing.docs[0].id);
      } else {
        const ref = await addDoc(collection(db, 'liveChats'), {
          userId: user.uid,
          userEmail: user.email,
          status: 'open',
          unreadByAdmin: 0,
          unreadByUser: 0,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
        setChatId(ref.id);
      }
      setLoading(false);
    }
    init();
  }, [user]);

  useEffect(() => {
    if (!chatId) return;
    const q = query(collection(db, 'liveChatMessages'), where('chatId', '==', chatId));
    return onSnapshot(q, (snap) =>
      setMessages(
        sortByCreatedAt(
          snap.docs.map((d) => ({ id: d.id, ...d.data() })),
          'asc'
        )
      )
    );
  }, [chatId]);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!input.trim() || !chatId || !user) return;
    await addDoc(collection(db, 'liveChatMessages'), {
      chatId,
      userId: user.uid,
      sender: 'user',
      message: input.trim(),
      read: false,
      createdAt: serverTimestamp(),
    });
    await updateDoc(doc(db, 'liveChats', chatId), {
      updatedAt: serverTimestamp(),
      lastMessage: input.trim(),
      unreadByAdmin: (messages.filter((m) => m.sender === 'user' && !m.read).length || 0) + 1,
    });
    setInput('');
  };

  if (loading) return <div className="flex justify-center py-24"><LoadingSpinner size="lg" /></div>;

  return (
    <div>
      <PageHeader
        title="Live Chat"
        description={
          <span className="flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full ${adminOnline ? 'bg-white' : 'bg-neutral-600'}`} />
            {adminOnline ? 'Support is online' : 'Support is offline'}
          </span>
        }
      />
      <Card>
        <div className="h-[500px] overflow-y-auto space-y-3 mb-4">
          {messages.length === 0 ? (
            <p className="text-neutral-400 text-sm text-center py-12">Start a conversation with our support team.</p>
          ) : (
            messages.map((msg) => (
              <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[75%] px-4 py-2 rounded-lg text-sm ${msg.sender === 'user' ? 'bg-white text-black' : 'bg-neutral-800 text-white'}`}>
                  {msg.message}
                </div>
              </div>
            ))
          )}
          <div ref={endRef} />
        </div>
        <form onSubmit={sendMessage} className="flex gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 px-4 py-2.5 bg-neutral-950 border border-neutral-700 rounded-lg text-white text-sm focus:outline-none focus:border-white"
          />
          <button type="submit" disabled={!input.trim()} className="px-5 py-2.5 bg-white text-black rounded-lg text-sm font-medium disabled:opacity-50">
            Send
          </button>
        </form>
      </Card>
    </div>
  );
}
