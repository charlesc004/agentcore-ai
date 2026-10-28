"use client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";
import { Toaster } from "sonner";
export default function Providers({ children }: { children: React.ReactNode }) {
  const [client] = useState(
    () =>
      new QueryClient({
        defaultOptions: { queries: { retry: 1, refetchInterval: 10000 } },
      }),
  );
  return (
    <QueryClientProvider client={client}>
      {children}
      <Toaster theme="dark" richColors position="bottom-right" />
    </QueryClientProvider>
  );
}
