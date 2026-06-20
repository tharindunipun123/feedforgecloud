'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { PageHeader, Card, LoadingSpinner, EmptyState, Button, StatusBadge } from '@/components/ui';
import { getUserCdnSubscription, getCdnAsset, deleteCdnAsset } from '@/lib/firebase/cdn';
import { formatBillingDate } from '@/lib/billing/helpers';
import { formatCreditsMB } from '@/data/cdn';

function formatFileSize(bytes) {
  if (!bytes) return '—';
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export default function CdnAssetDetailPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [subscription, setSubscription] = useState(null);
  const [asset, setAsset] = useState(null);
  const [copied, setCopied] = useState(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!user || !id) return;
    async function load() {
      const [sub, a] = await Promise.all([
        getUserCdnSubscription(user.uid),
        getCdnAsset(id),
      ]);
      if (a?.userId !== user.uid || a?.status === 'deleted') {
        setAsset(null);
      } else {
        setAsset(a);
      }
      setSubscription(sub);
      setLoading(false);
    }
    load();
  }, [user, id]);

  const copyUrl = async (field) => {
    const url = field === 'cdn' ? asset.cdnUrl : asset.publicUrl;
    if (!url) return;
    await navigator.clipboard.writeText(url);
    setCopied(field);
    setTimeout(() => setCopied(null), 2000);
  };

  const handleDelete = async () => {
    if (!confirm(`Delete "${asset.fileName}"? This cannot be undone.`)) return;
    setDeleting(true);
    try {
      await deleteCdnAsset(user.uid, asset.id);
      window.location.href = '/dashboard/cdn/assets';
    } catch (err) {
      alert(err.message || 'Failed to delete asset');
      setDeleting(false);
    }
  };

  if (loading) {
    return <div className="flex justify-center py-24"><LoadingSpinner size="lg" /></div>;
  }

  if (!subscription) {
    return (
      <div>
        <PageHeader title="Asset Detail" />
        <EmptyState
          title="No active CDN subscription"
          action={
            <Link href="/cdn-pricing"><Button>Browse CDN plans</Button></Link>
          }
        />
      </div>
    );
  }

  if (!asset) {
    return (
      <div className="text-center py-24">
        <h1 className="text-xl text-white mb-4">Asset not found</h1>
        <Link href="/dashboard/cdn/assets"><Button>Back to assets</Button></Link>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title={asset.fileName}
        description="Asset preview and metadata"
        action={
          <Link href="/dashboard/cdn/assets">
            <Button variant="secondary" size="sm">← Back</Button>
          </Link>
        }
      />

      <div className="grid lg:grid-cols-2 gap-6">
        <Card>
          <h2 className="text-lg font-semibold text-white mb-4">Preview</h2>
          <div className="bg-neutral-900 rounded-lg overflow-hidden aspect-video flex items-center justify-center">
            {asset.fileType === 'image' && asset.publicUrl ? (
              <img src={asset.publicUrl} alt={asset.altText || asset.fileName} className="max-w-full max-h-full object-contain" />
            ) : asset.fileType === 'video' && asset.publicUrl ? (
              <video src={asset.publicUrl} controls className="max-w-full max-h-full" />
            ) : (
              <div className="text-center p-8">
                <svg className="w-16 h-16 text-neutral-600 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <p className="text-neutral-400 text-sm">No preview available</p>
              </div>
            )}
          </div>
        </Card>

        <div className="space-y-6">
          <Card>
            <h2 className="text-lg font-semibold text-white mb-4">Metadata</h2>
            <div className="space-y-3 text-sm">
              {[
                ['File name', asset.fileName],
                ['Type', asset.fileType],
                ['MIME type', asset.mimeType],
                ['Size', formatFileSize(asset.fileSizeBytes)],
                ['Credits used', formatCreditsMB(asset.fileSizeMB || 0)],
                ['Folder', asset.folder || '/'],
                ['Status', null],
                ['Uploaded', formatBillingDate(asset.createdAt)],
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between py-1 border-b border-neutral-800">
                  <span className="text-neutral-400">{k}</span>
                  {k === 'Status' ? (
                    <StatusBadge status={asset.status} />
                  ) : (
                    <span className="text-white">{v}</span>
                  )}
                </div>
              ))}
            </div>
          </Card>

          <Card>
            <h2 className="text-lg font-semibold text-white mb-4">URLs</h2>
            <div className="space-y-4">
              <div>
                <p className="text-neutral-400 text-xs mb-1">CDN URL</p>
                <p className="text-white text-sm break-all font-mono bg-neutral-900 p-3 rounded-lg mb-2">{asset.cdnUrl}</p>
                <Button variant="secondary" size="sm" onClick={() => copyUrl('cdn')}>
                  {copied === 'cdn' ? 'Copied' : 'Copy CDN URL'}
                </Button>
              </div>
              <div>
                <p className="text-neutral-400 text-xs mb-1">Public URL</p>
                <p className="text-white text-sm break-all font-mono bg-neutral-900 p-3 rounded-lg mb-2">{asset.publicUrl}</p>
                <Button variant="secondary" size="sm" onClick={() => copyUrl('public')}>
                  {copied === 'public' ? 'Copied' : 'Copy public URL'}
                </Button>
              </div>
            </div>
          </Card>

          <Button variant="danger" className="w-full" disabled={deleting} onClick={handleDelete}>
            {deleting ? 'Deleting…' : 'Delete asset'}
          </Button>
        </div>
      </div>
    </div>
  );
}
