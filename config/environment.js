class Environment {
  constructor() {
    this.platform = this.detectPlatform();
    this.isDev = process.env.NODE_ENV === 'development';
    this.isProd = process.env.NODE_ENV === 'production';
  }

  detectPlatform() {
    if (process.env.REPLIT_DEPLOYMENT) return 'replit-deployment';
    if (process.env.REPL_ID) return 'replit';
    if (process.env.VERCEL) return 'vercel';
    if (process.env.NETLIFY) return 'netlify';
    if (process.env.DYNO) return 'heroku';
    if (process.env.RAILWAY_ENVIRONMENT) return 'railway';
    if (process.env.DIGITALOCEAN_APP_ID) return 'digitalocean';
    if (process.env.DOCKERFILE_PATH) return 'docker';
    return 'local';
  }

  getPort() {
    const platformPorts = {
      replit: 5000,
      'replit-deployment': 80,
      vercel: 3000,
      netlify: 8888,
      heroku: process.env.PORT || 3000,
      railway: process.env.PORT || 3000,
      digitalocean: process.env.PORT || 8080,
      docker: 3000,
      local: 5000
    };

    return parseInt(
      process.env.PORT || 
      process.env.REPLIT_PORT || 
      platformPorts[this.platform] || 
      5000
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
    if (this.platform === 'local') return false;

    const dbUrl = this.getDatabaseUrl();
    return !dbUrl.includes('localhost') && !dbUrl.includes('127.0.0.1');
  }

  getPoolSize() {
    const platformPoolSizes = {
      replit: 20,
      vercel: 5,
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
    const platformTimeouts = {
      replit: 30000,
      vercel: 15000,
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
    const platformTtls = {
      replit: 1800,
      vercel: 900,
      netlify: 900,
      heroku: 1800,
      railway: 1800,
      digitalocean: 1800,
      docker: 1800,
      local: 300
    };

    return parseInt(process.env.CACHE_TTL || platformTtls[this.platform] || 1800);
  }

  getCacheMaxSize() {
    const platformSizes = {
      replit: 100,
      vercel: 50,
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

  getCorsOrigins() {
    const defaultOrigins = this.isDev 
      ? ['http://localhost:5173', 'http://localhost:5000', 'http://127.0.0.1:5173']
      : [];

    const platformOrigins = {
      replit: [`https://${process.env.REPL_SLUG}.${process.env.REPL_OWNER}.repl.co`],
      'replit-deployment': [process.env.REPLIT_DEPLOYMENT_URL],
      vercel: [process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : ''],
      netlify: [process.env.URL || ''],
      heroku: [`https://${process.env.HEROKU_APP_NAME}.herokuapp.com`],
      railway: [process.env.RAILWAY_PUBLIC_DOMAIN ? `https://${process.env.RAILWAY_PUBLIC_DOMAIN}` : ''],
      digitalocean: [process.env.APP_URL || '']
    };

    const origins = [
      ...defaultOrigins,
      ...(platformOrigins[this.platform] || [])
    ].filter(Boolean);

    return origins.length > 0 ? origins : ['*'];
  }

  getSessionSecret() {
    return process.env.SESSION_SECRET || process.env.REPLIT_DB_URL || 'dev-secret-key';
  }

  getSystemInfo() {
    const systemInfo = {
      platform: this.platform,
      port: this.getPort(),
      host: this.getHost(),
      isDev: this.isDev,
      isProd: this.isProd,
      nodeVersion: process.version,
      memoryUsage: process.memoryUsage(),
      uptime: process.uptime()
    };

    // Add publicUrl for supported platforms
    if (this.platform === 'replit' && process.env.REPL_SLUG && process.env.REPL_OWNER) {
      systemInfo.publicUrl = `https://${process.env.REPL_SLUG}.${process.env.REPL_OWNER}.repl.co`;
    } else if (this.platform === 'replit-deployment' && process.env.REPLIT_DEPLOYMENT_URL) {
      systemInfo.publicUrl = process.env.REPLIT_DEPLOYMENT_URL;
    } else if (this.platform === 'vercel' && process.env.VERCEL_URL) {
      systemInfo.publicUrl = `https://${process.env.VERCEL_URL}`;
    } else if (this.platform === 'netlify' && process.env.URL) {
      systemInfo.publicUrl = process.env.URL;
    }

    return systemInfo;
  }
}

const environment = new Environment();

// Exports nomeados
export const config = environment;
export const platform = environment.platform;
export const getSystemInfo = () => environment.getSystemInfo();

// Export default
export default environment;