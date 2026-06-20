'use client';

import { ProtectedRoute } from '@/components/layout/ProtectedRoute';
import AdminLayout from '@/components/layout/AdminLayout';

export default function AdminRootLayout({ children }) {
  return (
    <ProtectedRoute requireAdmin>
      <AdminLayout>{children}</AdminLayout>
    </ProtectedRoute>
  );
}
