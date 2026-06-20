'use client';

import { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { PageHeader, Card, LoadingSpinner, StatusBadge, EmptyState, Button, PromoBanner } from '@/components/ui';
import { MultiLineChart, genChartSeries } from '@/components/ui/LineChart';
import {
  getUserServices,
  getUserInvoices,
  getUserTickets,
} from '@/lib/firebase/firestore';
import { formatCurrency, formatBillingDate, isPastDue } from '@/lib/billing/helpers';
import { hasServerAccess } from '@/lib/monitoring/helpers';
import { auth } from '@/lib/firebase/config';

// ─── Deterministic simulated EC2 metrics ──────────────────────────────────────

function seedRng(str) {
  return str.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
}

function genSeries(seed, base, variance, points = 14) {
  return genChartSeries(seed, base, variance, points);
}

function buildEc2Metrics(services, liveStats = {}) {
  const ec2 = services.filter(
    (s) => (s.type === 'ec2' || s.type === 'vps') && hasServerAccess(s)
  );
  if (!ec2.length) return null;

  const points = 14;
  const cpuSeries = Array(points).fill(0);
  const memSeries = Array(points).fill(0);
  const bwSeries = Array(points).fill(0);

  ec2.forEach((s) => {
    const live = liveStats[s.id];
    if (live?.history?.length) {
      const hist = live.history.slice(-points);
      hist.forEach((h, i) => {
        if (i < points) {
          cpuSeries[i] += h.cpu;
          memSeries[i] += h.mem;
          bwSeries[i] += h.bw;
        }
      });
    } else if (live) {
      cpuSeries[points - 1] += live.cpu;
      memSeries[points - 1] += live.mem;
      bwSeries[points - 1] += live.bw;
    } else {
      const seed = seedRng(s.id || s.name || 'x');
      const cpu = genSeries(seed, 40, 40, points);
      const mem = genSeries(seed * 3, 55, 30, points);
      const bw = genSeries(seed * 7, 30, 50, points);
      cpu.forEach((v, i) => { cpuSeries[i] += v; });
      mem.forEach((v, i) => { memSeries[i] += v; });
      bw.forEach((v, i) => { bwSeries[i] += v; });
    }
  });

  const n = ec2.length;
  return {
    ec2,
    cpu: cpuSeries.map((v) => Math.round(v / n)),
    mem: memSeries.map((v) => Math.round(v / n)),
    bw: bwSeries.map((v) => Math.round(v / n)),
    isLive: Object.keys(liveStats).length > 0,
  };
}

function Ec2PerformanceGraph({ metrics }) {
  const lines = [
    { key: 'cpu', label: 'CPU %', data: metrics.cpu, color: '#22c55e' },
    { key: 'mem', label: 'Memory %', data: metrics.mem, color: '#3b82f6' },
    { key: 'bw', label: 'Bandwidth %', data: metrics.bw, color: '#a855f7' },
  ];

  const last = (arr) => arr[arr.length - 1];

  return (
    <Card className="col-span-2">
      <MultiLineChart
        title="EC2 Performance"
        subtitle={`${metrics.ec2.length} instance${metrics.ec2.length !== 1 ? 's' : ''} · last 14 days`}
        series={lines}
        badge={metrics.isLive ? 'Live' : 'Simulated'}
      />

      {/* Current values */}
      <div className="grid grid-cols-3 gap-3 mt-5">
        {lines.map((l) => (
          <div key={l.key} className="bg-neutral-900 border border-neutral-800 rounded-xl px-4 py-3">
            <div className="flex items-center gap-1.5 mb-1">
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: l.color }} />
              <span className="text-xs text-neutral-500">{l.label}</span>
            </div>
            <p className="text-white text-xl font-bold">{last(l.data)}<span className="text-sm font-normal text-neutral-400">%</span></p>
            <p className="text-xs text-neutral-600 mt-0.5">avg: {Math.round(l.data.reduce((a, b) => a + b, 0) / l.data.length)}%</p>
          </div>
        ))}
      </div>

      {/* Instances list */}
      {metrics.ec2.length > 0 && (
        <div className="mt-5 pt-4 border-t border-neutral-800">
          <p className="text-xs text-neutral-500 mb-3">Instances included</p>
          <div className="flex flex-wrap gap-2">
            {metrics.ec2.map((s) => (
              <Link
                key={s.id}
                href={`/dashboard/services/${s.id}`}
                className="flex items-center gap-2 px-3 py-1.5 bg-neutral-900 border border-neutral-800 rounded-lg text-xs text-neutral-300 hover:border-neutral-600 hover:text-white transition-colors"
              >
                <span className={`w-1.5 h-1.5 rounded-full ${s.status === 'active' ? 'bg-green-400' : 'bg-yellow-400'}`} />
                {s.name}
              </Link>
            ))}
          </div>
        </div>
      )}
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
  const [liveStats, setLiveStats] = useState({});

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

        const provisioned = s.filter(
          (svc) => (svc.type === 'ec2' || svc.type === 'vps') && hasServerAccess(svc)
        );
        if (provisioned.length > 0) {
          const idToken = await auth.currentUser?.getIdToken();
          if (idToken) {
            const statsMap = {};
            await Promise.all(
              provisioned.map(async (svc) => {
                try {
                  const res = await fetch(`/api/services/${svc.id}/stats`, {
                    headers: { Authorization: `Bearer ${idToken}` },
                  });
                  const data = await res.json();
                  if (data.available && data.stats) {
                    statsMap[svc.id] = data.stats;
                  }
                } catch {
                  // ignore per-service failures
                }
              })
            );
            setLiveStats(statsMap);
          }
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [user]);

  const ec2Metrics = useMemo(() => buildEc2Metrics(services, liveStats), [services, liveStats]);
  const activeServices = services.filter((s) => s.status === 'active');
  const ec2Services = services.filter((s) => s.type === 'ec2' || s.type === 'vps');
  const unpaidInvoices = invoices.filter((i) => i.status === 'unpaid');
  const overdueInvoices = invoices.filter((i) => isPastDue(i.dueDate, i.status));

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
          { label: 'EC2 Instances', value: ec2Services.length, href: '/dashboard/services/ec2', icon: '⚡' },
          { label: 'Unpaid Invoices', value: unpaidInvoices.length, href: '/dashboard/invoices', icon: '💳' },
          { label: 'Overdue', value: overdueInvoices.length, href: '/dashboard/invoices', icon: overdueInvoices.length > 0 ? '⚠️' : '✓' },
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

      {/* EC2 Performance Graph — full width */}
      {ec2Metrics ? (
        <div className="grid grid-cols-2 gap-8 mb-8">
          <Ec2PerformanceGraph metrics={ec2Metrics} />
        </div>
      ) : (
        <Card className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-lg font-semibold text-white">EC2 Performance</h2>
          </div>
          <div className="flex flex-col items-center justify-center py-10 text-center">
            <span className="text-4xl mb-3">📊</span>
            <p className="text-white font-medium mb-1">Performance stats pending</p>
            <p className="text-neutral-400 text-sm mb-4">
              {ec2Services.length > 0
                ? 'Your EC2 instance is being provisioned. Stats will appear once admin assigns server IP and credentials.'
                : 'Deploy an EC2 instance to see live performance graphs here.'}
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
              description="Order an EC2 instance or service to get started."
              action={<Link href="/ec2-pricing"><Button size="sm">Browse plans</Button></Link>}
            />
          ) : (
            <ul className="space-y-2">
              {services.slice(0, 6).map((s) => (
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
