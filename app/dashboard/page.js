'use client';

import { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { PageHeader, Card, LoadingSpinner, StatusBadge, EmptyState, Button, PromoBanner } from '@/components/ui';
import {
  getUserServices,
  getUserInvoices,
  getUserTickets,
} from '@/lib/firebase/firestore';
import { formatCurrency, formatBillingDate } from '@/lib/billing/helpers';
import { hasServerAccess } from '@/lib/monitoring/helpers';
import { generateSimulatedServerStats } from '@/lib/server/display';

function buildEc2Stats(services) {
  const ec2 = services.filter(
    (s) => (s.type === 'ec2' || s.type === 'vps') && hasServerAccess(s) && s.status === 'active'
  );
  if (!ec2.length) return null;
  return ec2.map((s) => ({
    service: s,
    stats: generateSimulatedServerStats(s.id),
  }));
}

function Ec2ServerStats({ rows }) {
  return (
    <Card className="mb-8">
      <h2 className="text-lg font-semibold text-white mb-1">Server usage</h2>
      <p className="text-neutral-500 text-sm mb-5">Current resource usage across your active instances.</p>
      <div className="space-y-4">
        {rows.map(({ service, stats }) => (
          <div key={service.id} className="border border-neutral-800 rounded-xl p-4">
            <div className="flex items-center justify-between gap-3 mb-4">
              <Link href={`/dashboard/services/${service.id}`} className="text-white font-medium hover:underline">
                {service.name}
              </Link>
              <span className="text-xs text-neutral-500">Updated just now</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { label: 'CPU', value: stats.cpu, suffix: '%' },
                { label: 'Memory', value: stats.mem, suffix: '%' },
                { label: 'Bandwidth', value: stats.bw, suffix: '%' },
                { label: 'Disk', value: stats.storage, suffix: '%' },
              ].map((item) => (
                <div key={item.label} className="bg-neutral-900 border border-neutral-800 rounded-lg px-3 py-3 text-center">
                  <p className="text-neutral-500 text-xs mb-1">{item.label}</p>
                  <p className="text-white text-xl font-bold">
                    {item.value}
                    <span className="text-sm font-normal text-neutral-400">{item.suffix}</span>
                  </p>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────

export default function DashboardOverviewPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [services, setServices] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [tickets, setTickets] = useState([]);

  useEffect(() => {
    if (!user) return;
    async function load() {
      try {
        const [s, i, t] = await Promise.all([
          getUserServices(user.uid),
          getUserInvoices(user.uid),
          getUserTickets(user.uid),
        ]);
        setServices(s);
        setInvoices(i);
        setTickets(t);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [user]);

  const ec2Stats = useMemo(() => buildEc2Stats(services), [services]);
  const activeServices = services.filter((s) => s.status === 'active');
  const pendingServices = services.filter(
    (s) => s.status === 'provisioning' || s.status === 'temp_ssl_active'
  );
  const ec2Services = services.filter((s) => s.type === 'ec2' || s.type === 'vps');
  const unpaidInvoices = invoices.filter((i) => i.status === 'unpaid');

  if (loading) {
    return <div className="flex justify-center py-24"><LoadingSpinner size="lg" /></div>;
  }

  return (
    <div>
      <PromoBanner section="overview" />
      <PageHeader title="Overview" description="Welcome back. Here is a summary of your account." />

      {/* Stats row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Active Services', value: activeServices.length, href: '/dashboard/services', icon: '✅' },
          { label: 'Pending Activation', value: pendingServices.length, href: '/dashboard/services', icon: '⏳' },
          { label: 'EC2 Instances', value: ec2Services.length, href: '/dashboard/services/ec2', icon: '⚡' },
          { label: 'Unpaid Invoices', value: unpaidInvoices.length, href: '/dashboard/invoices', icon: '💳' },
        ].map((stat) => (
          <Link key={stat.label} href={stat.href}>
            <Card hover className="text-center !p-5">
              <p className="text-2xl mb-1">{stat.icon}</p>
              <p className="text-3xl font-bold text-white">{stat.value}</p>
              <p className="text-xs text-neutral-400 mt-1">{stat.label}</p>
            </Card>
          </Link>
        ))}
      </div>

      {ec2Stats ? (
        <Ec2ServerStats rows={ec2Stats} />
      ) : (
        <Card className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-lg font-semibold text-white">Server usage</h2>
          </div>
          <div className="flex flex-col items-center justify-center py-10 text-center">
            <span className="text-4xl mb-3">📊</span>
            <p className="text-white font-medium mb-1">Server stats pending</p>
            <p className="text-neutral-400 text-sm mb-4">
              {ec2Services.length > 0
                ? 'Usage numbers will appear once your instance is activated.'
                : 'Deploy an EC2 instance to see server usage here.'}
            </p>
            {ec2Services.length === 0 && (
              <Link href="/ec2-pricing"><Button size="sm">Deploy EC2 Instance</Button></Link>
            )}
          </div>
        </Card>
      )}

      {/* Bottom cards */}
      <div className="grid lg:grid-cols-2 gap-8">
        <Card>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-white">Recent services</h2>
            <Link href="/dashboard/services" className="text-sm text-neutral-400 hover:text-white">View all</Link>
          </div>
          {services.length === 0 ? (
            <EmptyState
              title="No services yet"
              description="After payment, services appear here as pending until activated."
              action={<Link href="/ec2-pricing"><Button size="sm">Browse plans</Button></Link>}
            />
          ) : (
            <ul className="space-y-2">
              {[...pendingServices, ...activeServices].slice(0, 6).map((s) => (
                <li key={s.id} className="flex justify-between items-center py-2 border-b border-neutral-800 last:border-0">
                  <Link href={`/dashboard/services/${s.id}`} className="text-white hover:underline text-sm">{s.name}</Link>
                  <StatusBadge status={s.status} />
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-white">Unpaid invoices</h2>
            <Link href="/dashboard/invoices" className="text-sm text-neutral-400 hover:text-white">View all</Link>
          </div>
          {unpaidInvoices.length === 0 ? (
            <p className="text-neutral-400 text-sm py-4">All invoices are paid. ✅</p>
          ) : (
            <ul className="space-y-2">
              {unpaidInvoices.slice(0, 5).map((inv) => (
                <li key={inv.id} className="flex justify-between items-center py-2 border-b border-neutral-800 last:border-0 text-sm">
                  <Link href={`/dashboard/invoices/${inv.id}`} className="text-white hover:underline">{inv.invoiceNumber}</Link>
                  <span className="text-neutral-400 text-xs">{formatCurrency(inv.total)} · Due {formatBillingDate(inv.dueDate)}</span>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-white">Support tickets</h2>
            <Link href="/dashboard/support" className="text-sm text-neutral-400 hover:text-white">View all</Link>
          </div>
          {tickets.length === 0 ? (
            <EmptyState title="No tickets" action={<Link href="/dashboard/support"><Button size="sm">Create ticket</Button></Link>} />
          ) : (
            <ul className="space-y-2">
              {tickets.slice(0, 5).map((t) => (
                <li key={t.id} className="flex justify-between items-center py-2 border-b border-neutral-800 last:border-0 text-sm">
                  <Link href={`/dashboard/support/${t.id}`} className="text-white hover:underline truncate max-w-[200px]">{t.subject}</Link>
                  <StatusBadge status={t.status} />
                </li>
              ))}
            </ul>
          )}
          <Link href="/dashboard/live-chat" className="block mt-4 text-sm text-white hover:underline">Open live chat →</Link>
        </Card>

        <Card>
          <h2 className="text-lg font-semibold text-white mb-4">Quick actions</h2>
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: 'Deploy EC2', href: '/ec2-pricing', icon: '⚡' },
              { label: 'AI Website', href: '/dashboard/ai-website', icon: '✨' },
              { label: 'CDN Assets', href: '/dashboard/cdn/upload', icon: '🌍' },
              { label: 'New Ticket', href: '/dashboard/support', icon: '🎫' },
            ].map((a) => (
              <Link key={a.label} href={a.href}>
                <div className="flex items-center gap-3 p-3 bg-neutral-900 border border-neutral-800 rounded-xl hover:border-neutral-600 transition-colors">
                  <span className="text-xl">{a.icon}</span>
                  <span className="text-sm text-neutral-300 font-medium">{a.label}</span>
                </div>
              </Link>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
