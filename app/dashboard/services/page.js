'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { PageHeader, Card, LoadingSpinner, StatusBadge, EmptyState, Button } from '@/components/ui';
import { getUserServices } from '@/lib/firebase/firestore';

function isPendingService(service) {
  return service.status === 'provisioning' || service.status === 'temp_ssl_active';
}

function ServiceRow({ service }) {
  return (
    <Link key={service.id} href={`/dashboard/services/${service.id}`}>
      <Card hover className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h3 className="text-white font-semibold">{service.name}</h3>
          <p className="text-sm text-neutral-400 capitalize mt-1">{service.type?.replace(/-/g, ' ')}</p>
          {isPendingService(service) && (
            <p className="text-xs text-yellow-500/90 mt-2">
              Payment confirmed — awaiting activation (usually 10–15 minutes)
            </p>
          )}
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <StatusBadge status={service.status} />
        </div>
      </Card>
    </Link>
  );
}

export default function DashboardServicesPage() {
  const { user } = useAuth();
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    getUserServices(user.uid).then(setServices).finally(() => setLoading(false));
  }, [user]);

  const { pendingServices, activeServices } = useMemo(() => {
    const pending = services.filter(isPendingService);
    const active = services.filter((s) => s.status === 'active');
    return { pendingServices: pending, activeServices: active };
  }, [services]);

  if (loading) return <div className="flex justify-center py-24"><LoadingSpinner size="lg" /></div>;

  return (
    <div>
      <PageHeader
        title="My Services"
        description="Paid orders appear here immediately as pending. Active credentials show once provisioning is complete."
      />

      {services.length === 0 ? (
        <EmptyState
          title="No services yet"
          description="After payment succeeds, your services will appear here in pending status until activated."
          action={<Link href="/ec2-pricing"><Button>Browse plans</Button></Link>}
        />
      ) : (
        <div className="space-y-10">
          {pendingServices.length > 0 && (
            <section>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-white">Pending activation</h2>
                <span className="text-sm text-yellow-500">{pendingServices.length} pending</span>
              </div>
              <div className="grid gap-4">
                {pendingServices.map((s) => (
                  <ServiceRow key={s.id} service={s} />
                ))}
              </div>
            </section>
          )}

          {activeServices.length > 0 && (
            <section>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-white">Active services</h2>
                <span className="text-sm text-green-500">{activeServices.length} active</span>
              </div>
              <div className="grid gap-4">
                {activeServices.map((s) => (
                  <ServiceRow key={s.id} service={s} />
                ))}
              </div>
            </section>
          )}

          {pendingServices.length === 0 && activeServices.length === 0 && (
            <Card>
              <p className="text-neutral-400 text-sm">
                You have services on your account, but none are currently pending or active. Check individual service pages for details.
              </p>
            </Card>
          )}
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
