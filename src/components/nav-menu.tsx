'use client';

import { signIn, signOut } from 'next-auth/react';
import { useEffect, useState } from 'react';

export function NavMenu() {
  // Add a client-side flag to prevent SSR issues
  const [mounted, setMounted] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // Only run this on the client side
  useEffect(() => {
    setMounted(true);
    
    // Safe way to check session without directly using useSession
    const checkSession = async () => {
      try {
        setIsLoading(true);
        const res = await fetch('/api/auth/session');
        const session = await res.json();
        
        if (session && session.user) {
          setIsAuthenticated(true);
          setUserEmail(session.user.email || null);
        } else {
          setIsAuthenticated(false);
          setUserEmail(null);
        }
      } catch {
        setIsAuthenticated(false);
      } finally {
        setIsLoading(false);
      }
    };
    
    checkSession();
  }, []);
  
  // Don't render anything during SSR or if not mounted yet
  if (!mounted) return <nav className="flex items-center gap-4"></nav>;
  
  return (
    <nav className="flex items-center gap-4">
      {isLoading ? (
        <span className="text-sm opacity-70">Loading...</span>
      ) : isAuthenticated ? (
        <div className="flex items-center gap-4">
          <a
            href="/monitoring"
            className="text-sm hover:text-white/80 underline"
          >
            Monitoring
          </a>
          <span className="text-sm">
            {userEmail}
          </span>
          <button
            onClick={() => signOut({ callbackUrl: '/' })}
            className="text-sm bg-white/20 hover:bg-white/30 px-3 py-1 rounded"
          >
            Sign out
          </button>
        </div>
      ) : (
        <button
          onClick={() => signIn('google')}
          className="text-sm bg-white/20 hover:bg-white/30 px-3 py-1 rounded"
        >
          Sign in
        </button>
      )}
    </nav>
  );
} 