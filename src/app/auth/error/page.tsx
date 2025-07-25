'use client';

import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useEffect, useState, Suspense } from 'react';

// Error content component that uses hooks
function ErrorContent() {
  const searchParams = useSearchParams();
  const error = searchParams.get('error');
  const [errorDetails, setErrorDetails] = useState('');
  
  useEffect(() => {
    // Get more detailed error information from session if available
    const checkSession = async () => {
      try {
        const res = await fetch('/api/auth/session');
        const data = await res.json();
        if (data?.error) {
          setErrorDetails(data.error);
        }
      } catch {
        // Session error details fetch failed silently
      }
    };
    
    checkSession();
  }, []);
  
  const errorMessages: Record<string, string> = {
    'AccessDenied': 'You do not have access to this application.',
    'Configuration': 'There is a problem with the server configuration.',
    'Verification': 'The verification token has expired or has already been used.',
    'Default': 'An error occurred during authentication.',
  };
  
  // Get error message based on error code
  const getErrorMessage = () => {
    if (!error || error === 'undefined') {
      return 'Authentication failed. This could be due to an expired token or a server configuration issue.';
    }
    
    return errorMessages[error] || errorMessages.Default;
  };
  
  return (
    <div className="text-center">
      <h1 className="text-2xl font-bold text-red-600">Authentication Error</h1>
      <p className="mt-4">{getErrorMessage()}</p>
      
      {errorDetails && (
        <div className="mt-4 p-3 bg-gray-50 border border-gray-200 rounded-md text-xs text-left">
          <p className="font-semibold mb-1">Error details:</p>
          <p className="break-words">{errorDetails}</p>
        </div>
      )}
      
      <div className="mt-8 flex flex-col space-y-3">
        <Link href="/" className="text-blue-600 hover:underline">
          Return to Home
        </Link>
        <Link href="/auth/signin" className="text-blue-600 hover:underline">
          Try signing in again
        </Link>
      </div>
    </div>
  );
}

// Loading fallback
function ErrorLoading() {
  return (
    <div className="text-center">
      <h1 className="text-2xl font-bold text-gray-600">Loading...</h1>
      <p className="mt-4">Please wait while we process your request.</p>
    </div>
  );
}

// Main component with Suspense boundary
export default function AuthError() {
  return (
    <div className="container mx-auto p-8 flex flex-col items-center justify-center min-h-[80vh]">
      <div className="w-full max-w-md p-8 space-y-8 bg-white rounded-lg shadow-md">
        <Suspense fallback={<ErrorLoading />}>
          <ErrorContent />
        </Suspense>
      </div>
    </div>
  );
} 