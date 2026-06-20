export const CDN_PLANS = [
  {
    id: 'cdn-starter',
    slug: 'cdn-starter',
    name: 'CDN Starter',
    type: 'cdn_hosting',
    monthlyPrice: 9.99,
    renewalPrice: 9.99,
    storageCredits: 5120,
    bandwidthCredits: 10240,
    maxImageSizeMB: 10,
    maxVideoSizeMB: 100,
    allowedFileTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'video/mp4', 'application/pdf'],
    popular: false,
    features: [
      '5 GB storage credits',
      '10 GB bandwidth credits',
      '10 MB max image size',
      '100 MB max video size',
      'API access',
      'Monthly credit reset',
    ],
  },
  {
    id: 'cdn-growth',
    slug: 'cdn-growth',
    name: 'CDN Growth',
    type: 'cdn_hosting',
    monthlyPrice: 24.99,
    renewalPrice: 24.99,
    storageCredits: 20480,
    bandwidthCredits: 51200,
    maxImageSizeMB: 25,
    maxVideoSizeMB: 500,
    allowedFileTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml', 'video/mp4', 'video/webm', 'application/pdf', 'text/css', 'application/javascript'],
    popular: true,
    features: [
      '20 GB storage credits',
      '50 GB bandwidth credits',
      '25 MB max image size',
      '500 MB max video size',
      'Priority delivery',
      'API access',
    ],
  },
  {
    id: 'cdn-pro',
    slug: 'cdn-pro',
    name: 'CDN Pro',
    type: 'cdn_hosting',
    monthlyPrice: 49.99,
    renewalPrice: 49.99,
    storageCredits: 51200,
    bandwidthCredits: 153600,
    maxImageSizeMB: 50,
    maxVideoSizeMB: 2000,
    allowedFileTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml', 'video/mp4', 'video/webm', 'video/quicktime', 'application/pdf', 'text/css', 'application/javascript', 'font/woff2'],
    popular: false,
    features: [
      '50 GB storage credits',
      '150 GB bandwidth credits',
      '50 MB max image size',
      '2 GB max video size',
      'Custom domains',
      'Advanced API access',
    ],
  },
  {
    id: 'cdn-enterprise',
    slug: 'cdn-enterprise',
    name: 'CDN Enterprise',
    type: 'cdn_hosting',
    monthlyPrice: 99.99,
    renewalPrice: 99.99,
    storageCredits: 153600,
    bandwidthCredits: 512000,
    maxImageSizeMB: 100,
    maxVideoSizeMB: 5000,
    allowedFileTypes: ['*'],
    popular: false,
    features: [
      '150 GB storage credits',
      '500 GB bandwidth credits',
      '100 MB max image size',
      '5 GB max video size',
      'Dedicated support',
      'SLA 99.9%',
    ],
  },
];

export const CDN_ALLOWED_EXTENSIONS = {
  image: ['jpg', 'jpeg', 'png', 'webp', 'gif', 'svg'],
  video: ['mp4', 'webm', 'mov', 'quicktime'],
  file: ['pdf', 'css', 'js', 'woff', 'woff2', 'txt'],
};

export function getCdnPlanById(id) {
  return CDN_PLANS.find((p) => p.id === id || p.slug === id);
}

export function getCdnPlanBySlug(slug) {
  return CDN_PLANS.find((p) => p.slug === slug);
}

export function formatCreditsMB(mb) {
  if (mb >= 1024) return `${(mb / 1024).toFixed(1)} GB`;
  return `${mb.toFixed(1)} MB`;
}

export function getFileCategory(mimeType = '', fileName = '') {
  if (mimeType.startsWith('image/')) return 'image';
  if (mimeType.startsWith('video/')) return 'video';
  const ext = fileName.split('.').pop()?.toLowerCase();
  if (CDN_ALLOWED_EXTENSIONS.image.includes(ext)) return 'image';
  if (CDN_ALLOWED_EXTENSIONS.video.includes(ext)) return 'video';
  return 'file';
}

export function bytesToMB(bytes) {
  return bytes / (1024 * 1024);
}

export function creditsFromBytes(bytes) {
  return Math.ceil(bytesToMB(bytes));
}

export function generateCdnUrl(assetId, fileName) {
  const base = process.env.NEXT_PUBLIC_CDN_BASE_URL || 'https://cdn.quantumserver.cloud';
  return `${base}/${assetId}/${encodeURIComponent(fileName)}`;
}

export function generatePublicStorageUrl(storagePath) {
  const bucket = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET;
  const encoded = encodeURIComponent(storagePath);
  return `https://firebasestorage.googleapis.com/v0/b/${bucket}/o/${encoded}?alt=media`;
}
