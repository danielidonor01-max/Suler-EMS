import NextAuth from "next-auth";
import Credentials from 'next-auth/providers/credentials';
import prisma from '@/lib/prisma';
import { PasswordService } from './password.service';
import { AuthService } from './auth.service';

export const { 
  handlers, 
  auth, 
  signIn, 
  signOut 
} = NextAuth({
  providers: [
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
            departmentId: user.employee?.departmentId
          };
        } catch (error: any) {
          console.error('[AUTH ERROR]', error);
          return null;
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id as string;
        token.role = user.role;
        token.permissions = user.permissions;
        token.employeeId = user.employeeId as string | undefined;
        token.departmentId = user.departmentId as string | undefined;
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

