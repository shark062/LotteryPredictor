
import { pool } from './db';
import { caixaLotteryService } from './services/caixaLotteryService';
import { webScrapingService } from './services/webScrapingService';
import { aiService } from './services/aiService';

export class HealthCheckService {
  static async performFullHealthCheck(): Promise<{
    database: boolean;
    caixaAPI: boolean;
    webScraping: boolean;
    aiService: boolean;
    overall: 'healthy' | 'degraded' | 'unhealthy';
    details: any;
  }> {
    const results = {
      database: false,
      caixaAPI: false,
      webScraping: false,
      aiService: false,
      overall: 'unhealthy' as 'healthy' | 'degraded' | 'unhealthy',
      details: {
        database: null,
        caixaAPI: null,
        webScraping: null,
        aiService: null,
        timestamp: new Date().toISOString()
      }
    };

    // 1. Verificar conexão com banco Neon
    try {
      const client = await pool.connect();
      await client.query('SELECT 1');
      client.release();
      results.database = true;
      results.details.database = 'Conectado com sucesso ao Neon PostgreSQL';
      console.log('✅ Banco de dados Neon: OK');
    } catch (error) {
      results.details.database = `Erro: ${error.message}`;
      console.error('❌ Banco de dados Neon: FALHA');
    }

    // 2. Verificar API da Caixa
    try {
      const caixaData = await Promise.race([
        caixaLotteryService.getLatestResults(),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 10000))
      ]);
      
      const validLotteries = Object.keys(caixaData as any).length;
      if (validLotteries >= 5) {
        results.caixaAPI = true;
        results.details.caixaAPI = `${validLotteries} loterias com dados válidos`;
        console.log('✅ API Caixa: OK');
      } else {
        results.details.caixaAPI = `Apenas ${validLotteries} loterias válidas`;
        console.warn('⚠️ API Caixa: DEGRADADA');
      }
    } catch (error) {
      results.details.caixaAPI = `Erro: ${error.message}`;
      console.error('❌ API Caixa: FALHA');
    }

    // 3. Verificar Web Scraping
    try {
      const scrapingData = await Promise.race([
        webScrapingService.getLotteryInfo(),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 8000))
      ]);
      
      const validScraping = Object.keys(scrapingData as any).length;
      if (validScraping >= 3) {
        results.webScraping = true;
        results.details.webScraping = `${validScraping} loterias obtidas via scraping`;
        console.log('✅ Web Scraping: OK');
      } else {
        results.details.webScraping = `Apenas ${validScraping} loterias via scraping`;
        console.warn('⚠️ Web Scraping: DEGRADADO');
      }
    } catch (error) {
      results.details.webScraping = `Erro: ${error.message}`;
      console.error('❌ Web Scraping: FALHA');
    }

    // 4. Verificar serviço de IA
    try {
      const aiStatus = await aiService.getLearningStatus();
      if (aiStatus && typeof aiStatus === 'object') {
        results.aiService = true;
        results.details.aiService = 'IA operacional e aprendendo';
        console.log('✅ Serviço IA: OK');
      } else {
        results.details.aiService = 'IA com resposta inválida';
        console.warn('⚠️ Serviço IA: DEGRADADO');
      }
    } catch (error) {
      results.details.aiService = `Erro: ${error.message}`;
      console.error('❌ Serviço IA: FALHA');
    }

    // Determinar status geral
    const healthyServices = [results.database, results.caixaAPI, results.webScraping, results.aiService];
    const healthyCount = healthyServices.filter(Boolean).length;

    if (healthyCount === 4) {
      results.overall = 'healthy';
    } else if (healthyCount >= 2) {
      results.overall = 'degraded';
    } else {
      results.overall = 'unhealthy';
    }

    return results;
  }

  static async checkPortability(): Promise<{
    exportReady: boolean;
    dependencies: string[];
    envVars: string[];
    dbSchema: boolean;
    issues: string[];
  }> {
    const portabilityCheck = {
      exportReady: false,
      dependencies: [],
      envVars: [],
      dbSchema: false,
      issues: []
    };

    try {
      // Verificar package.json
      const fs = await import('fs').then(m => m.promises);
      const packageJson = JSON.parse(await fs.readFile('package.json', 'utf-8'));
      
      portabilityCheck.dependencies = [
        ...Object.keys(packageJson.dependencies || {}),
        ...Object.keys(packageJson.devDependencies || {})
      ];

      // Verificar variáveis de ambiente essenciais
      const essentialEnvVars = ['DATABASE_URL', 'NODE_ENV'];
      portabilityCheck.envVars = essentialEnvVars.filter(env => process.env[env]);

      // Verificar se todas as variáveis essenciais estão presentes
      const missingEnvVars = essentialEnvVars.filter(env => !process.env[env]);
      if (missingEnvVars.length > 0) {
        portabilityCheck.issues.push(`Variáveis de ambiente ausentes: ${missingEnvVars.join(', ')}`);
      }

      // Verificar schema do banco
      try {
        const client = await pool.connect();
        await client.query(`
          SELECT table_name 
          FROM information_schema.tables 
          WHERE table_schema = 'public'
        `);
        client.release();
        portabilityCheck.dbSchema = true;
      } catch (error) {
        portabilityCheck.issues.push(`Erro no schema do banco: ${error.message}`);
      }

      // Determinar se está pronto para exportação
      portabilityCheck.exportReady = 
        portabilityCheck.dependencies.length > 0 &&
        portabilityCheck.envVars.length === essentialEnvVars.length &&
        portabilityCheck.dbSchema &&
        portabilityCheck.issues.length === 0;

    } catch (error) {
      portabilityCheck.issues.push(`Erro na verificação: ${error.message}`);
    }

    return portabilityCheck;
  }
}
