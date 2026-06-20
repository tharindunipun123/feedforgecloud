'use client';

import { useState } from 'react';
import Link from 'next/link';
import PublicLayout from '@/components/layout/PublicLayout';
import { Button, Input, Card } from '@/components/ui';
import { useAuth } from '@/contexts/AuthContext';

export default function ForgotPasswordPage() {
  const { resetPassword } = useAuth();
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await resetPassword(email);
      setSent(true);
    } catch (err) {
      setError(err.message || 'Failed to send reset email');
    } finally {
      setLoading(false);
    }
  };

  return (
    <PublicLayout>
      <div className="max-w-md mx-auto px-4 py-16">
        <h1 className="text-3xl font-bold text-white text-center mb-2">Reset password</h1>
        <p className="text-neutral-400 text-center mb-8">Enter your email to receive a password reset link</p>
        {sent ? (
          <Card className="text-center py-8">
            <p className="text-neutral-300 mb-4">If an account exists for {email}, a reset link has been sent.</p>
            <Link href="/login"><Button variant="secondary">Back to sign in</Button></Link>
          </Card>
        ) : (
          <Card>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && <p className="text-red-400 text-sm">{error}</p>}
              <Input label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
              <Button type="submit" className="w-full" disabled={loading}>{loading ? 'Sending...' : 'Send reset link'}</Button>
            </form>
            <p className="mt-6 text-center text-sm text-neutral-400">
              <Link href="/login" className="text-white hover:underline">Back to sign in</Link>
            </p>
          </Card>
        )}
      </div>
    </PublicLayout>
  );
}
