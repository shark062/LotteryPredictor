import { useQuery } from "@tanstack/react-query";

export function useAuth() {
  const { data: user, isLoading, error } = useQuery({
    queryKey: ["/api/auth/user"],
    retry: false,
    staleTime: Infinity, // Keep user data cached
  });

  // Always return demo user when not loading
  return {
    user: user || { id: 'demo-user', email: 'usuario@demo.com', name: 'Usuário Demo' },
    isLoading: false, // Always ready for demo
    isAuthenticated: true, // Always authenticated for demo
  };
}