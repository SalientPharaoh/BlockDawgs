"use client";
import { SessionProvider } from "next-auth/react";
import { AppContextProvider, AuthProvider } from "./AppContext";

export default function Providers({ 
  children,
  session 
}: { 
  children: React.ReactNode;
  session: any;
}) {
  return (
    <SessionProvider session={session} refetchInterval={0}>
      <AppContextProvider>
        <AuthProvider>
          {children}
        </AuthProvider>
      </AppContextProvider>
    </SessionProvider>
  );
}
