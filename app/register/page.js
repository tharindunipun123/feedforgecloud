'use client';

import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import PublicLayout from '@/components/layout/PublicLayout';
import { Button, Input, Card, LoadingSpinner } from '@/components/ui';
import GoogleSignInButton from '@/components/auth/GoogleSignInButton';
import { useAuth } from '@/contexts/AuthContext';

function getAuthErrorMessage(err) {
  if (err?.code === 'auth/popup-closed-by-user') return 'Sign-up was cancelled.';
  if (err?.code === 'auth/account-exists-with-different-credential') {
    return 'An account already exists with this email. Try signing in instead.';
  }
  return err?.message || 'Something went wrong. Please try again.';
}

function RegisterForm() {
  const { register, loginWithGoogle, user, loading: authLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get('redirect') || '/dashboard';
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!authLoading && user) {
      router.replace(redirect);
    }
  }, [authLoading, user, redirect, router]);

  if (authLoading || user) {
    return (
      <Card>
        <div className="flex justify-center py-8">
          <LoadingSpinner />
        </div>
      </Card>
    );
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (password !== confirm) {
      setError('Passwords do not match');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    setLoading(true);
    try {
      await register(name, email, password);
      router.replace(redirect);
    } catch (err) {
      setError(err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignUp = async () => {
    setError('');
    setLoading(true);
    try {
      await loginWithGoogle();
      router.replace(redirect);
    } catch (err) {
      setError(getAuthErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <div className="space-y-4">
        {error && <p className="text-red-400 text-sm">{error}</p>}
        <GoogleSignInButton onClick={handleGoogleSignUp} disabled={loading} label="Sign up with Google" />
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-neutral-800" />
          </div>
          <div className="relative flex justify-center text-xs">
            <span className="bg-neutral-950 px-3 text-neutral-500">or register with email</span>
          </div>
        </div>
      </div>
      <form onSubmit={handleSubmit} className="space-y-4 mt-4">
        <Input label="Full name" value={name} onChange={(e) => setName(e.target.value)} required />
        <Input label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" />
        <Input label="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required autoComplete="new-password" />
        <Input label="Confirm password" type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} required autoComplete="new-password" />
        <Button type="submit" className="w-full" disabled={loading}>{loading ? 'Creating account...' : 'Create account'}</Button>
      </form>
      <p className="mt-6 text-center text-sm text-neutral-400">
        Already have an account? <Link href="/login" className="text-white hover:underline">Sign in</Link>
      </p>
    </Card>
  );
}

export default function RegisterPage() {
  return (
    <PublicLayout>
      <div className="max-w-md mx-auto px-4 py-16">
        <h1 className="text-3xl font-bold text-white text-center mb-2">Create account</h1>
        <p className="text-neutral-400 text-center mb-8">Start deploying with Feed Forge</p>
        <Suspense fallback={<Card><p className="text-neutral-400 text-center py-8">Loading...</p></Card>}>
          <RegisterForm />
        </Suspense>
      </div>
    </PublicLayout>
  );
}
