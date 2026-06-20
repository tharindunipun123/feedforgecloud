'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { PageHeader, Card, LoadingSpinner, StatusBadge, Button } from '@/components/ui';
import LineChart, { genChartSeries } from '@/components/ui/LineChart';
import {
  getService,
  getUserInvoices,
  getServiceEvents,
  cancelService,
  requestServiceRestart,
  getOnDemandSettings,
  toggleServiceOnDemandUsage,
} from '@/lib/firebase/firestore';
import { formatBillingDate, formatCurrency } from '@/lib/billing/helpers';
import { hasServerAccess, isMonitorableService } from '@/lib/monitoring/helpers';
import {
  canUserToggleOnDemand,
  getServiceOnDemandRates,
  isServiceOnDemandEligible,
} from '@/data/on-demand';
import { auth } from '@/lib/firebase/config';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function toDate(val) {
  if (!val) return null;
  if (val?.toDate) return val.toDate();
  if (val?.seconds) return new Date(val.seconds * 1000);
  return new Date(val);
}

function fmtDate(val, opts = {}) {
  const d = toDate(val);
  if (!d || isNaN(d)) return '—';
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric', ...opts });
}

function generateBillingTimeline(service) {
  const created = toDate(service.createdAt);
  if (!created) return [];
  const events = [];
  events.push({ date: created, label: 'Service purchased', type: 'purchase', icon: '🛒' });
  const activated = toDate(service.activatedAt);
  if (activated) events.push({ date: activated, label: 'Service activated', type: 'active', icon: '✅' });
  const next = toDate(service.nextRenewalDate);
  if (next) events.push({ date: next, label: 'Next renewal', type: 'renewal', icon: '🔄' });
  if (service.cancelledAt) {
    events.push({ date: toDate(service.cancelledAt), label: 'Service cancelled', type: 'cancelled', icon: '❌' });
  }
  return events.sort((a, b) => a.date - b.date);
}

// ─── Sub-components ────────────────────────────────────────────────────────────

function CopyButton({ value }) {
  const [copied, setCopied] = useState(false);
  function copy() {
    navigator.clipboard.writeText(value).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }
  return (
    <button
      onClick={copy}
      className="ml-2 px-2 py-0.5 text-xs rounded border border-neutral-700 text-neutral-400 hover:border-white hover:text-white transition-colors shrink-0"
    >
      {copied ? '✓ Copied' : 'Copy'}
    </button>
  );
}

function CodeBlock({ code, language = 'bash' }) {
  const [copied, setCopied] = useState(false);
  function copy() {
    navigator.clipboard.writeText(code).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }
  return (
    <div className="relative group">
      <div className="flex items-center justify-between bg-neutral-900 border border-neutral-800 rounded-t-lg px-4 py-2">
        <span className="text-xs text-neutral-500 font-mono">{language}</span>
        <button
          onClick={copy}
          className="text-xs text-neutral-500 hover:text-white transition-colors"
        >
          {copied ? '✓ Copied' : 'Copy code'}
        </button>
      </div>
      <pre className="bg-black border border-t-0 border-neutral-800 rounded-b-lg px-4 py-3 text-sm text-green-400 font-mono overflow-x-auto whitespace-pre-wrap">
        {code}
      </pre>
    </div>
  );
}

function UsageBar({ label, value, color = 'bg-white', suffix = '%' }) {
  return (
    <div>
      <div className="flex justify-between text-sm mb-1.5">
        <span className="text-neutral-400">{label}</span>
        <span className="text-white font-medium">{value}{suffix}</span>
      </div>
      <div className="h-2 bg-neutral-800 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-700 ${color}`}
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  );
}

// ─── Tabs ──────────────────────────────────────────────────────────────────────

