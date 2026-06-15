import NextAuth from "next-auth";
import Credentials from 'next-auth/providers/credentials';
import Google from 'next-auth/providers/google';
import prisma from '@/lib/prisma';
import { PasswordService } from './password.service';
import { AuthService } from './auth.service';

/**
 * Google OAuth is enabled only when both env vars are set. This lets
 * developers run the app on localhost without OAuth credentials.
 */
const googleEnabled = Boolean(
  process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET,
);

export const {
  handlers,
  auth,
  signIn,
  signOut
} = NextAuth({
  // NextAuth v5 beta refuses to trust the request host outside Vercel
  // unless you opt in. Without this, /api/auth/session 500s on localhost
  // with a generic "server configuration" error.
  trustHost: true,
  // Pick up AUTH_SECRET (v5 convention) or NEXTAUTH_SECRET (v4 fallback)
  // explicitly so the resolution isn't environment-magic.
  secret: process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET,
  providers: [
    ...(googleEnabled ? [Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      // Google emails are verified by the provider, so linking by email is
      // safe here. Without this, OAuth sign-in would refuse to attach to an
      // existing Credentials user with the same email.
      allowDangerousEmailAccountLinking: true,
    })] : []),
    Credentials({
      async authorize(credentials) {
        const correlationId = crypto.randomUUID();
        
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const email = credentials.email as string;

        try {
          const user = await prisma.user.findUnique({
            where: { email },
            include: { 
              role: { include: { permissions: true } },
              employee: true 
            }
          });

          if (!user || !user.isActive) {
            await AuthService.recordLoginAttempt({
              email,
              success: false,
              correlationId
            });
            await AuthService.recordSecurityEvent({
              type: 'LOGIN_FAILURE',
              description: `Login failed: ${!user ? 'User not found' : 'Account inactive'}`,
              metadata: { email },
              correlationId
            });
            return null;
          }

          const isValid = await PasswordService.verify(
            credentials.password as string, 
            user.passwordHash
          );

          if (!isValid) {
            await AuthService.recordLoginAttempt({
              email,
              success: false,
              userId: user.id,
              correlationId
            });
            await AuthService.recordSecurityEvent({
              type: 'LOGIN_FAILURE',
              userId: user.id,
              description: 'Login failed: Invalid password',
              metadata: { email },
              correlationId
            });
            return null;
          }

          // SUCCESS
          await AuthService.recordLoginAttempt({
            email,
            success: true,
            userId: user.id,
            correlationId
          });
          await AuthService.recordSecurityEvent({
            type: 'LOGIN_SUCCESS',
            userId: user.id,
            description: 'Login successful',
            metadata: { email },
            correlationId
          });

          return {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role.name,
            permissions: user.role.permissions.map(p => p.code),
            employeeId: user.employeeId,
            departmentId: user.employee?.departmentId,
            version: user.version,
          };
        } catch (error: any) {
          console.error('[AUTH ERROR]', error);
          return null;
        }
      },
    }),
  ],
  callbacks: {
    /**
     * Gate OAuth sign-ins: only allow Google when an existing Suler user
     * record matches the verified email. There is no self-service signup.
     * Credentials sign-ins are pre-validated by `authorize` and pass through.
     */
    async signIn({ user, account }) {
      if (account?.provider === 'google') {
        if (!user.email) return false;
        const existing = await prisma.user.findUnique({
          where: { email: user.email },
          include: { role: { include: { permissions: true } }, employee: true },
        });
        if (!existing || !existing.isActive) return false;
        // Hand the merged record back to the jwt callback via `user.*`.
        (user as any).id = existing.id;
        (user as any).role = existing.role.name;
        (user as any).permissions = existing.role.permissions.map(p => p.code);
        (user as any).employeeId = existing.employeeId ?? undefined;
        (user as any).departmentId = existing.employee?.departmentId ?? undefined;
        (user as any).version = existing.version;
        await AuthService.recordSecurityEvent({
          type: 'LOGIN_SUCCESS',
          userId: existing.id,
          description: 'Login successful (Google SSO)',
          metadata: { email: existing.email, provider: 'google' },
          correlationId: crypto.randomUUID(),
        }).catch(() => {});
        return true;
      }
      return true;
    },
    async jwt({ token, user, trigger }) {
      if (user) {
        token.id = user.id as string;
        token.role = user.role;
        token.permissions = user.permissions;
        token.employeeId = user.employeeId as string | undefined;
        token.departmentId = user.departmentId as string | undefined;
        token.version = (user as any).version ?? 1;
      }
      // Permission refresh path: client called `session.update()` because the
      // session-version poller detected a mismatch. Re-read DB and rebuild
      // token claims so RBAC reflects current permissions without re-login.
      // See ARCHITECTURE.md §11.
      if (trigger === 'update' && token.id) {
        const fresh = await prisma.user.findUnique({
          where: { id: token.id as string },
          include: { role: { include: { permissions: true } }, employee: true },
        });
        if (fresh && fresh.isActive) {
          token.role = fresh.role.name;
          token.permissions = fresh.role.permissions.map(p => p.code);
          token.employeeId = fresh.employeeId ?? undefined;
          token.departmentId = fresh.employee?.departmentId ?? undefined;
          token.version = fresh.version;
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
        session.user.permissions = token.permissions as string[];
        session.user.employeeId = token.employeeId as string;
        session.user.departmentId = token.departmentId as string;
        (session.user as any).version = (token.version as number) ?? 1;
      }
      return session;
    },
  },
  pages: {
    signIn: '/login',
  },
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60,
  },
});

