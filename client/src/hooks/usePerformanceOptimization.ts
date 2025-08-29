
import { useEffect, useCallback, useRef } from 'react';
import { throttle, debounce } from '@/lib/cdnUtils';

export function usePerformanceOptimization() {
  const mountedRef = useRef(true);

  useEffect(() => {
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const safeSetState = useCallback((setState: Function) => {
    return (...args: any[]) => {
      if (mountedRef.current) {
        setState(...args);
      }
    };
  }, []);

  // Intersection Observer para lazy loading
  const useIntersectionObserver = useCallback((callback: Function, options = {}) => {
    const ref = useRef<HTMLElement>(null);
    
    useEffect(() => {
      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            callback();
          }
        },
        { threshold: 0.1, ...options }
      );

      if (ref.current) {
        observer.observe(ref.current);
      }

      return () => {
        if (ref.current) {
          observer.unobserve(ref.current);
        }
      };
    }, [callback]);

    return ref;
  }, []);

  // RAF para animações suaves
  const useRequestAnimationFrame = useCallback((callback: Function) => {
    const requestRef = useRef<number>();
    
    const animate = useCallback(() => {
      callback();
      requestRef.current = requestAnimationFrame(animate);
    }, [callback]);

    useEffect(() => {
      requestRef.current = requestAnimationFrame(animate);
      return () => {
        if (requestRef.current) {
          cancelAnimationFrame(requestRef.current);
        }
      };
    }, [animate]);
  }, []);

  return {
    safeSetState,
    useIntersectionObserver,
    useRequestAnimationFrame,
    throttle,
    debounce
  };
}

// Hook para prevenção de memory leaks
export function useMemoryCleanup() {
  const timerRefs = useRef<Set<NodeJS.Timeout>>(new Set());
  const abortControllers = useRef<Set<AbortController>>(new Set());

  const createTimer = useCallback((callback: Function, delay: number) => {
    const timer = setTimeout(() => {
      callback();
      timerRefs.current.delete(timer);
    }, delay);
    
    timerRefs.current.add(timer);
    return timer;
  }, []);

  const createAbortController = useCallback(() => {
    const controller = new AbortController();
    abortControllers.current.add(controller);
    return controller;
  }, []);

  useEffect(() => {
    return () => {
      // Limpar todos os timers
      timerRefs.current.forEach(timer => clearTimeout(timer));
      timerRefs.current.clear();
      
      // Abortar todas as requisições pendentes
      abortControllers.current.forEach(controller => controller.abort());
      abortControllers.current.clear();
    };
  }, []);

  return {
    createTimer,
    createAbortController
  };
}
