'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { PageHeader, LoadingSpinner, EmptyState, Button } from '@/components/ui';
import UploadZone from '@/components/cdn/UploadZone';
import { getUserCdnSubscription } from '@/lib/firebase/cdn';

export default function CdnUploadPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [subscription, setSubscription] = useState(null);

  const load = async () => {
    if (!user) return;
    const sub = await getUserCdnSubscription(user.uid);
    setSubscription(sub);
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
        <PageHeader title="Upload Media" description="Upload images, videos, and files to your CDN." />
        <EmptyState
          title="No active CDN subscription"
          description="Subscribe to a CDN plan before uploading media."
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
        title="Upload Media"
        description={`Upload to ${subscription.planName}. Remaining credits: ${subscription.remainingCredits ?? 0} MB.`}
      />
      <UploadZone
        userId={user.uid}
        subscription={subscription}
        onUploadComplete={() => load()}
      />
    </div>
  );
}
