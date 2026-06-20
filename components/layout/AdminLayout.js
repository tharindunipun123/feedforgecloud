'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { BRAND_NAME } from '@/data/constants';

const adminNav = [
  { href: '/admin', label: 'Overview' },
  { href: '/admin/users', label: 'Users' },
  { href: '/admin/orders', label: 'Orders' },
  { href: '/admin/services', label: 'Services' },
  { href: '/admin/ec2-provisioning', label: 'EC2 Provisioning' },
  { href: '/admin/n8n-provisioning', label: 'n8n Provisioning' },
  { href: '/admin/ai-website', label: 'AI Website Orders' },
  { href: '/admin/ai-chatbot', label: 'AI Chatbot Orders' },
  { href: '/admin/cdn/plans', label: 'CDN Plans' },
  { href: '/admin/cdn/subscriptions', label: 'CDN Subscriptions' },
  { href: '/admin/cdn/assets', label: 'CDN Assets' },
  { href: '/admin/cdn/usage', label: 'CDN Usage' },
  { href: '/admin/cdn/api-keys', label: 'CDN API Keys' },
  { href: '/admin/packages', label: 'Packages/Pricing' },
  { href: '/admin/usage-charges', label: 'Usage Charges' },
  { href: '/admin/on-demand', label: 'On-Demand Usage' },
  { href: '/admin/invoices', label: 'Invoices' },
  { href: '/admin/overdue', label: 'Overdue Services' },
  { href: '/admin/support', label: 'Support Tickets' },
  { href: '/admin/live-chat', label: 'Live Chat Management' },
  { href: '/admin/legal', label: 'Legal Page Editor' },
  { href: '/admin/settings', label: 'Settings' },
  { href: '/admin/logs', label: 'Admin Logs' },
];

export default function AdminLayout({ children }) {
  const { logout } = useAuth();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-black flex">
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/60 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      <aside
        className={`fixed lg:static inset-y-0 left-0 z-50 w-64 bg-neutral-950 border-r border-neutral-800 flex flex-col transform transition-transform lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="p-4 border-b border-neutral-800">
          <Link href="/admin" className="flex items-center gap-2.5">
            <Image src="/logo.png" alt={BRAND_NAME} width={32} height={32} className="rounded-lg" />
            <div>
              <span className="font-bold text-white text-sm tracking-tight block">{BRAND_NAME}</span>
              <span className="text-xs text-neutral-500">Admin Panel</span>
            </div>
          </Link>
        </div>

        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {adminNav.map((item) => {
            const active = pathname === item.href || (item.href !== '/admin' && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setSidebarOpen(false)}
                className={`block px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  active ? 'bg-neutral-800 text-white' : 'text-neutral-400 hover:text-white hover:bg-neutral-900'
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-neutral-800 space-y-2">
          <Link href="/dashboard" className="block text-sm text-neutral-400 hover:text-white">
            User Dashboard
          </Link>
          <button
            onClick={logout}
            className="w-full text-left text-sm text-neutral-400 hover:text-white"
          >
            Logout
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 border-b border-neutral-800 bg-black flex items-center px-4 lg:px-8">
          <button
            className="lg:hidden text-white p-2 mr-4"
            onClick={() => setSidebarOpen(true)}
            aria-label="Open sidebar"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <h1 className="text-white font-semibold">Admin Panel</h1>
        </header>
        <main className="flex-1 p-4 lg:p-8 overflow-auto">{children}</main>
      </div>
    </div>
  );
}
