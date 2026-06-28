"use client";

import { SessionProvider } from "next-auth/react";
import QueryProvider from "@/components/QueryProvider";
import { Toaster } from "sonner";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <QueryProvider>
        {children}
        <Toaster
          position="top-center"
          toastOptions={{
            duration: 3000,
            className: "text-sm",
          }}
        />
      </QueryProvider>
    </SessionProvider>
  );
}
