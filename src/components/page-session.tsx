'use client';

import { SessionProvider } from 'next-auth/react';
import { ReactNode } from 'react';

interface PageSessionProps {
  children: ReactNode;
}

/**
 * Component to wrap individual pages that need session access
 * This allows components within the page to use useSession()
 */
export function PageSession({ children }: PageSessionProps) {
  return <SessionProvider>{children}</SessionProvider>;
} 