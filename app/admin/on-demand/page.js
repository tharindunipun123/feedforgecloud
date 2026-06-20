'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import {
  PageHeader,
  Card,
  LoadingSpinner,
  Button,
  Input,
  StatusBadge,
} from '@/components/ui';
import {
  getAllServices,
  getAllUsers,
  getOnDemandSettings,
  saveOnDemandSettings,
  updateServiceOnDemandAdmin,
} from '@/lib/firebase/firestore';
import {
  ON_DEMAND_SERVICE_TYPES,
  isServiceOnDemandEligible,
} from '@/data/on-demand';

export default function AdminOnDemandPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [services, setServices] = useState([]);
  const [users, setUsers] = useState([]);
  const [settings, setSettings] = useState(null);
  const [serviceSaving, setServiceSaving] = useState(null);

  useEffect(() => {
    Promise.all([getAllServices(), getAllUsers(), getOnDemandSettings()]).then(([s, u, st]) => {
      setServices(s);
      setUsers(u);
      setSettings(st);
      setLoading(false);
    });
  }, []);

  const userMap = Object.fromEntries(users.map((u) => [u.uid || u.id, u]));

  const eligibleServices = services.filter((s) => isServiceOnDemandEligible(s, settings || {}));

  const handleSaveSettings = async (e) => {
    e.preventDefault();
    if (!user) return;
    setSaving(true);
    setSaved(false);
    try {
      await saveOnDemandSettings(settings, user.uid);
      setSaved(true);
    } finally {
      setSaving(false);
    }
  };

  const toggleEligibleType = (typeId) => {
    const types = settings.eligibleTypes || [];
    const next = types.includes(typeId)
      ? types.filter((t) => t !== typeId)
      : [...types, typeId];
    setSettings({ ...settings, eligibleTypes: next });
  };

  const handleServiceUpdate = async (serviceId, data) => {
    if (!user) return;
    setServiceSaving(serviceId);
    try {
      await updateServiceOnDemandAdmin(serviceId, data, user.uid);
      setServices((prev) =>
        prev.map((s) =>
          s.id === serviceId
            ? { ...s, onDemandUsage: { ...(s.onDemandUsage || {}), ...data } }
            : s
        )
      );
    } finally {
      setServiceSaving(null);
    }
  };

  if (loading || !settings) {
    return <div className="flex justify-center py-24"><LoadingSpinner size="lg" /></div>;
  }

  return (
    <div className="space-y-8">
      <PageHeader
        title="On-Demand Usage"
        description="Configure platform-wide on-demand billing and manage per-service settings."
      />

      <Card className="max-w-2xl">
        <h2 className="text-lg font-semibold text-white mb-4">Platform settings</h2>
        <form onSubmit={handleSaveSettings} className="space-y-5">
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={settings.globallyEnabled !== false}
              onChange={(e) => setSettings({ ...settings, globallyEnabled: e.target.checked })}
              className="w-4 h-4 accent-white"
            />
            <span className="text-white text-sm">Enable on-demand usage platform-wide</span>
          </label>

          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={settings.userCanEnable !== false}
              onChange={(e) => setSettings({ ...settings, userCanEnable: e.target.checked })}
              className="w-4 h-4 accent-white"
            />
            <span className="text-white text-sm">Allow users to self-enable on-demand usage</span>
          </label>

          <div>
            <p className="text-sm font-medium text-neutral-300 mb-2">Eligible service categories</p>
            <div className="flex flex-wrap gap-2">
              {ON_DEMAND_SERVICE_TYPES.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => toggleEligibleType(t.id)}
                  className={`px-3 py-1.5 rounded-lg text-sm border transition-colors ${
                    settings.eligibleTypes?.includes(t.id)
                      ? 'bg-white text-black border-white'
                      : 'border-neutral-700 text-neutral-400 hover:border-neutral-500'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            {[
              ['vcpu', 'vCPU rate ($/hr per core)'],
              ['ram', 'RAM rate ($/hr per GB)'],
              ['storage', 'Storage rate ($/hr per GB)'],
              ['bandwidth', 'Bandwidth rate ($/GB)'],
            ].map(([key, label]) => (
              <Input
                key={key}
                label={label}
                type="number"
                step="0.0001"
                value={settings.rates?.[key] ?? ''}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    rates: { ...settings.rates, [key]: parseFloat(e.target.value) || 0 },
                  })
                }
              />
            ))}
          </div>

          {saved && <p className="text-sm text-neutral-300">Platform settings saved.</p>}
          <Button type="submit" disabled={saving}>
            {saving ? 'Saving...' : 'Save platform settings'}
          </Button>
        </form>
      </Card>

      <Card>
        <h2 className="text-lg font-semibold text-white mb-4">
          Service on-demand controls ({eligibleServices.length})
        </h2>
        {eligibleServices.length === 0 ? (
          <p className="text-neutral-400 text-sm">No eligible services yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-neutral-800 text-neutral-400 text-left">
                  <th className="py-3 pr-4">Service</th>
                  <th className="py-3 pr-4">User</th>
                  <th className="py-3 pr-4">Status</th>
                  <th className="py-3 pr-4">On-demand</th>
                  <th className="py-3 pr-4">Locked</th>
                  <th className="py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {eligibleServices.map((s) => {
                  const owner = userMap[s.userId];
                  const od = s.onDemandUsage || {};
                  return (
                    <tr key={s.id} className="border-b border-neutral-800">
                      <td className="py-3 pr-4 text-white">{s.name}</td>
                      <td className="py-3 pr-4 text-neutral-400 text-xs">
                        {owner?.email || s.userId?.slice(0, 8)}
                      </td>
                      <td className="py-3 pr-4"><StatusBadge status={s.status} /></td>
                      <td className="py-3 pr-4">
                        <span className={od.enabled ? 'text-green-400' : 'text-neutral-500'}>
                          {od.enabled ? 'Enabled' : 'Off'}
                        </span>
                        {od.enabledBy && (
                          <span className="text-neutral-600 text-xs block">by {od.enabledBy}</span>
                        )}
                      </td>
                      <td className="py-3 pr-4">
                        {od.adminLocked ? (
                          <span className="text-red-400 text-xs">Locked</span>
                        ) : (
                          <span className="text-neutral-500 text-xs">—</span>
                        )}
                      </td>
                      <td className="py-3">
                        <div className="flex flex-wrap gap-1">
                          <Button
                            size="sm"
                            disabled={serviceSaving === s.id}
                            onClick={() => handleServiceUpdate(s.id, { enabled: !od.enabled })}
                          >
                            {od.enabled ? 'Disable' : 'Enable'}
                          </Button>
                          <Button
                            size="sm"
                            variant="secondary"
                            disabled={serviceSaving === s.id}
                            onClick={() =>
                              handleServiceUpdate(s.id, {
                                adminLocked: !od.adminLocked,
                                enabled: od.adminLocked ? od.enabled : false,
                              })
                            }
                          >
                            {od.adminLocked ? 'Unlock' : 'Lock'}
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
        <p className="text-xs text-neutral-500 mt-4">
          Locking prevents the user from enabling on-demand usage. Admin can still enable/disable manually.
          Custom per-service rates can be set when creating usage charges.
        </p>
      </Card>
    </div>
  );
}
