'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { LoadingSpinner } from '@/components/ui';

export function ProtectedRoute({ children, requireAdmin = false }) {
  const { user, loading, isAdmin } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push('/login');
      } else if (requireAdmin && !isAdmin) {
        router.push('/dashboard');
      }
    }
  }, [user, loading, isAdmin, requireAdmin, router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!user || (requireAdmin && !isAdmin)) {
    return null;
  }

  return children;
}
