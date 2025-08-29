// Configuração de Ambiente Multiplataforma
// Sistema inteligente que detecta e configura automaticamente para cada plataforma

class EnvironmentDetector {
  constructor() {
    this.platform = this.detectPlatform();
    this.config = this.generateConfig();
  }

  detectPlatform() {
    // Detectar Replit
    if (process.env.REPLIT_DB_URL || process.env.REPLIT_CLUSTER) {
      return 'replit';
    }

    // Detectar Vercel
    if (process.env.VERCEL || process.env.VERCEL_ENV) {
      return 'vercel';
    }

    // Detectar Netlify
    if (process.env.NETLIFY || process.env.NETLIFY_ENV) {
      return 'netlify';
    }

    // Detectar Heroku
    if (process.env.DYNO || process.env.HEROKU_APP_NAME) {
      return 'heroku';
    }

    // Detectar Railway
    if (process.env.RAILWAY_STATIC_URL || process.env.RAILWAY_GIT_COMMIT_SHA) {
      return 'railway';
    }

    // Detectar DigitalOcean
    if (process.env.DIGITALOCEAN_APP_NAME || process.env.DO_APP_NAME) {
      return 'digitalocean';
    }

    // Detectar Docker
    if (process.env.DOCKER_CONTAINER || fs.existsSync('/.dockerenv')) {
      return 'docker';
    }

    // Ambiente local por padrão
    return 'local';
  }

  generateConfig() {
    const baseConfig = {
      // Configurações universais
      nodeEnv: process.env.NODE_ENV || 'development',
      port: this.getPort(),
      host: this.getHost(),
      
      // Database
      database: {
        url: this.getDatabaseUrl(),
        ssl: this.requiresSsl(),
        poolSize: this.getPoolSize(),
        connectionTimeout: this.getConnectionTimeout()
      },

      // API Keys
      apiKeys: {
        openai: process.env.OPENAI_API_KEY,
        caixa: process.env.CAIXA_API_KEY // Para futuras integrações oficiais
      },

      // Cache
      cache: {
        enabled: this.platform !== 'local',
        ttl: this.getCacheTtl(),
        maxSize: this.getCacheMaxSize()
      },

      // Logging
      logging: {
        level: this.getLogLevel(),
        format: this.getLogFormat(),
        enableConsole: true,
        enableFile: this.platform === 'local'
      },

      // Performance
      performance: {
        enableGzip: true,
        enableCors: true,
        allowedOrigins: this.getAllowedOrigins(),
        requestTimeout: this.getRequestTimeout(),
        bodyLimit: '10mb'
      },

      // Features flags
      features: {
        realTimeNotifications: true,
        aiLearning: true,
        dataValidation: true,
        autoCorrection: true,
        analytics: this.platform !== 'local'
      }
    };

    // Configurações específicas por plataforma
    return this.applyPlatformSpecificConfig(baseConfig);
  }

  getPort() {
    // Prioridade para variáveis de ambiente específicas da plataforma
    return parseInt(
      process.env.PORT ||
      process.env.REPLIT_PORT ||
      process.env.VERCEL_PORT ||
      process.env.RAILWAY_PORT ||
      '5000'
    );
  }

  getHost() {
    const platformHosts = {
      replit: '0.0.0.0',
      vercel: '0.0.0.0',
      netlify: '0.0.0.0',
      heroku: '0.0.0.0',
      railway: '0.0.0.0',
      digitalocean: '0.0.0.0',
      docker: '0.0.0.0',
      local: 'localhost'
    };

    return process.env.HOST || platformHosts[this.platform] || '0.0.0.0';
  }

  getDatabaseUrl() {
    // Suporte a diferentes formatos de URL de banco
    return (
      process.env.DATABASE_URL ||
      process.env.POSTGRES_URL ||
      process.env.POSTGRESQL_URL ||
      process.env.DB_URL ||
      process.env.NEON_DATABASE_URL ||
      'postgresql://postgres:postgres@localhost:5432/sharkloto'
    );
  }

  requiresSsl() {
    // SSL obrigatório em produção, exceto para localhost
    if (this.platform === 'local') return false;
    
    const dbUrl = this.getDatabaseUrl();
    return !dbUrl.includes('localhost') && !dbUrl.includes('127.0.0.1');
  }

  getPoolSize() {
    const platformPoolSizes = {
      replit: 20,
      vercel: 5, // Limitado por conexões serverless
      netlify: 5,
      heroku: 10,
      railway: 15,
      digitalocean: 20,
      docker: 25,
      local: 10
    };

    return parseInt(process.env.DB_POOL_SIZE || platformPoolSizes[this.platform] || 10);
  }

  getConnectionTimeout() {
    // Timeout em milissegundos
    const platformTimeouts = {
      replit: 30000,
      vercel: 15000, // Mais rápido para serverless
      netlify: 15000,
      heroku: 30000,
      railway: 30000,
      digitalocean: 30000,
      docker: 30000,
      local: 5000
    };

    return parseInt(process.env.DB_TIMEOUT || platformTimeouts[this.platform] || 30000);
  }

  getCacheTtl() {
    // TTL padrão do cache em segundos
    const platformTtls = {
      replit: 1800, // 30 minutos
      vercel: 900,  // 15 minutos (serverless)
      netlify: 900,
      heroku: 1800,
      railway: 1800,
      digitalocean: 1800,
      docker: 1800,
      local: 300 // 5 minutos para desenvolvimento
    };

    return parseInt(process.env.CACHE_TTL || platformTtls[this.platform] || 1800);
  }

