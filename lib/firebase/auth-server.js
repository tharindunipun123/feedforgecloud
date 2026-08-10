import { getAuth } from 'firebase-admin/auth';
import { initAdminApp } from '@/lib/firebase/admin';

export async function verifyAuthToken(request) {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return { ok: false, code: 'missing_token', message: 'Missing authentication token. Please sign in again.' };
  }

  const token = authHeader.slice(7);
  const app = initAdminApp();
  if (!app) {
    console.error('verifyAuthToken: Firebase Admin is not configured (missing service account).');
    return {
      ok: false,
      code: 'admin_not_configured',
      message: 'Server authentication is not configured. Contact support.',
    };
  }

  try {
    const decoded = await getAuth(app).verifyIdToken(token);
    return { ok: true, decoded };
  } catch (err) {
    console.error('verifyAuthToken failed:', err?.code || err?.message || err);
    return {
      ok: false,
      code: 'invalid_token',
      message: 'Your session expired. Please sign out and sign in again.',
    };
  }
}
