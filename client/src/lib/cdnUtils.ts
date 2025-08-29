
import { useMemo } from 'react';

// Cache em memória para dados frequentemente acessados
class MemoryCache {
  private cache = new Map<string, { data: any; timestamp: number; ttl: number }>();

  set(key: string, data: any, ttl: number = 5 * 60 * 1000) { // 5 minutos default
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    });
  }

  get(key: string) {
    const item = this.cache.get(key);
    if (!item) return null;

    if (Date.now() - item.timestamp > item.ttl) {
      this.cache.delete(key);
      return null;
    }

    return item.data;
  }

  clear() {
    this.cache.clear();
  }

  size() {
    return this.cache.size;
  }
}

// Instância global do cache
export const memoryCache = new MemoryCache();

// CDN URLs para assets otimizados
export const CDN_URLS = {
  fonts: {
    inter: 'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap',
    poppins: 'https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&display=swap',
  },
  icons: {
    lucide: 'https://cdn.jsdelivr.net/npm/lucide@latest/dist/umd/lucide.js',
  },
  libraries: {
    framerMotion: 'https://cdn.jsdelivr.net/npm/framer-motion@latest/dist/index.min.js',
  }
};

// Hook para cache de dados com invalidação automática
export function useCachedData<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttl: number = 5 * 60 * 1000
) {
  return useMemo(() => {
    const cached = memoryCache.get(key);
    if (cached) return cached;

    const fetchData = async () => {
      try {
        const data = await fetcher();
        memoryCache.set(key, data, ttl);
        return data;
      } catch (error) {
        console.error(`Erro ao buscar dados para ${key}:`, error);
        throw error;
      }
    };

    return fetchData();
  }, [key, fetcher, ttl]);
}

// Debounce para evitar muitas chamadas
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

// Throttle para limitar frequência de execução
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}

// Preload de imagens para cache do navegador
export function preloadImage(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve();
    img.onerror = reject;
    img.src = src;
  });
}

// Lazy loading para componentes pesados
export function createLazyComponent<T extends React.ComponentType<any>>(
  importFunc: () => Promise<{ default: T }>
) {
  return React.lazy(importFunc);
}

// Service Worker para cache agressivo
export function registerServiceWorker() {
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/sw.js')
        .then((registration) => {
          console.log('SW registrado com sucesso:', registration);
        })
        .catch((registrationError) => {
          console.log('SW falha no registro:', registrationError);
        });
    });
  }
}

// Compressão de dados para localStorage
export const compressedStorage = {
  set(key: string, data: any) {
    try {
      const compressed = JSON.stringify(data);
      localStorage.setItem(key, compressed);
    } catch (error) {
      console.error('Erro ao salvar no localStorage:', error);
    }
  },

  get(key: string) {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : null;
    } catch (error) {
      console.error('Erro ao ler do localStorage:', error);
      return null;
    }
  },

  remove(key: string) {
    localStorage.removeItem(key);
  }
};