  getCacheMaxSize() {
    // Tamanho máximo do cache em MB
    const platformSizes = {
      replit: 100,
      vercel: 50, // Limitado por memória serverless
      netlify: 50,
      heroku: 100,
      railway: 150,
      digitalocean: 200,
      docker: 200,
      local: 50
    };

    return parseInt(process.env.CACHE_MAX_SIZE || platformSizes[this.platform] || 100);
  }

  getLogLevel() {
    if (process.env.LOG_LEVEL) return process.env.LOG_LEVEL;
    
    return this.platform === 'local' ? 'debug' : 'info';
  }

  getLogFormat() {
    return this.platform === 'local' ? 'pretty' : 'json';
  }

  getAllowedOrigins() {
    // Configurar CORS baseado na plataforma
    if (process.env.ALLOWED_ORIGINS) {
      return process.env.ALLOWED_ORIGINS.split(',');
    }

    const platformOrigins = {
      replit: ['*.replit.dev', '*.replit.co', '*.replit.app'],
      vercel: ['*.vercel.app', '*.vercel.com'],
      netlify: ['*.netlify.app', '*.netlify.com'],
      heroku: ['*.herokuapp.com'],
      railway: ['*.railway.app'],
      digitalocean: ['*.ondigitalocean.app'],
      docker: ['*'],
      local: ['http://localhost:*', 'http://127.0.0.1:*']
    };

    return platformOrigins[this.platform] || ['*'];
  }

  getRequestTimeout() {
    // Timeout para requests em milissegundos
    const platformTimeouts = {
      replit: 120000, // 2 minutos
      vercel: 30000,  // 30 segundos (limitação serverless)
      netlify: 30000,
      heroku: 60000,
      railway: 120000,
      digitalocean: 120000,
      docker: 120000,
      local: 30000
    };

    return parseInt(process.env.REQUEST_TIMEOUT || platformTimeouts[this.platform] || 60000);
  }

  applyPlatformSpecificConfig(config) {
    switch (this.platform) {
      case 'replit':
        return {
          ...config,
          replit: {
            enableAnalytics: false, // Privacy
            enableDebugMode: true,
            hotReload: true
          }
        };

      case 'vercel':
        return {
          ...config,
          vercel: {
            enableEdgeRuntime: false, // Usar Node.js runtime
            enableISR: true, // Incremental Static Regeneration
            regions: ['iad1'], // US East
          }
        };

      case 'netlify':
        return {
          ...config,
          netlify: {
            enableFunctions: true,
            enableEdgeFunctions: false,
            splitTesting: false
          }
        };

      case 'heroku':
        return {
          ...config,
          heroku: {
            enableMetrics: true,
            enableAutoscaling: false,
            dynoType: 'web'
          }
        };

      case 'railway':
        return {
          ...config,
          railway: {
            enableAutoSleep: false,
            enablePublicNetworking: true
          }
        };

      case 'digitalocean':
        return {
          ...config,
          digitalocean: {
            enableCDN: true,
            enableLoadBalancer: false
          }
        };

      case 'docker':
        return {
          ...config,
          docker: {
            enableHealthCheck: true,
            enableSwarm: false,
            restartPolicy: 'unless-stopped'
          }
        };

      default:
        return config;
    }
  }

  // Métodos utilitários
  isPlatform(platformName) {
    return this.platform === platformName;
  }

  isProduction() {
    return this.config.nodeEnv === 'production';
  }

  isDevelopment() {
    return this.config.nodeEnv === 'development';
  }

  isServerless() {
    return ['vercel', 'netlify'].includes(this.platform);
  }

  supportsWebSockets() {
    // Nem todas as plataformas suportam WebSockets
    return !this.isServerless();
  }

  getPublicUrl() {
    // Tentar detectar URL pública automaticamente
    if (process.env.PUBLIC_URL) return process.env.PUBLIC_URL;
    if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
    if (process.env.NETLIFY_URL) return process.env.NETLIFY_URL;
    if (process.env.HEROKU_APP_NAME) return `https://${process.env.HEROKU_APP_NAME}.herokuapp.com`;
    if (process.env.RAILWAY_STATIC_URL) return process.env.RAILWAY_STATIC_URL;
    
    return `http://${this.config.host}:${this.config.port}`;
  }

  // Método para debug e monitoramento
  getSystemInfo() {
    return {
      platform: this.platform,
      nodeVersion: process.version,
      environment: this.config.nodeEnv,
      publicUrl: this.getPublicUrl(),
      features: this.config.features,
      memoryUsage: process.memoryUsage(),
      uptime: process.uptime(),
      timestamp: new Date().toISOString()
    };
  }
}

// Singleton instance
const envDetector = new EnvironmentDetector();

module.exports = {
  platform: envDetector.platform,
  config: envDetector.config,
  detector: envDetector,
  
  // Shortcuts para facilitar uso
  isPlatform: (name) => envDetector.isPlatform(name),
  isProduction: () => envDetector.isProduction(),
  isDevelopment: () => envDetector.isDevelopment(),
  isServerless: () => envDetector.isServerless(),
  supportsWebSockets: () => envDetector.supportsWebSockets(),
  getPublicUrl: () => envDetector.getPublicUrl(),
  getSystemInfo: () => envDetector.getSystemInfo()
};