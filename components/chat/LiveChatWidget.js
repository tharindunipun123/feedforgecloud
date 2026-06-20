'use client';

import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
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
import { sortByCreatedAt } from '@/lib/firebase/query-helpers';
import { db } from '@/lib/firebase/config';

export default function LiveChatWidget() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [chatId, setChatId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [adminOnline, setAdminOnline] = useState(true);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (!db) return;
    const settingsRef = doc(db, 'settings', 'general');
    const unsub = onSnapshot(settingsRef, (snap) => {
      if (snap.exists()) {
        setAdminOnline(snap.data().adminOnline !== false);
      }
    });
    return unsub;
  }, []);

  useEffect(() => {
    if (!chatId || !open || !db) return;
    const q = query(
      collection(db, 'liveChatMessages'),
      where('chatId', '==', chatId)
    );
    const unsub = onSnapshot(q, (snap) => {
      setMessages(
        sortByCreatedAt(
          snap.docs.map((d) => ({ id: d.id, ...d.data() })),
          'asc'
        )
      );
    });
    return unsub;
  }, [chatId, open]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const startChat = async () => {
    if (!user || !db) {
      window.location.href = '/login?redirect=/dashboard/live-chat';
      return;
    }
    setLoading(true);
    try {
      const existing = await getDocs(
        query(
          collection(db, 'liveChats'),
          where('userId', '==', user.uid),
          where('status', '==', 'open'),
          limit(1)
        )
      );
      if (!existing.empty) {
        setChatId(existing.docs[0].id);
      } else {
        const chatRef = await addDoc(collection(db, 'liveChats'), {
          userId: user.uid,
          userEmail: user.email,
          status: 'open',
          unreadByAdmin: 0,
          unreadByUser: 0,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
        setChatId(chatRef.id);
      }
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!input.trim() || !chatId || !user || !db) return;

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
      unreadByAdmin: (messages.filter((m) => m.sender === 'user' && !m.read).length || 0) + 1,
      lastMessage: input.trim(),
    });

    setInput('');
  };

  const handleOpen = () => {
    setOpen(true);
    if (!chatId) startChat();
  };

  return (
    <>
      <button
        onClick={handleOpen}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 bg-white text-black rounded-full shadow-lg flex items-center justify-center hover:bg-neutral-200 transition-colors"
        aria-label="Open live chat"
      >
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
      </button>

      {open && (
        <div className="fixed bottom-24 right-6 z-50 w-[360px] max-w-[calc(100vw-3rem)] bg-neutral-950 border border-neutral-800 rounded-xl shadow-2xl flex flex-col overflow-hidden">
          <div className="p-4 border-b border-neutral-800 flex items-center justify-between">
            <div>
              <h3 className="text-white font-semibold text-sm">Live Chat</h3>
              <p className="text-xs text-neutral-400 flex items-center gap-1.5 mt-0.5">
                <span className={`w-2 h-2 rounded-full ${adminOnline ? 'bg-white' : 'bg-neutral-600'}`} />
                {adminOnline ? 'Support online' : 'Support offline'}
              </p>
            </div>
            <button onClick={() => setOpen(false)} className="text-neutral-400 hover:text-white">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="flex-1 h-72 overflow-y-auto p-4 space-y-3">
            {loading ? (
              <p className="text-neutral-400 text-sm text-center py-8">Connecting...</p>
            ) : messages.length === 0 ? (
              <p className="text-neutral-400 text-sm text-center py-8">
                Start a conversation with our support team.
              </p>
            ) : (
              messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[80%] px-3 py-2 rounded-lg text-sm ${
                      msg.sender === 'user'
                        ? 'bg-white text-black'
                        : 'bg-neutral-800 text-white'
                    }`}
                  >
                    {msg.message}
                  </div>
                </div>
              ))
            )}
            <div ref={messagesEndRef} />
          </div>

          <form onSubmit={sendMessage} className="p-3 border-t border-neutral-800 flex gap-2">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={user ? 'Type a message...' : 'Login to chat'}
              disabled={!user || !chatId}
              className="flex-1 px-3 py-2 bg-neutral-900 border border-neutral-700 rounded-lg text-white text-sm focus:outline-none focus:border-white"
            />
            <button
              type="submit"
              disabled={!user || !chatId || !input.trim()}
              className="px-3 py-2 bg-white text-black rounded-lg text-sm font-medium disabled:opacity-50"
            >
              Send
            </button>
          </form>
        </div>
      )}
    </>
  );
}
