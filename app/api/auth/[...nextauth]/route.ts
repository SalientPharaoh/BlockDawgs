import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import type { AuthOptions, User } from "next-auth";
import type { JWT } from "next-auth/jwt";

interface CustomUser extends User {
  auth_token?: string;
  refresh_auth_token?: string;
  device_token?: string;
  phone?: string | null;
}

declare module "next-auth" {
  interface Session {
    id_token?: string;
    auth_token?: string;
    refresh_auth_token?: string;
    device_token?: string;
    user: {
      id: string;
      email?: string | null;
      phone?: string | null;
      name?: string | null;
      image?: string | null;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id_token?: string;
    auth_token?: string;
    refresh_auth_token?: string;
    device_token?: string;
    email?: string | null;
    phone?: string | null;
  }
}

export const authOptions: AuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    CredentialsProvider({
      id: "email-auth",
      name: "Email",
      credentials: {
        email: { label: "Email", type: "email" },
        auth_token: { label: "Auth Token", type: "text" },
        refresh_auth_token: { label: "Refresh Token", type: "text" },
        device_token: { label: "Device Token", type: "text" },
      },
      async authorize(credentials): Promise<CustomUser | null> {
        if (!credentials?.auth_token) return null;

        return {
          id: credentials.email || "user-id",
          email: credentials.email,
          auth_token: credentials.auth_token,
          refresh_auth_token: credentials.refresh_auth_token,
          device_token: credentials.device_token,
        };
      },
    }),
    CredentialsProvider({
      id: "phone-auth",
      name: "Phone",
      credentials: {
        phone: { label: "Phone", type: "tel" },
        auth_token: { label: "Auth Token", type: "text" },
        refresh_auth_token: { label: "Refresh Token", type: "text" },
        device_token: { label: "Device Token", type: "text" },
      },
      async authorize(credentials): Promise<CustomUser | null> {
        if (!credentials?.auth_token) return null;

        return {
          id: credentials.phone || "user-id",
          phone: credentials.phone,
          auth_token: credentials.auth_token,
          refresh_auth_token: credentials.refresh_auth_token,
          device_token: credentials.device_token,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, account }): Promise<JWT> {
      if (user) {
        const customUser = user as CustomUser;
        token.auth_token = customUser.auth_token;
        token.refresh_auth_token = customUser.refresh_auth_token;
        token.device_token = customUser.device_token;
        token.email = customUser.email;
        token.phone = customUser.phone;
      }
      if (account) {
        token.id_token = account.id_token;
      }
      return token;
    },

    async session({ session, token }): Promise<any> {
      return {
        ...session,
        auth_token: token.auth_token as string | undefined,
        refresh_auth_token: token.refresh_auth_token as string | undefined,
        device_token: token.device_token as string | undefined,
        id_token: token.id_token,
        user: {
          id: token.sub || "user-id",
          email: token.email,
          phone: token.phone as string | null,
          name: session.user?.name,
          image: session.user?.image,
        },
      };
    },
  },
  pages: {
    signIn: '/login',
  },
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  secret: process.env.AUTH_SECRET,
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
