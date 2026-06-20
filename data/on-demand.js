import { PAYG_RATES } from '@/data/constants';

export const ON_DEMAND_DEFAULT_SETTINGS = {
  globallyEnabled: true,
  userCanEnable: true,
  eligibleTypes: ['ec2', 'vps', 'n8n'],
  rates: { ...PAYG_RATES },
  billingNote: 'On-demand usage is calculated from actual resource consumption and invoiced at the end of each billing period.',
};

export const ON_DEMAND_SERVICE_TYPES = [
  { id: 'ec2', label: 'EC2 Hosting' },
  { id: 'vps', label: 'VPS Hosting' },
  { id: 'n8n', label: 'n8n Automation' },
];

export function mergeOnDemandSettings(platformSettings = {}) {
  const stored = platformSettings.onDemandUsage || {};
  return {
    ...ON_DEMAND_DEFAULT_SETTINGS,
    ...stored,
    rates: { ...ON_DEMAND_DEFAULT_SETTINGS.rates, ...(stored.rates || {}) },
    eligibleTypes: stored.eligibleTypes || ON_DEMAND_DEFAULT_SETTINGS.eligibleTypes,
  };
}

export function isServiceOnDemandEligible(service, platformSettings) {
  if (!service) return false;
  const settings = mergeOnDemandSettings(platformSettings);
  if (!settings.globallyEnabled) return false;
  if (service.type === 'payg') return false;
  if (service.status === 'cancelled') return false;
  return settings.eligibleTypes.includes(service.type);
}

export function canUserToggleOnDemand(service, platformSettings) {
  if (!isServiceOnDemandEligible(service, platformSettings)) return false;
  const settings = mergeOnDemandSettings(platformSettings);
  if (!settings.userCanEnable) return false;
  if (service.onDemandUsage?.adminLocked) return false;
  return service.status === 'active' || service.status === 'provisioning';
}

export function getServiceOnDemandRates(service, platformSettings) {
  const settings = mergeOnDemandSettings(platformSettings);
  return service?.onDemandUsage?.customRates || settings.rates;
}

export function getDefaultServiceOnDemand() {
  return {
    enabled: false,
    enabledAt: null,
    enabledBy: null,
    adminLocked: false,
    customRates: null,
    notes: '',
  };
}
