'use client';

import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  sendPasswordResetEmail,
  updateProfile,
  updatePassword,
  reauthenticateWithCredential,
  EmailAuthProvider,
} from 'firebase/auth';
import { auth } from '@/lib/firebase/config';
import { createUserDocument, getUserData } from '@/lib/firebase/firestore';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!auth) {
      setLoading(false);
      return;
    }
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {
        let data = await getUserData(firebaseUser.uid);
        if (!data) {
          data = await createUserDocument(firebaseUser, firebaseUser.displayName || '');
        }
        setUserData(data);
      } else {
        setUserData(null);
      }
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const login = useCallback(async (email, password) => {
    if (!auth) throw new Error('Firebase is not configured');
    const result = await signInWithEmailAndPassword(auth, email, password);
    const data = await getUserData(result.user.uid);
    setUserData(data);
    return result;
  }, []);

  const register = useCallback(async (name, email, password) => {
    if (!auth) throw new Error('Firebase is not configured');
    const result = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(result.user, { displayName: name });
    const data = await createUserDocument(result.user, name);
    setUserData(data);
    return result;
  }, []);

  const loginWithGoogle = useCallback(async () => {
    if (!auth) throw new Error('Firebase is not configured');
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });
    const result = await signInWithPopup(auth, provider);
    const data = await createUserDocument(result.user, result.user.displayName || '');
    setUserData(data);
    return result;
  }, []);

  const logout = useCallback(async () => {
    if (auth) await signOut(auth);
    setUserData(null);
  }, []);

  const resetPassword = useCallback(async (email) => {
    if (!auth) throw new Error('Firebase is not configured');
    await sendPasswordResetEmail(auth, email);
  }, []);

  const changePassword = useCallback(async (currentPassword, newPassword) => {
    if (!auth || !auth.currentUser) throw new Error('You must be signed in to change your password.');
    if (!auth.currentUser.email) throw new Error('Email/password account required.');

    const credential = EmailAuthProvider.credential(auth.currentUser.email, currentPassword);
    await reauthenticateWithCredential(auth.currentUser, credential);
    await updatePassword(auth.currentUser, newPassword);
  }, []);

  const sendPasswordResetToAccountEmail = useCallback(async () => {
    if (!auth || !auth.currentUser?.email) throw new Error('No email associated with this account.');
    await sendPasswordResetEmail(auth, auth.currentUser.email);
  }, []);

  const isAdmin = userData?.role === 'admin';

  return (
    <AuthContext.Provider
      value={{
        user,
        userData,
        loading,
        login,
        register,
        loginWithGoogle,
        logout,
        resetPassword,
        changePassword,
        sendPasswordResetToAccountEmail,
        isAdmin,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
