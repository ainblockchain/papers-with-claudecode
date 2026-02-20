'use client';

import { usePathname } from 'next/navigation';
import { Header } from './Header';

// Pages that should NOT show the global header (they manage their own layout)
const EXACT_NO_HEADER = ['/'];
const PREFIX_NO_HEADER = ['/login', '/learn'];

export function LayoutWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const showHeader =
    !EXACT_NO_HEADER.includes(pathname ?? '') &&
    !PREFIX_NO_HEADER.some((route) => pathname?.startsWith(route));

  return (
    <>
      {showHeader && <Header />}
      {children}
    </>
  );
}
