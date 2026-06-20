import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || 'build-placeholder-api-key',
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || 'placeholder.firebaseapp.com',
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'placeholder-project',
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || 'placeholder.appspot.com',
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '000000000000',
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || '1:000000000000:web:0000000000000000000000',
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

function getFirebaseApp() {
  if (typeof window === 'undefined' && !process.env.NEXT_PUBLIC_FIREBASE_API_KEY) {
    return null;
  }
  return getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
}

let app = null;
let auth = null;
let db = null;
let storage = null;
let analytics = null;

if (typeof window !== 'undefined' || process.env.NEXT_PUBLIC_FIREBASE_API_KEY) {
  app = getFirebaseApp();
  if (app) {
    auth = getAuth(app);
    db = getFirestore(app);
    storage = getStorage(app);

    if (typeof window !== 'undefined' && firebaseConfig.measurementId) {
      import('firebase/analytics').then(({ getAnalytics, isSupported }) => {
        isSupported().then((supported) => {
          if (supported) {
            analytics = getAnalytics(app);
          }
        });
      });
    }
  }
}

export { auth, db, storage, analytics };
export default app;
