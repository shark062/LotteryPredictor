import { QueryClient } from "@tanstack/react-query";
import { toast } from "@/hooks/use-toast";
import { memoryCache } from "./cdnUtils";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 10 * 60 * 1000, // 10 minutes - cache mais agressivo
      gcTime: 30 * 60 * 1000, // 30 minutes
      retry: (failureCount, error: any) => {
        // Don't retry on 4xx errors except 408, 429
        if (error?.status >= 400 && error?.status < 500 && ![408, 429].includes(error.status)) {
          return false;
        }
        return failureCount < 3;
      },
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      // Cache personalizado para dados críticos
      queryFn: async ({ queryKey, signal }) => {
        const cacheKey = JSON.stringify(queryKey);
        const cached = memoryCache.get(cacheKey);

        if (cached) {
          return cached;
        }

        const response = await fetch(queryKey[0] as string, { signal });
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }

        const data = await response.json();
        memoryCache.set(cacheKey, data, 5 * 60 * 1000); // 5 min cache
        return data;
      }
    },
    mutations: {
      onError: (error: any) => {
        let message = "Something went wrong";
        if (error?.message) {
          message = error.message;
        }

        toast({
          variant: "destructive",
          title: "Error",
          description: message,
        });
      },
      onSuccess: () => {
        // Invalidar cache relacionado após mutações
        queryClient.invalidateQueries();
      }
    },
  },
});

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  const res = await fetch(url, {
    method,
    headers: data ? { "Content-Type": "application/json" } : {},
    body: data ? JSON.stringify(data) : undefined,
    credentials: "include",
  });

  await throwIfResNotOk(res);
  return res;
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const res = await fetch(queryKey.join("/") as string, {
      credentials: "include",
    });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    await throwIfResNotOk(res);
    return await res.json();
  };