'use client';

import { SessionProvider } from 'next-auth/react';
import { ReactNode, useState, useEffect } from 'react';

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [isClient, setIsClient] = useState(false);
  
  // This ensures hydration issues are avoided by only enabling the provider
  // after the component has mounted on the client
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Use a basic fallback during SSR or if still loading
  if (!isClient) {
    return <>{children}</>;
  }

  return (
    <SessionProvider refetchInterval={0} refetchOnWindowFocus={false}>
      {children}
    </SessionProvider>
  );
} 