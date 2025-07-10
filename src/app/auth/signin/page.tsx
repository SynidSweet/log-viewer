'use client';

import { signIn } from 'next-auth/react';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';

// SignIn content component with hooks
function SignInContent() {
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl') || '/';
  const error = searchParams.get('error');
  
  return (
    <div className="text-center">
      <h1 className="text-2xl font-bold">Sign in to Log Viewer</h1>
      {error && (
        <div className="mt-4 p-4 bg-red-100 text-red-700 rounded">
          {error === 'AccessDenied' 
            ? 'You do not have access to this application' 
            : 'An error occurred during sign in'}
        </div>
      )}
      
      <div className="mt-8 space-y-4">
        <button
          onClick={() => signIn('google', { callbackUrl })}
          className="w-full flex items-center justify-center gap-3 bg-white border border-gray-300 rounded-lg px-6 py-3 text-gray-800 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          <svg viewBox="0 0 24 24" width="24" height="24" xmlns="http://www.w3.org/2000/svg">
            <g transform="matrix(1, 0, 0, 1, 0, 0)" fill="none">
              <path d="M20.283 10.356h-8.327v3.451h4.792c-.446 2.193-2.313 3.453-4.792 3.453a5.27 5.27 0 0 1-5.279-5.28 5.27 5.27 0 0 1 5.279-5.279c1.259 0 2.397.447 3.29 1.178l2.6-2.599c-1.584-1.381-3.615-2.233-5.89-2.233a8.908 8.908 0 0 0-8.934 8.934 8.907 8.907 0 0 0 8.934 8.934c4.467 0 8.529-3.249 8.529-8.934 0-.528-.081-1.097-.202-1.625z" fill="#4285F4"></path>
              <path d="M4.17 12.958l-.823 3.057-3.018.064A8.932 8.932 0 0 1 .001 12c0-1.401.324-2.727.899-3.904l2.687.499 1.175 2.667A5.304 5.304 0 0 0 4.17 12.958z" fill="#FBBC05"></path>
              <path d="M12 19.191c2.275 0 4.306-.852 5.89-2.233l-2.867-2.222c-.808.54-1.837.862-3.023.862-2.478 0-4.578-1.674-5.32-3.926L3.672 11.973a8.931 8.931 0 0 0 8.328 7.218z" fill="#34A853"></path>
              <path d="M16.488 6.968l2.624-2.599C17.512 3.01 14.926 2 12 2a8.93 8.93 0 0 0-8.328 5.8l2.689 2.068C7.013 7.245 9.27 5.77 12 5.77c1.683 0 2.9.503 3.618.939l.87.259z" fill="#EA4335"></path>
            </g>
          </svg>
          Sign in with Google
        </button>
      </div>
    </div>
  );
}

// Loading component
function SignInLoading() {
  return (
    <div className="text-center">
      <h1 className="text-2xl font-bold">Loading...</h1>
    </div>
  );
}

// Main SignIn component with Suspense
export default function SignIn() {
  return (
    <div className="container mx-auto p-8 flex flex-col items-center justify-center min-h-[80vh]">
      <div className="w-full max-w-md p-8 space-y-8 bg-white rounded-lg shadow-md">
        <Suspense fallback={<SignInLoading />}>
          <SignInContent />
        </Suspense>
      </div>
    </div>
  );
} 