function OverviewTab({ service, invoices }) {
  const timeline = generateBillingTimeline(service);
  const creds = service.credentials;
  const showCreds = service.status === 'active' && creds;

  return (
    <div className="space-y-6">
      {service.status === 'provisioning' && (
        <div className="bg-yellow-950/40 border border-yellow-800/40 rounded-xl px-5 py-4 flex gap-3 items-start">
          <span className="text-yellow-400 text-lg mt-0.5">⏳</span>
          <div>
            <p className="text-yellow-300 font-medium text-sm">Provisioning in progress</p>
            <p className="text-yellow-500/80 text-xs mt-0.5">Your service is being set up. This usually takes 10–15 minutes. Credentials will appear here once ready.</p>
          </div>
        </div>
      )}

      <div className="grid sm:grid-cols-2 gap-6">
        <Card>
          <h3 className="text-white font-semibold mb-4">Service Status</h3>
          <div className="space-y-3 text-sm">
            {[
              ['Service Status', <StatusBadge key="s" status={service.status} />],
              ['Billing Status', <StatusBadge key="b" status={service.billingStatus} />],
              ['Billing Cycle', <span key="c" className="text-white capitalize">{service.billingCycle || '—'}</span>],
              ['Next Renewal', <span key="r" className="text-white">{formatBillingDate(service.nextRenewalDate)}</span>],
              ['Created', <span key="cr" className="text-white">{fmtDate(service.createdAt)}</span>],
              ['Activated', <span key="a" className="text-white">{fmtDate(service.activatedAt)}</span>],
            ].map(([k, v]) => (
              <div key={k} className="flex justify-between items-center py-1.5 border-b border-neutral-800 last:border-0">
                <span className="text-neutral-400">{k}</span>
                {v}
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <h3 className="text-white font-semibold mb-4">Configuration</h3>
          {service.config && Object.keys(service.config).length > 0 ? (
            <div className="space-y-1 text-sm">
              {Object.entries(service.config).map(([k, v]) => (
                <div key={k} className="flex justify-between py-1.5 border-b border-neutral-800 last:border-0">
                  <span className="text-neutral-400 capitalize">{k.replace(/([A-Z])/g, ' $1')}</span>
                  <span className="text-white text-right max-w-[55%] truncate">{String(v)}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-neutral-500 text-sm">No configuration details.</p>
          )}
        </Card>
      </div>

      {showCreds && (
        <Card>
          <h3 className="text-white font-semibold mb-4">Access Credentials</h3>
          <div className="grid sm:grid-cols-2 gap-4 text-sm font-mono">
            {[
              ['IP Address', creds.ip],
              ['Username', creds.username],
              ['Password', creds.password],
              ['SSH Port', creds.sshPort],
              ['Operating System', creds.os],
              ['Location', creds.location],
            ].filter(([, v]) => v).map(([k, v]) => (
              <div key={k} className="bg-black border border-neutral-800 rounded-lg px-3 py-2.5">
                <p className="text-neutral-500 text-xs mb-1">{k}</p>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-white text-sm truncate">{v}</span>
                  <CopyButton value={v} />
                </div>
              </div>
            ))}
            {creds.controlPanelUrl && (
              <div className="sm:col-span-2 bg-black border border-neutral-800 rounded-lg px-3 py-2.5">
                <p className="text-neutral-500 text-xs mb-1">Control Panel</p>
                <a href={creds.controlPanelUrl} target="_blank" rel="noopener noreferrer" className="text-white hover:underline text-sm break-all">{creds.controlPanelUrl}</a>
              </div>
            )}
            {creds.notes && (
              <div className="sm:col-span-2 bg-black border border-neutral-800 rounded-lg px-3 py-2.5">
                <p className="text-neutral-500 text-xs mb-1">Notes</p>
                <p className="text-white text-sm">{creds.notes}</p>
              </div>
            )}
          </div>
        </Card>
      )}

      {/* Billing Timeline */}
      <Card>
        <h3 className="text-white font-semibold mb-5">Billing Timeline</h3>
        <div className="relative">
          <div className="absolute left-4 top-0 bottom-0 w-px bg-neutral-800" />
          <div className="space-y-5">
            {timeline.map((ev, i) => (
              <div key={i} className="flex items-start gap-4 pl-12 relative">
                <div className="absolute left-0 w-8 h-8 rounded-full bg-neutral-900 border border-neutral-700 flex items-center justify-center text-base shrink-0">
                  {ev.icon}
                </div>
                <div>
                  <p className="text-white text-sm font-medium">{ev.label}</p>
                  <p className="text-neutral-500 text-xs mt-0.5">{fmtDate(ev.date, { weekday: 'short', hour: '2-digit', minute: '2-digit' })}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </Card>

      {/* Related Invoices */}
      <Card>
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-white font-semibold">Related Invoices</h3>
          <Link href="/dashboard/invoices" className="text-xs text-neutral-400 hover:text-white">View all</Link>
        </div>
        {invoices.length === 0 ? (
          <p className="text-neutral-500 text-sm">No invoices for this service yet.</p>
        ) : (
          <div className="space-y-2">
            {invoices.map((inv) => (
              <Link key={inv.id} href={`/dashboard/invoices/${inv.id}`} className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-neutral-900 transition-colors group">
                <div>
                  <p className="text-white text-sm font-medium group-hover:underline">{inv.invoiceNumber}</p>
                  <p className="text-xs text-neutral-500">{fmtDate(inv.issueDate)}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-white text-sm">{formatCurrency(inv.total)}</span>
                  <StatusBadge status={inv.status} />
                </div>
              </Link>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}

function ConnectTab({ service }) {
  const [os, setOs] = useState('linux');
  const creds = service.credentials;
  const canConnect = hasServerAccess(service);
  const ip = creds?.ip || 'YOUR_IP_ADDRESS';
  const user = creds?.username || 'root';
  const password = creds?.password || 'YOUR_PASSWORD';
  const port = creds?.sshPort || '22';

  if (!canConnect) {
    return (
      <Card>
        <div className="text-center py-12">
          <span className="text-4xl mb-4 block">🔐</span>
          <h3 className="text-white font-semibold mb-2">Connection details not yet available</h3>
          <p className="text-neutral-400 text-sm max-w-md mx-auto">
            Your server IP, username, and password will appear here once our team has finished provisioning your instance. This usually takes 10–15 minutes after payment.
          </p>
        </div>
      </Card>
    );
  }

  const guides = {
    linux: {
      label: 'Linux / macOS',
      icon: '🐧',
      steps: [
        {
          title: 'Step 1 — Open Terminal',
          desc: 'Open your Terminal application. On macOS use Spotlight (⌘+Space) and type "Terminal".',
        },
        {
          title: 'Step 2 — Connect via SSH',
          desc: 'Run the following command replacing with your credentials:',
          code: `ssh ${user}@${ip} -p ${port}`,
          lang: 'bash',
        },
        {
          title: 'Step 3 — Authenticate',
          desc: `When prompted, type your password. For security it won't be visible as you type.`,
          code: password,
          lang: 'password',
        },
        {
          title: 'Step 4 — You\'re connected!',
          desc: 'You should now see the server command prompt. Change your root password immediately:',
          code: `passwd`,
          lang: 'bash',
        },
        {
          title: '(Optional) Use SSH Key for passwordless login',
          desc: 'Generate and copy your public key to the server for secure keyless auth:',
          code: `# Generate SSH key (skip if you already have one)
ssh-keygen -t ed25519 -C "your_email@example.com"

# Copy your key to the server
ssh-copy-id -p ${port} ${user}@${ip}

# Now connect without a password
ssh ${user}@${ip} -p ${port}`,
          lang: 'bash',
        },
      ],
    },
    windows: {
      label: 'Windows (PuTTY)',
      icon: '🪟',
      steps: [
        {
          title: 'Step 1 — Download PuTTY',
          desc: 'Download and install PuTTY from the official site: https://www.putty.org. It\'s free and widely used.',
        },
        {
          title: 'Step 2 — Enter Connection Details',
          desc: 'Open PuTTY and fill in the following fields:',
          bullets: [
            `Host Name (or IP address): ${ip}`,
            `Port: ${port}`,
            `Connection type: SSH`,
          ],
        },
        {
          title: 'Step 3 — (Optional) Save Session',
          desc: 'Type a name in "Saved Sessions" and click Save so you don\'t have to re-enter details every time.',
        },
        {
          title: 'Step 4 — Click Open & Login',
          desc: `Click Open. A terminal window appears. Enter your login credentials:`,
          code: `Login as: ${user}
Password: (type your password — it won't be visible)`,
          lang: 'text',
        },
        {
          title: 'Step 5 — You\'re connected!',
          desc: 'You\'ll see the server prompt. Change your password immediately for security:',
          code: `passwd`,
          lang: 'bash',
        },
        {
          title: '(Alternative) Windows Terminal / PowerShell',
          desc: 'Windows 10/11 has built-in OpenSSH. Use Windows Terminal or PowerShell:',
          code: `ssh ${user}@${ip} -p ${port}`,
          lang: 'powershell',
        },
      ],
    },
    vscode: {
      label: 'VS Code Remote',
      icon: '💻',
      steps: [
        {
          title: 'Step 1 — Install Remote - SSH Extension',
          desc: 'Open VS Code, go to Extensions (Ctrl+Shift+X), search for "Remote - SSH" by Microsoft and install it.',
        },
        {
          title: 'Step 2 — Open Command Palette',
          desc: 'Press Ctrl+Shift+P (or ⌘+Shift+P on macOS) and type "Remote-SSH: Connect to Host".',
        },
        {
          title: 'Step 3 — Add New SSH Host',
          desc: 'Select "Add New SSH Host..." and enter:',
          code: `ssh ${user}@${ip} -p ${port}`,
          lang: 'bash',
        },
        {
          title: 'Step 4 — Connect',
          desc: 'Select the host you just added. VS Code opens a new window connected to your server. Enter password when prompted.',
        },
        {
          title: 'Step 5 — Configure SSH Config (Recommended)',
          desc: 'Edit your SSH config file (~/.ssh/config) for easier access:',
          code: `Host my-ec2-server
  HostName ${ip}
  User ${user}
  Port ${port}
  IdentityFile ~/.ssh/id_ed25519   # Optional: if using SSH key`,
          lang: 'ssh-config',
        },
        {
          title: 'You\'re connected!',
          desc: 'Open any folder on your server with File → Open Folder. Use the integrated terminal (Ctrl+`) to run commands.',
        },
      ],
    },
  };

  const guide = guides[os];

  return (
    <div className="space-y-6">
      <Card>
        <h3 className="text-white font-semibold mb-1">Connection Guide</h3>
        <p className="text-neutral-400 text-sm mb-5">Step-by-step instructions to connect to your EC2 instance.</p>

        {/* OS Selector */}
        <div className="flex gap-2 mb-6 flex-wrap">
          {Object.entries(guides).map(([key, g]) => (
            <button
              key={key}
              onClick={() => setOs(key)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border transition-all ${
                os === key
                  ? 'bg-white text-black border-white'
                  : 'border-neutral-700 text-neutral-400 hover:border-neutral-500 hover:text-white'
              }`}
            >
              <span>{g.icon}</span>
              {g.label}
            </button>
          ))}
        </div>

        {/* Quick connect summary */}
        {service.status === 'active' && (
          <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-4 mb-6 grid sm:grid-cols-3 gap-3 text-sm">
            {[['Host / IP', ip], ['User', user], ['Port', port]].map(([k, v]) => (
              <div key={k}>
                <p className="text-neutral-500 text-xs mb-1">{k}</p>
                <div className="flex items-center gap-2">
                  <code className="text-green-400 font-mono">{v}</code>
                  <CopyButton value={v} />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Steps */}
        <div className="space-y-5">
          {guide.steps.map((step, i) => (
            <div key={i} className="border border-neutral-800 rounded-xl overflow-hidden">
              <div className="flex items-start gap-3 p-4 bg-neutral-950">
                <div className="w-7 h-7 rounded-full bg-neutral-800 border border-neutral-700 flex items-center justify-center text-xs font-bold text-white shrink-0">
                  {i + 1}
                </div>
                <div className="min-w-0">
                  <h4 className="text-white font-medium text-sm">{step.title}</h4>
                  <p className="text-neutral-400 text-xs mt-1 leading-relaxed">{step.desc}</p>
                  {step.bullets && (
                    <ul className="mt-2 space-y-1">
                      {step.bullets.map((b, j) => (
                        <li key={j} className="text-xs text-neutral-300 flex gap-2">
                          <span className="text-neutral-600">•</span>
                          <code className="text-green-400">{b}</code>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
              {step.code && (
                <div className="border-t border-neutral-800">
                  <CodeBlock code={step.code} language={step.lang} />
                </div>
              )}
            </div>
          ))}
        </div>
      </Card>

      <Card>
        <h3 className="text-white font-semibold mb-3">Security Best Practices</h3>
        <div className="grid sm:grid-cols-2 gap-3">
          {[
            { icon: '🔑', tip: 'Use SSH key authentication instead of passwords.' },
            { icon: '🔒', tip: 'Change your root password immediately after first login.' },
            { icon: '🚫', tip: 'Disable root login — create a sudo user instead.' },
            { icon: '🛡️', tip: 'Enable a firewall (ufw) and only allow needed ports.' },
            { icon: '🔄', tip: 'Keep your system updated: sudo apt update && sudo apt upgrade' },
            { icon: '📋', tip: 'Review auth logs regularly: tail -f /var/log/auth.log' },
          ].map((b, i) => (
            <div key={i} className="flex items-start gap-3 bg-neutral-900 rounded-lg p-3">
              <span className="text-lg">{b.icon}</span>
              <p className="text-neutral-300 text-xs leading-relaxed">{b.tip}</p>
            </div>
          ))}
        </div>
      </Card>

      <Card>
        <h3 className="text-white font-semibold mb-3">Useful Commands</h3>
        <div className="space-y-2">
          {[
            ['Check system info', 'uname -a && lsb_release -a'],
            ['Check disk space', 'df -h'],
            ['Check memory', 'free -m'],
            ['Check CPU usage', 'top -bn1 | head -20'],
            ['Check running services', 'systemctl list-units --type=service --state=running'],
            ['View network usage', 'ifstat -i eth0 1 5'],
            ['Firewall status', 'ufw status verbose'],
            ['Update packages', 'apt update && apt upgrade -y'],
          ].map(([label, cmd]) => (
            <div key={label} className="flex items-center justify-between bg-black border border-neutral-800 rounded-lg px-3 py-2">
              <span className="text-neutral-400 text-xs w-36 shrink-0">{label}</span>
              <code className="text-green-400 text-xs font-mono flex-1 mx-3 truncate">{cmd}</code>
              <CopyButton value={cmd} />
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

function UsageTab({ service }) {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [unavailable, setUnavailable] = useState(null);

  const canShowStats = hasServerAccess(service) && isMonitorableService(service);
  const created = toDate(service.createdAt);
  const now = new Date();
  const daysActive = created ? Math.floor((now - created) / (1000 * 60 * 60 * 24)) : 0;
  const cfg = service.config || {};

  useEffect(() => {
    if (!canShowStats) {
      setLoading(false);
      return;
    }

    async function loadStats() {
      try {
        const idToken = await auth.currentUser?.getIdToken();
        if (!idToken) return;

        const res = await fetch(`/api/services/${service.id}/stats`, {
          headers: { Authorization: `Bearer ${idToken}` },
        });
        const data = await res.json();

        if (!data.available) {
          setUnavailable(data);
          return;
        }
        setStats(data.stats);
      } catch (err) {
        setUnavailable({ message: err.message });
      } finally {
        setLoading(false);
      }
    }

    loadStats();
    const interval = setInterval(loadStats, 60000);
    return () => clearInterval(interval);
  }, [service.id, canShowStats]);

  if (!canShowStats) {
    return (
      <Card>
        <div className="text-center py-12">
          <span className="text-4xl mb-4 block">📊</span>
          <h3 className="text-white font-semibold mb-2">Server stats not yet available</h3>
          <p className="text-neutral-400 text-sm max-w-md mx-auto">
            CPU, memory, and bandwidth usage will be displayed here once your server has been provisioned with IP and access credentials by our admin team.
          </p>
        </div>
      </Card>
    );
  }

  if (loading) {
    return <div className="flex justify-center py-24"><LoadingSpinner size="lg" /></div>;
  }

  if (unavailable && !stats) {
    return (
      <Card>
        <div className="text-center py-12">
          <span className="text-4xl mb-4 block">⚠️</span>
          <h3 className="text-white font-semibold mb-2">Unable to fetch server stats</h3>
          <p className="text-neutral-400 text-sm max-w-md mx-auto">
            {unavailable.message || 'Could not connect to your server. Please try again later or contact support.'}
          </p>
        </div>
      </Card>
    );
  }

  const usage = stats || { cpu: 0, mem: 0, bw: 0, storage: 0 };
  const history = stats?.history || [];
  const cpuSeries = history.length
    ? history.slice(-14).map((h) => h.cpu)
    : genChartSeries(service.id.split('').reduce((a, c) => a + c.charCodeAt(0), 0), usage.cpu, 30);
  const memSeries = history.length
    ? history.slice(-14).map((h) => h.mem)
    : genChartSeries(service.id.split('').reduce((a, c) => a + c.charCodeAt(0), 0) * 3, usage.mem, 25);
  const bwSeries = history.length
    ? history.slice(-14).map((h) => h.bw)
    : genChartSeries(service.id.split('').reduce((a, c) => a + c.charCodeAt(0), 0) * 7, usage.bw, 35);

  const usageBars = [
    { label: 'CPU Usage (live)', value: usage.cpu, color: usage.cpu > 80 ? 'bg-red-500' : usage.cpu > 60 ? 'bg-yellow-500' : 'bg-green-500' },
    { label: 'Memory Usage', value: usage.mem, color: usage.mem > 80 ? 'bg-red-500' : usage.mem > 60 ? 'bg-yellow-500' : 'bg-blue-500' },
    { label: 'Bandwidth Used', value: usage.bw, color: 'bg-white' },
    { label: 'Disk Usage', value: usage.storage, color: usage.storage > 80 ? 'bg-red-500' : 'bg-purple-500' },
  ];

  return (
    <div className="space-y-6">
      {/* Stats overview */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Days Active', value: daysActive, suffix: ' days' },
          { label: 'CPU Cores', value: cfg.vcpu || '—', suffix: ' vCPU' },
          { label: 'RAM', value: cfg.ram || '—', suffix: '' },
          { label: 'Storage', value: cfg.storage || '—', suffix: '' },
        ].map((s) => (
          <Card key={s.label} className="!p-4 text-center">
            <p className="text-neutral-500 text-xs mb-1">{s.label}</p>
            <p className="text-white font-bold text-xl">{s.value}<span className="text-sm font-normal text-neutral-400">{s.suffix}</span></p>
          </Card>
        ))}
      </div>

      {/* Line charts */}
      <div className="grid lg:grid-cols-2 gap-6">
        <Card>
          <LineChart
            title="CPU Usage"
            subtitle="Last 14 days"
            data={cpuSeries}
            color="#22c55e"
            badge="Live"
          />
        </Card>
        <Card>
          <LineChart
            title="Bandwidth Usage"
            subtitle="Last 14 readings"
            data={bwSeries}
            color="#a855f7"
            badge="Live"
          />
        </Card>
      </div>

      <Card>
        <LineChart
          title="Memory Usage"
          subtitle="Last 14 readings"
          data={memSeries}
          color="#3b82f6"
          badge="Live"
        />
      </Card>

      {/* Usage Bars */}
      <Card>
        <h3 className="text-white font-semibold mb-5">Current Resource Usage</h3>
        <div className="space-y-5">
          {usageBars.map((b) => (
            <UsageBar key={b.label} label={b.label} value={b.value} color={b.color} />
          ))}
        </div>
        <p className="text-xs text-neutral-600 mt-4">
          * Stats are fetched live from your server via SSH. Last updated: {stats?.fetchedAt ? new Date(stats.fetchedAt).toLocaleString() : '—'}
        </p>
      </Card>

      {/* Billing Periods */}
      <Card>
        <h3 className="text-white font-semibold mb-4">Billing Periods</h3>
        <div className="space-y-3">
          {Array.from({ length: Math.min(3, Math.ceil(daysActive / 30) + 1) }, (_, i) => {
            if (!created) return null;
            const start = new Date(created);
            start.setMonth(start.getMonth() + i);
            const end = new Date(start);
            end.setMonth(end.getMonth() + 1);
            const isPast = end < now;
            const isCurrent = !isPast && start <= now;
            return (
              <div key={i} className={`flex items-center justify-between p-3 rounded-lg border ${
                isCurrent ? 'border-white/20 bg-white/5' : 'border-neutral-800 bg-neutral-950'
              }`}>
                <div>
                  <p className="text-white text-sm font-medium">Period {i + 1}</p>
                  <p className="text-neutral-500 text-xs">{fmtDate(start)} → {fmtDate(end)}</p>
                </div>
                <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                  isCurrent ? 'bg-white/10 text-white border border-white/20' :
                  isPast ? 'bg-neutral-800 text-neutral-400' : 'bg-neutral-900 text-neutral-500'
                }`}>
                  {isCurrent ? 'Current' : isPast ? 'Completed' : 'Upcoming'}
                </span>
              </div>
            );
          })}
        </div>
      </Card>

      {/* Network */}
      <Card>
        <h3 className="text-white font-semibold mb-4">Network & Bandwidth</h3>
        <div className="grid sm:grid-cols-3 gap-4 text-sm">
          {[
            { label: 'Bandwidth Included', value: cfg.bandwidth || '—' },
            { label: 'Data In (est.)', value: `${Math.floor(usage.bw * 0.4)} GB` },
            { label: 'Data Out (est.)', value: `${Math.floor(usage.bw * 0.6)} GB` },
          ].map((s) => (
            <div key={s.label} className="bg-neutral-900 border border-neutral-800 rounded-lg p-3">
              <p className="text-neutral-500 text-xs mb-1">{s.label}</p>
              <p className="text-white font-semibold">{s.value}</p>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

function ManageTab({ service, onServiceUpdate }) {
  const { user } = useAuth();
  const router = useRouter();
  const [restarting, setRestarting] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [restartMsg, setRestartMsg] = useState('');
  const [cancelStep, setCancelStep] = useState(0);
  const [platformSettings, setPlatformSettings] = useState(null);
  const [onDemandToggling, setOnDemandToggling] = useState(false);
  const [onDemandError, setOnDemandError] = useState('');

  useEffect(() => {
    getOnDemandSettings().then(setPlatformSettings);
  }, []);

  const onDemandEligible = platformSettings && isServiceOnDemandEligible(service, platformSettings);
  const canToggleOnDemand = platformSettings && canUserToggleOnDemand(service, platformSettings);
  const onDemandEnabled = service.onDemandUsage?.enabled;
  const onDemandRates = platformSettings ? getServiceOnDemandRates(service, platformSettings) : null;

  async function handleOnDemandToggle() {
    if (!user || !canToggleOnDemand) return;
    setOnDemandToggling(true);
    setOnDemandError('');
    try {
      const updated = await toggleServiceOnDemandUsage(service.id, user.uid, !onDemandEnabled);
      onServiceUpdate({ onDemandUsage: updated });
    } catch (err) {
      setOnDemandError(err.message);
    } finally {
      setOnDemandToggling(false);
    }
  }

  async function handleRestart() {
    setRestarting(true);
    setRestartMsg('');
    try {
      await requestServiceRestart(service.id, user.uid);
      setRestartMsg('Restart request submitted. Your instance will restart within 5–10 minutes.');
      onServiceUpdate({ restartRequested: true });
    } catch (err) {
      setRestartMsg('Error: ' + err.message);
    } finally {
      setRestarting(false);
    }
  }

  async function handleCancel() {
    if (cancelStep === 0) { setCancelStep(1); return; }
    setCancelling(true);
    try {
      await cancelService(service.id, user.uid);
      router.push('/dashboard/services');
    } catch (err) {
      setCancelling(false);
    }
  }

  const isActive = service.status === 'active';
  const isCancelled = service.status === 'cancelled';

  return (
    <div className="space-y-6 max-w-xl">
      {onDemandEligible && (
        <Card>
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-emerald-950 border border-emerald-800/50 flex items-center justify-center shrink-0">
              <svg className="w-5 h-5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            </div>
            <div className="flex-1">
              <h3 className="text-white font-semibold mb-1">On-Demand Usage</h3>
              <p className="text-neutral-400 text-sm mb-3">
                Enable pay-as-you-go billing for usage beyond your plan&apos;s included resources. Charges are invoiced at the end of each billing period.
              </p>

              {onDemandRates && (
                <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-3 mb-3 text-xs space-y-1">
                  <div className="flex justify-between"><span className="text-neutral-500">vCPU</span><span className="text-white">{formatCurrency(onDemandRates.vcpu)}/hr per core</span></div>
                  <div className="flex justify-between"><span className="text-neutral-500">RAM</span><span className="text-white">{formatCurrency(onDemandRates.ram)}/hr per GB</span></div>
                  <div className="flex justify-between"><span className="text-neutral-500">Storage</span><span className="text-white">{formatCurrency(onDemandRates.storage)}/hr per GB</span></div>
                  <div className="flex justify-between"><span className="text-neutral-500">Bandwidth</span><span className="text-white">{formatCurrency(onDemandRates.bandwidth)}/GB</span></div>
                </div>
              )}

              {service.onDemandUsage?.adminLocked && (
                <p className="text-yellow-400 text-sm mb-3 bg-yellow-950/30 border border-yellow-900/30 rounded-lg px-3 py-2">
                  On-demand usage is locked by an administrator.
                </p>
              )}

              {onDemandError && (
                <p className="text-red-400 text-sm mb-3">{onDemandError}</p>
              )}

              <div className="flex items-center gap-4">
                <button
                  type="button"
                  onClick={handleOnDemandToggle}
                  disabled={onDemandToggling || !canToggleOnDemand}
                  className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors ${
                    onDemandEnabled ? 'bg-green-600' : 'bg-neutral-700'
                  } ${!canToggleOnDemand ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                >
                  <span className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${
                    onDemandEnabled ? 'translate-x-6' : 'translate-x-1'
                  }`} />
                </button>
                <span className="text-sm text-neutral-300">
                  {onDemandEnabled ? 'On-demand usage enabled' : 'On-demand usage disabled'}
                </span>
              </div>

              <Link href="/dashboard/on-demand" className="inline-block mt-3 text-xs text-neutral-400 hover:text-white">
                Manage all on-demand services →
              </Link>
            </div>
          </div>
        </Card>
      )}

      {/* Restart */}
      <Card>
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-xl bg-blue-950 border border-blue-800/50 flex items-center justify-center shrink-0">
            <svg className="w-5 h-5 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </div>
          <div className="flex-1">
            <h3 className="text-white font-semibold mb-1">Restart Instance</h3>
            <p className="text-neutral-400 text-sm mb-4">Request a graceful restart of your EC2 instance. The server will restart within 5–10 minutes. Brief downtime expected.</p>
            {restartMsg && (
              <p className={`text-sm mb-3 p-3 rounded-lg border ${restartMsg.startsWith('Error') ? 'text-red-400 border-red-900/40 bg-red-950/30' : 'text-green-400 border-green-900/40 bg-green-950/30'}`}>
                {restartMsg}
              </p>
            )}
            {service.restartRequested && !restartMsg && (
              <p className="text-yellow-400 text-sm mb-3 bg-yellow-950/30 border border-yellow-900/30 rounded-lg px-3 py-2">
                A restart request is already pending.
              </p>
            )}
            <Button
              onClick={handleRestart}
              disabled={restarting || !isActive || !!service.restartRequested}
              variant="secondary"
            >
              {restarting ? 'Submitting…' : 'Request Restart'}
            </Button>
          </div>
        </div>
      </Card>

      {/* Open ticket */}
      <Card>
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-xl bg-neutral-800 border border-neutral-700 flex items-center justify-center shrink-0">
            <svg className="w-5 h-5 text-neutral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
          </div>
          <div>
            <h3 className="text-white font-semibold mb-1">Get Support</h3>
            <p className="text-neutral-400 text-sm mb-4">Having issues with your instance? Open a support ticket and our team will assist you.</p>
            <Link href={`/dashboard/support?service=${service.id}`}>
              <Button variant="secondary">Open Support Ticket</Button>
            </Link>
          </div>
        </div>
      </Card>

      {/* Cancel */}
      {!isCancelled && (
        <Card className="border-red-900/30">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-red-950/50 border border-red-900/40 flex items-center justify-center shrink-0">
              <svg className="w-5 h-5 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
              </svg>
            </div>
            <div className="flex-1">
              <h3 className="text-white font-semibold mb-1">Cancel Subscription</h3>
              <p className="text-neutral-400 text-sm mb-4">
                Cancelling will stop your service at the end of the current billing period. All data will be permanently deleted. <strong className="text-white">This action cannot be undone.</strong>
              </p>

              {cancelStep === 1 && (
                <div className="bg-red-950/30 border border-red-900/40 rounded-xl p-4 mb-4">
                  <p className="text-red-300 font-medium text-sm mb-1">⚠️ Are you absolutely sure?</p>
                  <p className="text-red-400/80 text-xs">Your EC2 instance and all data will be permanently removed. Make sure you have backed up everything you need.</p>
                </div>
              )}

              <div className="flex gap-2">
                {cancelStep === 0 ? (
                  <button
                    onClick={() => setCancelStep(1)}
                    className="px-4 py-2 text-sm text-red-400 border border-red-900/50 rounded-lg hover:bg-red-950/30 transition-colors"
                  >
                    Cancel Subscription
                  </button>
                ) : (
                  <>
                    <button
                      onClick={handleCancel}
                      disabled={cancelling}
                      className="px-4 py-2 text-sm font-medium text-white bg-red-700 rounded-lg hover:bg-red-600 transition-colors disabled:opacity-50"
                    >
                      {cancelling ? 'Cancelling…' : 'Yes, Cancel My Subscription'}
                    </button>
                    <button
                      onClick={() => setCancelStep(0)}
                      className="px-4 py-2 text-sm text-neutral-400 border border-neutral-700 rounded-lg hover:text-white transition-colors"
                    >
                      Keep Service
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </Card>
      )}

      {isCancelled && (
        <Card>
          <div className="flex items-center gap-3 text-neutral-400">
            <span className="text-2xl">❌</span>
            <div>
              <p className="text-white font-medium">Service Cancelled</p>
              <p className="text-sm">This service was cancelled on {fmtDate(service.cancelledAt)}.</p>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────

const TABS = [
  { id: 'overview', label: 'Overview', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
  { id: 'connect', label: 'Connect', icon: 'M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z' },
  { id: 'usage', label: 'Usage & Stats', icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z' },
  { id: 'manage', label: 'Manage', icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z' },
];

export default function ServiceDetailPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const [service, setService] = useState(null);
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    if (!user || !id) return;
    async function load() {
      const s = await getService(id);
      if (s?.userId !== user.uid) { setService(null); setLoading(false); return; }
      setService(s);
      const allInv = await getUserInvoices(user.uid);
      setInvoices(allInv.filter((i) => i.serviceId === id));
      setLoading(false);
    }
    load();
  }, [user, id]);

  const handleServiceUpdate = useCallback((patch) => {
    setService((prev) => prev ? { ...prev, ...patch } : prev);
  }, []);

  const isEc2 = service?.type === 'ec2' || service?.type === 'vps';
  const tabs = isEc2 ? TABS : TABS.filter(t => t.id !== 'connect');

  if (loading) return <div className="flex justify-center py-24"><LoadingSpinner size="lg" /></div>;

  if (!service) {
    return (
      <div className="text-center py-24">
        <h1 className="text-xl text-white mb-4">Service not found</h1>
        <Link href="/dashboard/services"><Button>Back to services</Button></Link>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-4">
        <Link href="/dashboard/services" className="inline-flex items-center text-sm text-neutral-400 hover:text-white transition-colors mb-4">
          <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          All services
        </Link>
      </div>

      <PageHeader
        title={service.name}
        description={`${(service.type || '').replace('-', ' ').toUpperCase()} · ${service.config?.vcpu ? `${service.config.vcpu} vCPU, ${service.config.ram}` : ''}`}
        action={
          <div className="flex gap-2">
            {service.status === 'active' && (
              <StatusBadge status="active" />
            )}
            {service.type === 'cdn_hosting' && service.status === 'active' && (
              <Link href="/dashboard/cdn"><Button size="sm">CDN Dashboard</Button></Link>
            )}
          </div>
        }
      />

      {/* Tab nav */}
      <div className="flex gap-1 border-b border-neutral-800 mb-6 overflow-x-auto">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
              activeTab === tab.id
                ? 'border-white text-white'
                : 'border-transparent text-neutral-400 hover:text-white'
            }`}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={tab.icon} />
            </svg>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === 'overview' && <OverviewTab service={service} invoices={invoices} />}
      {activeTab === 'connect' && isEc2 && <ConnectTab service={service} />}
      {activeTab === 'usage' && <UsageTab service={service} />}
      {activeTab === 'manage' && <ManageTab service={service} onServiceUpdate={handleServiceUpdate} />}
    </div>
  );
}
