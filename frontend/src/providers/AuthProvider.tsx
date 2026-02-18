'use client';

import { SessionProvider } from 'next-auth/react';
import { isRealAuth } from '@/lib/auth-mode';
import { AuthSyncEffect, MockAuthEffect } from '@/hooks/useAuthSync';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  if (isRealAuth) {
    return (
      <SessionProvider>
        <AuthSyncEffect />
        {children}
      </SessionProvider>
    );
  }

  return (
    <>
      <MockAuthEffect />
      {children}
    </>
  );
}
