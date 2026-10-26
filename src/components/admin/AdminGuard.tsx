'use client';

import React from 'react';
import AdminProtectedRoute from './AdminProtectedRoute';

export default function AdminGuard({ children }: { children: React.ReactNode }) {
  return <AdminProtectedRoute showHeader={true}>{children}</AdminProtectedRoute>;
}
