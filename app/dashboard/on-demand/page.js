'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import {
  PageHeader,
  Card,
  LoadingSpinner,
  StatusBadge,
  Button,
  EmptyState,
} from '@/components/ui';
import {
  getUserServices,
  getOnDemandSettings,
  toggleServiceOnDemandUsage,
  getUserUsageCharges,
} from '@/lib/firebase/firestore';
import { formatCurrency } from '@/lib/billing/helpers';
import {
  canUserToggleOnDemand,
  getServiceOnDemandRates,
  isServiceOnDemandEligible,
} from '@/data/on-demand';

function RateRow({ label, value }) {
  return (
    <div className="flex justify-between text-sm py-1.5 border-b border-neutral-800 last:border-0">
      <span className="text-neutral-400">{label}</span>
      <span className="text-white font-mono text-xs">{value}</span>
    </div>
  );
}

function ServiceOnDemandCard({ service, platformSettings, onUpdate }) {
  const { user } = useAuth();
  const [toggling, setToggling] = useState(false);
  const [error, setError] = useState('');

  const eligible = isServiceOnDemandEligible(service, platformSettings);
  const canToggle = canUserToggleOnDemand(service, platformSettings);
  const enabled = service.onDemandUsage?.enabled;
  const rates = getServiceOnDemandRates(service, platformSettings);
  const locked = service.onDemandUsage?.adminLocked;

  const handleToggle = async () => {
    if (!user || !canToggle) return;
    setToggling(true);
    setError('');
    try {
      const updated = await toggleServiceOnDemandUsage(service.id, user.uid, !enabled);
      onUpdate({ onDemandUsage: updated });
    } catch (err) {
      setError(err.message);
    } finally {
      setToggling(false);
    }
  };

  if (!eligible) return null;

  return (
    <Card>
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <h3 className="text-white font-semibold">{service.name}</h3>
            <StatusBadge status={service.status} />
            {enabled && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-green-950 text-green-400 border border-green-800">
                On-demand active
              </span>
            )}
            {locked && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-red-950 text-red-400 border border-red-800">
                Admin locked
              </span>
            )}
          </div>
          <p className="text-neutral-400 text-sm capitalize mb-3">{service.type} · {service.billingCycle || 'monthly'} plan</p>

          <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-3 mb-3">
            <p className="text-xs text-neutral-500 mb-2">On-demand rates for this service</p>
            <RateRow label="vCPU" value={`${formatCurrency(rates.vcpu)}/hr per core`} />
            <RateRow label="RAM" value={`${formatCurrency(rates.ram)}/hr per GB`} />
            <RateRow label="Storage" value={`${formatCurrency(rates.storage)}/hr per GB`} />
            <RateRow label="Bandwidth" value={`${formatCurrency(rates.bandwidth)}/GB`} />
          </div>

          <p className="text-xs text-neutral-500">
            {platformSettings.billingNote}
          </p>
          {error && <p className="text-red-400 text-sm mt-2">{error}</p>}
        </div>

        <div className="flex flex-col gap-2 shrink-0">
          <button
            type="button"
            onClick={handleToggle}
            disabled={toggling || !canToggle}
            className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors ${
              enabled ? 'bg-green-600' : 'bg-neutral-700'
            } ${!canToggle ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
            aria-label={enabled ? 'Disable on-demand usage' : 'Enable on-demand usage'}
          >
            <span
              className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${
                enabled ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
          <span className="text-xs text-neutral-500 text-center">
            {enabled ? 'Enabled' : 'Disabled'}
          </span>
          <Link href={`/dashboard/services/${service.id}`}>
            <Button variant="secondary" size="sm">Manage service</Button>
          </Link>
        </div>
      </div>
    </Card>
  );
}

export default function OnDemandUsagePage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [services, setServices] = useState([]);
  const [platformSettings, setPlatformSettings] = useState(null);
  const [usageCharges, setUsageCharges] = useState([]);

  useEffect(() => {
    if (!user) return;
    async function load() {
      const [s, settings, charges] = await Promise.all([
        getUserServices(user.uid),
        getOnDemandSettings(),
        getUserUsageCharges(user.uid),
      ]);
      setServices(s);
      setPlatformSettings(settings);
      setUsageCharges(charges);
      setLoading(false);
    }
    load();
  }, [user]);

  const eligibleServices = services.filter((s) =>
    isServiceOnDemandEligible(s, platformSettings || {})
  );
  const enabledCount = eligibleServices.filter((s) => s.onDemandUsage?.enabled).length;

  const handleServiceUpdate = (serviceId, patch) => {
    setServices((prev) =>
      prev.map((s) => (s.id === serviceId ? { ...s, ...patch } : s))
    );
  };

  if (loading) {
    return <div className="flex justify-center py-24"><LoadingSpinner size="lg" /></div>;
  }

  if (!platformSettings?.globallyEnabled) {
    return (
      <div>
        <PageHeader title="On-Demand Usage" description="Pay for extra resources beyond your plan limits." />
        <EmptyState
          title="On-demand usage unavailable"
          description="On-demand billing is currently disabled. Contact support for more information."
        />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <PageHeader
        title="On-Demand Usage"
        description="Enable pay-as-you-go billing on your subscription services for usage beyond included resources."
      />

      <div className="grid sm:grid-cols-3 gap-4">
        {[
          { label: 'Eligible services', value: eligibleServices.length },
          { label: 'On-demand enabled', value: enabledCount },
          { label: 'Usage charges', value: usageCharges.length },
        ].map((s) => (
          <Card key={s.label} className="!p-4 text-center">
            <p className="text-neutral-500 text-xs mb-1">{s.label}</p>
            <p className="text-white text-2xl font-bold">{s.value}</p>
          </Card>
        ))}
      </div>

      {eligibleServices.length === 0 ? (
        <EmptyState
          title="No eligible services"
          description="Purchase an EC2 or n8n subscription plan to enable on-demand usage billing."
          action={<Link href="/ec2-pricing"><Button size="sm">Browse EC2 plans</Button></Link>}
        />
      ) : (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-white">Your services</h2>
          {eligibleServices.map((service) => (
            <ServiceOnDemandCard
              key={service.id}
              service={service}
              platformSettings={platformSettings}
              onUpdate={(patch) => handleServiceUpdate(service.id, patch)}
            />
          ))}
        </div>
      )}

      {usageCharges.length > 0 && (
        <Card>
          <h2 className="text-lg font-semibold text-white mb-4">Recent usage charges</h2>
          <div className="space-y-2">
            {usageCharges.slice(0, 10).map((charge) => (
              <div key={charge.id} className="flex justify-between items-center py-2 border-b border-neutral-800 last:border-0 text-sm">
                <div>
                  <p className="text-white">{charge.description || 'Usage charge'}</p>
                  <p className="text-neutral-500 text-xs">
                    {charge.periodStart} → {charge.periodEnd}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-white font-medium">{formatCurrency(charge.amount)}</p>
                  <StatusBadge status={charge.status} />
                </div>
              </div>
            ))}
          </div>
          <Link href="/dashboard/invoices" className="inline-block mt-4 text-sm text-neutral-400 hover:text-white">
            View all invoices →
          </Link>
        </Card>
      )}
    </div>
  );
}
