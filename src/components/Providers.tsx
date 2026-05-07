"use client";

import { SessionProvider } from "next-auth/react";
import { AccessProvider } from "@/context/AccessContext";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <AccessProvider>
        {children}
      </AccessProvider>
    </SessionProvider>
  );
}

