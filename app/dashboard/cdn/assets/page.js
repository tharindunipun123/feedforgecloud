'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { PageHeader, LoadingSpinner, EmptyState, Button } from '@/components/ui';
import AssetGrid from '@/components/cdn/AssetGrid';
import { getUserCdnSubscription, getUserCdnAssets, deleteCdnAsset } from '@/lib/firebase/cdn';

export default function CdnAssetsPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [subscription, setSubscription] = useState(null);
  const [assets, setAssets] = useState([]);

  const load = async () => {
    if (!user) return;
    const [sub, userAssets] = await Promise.all([
      getUserCdnSubscription(user.uid),
      getUserCdnAssets(user.uid),
    ]);
    setSubscription(sub);
    setAssets(userAssets);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, [user]);

  const handleDelete = async (asset) => {
    await deleteCdnAsset(user.uid, asset.id);
    await load();
  };

  if (loading) {
    return <div className="flex justify-center py-24"><LoadingSpinner size="lg" /></div>;
  }

  if (!subscription) {
    return (
      <div>
        <PageHeader title="CDN Assets" description="Browse and manage your uploaded media." />
        <EmptyState
          title="No active CDN subscription"
          description="Subscribe to a CDN plan to upload and manage assets."
          action={
            <Link href="/cdn-pricing"><Button>Browse CDN plans</Button></Link>
          }
        />
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="CDN Assets"
        description={`${assets.length} active asset${assets.length !== 1 ? 's' : ''} in your library.`}
        action={
          <Link href="/dashboard/cdn/upload"><Button size="sm">Upload</Button></Link>
        }
      />
      {assets.length === 0 ? (
        <EmptyState
          title="No assets yet"
          description="Upload your first file to get a CDN URL."
          action={
            <Link href="/dashboard/cdn/upload"><Button>Upload media</Button></Link>
          }
        />
      ) : (
        <AssetGrid assets={assets} onDelete={handleDelete} />
      )}
    </div>
  );
}
