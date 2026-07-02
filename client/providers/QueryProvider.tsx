import { useState, type ReactNode } from "react";
import {
  QueryClient,
  QueryClientProvider,
  QueryCache,
  MutationCache,
} from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { logger } from "@/lib/logger";
import { registerQueryClient } from "@/lib/queryClientRegistry";
import { SupabaseQueryError } from "@/services/supabase/fallback";

function isTransientError(error: unknown): boolean {
  if (error instanceof SupabaseQueryError) {
    const msg = error.message.toLowerCase();
    return (
      msg.includes("network") ||
      msg.includes("fetch") ||
      msg.includes("timeout") ||
      msg.includes("503") ||
      msg.includes("502")
    );
  }
  return false;
}

function createQueryClient(): QueryClient {
  return new QueryClient({
    queryCache: new QueryCache({
      onError: (error, query) => {
        const message = error instanceof Error ? error.message : String(error);
        if (message.includes("Premium Chef Membership required")) {
          return;
        }
        logger.error("Query failed", {
          domain: "react-query",
          queryKey: JSON.stringify(query.queryKey),
          message,
        });
      },
    }),
    mutationCache: new MutationCache({
      onError: (error, _vars, _ctx, mutation) => {
        logger.error("Mutation failed", {
          domain: "react-query",
          mutationKey: JSON.stringify(mutation.options.mutationKey),
          message: error instanceof Error ? error.message : String(error),
        });
      },
    }),
    defaultOptions: {
      queries: {
        staleTime: 1000 * 60 * 5,
        gcTime: 1000 * 60 * 30,
        retry: (failureCount, error) => {
          if (!isTransientError(error)) return failureCount < 1;
          return failureCount < 3;
        },
        retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 8000),
        refetchOnWindowFocus: import.meta.env.PROD ? false : true,
        refetchOnReconnect: true,
      },
      mutations: {
        retry: 0,
      },
    },
  });
}

interface QueryProviderProps {
  children: ReactNode;
}

export function QueryProvider({ children }: QueryProviderProps) {
  const [queryClient] = useState(() => {
    const client = createQueryClient();
    registerQueryClient(client);
    return client;
  });

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {import.meta.env.DEV ? (
        <ReactQueryDevtools initialIsOpen={false} buttonPosition="bottom-left" />
      ) : null}
    </QueryClientProvider>
  );
}
