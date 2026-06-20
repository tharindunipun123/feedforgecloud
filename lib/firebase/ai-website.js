import {
  collection,
  addDoc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  doc,
  query,
  where,
  orderBy,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { AI_WEBSITE_PACKAGES } from '@/data/constants';

function getDb() {
  if (!db) throw new Error('Firebase not configured.');
  return db;
}

export async function createAiWebsiteProject(userId, { name, description, planId }) {
  const ref = await addDoc(collection(getDb(), 'aiWebsiteProjects'), {
    userId,
    name: name || 'Untitled Project',
    description: description || '',
    planId: planId || 'ai-website-free',
    generatedHtml: '',
    prompt: '',
    style: 'modern',
    status: 'active',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return ref.id;
}

export async function getUserAiWebsiteProjects(userId) {
  const q = query(
    collection(getDb(), 'aiWebsiteProjects'),
    where('userId', '==', userId),
    orderBy('createdAt', 'desc')
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export async function getAiWebsiteProject(projectId) {
  const snap = await getDoc(doc(getDb(), 'aiWebsiteProjects', projectId));
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() };
}

export async function updateAiWebsiteProject(projectId, data) {
  await updateDoc(doc(getDb(), 'aiWebsiteProjects', projectId), {
    ...data,
    updatedAt: serverTimestamp(),
  });
}

export async function deleteAiWebsiteProject(projectId) {
  await deleteDoc(doc(getDb(), 'aiWebsiteProjects', projectId));
}

export async function getUserAiWebsitePlan(userData) {
  if (!userData) return AI_WEBSITE_PACKAGES[0];
  if (userData.aiWebsitePlan) {
    return AI_WEBSITE_PACKAGES.find((p) => p.id === userData.aiWebsitePlan) || AI_WEBSITE_PACKAGES[0];
  }
  return AI_WEBSITE_PACKAGES[0];
}

export async function getMonthlyUsage(userId) {
  const now = new Date();
  const monthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const snap = await getDoc(doc(getDb(), 'aiWebsiteUsage', `${userId}_${monthKey}`));
  return snap.exists() ? (snap.data().count || 0) : 0;
}
