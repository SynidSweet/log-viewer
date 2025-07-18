import NextAuth, { User } from "next-auth";
import GoogleProvider from "next-auth/providers/google";


// Configure allowed emails - can be moved to environment variables for better security
const ALLOWED_EMAILS = (process.env.ALLOWED_EMAILS || "").split(",").map(email => email.trim());
const ALLOWED_DOMAINS = (process.env.ALLOWED_DOMAINS || "").split(",").map(domain => domain.trim());

// Check if a user is allowed to sign in
const isUserAllowed = (email: string | null | undefined): boolean => {
  if (!email) return false;
  
  // If no restrictions are configured, allow all
  if (ALLOWED_EMAILS.length === 0 && ALLOWED_DOMAINS.length === 0) {
    return true;
  }
  
  // Check if email is in the allowed list
  if (ALLOWED_EMAILS.length > 0 && ALLOWED_EMAILS.includes(email)) {
    return true;
  }
  
  // Check if email domain is allowed
  if (ALLOWED_DOMAINS.length > 0) {
    const domain = email.split('@')[1];
    if (domain && ALLOWED_DOMAINS.includes(domain)) {
      return true;
    }
  }
  
  return false;
};

const handler = NextAuth({
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
    }),
  ],
  pages: {
    signIn: '/auth/signin',
    signOut: '/auth/signout',
    error: '/auth/error',
  },
  callbacks: {
    async signIn({ user, account }) {
      
      // Check if user's email is allowed
      const isAllowed = isUserAllowed(user.email);
      
      if (!isAllowed) {
        return false; // This will redirect to error page with AccessDenied error
      }
      
      if (account && user) {
        return true;
      }
      return false;
    },
    async jwt({ token, account, user }) {
      // Initial sign in
      if (account && user) {
        return {
          ...token,
          accessToken: account.access_token,
          accessTokenExpires: account.expires_at ? account.expires_at * 1000 : 0,
          user,
        };
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user = token.user as User;
      }
      return session;
    },
  },
  logger: {
    error() {
      // Error logged by NextAuth internally
    },
    warn() {
      // Warning logged by NextAuth internally
    },
    debug() {
    }
  },
  debug: true,
  secret: process.env.NEXTAUTH_SECRET,
});

export { handler as GET, handler as POST }; 