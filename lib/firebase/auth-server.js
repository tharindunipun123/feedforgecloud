import { getAuth } from 'firebase-admin/auth';
import { initAdminApp } from '@/lib/firebase/admin';

export async function verifyAuthToken(request) {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) return null;

  const token = authHeader.slice(7);
  const app = initAdminApp();
  if (!app) return null;

  try {
    const decoded = await getAuth(app).verifyIdToken(token);
    return decoded;
  } catch {
    return null;
  }
}
