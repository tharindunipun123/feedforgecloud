'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { Button, Input, Card, StatusBadge } from '@/components/ui';
import { formatBillingDate } from '@/lib/billing/helpers';
import { formatCreditsMB } from '@/data/cdn';

function formatFileSize(bytes) {
  if (!bytes) return '—';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function AssetThumbnail({ asset }) {
  if (asset.fileType === 'image' && asset.publicUrl) {
    return (
      <img
        src={asset.publicUrl}
        alt={asset.altText || asset.fileName}
        className="w-full h-full object-cover"
      />
    );
  }
  if (asset.fileType === 'video') {
    return (
      <div className="w-full h-full flex items-center justify-center bg-neutral-900">
        <svg className="w-8 h-8 text-neutral-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.069A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
        </svg>
      </div>
    );
  }
  return (
    <div className="w-full h-full flex items-center justify-center bg-neutral-900">
      <svg className="w-8 h-8 text-neutral-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    </div>
  );
}

export default function AssetGrid({
  assets = [],
  onDelete,
  onCopyUrl,
  detailHrefPrefix = '/dashboard/cdn/assets',
  showUser = false,
}) {
  const [view, setView] = useState('grid');
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [deleting, setDeleting] = useState(null);
  const [copied, setCopied] = useState(null);

  const filtered = useMemo(() => {
    return assets.filter((a) => {
      const q = search.toLowerCase();
      const matchesSearch =
        !q ||
        a.fileName?.toLowerCase().includes(q) ||
        a.mimeType?.toLowerCase().includes(q);
      const matchesType = typeFilter === 'all' || a.fileType === typeFilter;
      return matchesSearch && matchesType;
    });
  }, [assets, search, typeFilter]);

  const handleCopy = async (asset) => {
    const url = asset.cdnUrl || asset.publicUrl;
    if (!url) return;
    await navigator.clipboard.writeText(url);
    setCopied(asset.id);
    onCopyUrl?.(asset);
    setTimeout(() => setCopied(null), 2000);
  };

  const handleDelete = async (asset) => {
    if (!confirm(`Delete "${asset.fileName}"? This cannot be undone.`)) return;
    setDeleting(asset.id);
    try {
      await onDelete?.(asset);
    } finally {
      setDeleting(null);
    }
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <Input
          placeholder="Search by name or type…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1"
        />
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="px-4 py-2.5 bg-neutral-950 border border-neutral-700 rounded-lg text-white text-sm"
        >
          <option value="all">All types</option>
          <option value="image">Images</option>
          <option value="video">Videos</option>
          <option value="file">Files</option>
        </select>
        <div className="flex gap-2">
          <Button variant={view === 'grid' ? 'primary' : 'secondary'} size="sm" onClick={() => setView('grid')}>
            Grid
          </Button>
          <Button variant={view === 'table' ? 'primary' : 'secondary'} size="sm" onClick={() => setView('table')}>
            Table
          </Button>
        </div>
      </div>

      {filtered.length === 0 ? (
        <Card>
          <p className="text-neutral-400 text-center py-8">No assets match your filters.</p>
        </Card>
      ) : view === 'grid' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map((asset) => (
            <Card key={asset.id} className="!p-0 overflow-hidden">
              <Link href={`${detailHrefPrefix}/${asset.id}`}>
                <div className="aspect-video bg-neutral-900">
                  <AssetThumbnail asset={asset} />
                </div>
              </Link>
              <div className="p-4">
                <Link href={`${detailHrefPrefix}/${asset.id}`}>
                  <p className="text-white text-sm font-medium truncate mb-1 hover:underline">{asset.fileName}</p>
                </Link>
                <p className="text-neutral-500 text-xs mb-3">
                  {formatFileSize(asset.fileSizeBytes)} · {asset.fileType}
                </p>
                <div className="flex gap-2">
                  <Button variant="secondary" size="sm" className="flex-1" onClick={() => handleCopy(asset)}>
                    {copied === asset.id ? 'Copied' : 'Copy URL'}
                  </Button>
                  {onDelete && (
                    <Button
                      variant="danger"
                      size="sm"
                      disabled={deleting === asset.id}
                      onClick={() => handleDelete(asset)}
                    >
                      Delete
                    </Button>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-neutral-800 text-neutral-400 text-left">
                <th className="py-3 pr-4">Preview</th>
                <th className="py-3 pr-4">Name</th>
                {showUser && <th className="py-3 pr-4">User</th>}
                <th className="py-3 pr-4">Type</th>
                <th className="py-3 pr-4">Size</th>
                <th className="py-3 pr-4">Credits</th>
                <th className="py-3 pr-4">Date</th>
                <th className="py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((asset) => (
                <tr key={asset.id} className="border-b border-neutral-800">
                  <td className="py-3 pr-4">
                    <div className="w-12 h-12 rounded overflow-hidden bg-neutral-900">
                      <AssetThumbnail asset={asset} />
                    </div>
                  </td>
                  <td className="py-3 pr-4">
                    <Link href={`${detailHrefPrefix}/${asset.id}`} className="text-white hover:underline">
                      {asset.fileName}
                    </Link>
                  </td>
                  {showUser && (
                    <td className="py-3 pr-4 text-neutral-400 font-mono text-xs">{asset.userId?.slice(0, 8)}…</td>
                  )}
                  <td className="py-3 pr-4"><StatusBadge status={asset.fileType || 'file'} /></td>
                  <td className="py-3 pr-4 text-neutral-300">{formatFileSize(asset.fileSizeBytes)}</td>
                  <td className="py-3 pr-4 text-neutral-300">{formatCreditsMB(asset.fileSizeMB || 0)}</td>
                  <td className="py-3 pr-4 text-neutral-400">{formatBillingDate(asset.createdAt)}</td>
                  <td className="py-3">
                    <div className="flex gap-2">
                      <Button variant="ghost" size="sm" onClick={() => handleCopy(asset)}>
                        {copied === asset.id ? 'Copied' : 'Copy'}
                      </Button>
                      {onDelete && (
                        <Button
                          variant="danger"
                          size="sm"
                          disabled={deleting === asset.id}
                          onClick={() => handleDelete(asset)}
                        >
                          Delete
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
