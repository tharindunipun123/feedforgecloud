/** Live audio streaming — Node.js stack (Icecast2 + Liquidsoap) */

export const STREAMING_STACK = {
  name: 'Node.js Streaming Stack',
  components: ['Icecast2', 'Liquidsoap', 'Node.js API', 'Nginx reverse proxy'],
  protocols: ['HTTP/HTTPS', 'HLS', 'AAC', 'MP3'],
  description: 'Dedicated streaming servers optimized for Node.js platforms and low-latency live audio.',
};

export const STREAMING_REGIONS = [
  { id: 'us-east', name: 'US East (New York)', flag: 'US' },
  { id: 'us-west', name: 'US West (Los Angeles)', flag: 'US' },
  { id: 'eu-west', name: 'EU West (London)', flag: 'EU' },
  { id: 'eu-central', name: 'EU Central (Frankfurt)', flag: 'EU' },
  { id: 'asia-sg', name: 'Asia (Singapore)', flag: 'SG' },
  { id: 'asia-mumbai', name: 'Asia (Mumbai)', flag: 'IN' },
];

export const STREAMING_PAYG_RATES = {
  extraListeners: 0.02,
  extraBandwidthGb: 0.08,
  extraStreamHour: 0.015,
  storageGb: 0.05,
};

/** Prices are USD per month, tax included (all-in pricing). */
export const STREAMING_PACKAGES = [
  {
    id: 'stream-starter',
    slug: 'stream-starter',
    name: 'Starter Broadcast',
    type: 'live_streaming',
    monthlyPrice: 165,
    renewalPrice: 165,
    taxIncluded: true,
    maxListeners: 500,
    maxStreams: 1,
    bandwidth: '2 TB/mo',
    bitrate: '128 kbps',
    recording: false,
    popular: false,
    features: [
      '500 concurrent listeners',
      '1 live stream mount',
      'Icecast2 + Liquidsoap stack',
      'Node.js control API',
      '2 TB bandwidth included',
      'SSL streaming URL',
      'Email support',
    ],
  },
  {
    id: 'stream-professional',
    slug: 'stream-professional',
    name: 'Professional Broadcast',
    type: 'live_streaming',
    monthlyPrice: 299,
    renewalPrice: 299,
    taxIncluded: true,
    maxListeners: 2000,
    maxStreams: 3,
    bandwidth: '5 TB/mo',
    bitrate: '192 kbps',
    recording: true,
    popular: true,
    features: [
      '2,000 concurrent listeners',
      '3 live stream mounts',
      'Auto DJ & recording',
      '5 TB bandwidth included',
      'Custom mount points',
      'Pay-as-you-go overages',
      'Priority support',
    ],
  },
  {
    id: 'stream-enterprise',
    slug: 'stream-enterprise',
    name: 'Enterprise Broadcast',
    type: 'live_streaming',
    monthlyPrice: 499,
    renewalPrice: 499,
    taxIncluded: true,
    maxListeners: 10000,
    maxStreams: 10,
    bandwidth: '15 TB/mo',
    bitrate: '320 kbps',
    recording: true,
    popular: false,
    features: [
      '10,000 concurrent listeners',
      '10 live stream mounts',
      'Dedicated streaming node',
      '15 TB bandwidth included',
      'Multi-region failover',
      'Pay-as-you-go overages',
      '24/7 priority support',
    ],
  },
];

export function getStreamingPackageById(id) {
  return STREAMING_PACKAGES.find((p) => p.id === id);
}

export function getStreamingPackageBySlug(slug) {
  return STREAMING_PACKAGES.find((p) => p.slug === slug);
}
