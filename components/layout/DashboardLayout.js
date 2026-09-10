'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import {
  LayoutDashboard,
  Package,
  Server,
  Zap,
  Monitor,
  Globe,
  BarChart3,
  Cloud,
  Upload,
  Activity,
  Key,
  BookOpen,
  CreditCard,
  TrendingUp,
  FileText,
  Headphones,
  MessageSquare,
  Settings,
  LogOut,
  Menu,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { BRAND_NAME } from '@/data/constants';

const navItems = [
  { href: '/dashboard', label: 'Overview', icon: LayoutDashboard },
  { href: '/dashboard/services', label: 'My Services', icon: Package },
  { href: '/dashboard/services/ec2', label: 'EC2 Services', icon: Server },
  { href: '/dashboard/services/n8n', label: 'n8n Services', icon: Zap },
  { href: '/dashboard/ai-website', label: 'AI Website Builder', icon: Monitor },
  { href: '/dashboard/services/cdn', label: 'CDN Services', icon: Globe },
  { href: '/dashboard/cdn', label: 'CDN Overview', icon: BarChart3 },
  { href: '/dashboard/cdn/assets', label: 'CDN Assets', icon: Cloud },
  { href: '/dashboard/cdn/upload', label: 'Upload Media', icon: Upload },
  { href: '/dashboard/cdn/usage', label: 'CDN Usage', icon: Activity },
  { href: '/dashboard/cdn/api-keys', label: 'API Keys', icon: Key },
  { href: '/dashboard/cdn/api-docs', label: 'API Documentation', icon: BookOpen },
  { href: '/dashboard/billing', label: 'Billing', icon: CreditCard },
  { href: '/dashboard/on-demand', label: 'On-Demand Usage', icon: TrendingUp },
  { href: '/dashboard/invoices', label: 'Invoices', icon: FileText },
  { href: '/dashboard/support', label: 'Support Tickets', icon: Headphones },
  { href: '/dashboard/live-chat', label: 'Live Chat', icon: MessageSquare },
  { href: '/dashboard/settings', label: 'Account Settings', icon: Settings },
];

function NavLink({ item, onClick }) {
  const pathname = usePathname();
  const active = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));
  const Icon = item.icon;

  return (
    <Link
      href={item.href}
      onClick={onClick}
      className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
        active ? 'bg-neutral-800 text-white' : 'text-neutral-400 hover:text-white hover:bg-neutral-900'
      }`}
    >
      <Icon className="w-5 h-5 shrink-0" strokeWidth={1.75} />
      {item.label}
    </Link>
  );
}

export default function DashboardLayout({ children }) {
  const { user, userData, logout } = useAuth();
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
          <Link href="/" className="flex items-center gap-2.5">
            <Image src="/logo.png" alt={BRAND_NAME} width={32} height={32} className="rounded-lg" />
            <span className="font-bold text-white text-sm tracking-tight">{BRAND_NAME}</span>
          </Link>
        </div>

        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => (
            <NavLink key={item.href} item={item} onClick={() => setSidebarOpen(false)} />
          ))}
        </nav>

        <div className="p-4 border-t border-neutral-800">
          <button
            onClick={logout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-neutral-400 hover:text-white hover:bg-neutral-900 transition-colors"
          >
            <LogOut className="w-5 h-5" strokeWidth={1.75} />
            Logout
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 border-b border-neutral-800 bg-black flex items-center justify-between px-4 lg:px-8">
          <button
            className="lg:hidden text-white p-2"
            onClick={() => setSidebarOpen(true)}
            aria-label="Open sidebar"
          >
            <Menu className="w-6 h-6" strokeWidth={1.75} />
          </button>
          <div className="flex-1" />
          <div className="flex items-center gap-4">
            <span className="text-sm text-neutral-400 hidden sm:block">{userData?.email || user?.email}</span>
            <div className="w-8 h-8 rounded-full bg-neutral-800 border border-neutral-700 flex items-center justify-center text-sm font-medium text-white">
              {(userData?.name || user?.email || 'U')[0].toUpperCase()}
            </div>
          </div>
        </header>
        <main className="flex-1 p-4 lg:p-8 overflow-auto">{children}</main>
      </div>
    </div>
  );
}
