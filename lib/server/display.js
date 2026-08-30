/** Shared server display defaults — credentials stay in Firestore; UI uses these helpers. */

export const DEFAULT_SERVER_IP =
  process.env.NEXT_PUBLIC_DEFAULT_SERVER_IP || '67.217.62.194';
export const DEFAULT_SSH_USER = 'root';
export const DEFAULT_SSH_PORT = '22';
export const DEFAULT_VNC_PORT = '5901';

const SECRET_FIELD_PATTERN = /password|secret|privatekey|private_key/i;

export function isSecretCredentialField(label) {
  return SECRET_FIELD_PATTERN.test(String(label || ''));
}

export function maskSecret(value) {
  if (!value) return '—';
  return '••••••••••••';
}

export function displayCredentialValue(label, value) {
  if (value == null || value === '') return null;
  if (isSecretCredentialField(label)) return maskSecret(value);
  return String(value);
}

export function displayServerIp(creds) {
  if (!creds) return DEFAULT_SERVER_IP;
  return creds.ip || creds.serverIp || DEFAULT_SERVER_IP;
}

export function displaySshUser(creds) {
  return creds?.username || DEFAULT_SSH_USER;
}

export function displaySshPort(creds) {
  return creds?.sshPort || DEFAULT_SSH_PORT;
}

export function displayVncPort(creds) {
  return creds?.vncPort || DEFAULT_VNC_PORT;
}

export function getServerLocationId(service) {
  return service?.config?.location || service?.credentials?.location || 'us-east';
}

export function getServerLocationLabel(locationId, locations = []) {
  const found = locations.find((l) => l.id === locationId);
  return found?.name || String(locationId || '—').replace(/-/g, ' ');
}

/** Deterministic pseudo-random stats per service (no SSH / no real monitoring). */
export function generateSimulatedServerStats(seedStr = 'default') {
  const seed = String(seedStr)
    .split('')
    .reduce((acc, char, index) => acc + char.charCodeAt(0) * (index + 1), 0);

  const rand = (min, max, offset = 0) => {
    const x = Math.sin(seed + offset) * 10000;
    const frac = x - Math.floor(x);
    return Math.round(min + frac * (max - min));
  };

  return {
    cpu: rand(14, 68, 1),
    mem: rand(28, 74, 2),
    bw: rand(6, 42, 3),
    storage: rand(18, 62, 4),
    fetchedAt: new Date().toISOString(),
  };
}

export function buildDefaultServerCredentials(extra = {}) {
  return {
    ip: DEFAULT_SERVER_IP,
    username: DEFAULT_SSH_USER,
    password: extra.password || '',
    sshPort: DEFAULT_SSH_PORT,
    vncPort: DEFAULT_VNC_PORT,
    os: 'Ubuntu 22.04 LTS',
    location: 'us-east',
    ...extra,
  };
}
