'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { PageHeader, Card, LoadingSpinner, Button, Input, Select, EmptyState } from '@/components/ui';
import { getAllServices, updateService } from '@/lib/firebase/firestore';
import { getSslPackageById } from '@/data/ssl-certificates';
import { serverTimestamp } from 'firebase/firestore';

export default function SslProvisioningPage() {
  const { user } = useAuth();
  const [services, setServices] = useState([]);
  const [selected, setSelected] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [tempCreds, setTempCreds] = useState({
    domain: '',
    tempCertificateUrl: '',
    tempExpiresAt: '',
    notes: '',
  });
  const [finalCreds, setFinalCreds] = useState({
    domain: '',
    certificateUrl: '',
    privateKeyUrl: '',
    caBundleUrl: '',
    issuedAt: '',
    expiresAt: '',
    notes: '',
  });

  const loadServices = () =>
    getAllServices().then((all) =>
      setServices(
        all.filter(
          (s) =>
            s.type === 'ssl_certificate' &&
            (s.status === 'provisioning' || s.status === 'temp_ssl_active')
        )
      )
    );

  useEffect(() => {
    loadServices().finally(() => setLoading(false));
  }, []);

  const selectedService = services.find((s) => s.id === selected);
  const isTempStep = selectedService?.status === 'provisioning';
  const isFinalStep = selectedService?.status === 'temp_ssl_active';

  useEffect(() => {
    if (!selectedService) return;
    const domain = selectedService.config?.domain || '';
    setTempCreds((c) => ({ ...c, domain }));
    setFinalCreds((c) => ({
      ...c,
      domain,
      ...(selectedService.credentials?.tempSsl || {}),
    }));
  }, [selected, selectedService]);

  const handleInstallTempSsl = async (e) => {
    e.preventDefault();
    if (!selected) return;
    setSaving(true);
    try {
      await updateService(
        selected,
        {
          status: 'temp_ssl_active',
          credentials: {
            domain: tempCreds.domain,
            tempSsl: {
              certificateUrl: tempCreds.tempCertificateUrl,
              expiresAt: tempCreds.tempExpiresAt,
              provider: 'Let\'s Encrypt',
              installedAt: new Date().toISOString(),
              notes: tempCreds.notes,
            },
          },
          config: {
            ...(selectedService?.config || {}),
            domain: tempCreds.domain,
            tempSsl: {
              status: 'active',
              provider: 'Let\'s Encrypt',
              expiresAt: tempCreds.tempExpiresAt,
            },
          },
        },
        user.uid
      );
      await loadServices();
      setSelected('');
    } finally {
      setSaving(false);
    }
  };

  const handleActivateFinal = async (e) => {
    e.preventDefault();
    if (!selected) return;
    setSaving(true);
    try {
      const pkg = getSslPackageById(selectedService?.packageId);
      const patch = {
        credentials: {
          ...(selectedService?.credentials || {}),
          domain: finalCreds.domain,
          certificateUrl: finalCreds.certificateUrl,
          privateKeyUrl: finalCreds.privateKeyUrl,
          caBundleUrl: finalCreds.caBundleUrl,
          issuedAt: finalCreds.issuedAt,
          expiresAt: finalCreds.expiresAt,
          notes: finalCreds.notes,
        },
        status: 'active',
        activatedAt: serverTimestamp(),
        config: {
          ...(selectedService?.config || {}),
          domain: finalCreds.domain,
          tempSsl: {
            ...(selectedService?.config?.tempSsl || {}),
            status: 'replaced',
          },
        },
      };

      await updateService(selected, patch, user.uid);

      if (pkg?.includesCdn && pkg.cdnPlanId) {
        const { createCdnSubscription } = await import('@/lib/firebase/cdn');
        await createCdnSubscription(
          selectedService.userId,
          selected,
          selectedService.orderId,
          pkg.cdnPlanId
        );
      }

      setServices((prev) => prev.filter((s) => s.id !== selected));
      setSelected('');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="flex justify-center py-24"><LoadingSpinner size="lg" /></div>;

  return (
    <div>
      <PageHeader
        title="SSL Provisioning"
        description="Step 1: Install temporary SSL. Step 2: Activate the annual certificate (and CDN if bundled)."
      />

      {services.length === 0 ? (
        <EmptyState
          title="No SSL orders awaiting provisioning"
          description="All SSL certificates are active or no orders yet."
        />
      ) : (
        <div className="grid lg:grid-cols-2 gap-6 max-w-5xl">
          <Card>
            <h3 className="text-white font-semibold mb-4">Pending orders</h3>
            <div className="space-y-2">
              {services.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setSelected(s.id)}
                  className={`w-full text-left px-4 py-3 rounded-lg border transition-colors ${
                    selected === s.id
                      ? 'border-white bg-neutral-900'
                      : 'border-neutral-800 hover:border-neutral-600'
                  }`}
                >
                  <p className="text-white text-sm font-medium">{s.name}</p>
                  <p className="text-xs text-neutral-500 mt-1">
                    {s.config?.domain || 'No domain'} ·{' '}
                    {s.status === 'provisioning' ? 'Awaiting temp SSL' : 'Temp SSL active — finalize cert'}
                  </p>
                </button>
              ))}
            </div>
          </Card>

          {selectedService && isTempStep && (
            <Card>
              <h3 className="text-white font-semibold mb-2">Step 1 — Install temporary SSL</h3>
              <p className="text-sm text-neutral-400 mb-4">
                Install a free Let&apos;s Encrypt temporary certificate so HTTPS works while the paid cert is issued.
              </p>
              <form onSubmit={handleInstallTempSsl} className="space-y-4">
                <Input
                  label="Domain"
                  value={tempCreds.domain}
                  onChange={(e) => setTempCreds({ ...tempCreds, domain: e.target.value })}
                  required
                />
                <Input
                  label="Temporary certificate URL"
                  value={tempCreds.tempCertificateUrl}
                  onChange={(e) => setTempCreds({ ...tempCreds, tempCertificateUrl: e.target.value })}
                  required
                />
                <Input
                  label="Temp cert expiry"
                  type="date"
                  value={tempCreds.tempExpiresAt}
                  onChange={(e) => setTempCreds({ ...tempCreds, tempExpiresAt: e.target.value })}
                  required
                />
                <Input
                  label="Notes"
                  value={tempCreds.notes}
                  onChange={(e) => setTempCreds({ ...tempCreds, notes: e.target.value })}
                />
                <Button type="submit" disabled={saving}>
                  {saving ? 'Installing...' : 'Mark temporary SSL installed'}
                </Button>
              </form>
            </Card>
          )}

          {selectedService && isFinalStep && (
            <Card>
              <h3 className="text-white font-semibold mb-2">Step 2 — Activate annual certificate</h3>
              <p className="text-sm text-neutral-400 mb-4">
                Temporary SSL is live. Upload the paid annual certificate
                {selectedService.config?.includesCdn ? ' and activate the CDN bundle' : ''}.
              </p>
              <form onSubmit={handleActivateFinal} className="space-y-4">
                <Input
                  label="Domain"
                  value={finalCreds.domain}
                  onChange={(e) => setFinalCreds({ ...finalCreds, domain: e.target.value })}
                  required
                />
                <Input
                  label="Certificate file URL"
                  value={finalCreds.certificateUrl}
                  onChange={(e) => setFinalCreds({ ...finalCreds, certificateUrl: e.target.value })}
                  required
                />
                <Input
                  label="Private key URL"
                  value={finalCreds.privateKeyUrl}
                  onChange={(e) => setFinalCreds({ ...finalCreds, privateKeyUrl: e.target.value })}
                />
                <Input
                  label="CA bundle URL"
                  value={finalCreds.caBundleUrl}
                  onChange={(e) => setFinalCreds({ ...finalCreds, caBundleUrl: e.target.value })}
                />
                <div className="grid sm:grid-cols-2 gap-4">
                  <Input
                    label="Issued date"
                    type="date"
                    value={finalCreds.issuedAt}
                    onChange={(e) => setFinalCreds({ ...finalCreds, issuedAt: e.target.value })}
                  />
                  <Input
                    label="Expiry date"
                    type="date"
                    value={finalCreds.expiresAt}
                    onChange={(e) => setFinalCreds({ ...finalCreds, expiresAt: e.target.value })}
                    required
                  />
                </div>
                <Input
                  label="Notes"
                  value={finalCreds.notes}
                  onChange={(e) => setFinalCreds({ ...finalCreds, notes: e.target.value })}
                />
                <Button type="submit" disabled={saving}>
                  {saving ? 'Activating...' : 'Activate annual SSL'}
                </Button>
              </form>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
