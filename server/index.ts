import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { DataCache } from "./db";
import { config, platform, getSystemInfo } from "../config/environment.js";

// Sistema de inicialização rápida e recuperação de falhas
const app = express();
const PORT = config.getPort();
const HOST = config.getHost();

// Middleware básico
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Sistema de cache e otimização
const cache = new DataCache();

// Middleware de log otimizado
app.use((req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    if (config.getLogLevel() === 'debug') {
      console.log(`${req.method} ${req.path} - ${res.statusCode} (${duration}ms)`);
    }
  });
  next();
});

// Middleware de erro
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error('Error:', err);
  res.status(500).json({ 
    message: config.isDev ? err.message : 'Internal Server Error',
    stack: config.isDev ? err.stack : undefined
  });
});

// Sistema de inicialização
async function startServer() {
  try {
    // Registrar rotas
    await registerRoutes(app);
    
    // Setup Vite em desenvolvimento
    if (config.isDev) {
      await setupVite(app);
    } else {
      serveStatic(app);
    }

    // Iniciar servidor
    const server = app.listen(PORT, HOST, () => {
      console.log(`🚀 Servidor rodando em http://${HOST}:${PORT}`);
      console.log(`📊 Plataforma: ${platform}`);
      console.log(`🔧 Ambiente: ${config.isDev ? 'desenvolvimento' : 'produção'}`);
    });

    // Graceful shutdown
    process.on('SIGTERM', () => {
      console.log('🔄 Recebido SIGTERM, encerrando servidor...');
      server.close(() => {
        console.log('✅ Servidor encerrado com sucesso');
        process.exit(0);
      });
    });

    return server;
  } catch (error) {
    console.error('❌ Erro ao iniciar servidor:', error);
    process.exit(1);
  }
}

// Inicializar aplicação
startServer().catch(console.error);

export default app;alhas
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

// Tratamento robusto de erros - evitar crashes
process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception (não crítico):', error.message);
  // Continuar rodando - não encerrar processo
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection (não crítico):', reason);
  // Continuar rodando - não encerrar processo
});

// Sistema de monitoramento de memória
setInterval(() => {
  const memUsage = process.memoryUsage();
  const memMB = Math.round(memUsage.heapUsed / 1024 / 1024);
  
  if (memMB > 250) { // Alerta se usar mais de 250MB
    console.warn(`⚠️ Uso de memória alto: ${memMB}MB`);
    // Limpar cache se necessário
    if (memMB > 400) {
      console.log('🧹 Limpando cache para liberar memória...');
      DataCache.clear();
    }
  }
}, 60000); // Verificar a cada minuto

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  try {
    // Inicialização rápida
    await StartupManager.fastStartup();

    // Registrar rotas com timeout
    console.log('📋 Registrando rotas da aplicação...');
    const server = await registerRoutes(app);

    // Sistema de health check avançado
    app.get('/health', (req, res) => {
      const status = StartupManager.getStatus();
      const systemInfo = getSystemInfo();
      
      res.json({
        status: 'healthy',
        platform,
        environment: config.nodeEnv,
        uptime: status.uptime,
        initialized: status.initialized,
        cache_size: DataCache.size(),
        memory_mb: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
        database: {
          connected: true,
          pool_size: config.database.poolSize,
          ssl_enabled: config.database.ssl
        },
        features: config.features,
        performance: {
          request_timeout: config.performance.requestTimeout,
          cache_enabled: config.cache.enabled,
          gzip_enabled: config.performance.enableGzip
        },
        system: systemInfo,
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
            error: process.env.NODE_ENV === 'development' ? err.stack : undefined
          });
        } catch (responseError) {
          console.error("❌ Falha ao enviar resposta de erro:", responseError);
        }
      }
    });

    // Setup do Vite otimizado
    if (app.get("env") === "development") {
      console.log('⚡ Configurando Vite para desenvolvimento...');
      await setupVite(app, server);
    } else {
      console.log('📦 Servindo arquivos estáticos de produção...');
      serveStatic(app);
    }

    // Iniciar servidor com configuração adaptável por plataforma
    const port = config.port;
    const host = config.host;
    
    server.listen({
      port,
      host,
      reusePort: true,
    }, () => {
      const uptime = StartupManager.getStatus().uptime;
      log(`🎯 Shark Loto servidor ativo na ${platform} - ${host}:${port} (startup: ${uptime}ms)`);
      
      if (platform !== 'local') {
        console.log(`🌐 URL pública: ${getSystemInfo().publicUrl}`);
      }
    });

    // Graceful shutdown melhorado
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

  } catch (error) {
    console.error('💥 Falha crítica na inicialização:', error);
    
    // Tentar recuperação básica
    console.log('🩹 Tentando recuperação básica...');
    const port = 5000;
    const basicServer = app.listen(port, '0.0.0.0', () => {
      console.log(`⚠️ Servidor básico ativo na porta ${port} (modo recuperação)`);
    });
  }
})();