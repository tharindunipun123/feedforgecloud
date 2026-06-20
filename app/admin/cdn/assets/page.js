'use client';

import { useEffect, useState } from 'react';
import { PageHeader, LoadingSpinner, Card } from '@/components/ui';
import AssetGrid from '@/components/cdn/AssetGrid';
import { getAllCdnAssets, deleteCdnAsset } from '@/lib/firebase/cdn';

export default function AdminCdnAssetsPage() {
  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = () => getAllCdnAssets().then(setAssets).finally(() => setLoading(false));

  useEffect(load, []);

  const handleDelete = async (asset) => {
    await deleteCdnAsset(asset.userId, asset.id);
    await load();
  };

  if (loading) {
    return <div className="flex justify-center py-24"><LoadingSpinner size="lg" /></div>;
  }

  return (
    <div>
      <PageHeader
        title="CDN Assets"
        description={`${assets.length} active asset${assets.length !== 1 ? 's' : ''} across all users.`}
      />
      {assets.length === 0 ? (
        <Card><p className="text-neutral-400 text-center py-8">No CDN assets yet.</p></Card>
      ) : (
        <AssetGrid
          assets={assets}
          onDelete={handleDelete}
          showUser
          detailHrefPrefix="/dashboard/cdn/assets"
        />
      )}
    </div>
  );
}
