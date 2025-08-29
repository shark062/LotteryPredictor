import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes.js";
import { setupVite, serveStatic, log } from "./vite.js";
import { DataCache } from "./db.js";
import { config as envConfig, platform, getSystemInfo as getEnvSystemInfo } from "../config/environment.js";
import { createRequire } from 'module';

const require = createRequire(import.meta.url);

// Sistema de inicialização rápida e recuperação de falhas
const app = express();
const PORT = envConfig.getPort();
const HOST = envConfig.getHost();

// Middleware básico
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Sistema de cache e otimização
const cache = new DataCache();

// Middleware de log otimizado
app.use((req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();

  // Reduzir logs para evitar spam
  const skipLogging = req.path.includes('/health') ||
                     req.path.includes('/api/ai/status') ||
                     req.path.includes('/static') ||
                     req.path.includes('.js') ||
                     req.path.includes('.css');

  if (!skipLogging) {
    res.on('finish', () => {
      const duration = Date.now() - start;
      if (req.path.startsWith("/api") && duration > 100) { // Log apenas requests lentos
        log(`${req.method} ${req.path} ${res.statusCode} in ${duration}ms`);
      }
    });
  }
  next();
});

// Sistema de cache e otimização de falhas
class StartupManager {
  private static initialized = false;
  private static startupPromise: Promise<void> | null = null;

  static async fastStartup(): Promise<void> {
    if (this.initialized) return;
    if (this.startupPromise) return this.startupPromise;

    console.log('🚀 Iniciando sistema com otimizações...');

    this.startupPromise = this.performStartup();
    await this.startupPromise;
    this.initialized = true;
  }

  private static async performStartup(): Promise<void> {
    const startTime = Date.now();

    try {
      // Pré-aquecer cache
      console.log('🔥 Pré-aquecendo sistema de cache...');
      DataCache.set('startup_time', startTime);

      // Verificar conectividade de rede
      console.log('🌐 Verificando conectividade...');
      await this.checkConnectivity();

      console.log(`⚡ Sistema iniciado em ${Date.now() - startTime}ms`);
    } catch (error) {
      console.warn('⚠️ Startup com falhas parciais:', error);
      // Não falhar o startup completamente - continuar funcionando
    }
  }

  private static async checkConnectivity(): Promise<void> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000);

      await fetch('https://httpbin.org/get', {
        signal: controller.signal,
        method: 'GET'
      });

      clearTimeout(timeoutId);
      console.log('✅ Conectividade verificada');
    } catch (error) {
      console.log('⚠️ Conectividade limitada, continuando...');
    }
  }

  static getStatus(): { initialized: boolean; uptime: number } {
    const startupTime = DataCache.get('startup_time') || Date.now();
    return {
      initialized: this.initialized,
      uptime: Date.now() - startupTime
    };
  }
}

// Sistema de inicialização
async function startServer() {
  try {
    // Inicialização rápida
    await StartupManager.fastStartup();

    // Registrar rotas
    console.log('📋 Registrando rotas da aplicação...');
    await registerRoutes(app);

    // Sistema de health check otimizado
    app.get('/health', (req, res) => {
      res.json({
        status: 'healthy',
        uptime: Math.round(process.uptime()),
        memory_mb: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
        timestamp: new Date().toISOString()
      });
    });

    // Middleware de erro robusto
    app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
      const status = err.status || err.statusCode || 500;
      const message = err.message || "Internal Server Error";

      // Log detalhado apenas para erros críticos
      if (status >= 500) {
        console.error("❌ Erro crítico:", err);
      } else {
        console.warn("⚠️ Erro de cliente:", message);
      }

      // Resposta segura
      if (!res.headersSent) {
        try {
          res.status(status).json({
            message,
            error: envConfig.isDev ? err.stack : undefined
          });
        } catch (responseError) {
          console.error("❌ Falha ao enviar resposta de erro:", responseError);
        }
      }
    });

    // Setup Vite em desenvolvimento ou produção
    if (envConfig.isDev) {
      console.log('⚡ Configurando Vite para desenvolvimento...');
      const server = require('http').createServer(app);
      await setupVite(app, server);
    } else {
      console.log('📦 Tentando servir arquivos estáticos de produção...');
      try {
        serveStatic(app);
      } catch (staticError) {
        console.warn('⚠️ Arquivos estáticos não encontrados, usando Vite...');
        const server = require('http').createServer(app);
        await setupVite(app, server);
      }
    }

    // Iniciar servidor
    const server = app.listen(PORT, HOST, () => {
      const uptime = StartupManager.getStatus().uptime;
      console.log(`🚀 Servidor rodando em http://${HOST}:${PORT}`);
      console.log(`📊 Plataforma: ${platform}`);
      console.log(`🔧 Ambiente: ${envConfig.isDev ? 'desenvolvimento' : 'produção'}`);
      console.log(`⚡ Startup: ${uptime}ms`);

      if (platform !== 'local') {
        const systemInfo = getEnvSystemInfo();
        console.log(`🌐 URL pública: ${systemInfo.publicUrl}`);
      }
    });

    // Graceful shutdown
    const gracefulShutdown = async (signal: string) => {
      console.log(`🔄 Recebido sinal ${signal}, encerrando graciosamente...`);

      try {
        // Fechar servidor HTTP
        server.close(() => {
          console.log('✅ Servidor HTTP encerrado');
        });

        // Limpar cache
        DataCache.clear();
        console.log('✅ Cache limpo');

        // Aguardar processos finalizarem
        await new Promise(resolve => setTimeout(resolve, 1000));

        console.log('✅ Shutdown completo');
        process.exit(0);
      } catch (error) {
        console.error('❌ Erro durante shutdown:', error);
        process.exit(1);
      }
    };

    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

    return server;
  } catch (error) {
    console.error('❌ Erro ao iniciar servidor:', error);

    // Forçar uso do Vite em caso de erro
    console.log('🔄 Forçando inicialização com Vite...');
    try {
      const server = require('http').createServer(app);
      await setupVite(app, server);

      const viteServer = server.listen(PORT, HOST, () => {
        console.log(`🚀 Servidor Vite rodando em http://${HOST}:${PORT}`);
        console.log('⚡ Modo de desenvolvimento ativo');
      });

      return viteServer;
    } catch (viteError) {
      console.error('❌ Erro crítico:', viteError);
      process.exit(1);
    }
  }
}

// Tratamento robusto de erros - evitar crashes
process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception (não crítico):', error.message);
  // Continuar rodando - não encerrar processo
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection (não crítico):', reason);
  // Continuar rodando - não encerrar processo
});

// Sistema de monitoramento de memória - reduzido para 5 minutos
setInterval(() => {
  const memUsage = process.memoryUsage();
  const memMB = Math.round(memUsage.heapUsed / 1024 / 1024);

  if (memMB > 300) { // Alerta se usar mais de 300MB
    console.warn(`⚠️ Uso de memória alto: ${memMB}MB`);
    // Limpar cache se necessário
    if (memMB > 450) {
      console.log('🧹 Limpando cache para liberar memória...');
      DataCache.clear();
    }
  }
}, 300000); // Verificar a cada 5 minutos

// Inicializar aplicação
startServer().catch(console.error);

export default app;