
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { isUnauthorizedError } from "../lib/authUtils";

interface User {
  id: string;
  email: string;
  name: string;
}

const fetchUser = async (): Promise<User> => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout

  try {
    const response = await fetch("/api/auth/user", {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error(`401: Unauthorized`);
      }
      throw new Error(`${response.status}: ${response.statusText}`);
    }

    const user = await response.json();
    
    // Validar estrutura do usuário
    if (!user.id || !user.email || !user.name) {
      throw new Error("Invalid user data received");
    }

    return user;
  } catch (error) {
    clearTimeout(timeoutId);
    if (error instanceof Error) {
      throw error;
    }
    throw new Error("Failed to fetch user");
  }
};

export function useAuth() {
  const queryClient = useQueryClient();
  const [retryCount, setRetryCount] = useState(0);
  const maxRetries = 3;

  const {
    data: user,
    error,
    isLoading,
    isError,
    refetch
  } = useQuery({
    queryKey: ["auth-user"],
    queryFn: fetchUser,
    retry: (failureCount, error) => {
      // Não fazer retry para erros 401
      if (error instanceof Error && isUnauthorizedError(error)) {
        return false;
      }
      // Fazer retry até 3 vezes para outros erros
      return failureCount < maxRetries;
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    staleTime: 5 * 60 * 1000, // 5 minutos
    gcTime: 10 * 60 * 1000, // 10 minutos
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
  });

  const logout = async () => {
    try {
      await fetch("/api/logout", {
        method: "GET",
        credentials: "include",
      });
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      queryClient.clear();
      window.location.href = "/";
    }
  };

  const login = () => {
    window.location.href = "/api/login";
  };

  const isAuthenticated = !isError && !isLoading && !!user;
  const isUnauthorized = isError && error instanceof Error && isUnauthorizedError(error);

  useEffect(() => {
    if (isError && !isUnauthorized) {
      setRetryCount(prev => prev + 1);
      if (retryCount < maxRetries) {
        const timeout = setTimeout(() => {
          refetch();
        }, 2000 * (retryCount + 1));
        
        return () => clearTimeout(timeout);
      }
    }
  }, [isError, isUnauthorized, retryCount, refetch]);

  return {
    user,
    isLoading,
    isAuthenticated,
    isUnauthorized,
    isError,
    error,
    login,
    logout,
    refetch,
  };
}
