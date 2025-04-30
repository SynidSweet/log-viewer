'use client';

import { signOut } from 'next-auth/react';
import { useEffect, useState } from 'react';
import Link from 'next/link';

export default function SignOut() {
  const [isSigningOut, setIsSigningOut] = useState(false);
  
  useEffect(() => {
    const handleSignOut = async () => {
      setIsSigningOut(true);
      await signOut({ redirect: false });
    };
    
    handleSignOut();
  }, []);
  
  return (
    <div className="container mx-auto p-8 flex flex-col items-center justify-center min-h-[80vh]">
      <div className="w-full max-w-md p-8 space-y-8 bg-white rounded-lg shadow-md">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Sign Out</h1>
          <p className="mt-4">
            {isSigningOut 
              ? 'You have been signed out successfully.' 
              : 'Signing out...'}
          </p>
          <div className="mt-8">
            <Link href="/" className="text-blue-600 hover:underline">
              Return to Home
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
} 