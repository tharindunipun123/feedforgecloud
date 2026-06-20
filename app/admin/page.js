'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { PageHeader, Card, LoadingSpinner } from '@/components/ui';
import { getAllUsers, getAllOrders, getAllServices, getAllInvoices, getAllTickets } from '@/lib/firebase/firestore';

export default function AdminOverviewPage() {
  const [stats, setStats] = useState({ users: 0, orders: 0, services: 0, invoices: 0, tickets: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [users, orders, services, invoices, tickets] = await Promise.all([
          getAllUsers(),
          getAllOrders(),
          getAllServices(),
          getAllInvoices(),
          getAllTickets(),
        ]);
        setStats({
          users: users.length,
          orders: orders.length,
          services: services.length,
          invoices: invoices.length,
          tickets: tickets.filter((t) => t.status !== 'closed').length,
        });
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) return <div className="flex justify-center py-24"><LoadingSpinner size="lg" /></div>;

  const links = [
    { label: 'Users', value: stats.users, href: '/admin/users' },
    { label: 'Orders', value: stats.orders, href: '/admin/orders' },
    { label: 'Services', value: stats.services, href: '/admin/services' },
    { label: 'Invoices', value: stats.invoices, href: '/admin/invoices' },
    { label: 'Open tickets', value: stats.tickets, href: '/admin/support' },
  ];

  return (
    <div>
      <PageHeader title="Admin Overview" description="Platform summary and quick links." />
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {links.map((item) => (
          <Link key={item.label} href={item.href}>
            <Card hover className="text-center">
              <p className="text-3xl font-bold text-white">{item.value}</p>
              <p className="text-sm text-neutral-400 mt-1">{item.label}</p>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
