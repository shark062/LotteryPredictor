import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Home from "@/pages/Home";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
import React, { Suspense, lazy } from "react";
import { Router, Route, Switch } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { ErrorBoundary } from "react-error-boundary";

// Lazy loading para melhor performance
const Home = lazy(() => import("@/pages/Home"));
const Landing = lazy(() => import("@/pages/Landing"));
const NotFound = lazy(() => import("@/pages/not-found"));

// Cliente de queries otimizado
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutos
      cacheTime: 10 * 60 * 1000, // 10 minutos
      retry: 2,
      refetchOnWindowFocus: false,
    },
  },
});

// Componente de loading
const LoadingFallback = () => (
  <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 flex items-center justify-center">
    <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-400"></div>
  </div>
);

// Componente de erro
const ErrorFallback = ({ error, resetErrorBoundary }: any) => (
  <div className="min-h-screen bg-gradient-to-br from-gray-900 via-red-900 to-purple-900 flex items-center justify-center p-4">
    <div className="bg-gray-800 p-8 rounded-lg border border-red-500 max-w-md w-full">
      <h2 className="text-xl font-bold text-red-400 mb-4">Algo deu errado!</h2>
      <p className="text-gray-300 mb-4">{error.message}</p>
      <button
        onClick={resetErrorBoundary}
        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded transition-colors"
      >
        Tentar novamente
      </button>
    </div>
  </div>
);

function App() {
  return (
    <ErrorBoundary FallbackComponent={ErrorFallback}>
      <QueryClientProvider client={queryClient}>
        <Router>
          <Suspense fallback={<LoadingFallback />}>
            <Switch>
              <Route path="/" component={Home} />
              <Route path="/landing" component={Landing} />
              <Route component={NotFound} />
            </Switch>
          </Suspense>
        </Router>
        <Toaster />
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;
