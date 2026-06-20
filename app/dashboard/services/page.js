'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { PageHeader, Card, LoadingSpinner, StatusBadge, EmptyState, Button } from '@/components/ui';
import { getUserServices } from '@/lib/firebase/firestore';

export default function DashboardServicesPage() {
  const { user } = useAuth();
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    getUserServices(user.uid).then(setServices).finally(() => setLoading(false));
  }, [user]);

  if (loading) return <div className="flex justify-center py-24"><LoadingSpinner size="lg" /></div>;

  return (
    <div>
      <PageHeader title="My Services" description="Manage all your active and provisioning services." />
      {services.length === 0 ? (
        <EmptyState
          title="No services yet"
          description="Your services will appear here after payment confirmation."
          action={<Link href="/ec2-pricing"><Button>Browse plans</Button></Link>}
        />
      ) : (
        <div className="grid gap-4">
          {services.map((s) => (
            <Link key={s.id} href={`/dashboard/services/${s.id}`}>
              <Card hover className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <h3 className="text-white font-semibold">{s.name}</h3>
                  <p className="text-sm text-neutral-400 capitalize mt-1">{s.type?.replace('-', ' ')}</p>
                </div>
                <div className="flex items-center gap-4">
                  <StatusBadge status={s.billingStatus || s.status} />
                  <StatusBadge status={s.status} />
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

function ServiceTypePage({ type, title, description }) {
  const { user } = useAuth();
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    getUserServices(user.uid).then((all) => setServices(all.filter((s) => s.type === type))).finally(() => setLoading(false));
  }, [user, type]);

  if (loading) return <div className="flex justify-center py-24"><LoadingSpinner size="lg" /></div>;

  return (
    <div>
      <PageHeader title={title} description={description} />
      {services.length === 0 ? (
        <EmptyState title={`No ${title.toLowerCase()}`} action={<Link href="/ec2-pricing"><Button>Browse plans</Button></Link>} />
      ) : (
        <div className="grid gap-4">
          {services.map((s) => (
            <Link key={s.id} href={`/dashboard/services/${s.id}`}>
              <Card hover className="flex justify-between items-center">
                <span className="text-white font-medium">{s.name}</span>
                <StatusBadge status={s.status} />
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

export { ServiceTypePage };
