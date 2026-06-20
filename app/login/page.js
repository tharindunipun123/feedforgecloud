'use client';

import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import PublicLayout from '@/components/layout/PublicLayout';
import { Button, Input, Card, LoadingSpinner } from '@/components/ui';
import GoogleSignInButton from '@/components/auth/GoogleSignInButton';
import { useAuth } from '@/contexts/AuthContext';

function getAuthErrorMessage(err) {
  if (err?.code === 'auth/popup-closed-by-user') return 'Sign-in was cancelled.';
  if (err?.code === 'auth/account-exists-with-different-credential') {
    return 'An account already exists with this email. Try signing in with email and password.';
  }
  return err?.message || 'Something went wrong. Please try again.';
}

function LoginForm() {
  const { login, loginWithGoogle, user, loading: authLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get('redirect') || '/dashboard';
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
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
    setLoading(true);
    try {
      await login(email, password);
      router.replace(redirect);
    } catch (err) {
      setError(err.message || 'Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
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
        <GoogleSignInButton onClick={handleGoogleSignIn} disabled={loading} label="Sign in with Google" />
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-neutral-800" />
          </div>
          <div className="relative flex justify-center text-xs">
            <span className="bg-neutral-950 px-3 text-neutral-500">or continue with email</span>
          </div>
        </div>
      </div>
      <form onSubmit={handleSubmit} className="space-y-4 mt-4">
        <Input label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" />
        <Input label="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required autoComplete="current-password" />
        <div className="flex justify-end">
          <Link href="/forgot-password" className="text-sm text-neutral-400 hover:text-white">Forgot password?</Link>
        </div>
        <Button type="submit" className="w-full" disabled={loading}>{loading ? 'Signing in...' : 'Sign in'}</Button>
      </form>
      <p className="mt-6 text-center text-sm text-neutral-400">
        Don&apos;t have an account? <Link href="/register" className="text-white hover:underline">Register</Link>
      </p>
    </Card>
  );
}

export default function LoginPage() {
  return (
    <PublicLayout>
      <div className="max-w-md mx-auto px-4 py-16">
        <h1 className="text-3xl font-bold text-white text-center mb-2">Sign in</h1>
        <p className="text-neutral-400 text-center mb-8">Access your Feed Forge dashboard</p>
        <Suspense fallback={<Card><p className="text-neutral-400 text-center py-8">Loading...</p></Card>}>
          <LoginForm />
        </Suspense>
      </div>
    </PublicLayout>
  );
}
