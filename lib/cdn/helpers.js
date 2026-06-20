export function generateApiKey() {
  const array = new Uint8Array(24);
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    crypto.getRandomValues(array);
  }
  const hex = Array.from(array, (b) => b.toString(16).padStart(2, '0')).join('');
  return `qscdn_${hex}`;
}

export async function hashApiKey(key) {
  if (typeof crypto !== 'undefined' && crypto.subtle) {
    const encoder = new TextEncoder();
    const data = encoder.encode(key);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    return Array.from(new Uint8Array(hashBuffer), (b) => b.toString(16).padStart(2, '0')).join('');
  }
  return key;
}

export function getApiKeyPrefix(key) {
  return key.slice(0, 12);
}

export function maskApiKey(keyPrefix) {
  return `${keyPrefix}${'•'.repeat(24)}`;
}

export function validateFileForPlan(file, plan) {
  const mimeType = file.type || 'application/octet-stream';
  const sizeMB = file.size / (1024 * 1024);
  const category = mimeType.startsWith('image/')
    ? 'image'
    : mimeType.startsWith('video/')
      ? 'video'
      : 'file';

  if (plan.allowedFileTypes?.[0] !== '*' && !plan.allowedFileTypes?.includes(mimeType)) {
    return { valid: false, error: `File type ${mimeType} is not allowed on your plan.` };
  }

  if (category === 'image' && sizeMB > plan.maxImageSizeMB) {
    return { valid: false, error: `Image exceeds max size of ${plan.maxImageSizeMB} MB.` };
  }

  if (category === 'video' && sizeMB > plan.maxVideoSizeMB) {
    return { valid: false, error: `Video exceeds max size of ${plan.maxVideoSizeMB} MB.` };
  }

  return { valid: true, category, creditsNeeded: Math.ceil(sizeMB) };
}

export function checkCredits(subscription, creditsNeeded) {
  const remaining = subscription.remainingCredits ?? 0;
  if (creditsNeeded > remaining) {
    return {
      allowed: false,
      error: 'Insufficient CDN credits. Please upgrade your plan or free storage.',
    };
  }
  return { allowed: true };
}

export function computeNextResetDate(fromDate = new Date()) {
  const next = new Date(fromDate);
  next.setMonth(next.getMonth() + 1);
  next.setDate(1);
  next.setHours(0, 0, 0, 0);
  return next;
}

export function bytesToMB(bytes) {
  return bytes / (1024 * 1024);
}

export function creditsFromBytes(bytes) {
  return Math.ceil(bytesToMB(bytes));
}
