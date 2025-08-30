import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from "../shared/schema.js";
import { config as envConfig } from "../config/environment.js";

if (!process.env.DATABASE_URL) {
  console.warn("⚠️ DATABASE_URL not set, using default connection");
  process.env.DATABASE_URL = "postgresql://postgres:postgres@localhost:5432/sharkloto";
}

// Configuração otimizada do pool baseada na plataforma
const poolConfig = {
  connectionString: envConfig.getDatabaseUrl(),
  ssl: envConfig.requiresSsl() ? { rejectUnauthorized: false } : false,
  max: envConfig.getPoolSize(),
  min: 2,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: envConfig.getConnectionTimeout(),
  allowExitOnIdle: false,
  statement_timeout: 30000,
  query_timeout: 25000,
  // Configurações adicionais para estabilidade
  application_name: 'sharkloto_app',
  keepAlive: true,
  keepAliveInitialDelayMillis: 0,
};

export const pool = new Pool(poolConfig);

// Configuração do Drizzle com schema
export const db = drizzle(pool, { 
  schema,
  logger: process.env.NODE_ENV === 'development' // Log apenas em desenvolvimento
});

// Cache em memória para dados frequentemente acessados
export class DataCache {
  private static cache = new Map<string, { data: any; timestamp: number; ttl: number }>();

  static set(key: string, data: any, ttl: number = 300000): void { // TTL padrão: 5 minutos
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    });
  }

  static get(key: string): any | null {
    const item = this.cache.get(key);
    if (!item) return null;

    const now = Date.now();
    if (now - item.timestamp > item.ttl) {
      this.cache.delete(key);
      return null;
    }

    return item.data;
  }

  static invalidate(pattern: string): void {
    for (const key of this.cache.keys()) {
      if (key.includes(pattern)) {
        this.cache.delete(key);
      }
    }
  }

  static clear(): void {
    this.cache.clear();
  }

  static size(): number {
    return this.cache.size;
  }
}

// Event handlers para gerenciamento do pool
pool.on('connect', () => {
  console.log('✅ Nova conexão estabelecida com Neon Database');
});

pool.on('error', (err) => {
  console.error('❌ Erro no pool de conexões Neon:', err);
});

pool.on('acquire', () => {
  console.log('🔒 Conexão adquirida do pool');
});

pool.on('release', () => {
  console.log('🔓 Conexão liberada para o pool');
});

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('🔄 Encerrando pool de conexões...');
  await pool.end();
  console.log('✅ Pool de conexões encerrado com sucesso');
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('🔄 Encerrando pool de conexões...');
  await pool.end();
  console.log('✅ Pool de conexões encerrado com sucesso');
  process.exit(0);
});