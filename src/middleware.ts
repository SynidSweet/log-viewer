import { NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { NextRequest } from 'next/server';

// Configure which paths are exempt from authentication
const PUBLIC_PATHS = [
  '/api/logs',      // API endpoint for logs
  '/api/logs/',     // All API endpoints under logs
  '/auth/signin',   // Auth signin page
  '/auth/error',    // Auth error page
  '/auth/signout',  // Auth signout page
];

// Check if the path should bypass authentication
const isPublic = (path: string) => {
  // Always allow all NextAuth API routes
  if (path.startsWith('/api/auth/')) {
    return true;
  }
  
  // Allow configured public paths
  if (PUBLIC_PATHS.some(publicPath => path.startsWith(publicPath))) {
    return true; 
  }
  
  // Allow all non-auth API routes
  if (path.startsWith('/api/') && !path.startsWith('/api/auth')) {
    return true;
  }
  
  return false;
};

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Check if the path is public (no auth required)
  if (isPublic(pathname)) {
    return NextResponse.next();
  }
  
  // Get the session token
  const token = await getToken({ 
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  });
  
  // If there is no token, redirect to signin
  if (!token) {
    const signInUrl = new URL('/auth/signin', request.url);
    signInUrl.searchParams.set('callbackUrl', encodeURI(request.url));
    return NextResponse.redirect(signInUrl);
  }
  
  // Allow authenticated requests
  return NextResponse.next();
}

// Configure the paths that this middleware should be matched against
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * 1. _next (Next.js internals)
     * 2. static files (e.g. images)
     * 3. favicon.ico
     * 4. public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|public/).*)',
  ],
}; 