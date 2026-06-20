'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { PageHeader, Card, LoadingSpinner, EmptyState, Button, StatusBadge, PromoBanner } from '@/components/ui';
import { getUserCdnSubscription, getUserCdnAssets } from '@/lib/firebase/cdn';
import { formatCreditsMB } from '@/data/cdn';
import { formatBillingDate } from '@/lib/billing/helpers';

export default function CdnOverviewPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [subscription, setSubscription] = useState(null);
  const [assets, setAssets] = useState([]);
  const [totalAssets, setTotalAssets] = useState(0);

  const load = async () => {
    if (!user) return;
    const [sub, userAssets] = await Promise.all([
      getUserCdnSubscription(user.uid),
      getUserCdnAssets(user.uid),
    ]);
    setSubscription(sub);
    setTotalAssets(userAssets.length);
    setAssets(userAssets.slice(0, 6));
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, [user]);

  if (loading) {
    return <div className="flex justify-center py-24"><LoadingSpinner size="lg" /></div>;
  }

  if (!subscription) {
    return (
      <div>
        <PromoBanner section="cdn" />
        <PageHeader title="CDN Overview" description="Manage your CDN storage and media assets." />
        <EmptyState
          title="No active CDN subscription"
          description="Subscribe to a CDN plan to upload and deliver media via dashboard or API."
          action={
            <Link href="/cdn-pricing"><Button>Browse CDN plans</Button></Link>
          }
        />
      </div>
    );
  }

  const storagePct = subscription.totalCredits
    ? Math.round(((subscription.usedCredits || 0) / subscription.totalCredits) * 100)
    : 0;
  const bandwidthPct = subscription.bandwidthCredits
    ? Math.round(((subscription.bandwidthUsedMB || 0) / subscription.bandwidthCredits) * 100)
    : 0;

  return (
    <div>
      <PageHeader
        title="CDN Overview"
        description="Your CDN subscription, credits, and recent uploads."
        action={
          <Link href="/dashboard/cdn/upload"><Button>Upload media</Button></Link>
        }
      />

      <div className="grid lg:grid-cols-3 gap-6 mb-8">
        <Card>
          <h2 className="text-lg font-semibold text-white mb-4">Current plan</h2>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-neutral-400">Plan</span>
              <span className="text-white">{subscription.planName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-neutral-400">Status</span>
              <StatusBadge status={subscription.status} />
            </div>
            <div className="flex justify-between">
              <span className="text-neutral-400">Credit reset</span>
              <span className="text-white">{formatBillingDate(subscription.monthlyResetDate)}</span>
            </div>
          </div>
        </Card>

        <Card>
          <h2 className="text-lg font-semibold text-white mb-4">Storage credits</h2>
          <p className="text-2xl font-bold text-white mb-2">
            {formatCreditsMB(subscription.remainingCredits || 0)} remaining
          </p>
          <p className="text-neutral-400 text-sm mb-3">
            {formatCreditsMB(subscription.usedCredits || 0)} of {formatCreditsMB(subscription.totalCredits || 0)} used
          </p>
          <div className="h-2 bg-neutral-800 rounded-full overflow-hidden">
            <div className="h-full bg-white" style={{ width: `${Math.min(storagePct, 100)}%` }} />
          </div>
        </Card>

        <Card>
          <h2 className="text-lg font-semibold text-white mb-4">Bandwidth credits</h2>
          <p className="text-2xl font-bold text-white mb-2">
            {formatCreditsMB((subscription.bandwidthCredits || 0) - (subscription.bandwidthUsedMB || 0))} remaining
          </p>
          <p className="text-neutral-400 text-sm mb-3">
            {formatCreditsMB(subscription.bandwidthUsedMB || 0)} of {formatCreditsMB(subscription.bandwidthCredits || 0)} used
          </p>
          <div className="h-2 bg-neutral-800 rounded-full overflow-hidden">
            <div className="h-full bg-neutral-400" style={{ width: `${Math.min(bandwidthPct, 100)}%` }} />
          </div>
        </Card>
      </div>

      <div className="grid sm:grid-cols-3 gap-4 mb-8">
        {[
          { label: 'Total assets', value: String(totalAssets) },
          { label: 'Storage used', value: formatCreditsMB(subscription.storageUsedMB || 0) },
          { label: 'Max image size', value: `${subscription.maxImageSizeMB || 10} MB` },
        ].map((stat) => (
          <Card key={stat.label} className="!py-4">
            <p className="text-neutral-400 text-sm">{stat.label}</p>
            <p className="text-xl font-bold text-white">{stat.value}</p>
          </Card>
        ))}
      </div>

      <Card>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-white">Recent assets</h2>
          <Link href="/dashboard/cdn/assets" className="text-sm text-neutral-400 hover:text-white">
            View all →
          </Link>
        </div>
        {assets.length === 0 ? (
          <p className="text-neutral-400 text-sm py-4">
            No uploads yet.{' '}
            <Link href="/dashboard/cdn/upload" className="text-white hover:underline">Upload your first file</Link>
          </p>
        ) : (
          <div className="space-y-3">
            {assets.map((a) => (
              <Link
                key={a.id}
                href={`/dashboard/cdn/assets/${a.id}`}
                className="flex items-center justify-between py-2 border-b border-neutral-800 last:border-0 hover:bg-neutral-900/50 -mx-2 px-2 rounded"
              >
                <span className="text-white text-sm truncate">{a.fileName}</span>
                <span className="text-neutral-500 text-xs shrink-0 ml-4">{formatBillingDate(a.createdAt)}</span>
              </Link>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
