export function hasServerAccess(service) {
  if (!service) return false;
  if (service.status !== 'active') return false;
  const creds = service.credentials;
  return !!(creds?.ip && creds?.password);
}

export function isMonitorableService(service) {
  if (!service) return false;
  const type = service.type;
  return type === 'ec2' || type === 'vps' || type === 'payg' || type === 'n8n';
}
