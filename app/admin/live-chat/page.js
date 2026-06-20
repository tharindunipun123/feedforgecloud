'use client';

import { useEffect, useState, useRef } from 'react';
import { PageHeader, Card, LoadingSpinner, Button, Input } from '@/components/ui';
import {
  collection,
  query,
  where,
  onSnapshot,
  doc,
  updateDoc,
  addDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { sortByCreatedAt, sortByUpdatedAt } from '@/lib/firebase/query-helpers';

export default function AdminLiveChatPage() {
  const [chats, setChats] = useState([]);
  const [selected, setSelected] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const endRef = useRef(null);

  useEffect(() => {
    const q = query(collection(db, 'liveChats'));
    return onSnapshot(q, (snap) => {
      setChats(
        sortByUpdatedAt(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
      );
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    if (!selected) return;
    const q = query(collection(db, 'liveChatMessages'), where('chatId', '==', selected));
    return onSnapshot(q, (snap) =>
      setMessages(
        sortByCreatedAt(
          snap.docs.map((d) => ({ id: d.id, ...d.data() })),
          'asc'
        )
      )
    );
  }, [selected]);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const filteredChats = chats.filter(
    (c) => !search || c.userEmail?.toLowerCase().includes(search.toLowerCase())
  );

  const sendReply = async (e) => {
    e.preventDefault();
    if (!input.trim() || !selected) return;
    await addDoc(collection(db, 'liveChatMessages'), {
      chatId: selected,
      sender: 'admin',
      message: input.trim(),
      read: false,
      createdAt: serverTimestamp(),
    });
    await updateDoc(doc(db, 'liveChats', selected), {
      updatedAt: serverTimestamp(),
      lastMessage: input.trim(),
      unreadByUser: 1,
    });
    setInput('');
  };

  const closeChat = async (chatId) => {
    await updateDoc(doc(db, 'liveChats', chatId), { status: 'closed', updatedAt: serverTimestamp() });
    if (selected === chatId) setSelected(null);
  };

  if (loading) return <div className="flex justify-center py-24"><LoadingSpinner size="lg" /></div>;

  return (
    <div>
      <PageHeader title="Live Chat Management" description="Reply to customer chats and manage conversations." />
      <div className="grid lg:grid-cols-3 gap-6 h-[600px]">
        <Card className="overflow-hidden flex flex-col">
          <Input placeholder="Search by email..." value={search} onChange={(e) => setSearch(e.target.value)} className="mb-4" />
          <div className="flex-1 overflow-y-auto space-y-2">
            {filteredChats.map((chat) => (
              <button
                key={chat.id}
                onClick={() => setSelected(chat.id)}
                className={`w-full text-left p-3 rounded-lg border transition-colors ${
                  selected === chat.id ? 'border-white bg-neutral-900' : 'border-neutral-800 hover:border-neutral-600'
                }`}
              >
                <p className="text-white text-sm truncate">{chat.userEmail}</p>
                <p className="text-xs text-neutral-500 truncate">{chat.lastMessage || 'No messages'}</p>
                <div className="flex justify-between mt-1">
                  <span className="text-xs text-neutral-500 capitalize">{chat.status}</span>
                  {(chat.unreadByAdmin || 0) > 0 && (
                    <span className="text-xs bg-white text-black px-1.5 rounded-full">{chat.unreadByAdmin}</span>
                  )}
                </div>
              </button>
            ))}
          </div>
        </Card>

        <Card className="lg:col-span-2 flex flex-col overflow-hidden">
          {selected ? (
            <>
              <div className="flex justify-between items-center mb-4 pb-4 border-b border-neutral-800">
                <span className="text-white text-sm">{chats.find((c) => c.id === selected)?.userEmail}</span>
                <Button size="sm" variant="secondary" onClick={() => closeChat(selected)}>Close chat</Button>
              </div>
              <div className="flex-1 overflow-y-auto space-y-3 mb-4">
                {messages.map((msg) => (
                  <div key={msg.id} className={`flex ${msg.sender === 'admin' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[75%] px-4 py-2 rounded-lg text-sm ${msg.sender === 'admin' ? 'bg-white text-black' : 'bg-neutral-800 text-white'}`}>
                      {msg.message}
                    </div>
                  </div>
                ))}
                <div ref={endRef} />
              </div>
              <form onSubmit={sendReply} className="flex gap-2">
                <input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Type a reply..."
                  className="flex-1 px-4 py-2.5 bg-neutral-950 border border-neutral-700 rounded-lg text-white text-sm focus:outline-none focus:border-white"
                />
                <Button type="submit" disabled={!input.trim()}>Send</Button>
              </form>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-neutral-400 text-sm">Select a chat to view messages</div>
          )}
        </Card>
      </div>
    </div>
  );
}
