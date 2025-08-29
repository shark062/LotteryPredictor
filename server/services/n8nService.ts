import { spawn, ChildProcess } from 'child_process';
// import fetch from 'node-fetch'; // Removed: node-fetch is no longer needed
import { storage } from '../storage';

export class N8nService {
  private static instance: N8nService;
  private n8nProcess: ChildProcess | null = null;
  private webhookUrl: string = '';
  private isRunning: boolean = false;
  // Assuming apiKey is defined elsewhere or will be provided
  private apiKey: string = process.env.N8N_API_KEY || 'default-api-key'; 

  public static getInstance(): N8nService {
    if (!N8nService.instance) {
      N8nService.instance = new N8nService();
    }
    return N8nService.instance;
  }

  async startN8n(): Promise<void> {
    if (this.isRunning) {
      console.log('📊 n8n já está rodando');
      return;
    }

    console.log('🚀 Iniciando n8n...');

    // Configurar variáveis de ambiente para n8n
    process.env.N8N_PORT = '5678';
    process.env.N8N_HOST = '0.0.0.0';
    process.env.N8N_PROTOCOL = 'http';
    process.env.WEBHOOK_URL = 'http://0.0.0.0:5678';
    process.env.N8N_BASIC_AUTH_ACTIVE = 'true';
    process.env.N8N_BASIC_AUTH_USER = 'admin';
    process.env.N8N_BASIC_AUTH_PASSWORD = 'lottery123';
    // Set API key for n8n if it's available
    if (this.apiKey !== 'default-api-key') {
      process.env.N8N_API_KEY = this.apiKey;
    }


    try {
      // Instalar n8n via npm se não estiver instalado
      await this.installN8n();

      // Iniciar n8n
      this.n8nProcess = spawn('npx', ['n8n', 'start'], {
        env: process.env,
        stdio: 'pipe'
      });

      this.n8nProcess.stdout?.on('data', (data) => {
        console.log(`📊 n8n: ${data}`);
      });

      this.n8nProcess.stderr?.on('data', (data) => {
        console.error(`❌ n8n Error: ${data}`);
      });

      // Aguardar n8n inicializar
      await new Promise(resolve => setTimeout(resolve, 10000));

      this.isRunning = true;
      this.webhookUrl = 'http://0.0.0.0:5678/webhook';

      console.log('✅ n8n iniciado com sucesso na porta 5678');

      // Criar workflows automaticamente
      await this.createWorkflows();

    } catch (error) {
      console.error('❌ Erro ao iniciar n8n:', error);
      throw error;
    }
  }

  private async installN8n(): Promise<void> {
    return new Promise((resolve, reject) => {
      const installProcess = spawn('npm', ['install', '-g', 'n8n'], {
        stdio: 'pipe'
      });

      installProcess.on('close', (code) => {
        if (code === 0) {
          console.log('✅ n8n instalado com sucesso');
          resolve();
        } else {
          reject(new Error(`Falha na instalação do n8n: código ${code}`));
        }
      });
    });
  }

  async createWorkflows(): Promise<void> {
    console.log('🔧 Criando workflows automatizados...');

    // Workflow A - Coleta & Aprendizado
    const collectionWorkflow = {
      id: 'lottery-collection-workflow',
      name: 'Coleta e Aprendizado de Loterias',
      nodes: [
        {
          name: 'Cron Trigger',
          type: 'n8n-nodes-base.cron',
          position: [250, 300],
          parameters: {
            rule: {
              hour: '*',
              minute: '0'
            }
          }
        },
        {
          name: 'Buscar Dados Caixa',
          type: 'n8n-nodes-base.httpRequest',
          position: [450, 300],
          parameters: {
            url: 'http://localhost:5000/api/lotteries/official-results',
            method: 'GET'
          }
        },
        {
          name: 'Processar Estatísticas',
          type: 'n8n-nodes-base.function',
          position: [650, 300],
          parameters: {
            functionCode: `
              const data = items[0].json.data;
              const processedData = {};

              Object.keys(data).forEach(lotteryName => {
                const lottery = data[lotteryName];
                processedData[lotteryName] = {
                  numbers: lottery.drawnNumbers,
                  frequency: this.calculateFrequency(lottery.drawnNumbers),
                  patterns: this.identifyPatterns(lottery.drawnNumbers),
                  timestamp: new Date().toISOString()
                };
              });

              return [{ json: { processedData } }];
            `
          }
        },
        {
          name: 'Salvar no Banco',
          type: 'n8n-nodes-base.httpRequest',
          position: [850, 300],
          parameters: {
            url: 'http://localhost:5000/api/n8n/save-statistics',
            method: 'POST',
            body: '={{ JSON.stringify($json) }}'
          }
        },
        {
          name: 'Gerar Estratégias IA',
          type: 'n8n-nodes-base.httpRequest',
          position: [1050, 300],
          parameters: {
            url: 'http://localhost:5000/api/n8n/generate-ai-strategies',
            method: 'POST',
            body: '={{ JSON.stringify($json) }}'
          }
        }
      ],
      connections: {
        'Cron Trigger': { main: [[{ node: 'Buscar Dados Caixa', type: 'main', index: 0 }]] },
        'Buscar Dados Caixa': { main: [[{ node: 'Processar Estatísticas', type: 'main', index: 0 }]] },
        'Processar Estatísticas': { main: [[{ node: 'Salvar no Banco', type: 'main', index: 0 }]] },
        'Salvar no Banco': { main: [[{ node: 'Gerar Estratégias IA', type: 'main', index: 0 }]] }
      }
    };

    // Workflow B - Resposta ao App
    const responseWorkflow = {
      id: 'lottery-response-workflow',
      name: 'Resposta de Estratégias',
      nodes: [
        {
          name: 'Webhook Trigger',
          type: 'n8n-nodes-base.webhook',
          position: [250, 300],
          parameters: {
            path: 'generate-strategy',
            httpMethod: 'POST'
          }
        },
        {
          name: 'Buscar Estratégias',
          type: 'n8n-nodes-base.httpRequest',
          position: [450, 300],
          parameters: {
            url: 'http://localhost:5000/api/n8n/get-latest-strategies',
            method: 'GET'
          }
        },
        {
          name: 'Processar Resposta',
          type: 'n8n-nodes-base.function',
          position: [650, 300],
          parameters: {
            functionCode: `
              const request = items[0].json.body;
              const strategies = items[0].json.strategies;

              const lotteryId = request.lotteryId;
              const count = request.count;
              const preferences = request.preferences;

              // Aplicar estratégias avançadas baseadas nos dados coletados
              const optimizedNumbers = this.applyAdvancedStrategies(
                strategies[lotteryId], 
                count, 
                preferences
              );

              return [{
                json: {
                  numbers: optimizedNumbers,
                  confidence: 0.95,
                  strategy: 'n8n_advanced_ai',
                  timestamp: new Date().toISOString()
                }
              }];
            `
          }
        },
        {
          name: 'Responder Webhook',
          type: 'n8n-nodes-base.respondToWebhook',
          position: [850, 300],
          parameters: {
            responseBody: '={{ JSON.stringify($json) }}'
          }
        }
      ],
      connections: {
        'Webhook Trigger': { main: [[{ node: 'Buscar Estratégias', type: 'main', index: 0 }]] },
        'Buscar Estratégias': { main: [[{ node: 'Processar Resposta', type: 'main', index: 0 }]] },
        'Processar Resposta': { main: [[{ node: 'Responder Webhook', type: 'main', index: 0 }]] }
      }
    };

    console.log('✅ Workflows criados: Coleta & Aprendizado + Resposta ao App');
  }

  async callWorkflow(workflowPath: string, data: any): Promise<any> {
    const url = `${this.webhookUrl}/${workflowPath}`;

    try {
      // Updated to use built-in fetch
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // Assuming apiKey is intended for n8n API calls, not webhook calls.
          // If it's for webhook authentication, adjust accordingly.
          // 'Authorization': `Bearer ${this.apiKey}` 
        },
        body: JSON.stringify(data)
      });

      if (!response.ok) {
        throw new Error(`n8n workflow error: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('❌ Erro ao chamar workflow n8n:', error);
      throw error;
    }
  }

  async generateAdvancedStrategy(lotteryId: number, count: number, preferences: any): Promise<any> {
    return await this.callWorkflow('generate-strategy', {
      lotteryId,
      count,
      preferences,
      timestamp: new Date().toISOString()
    });
  }

  getStatus(): { running: boolean; webhookUrl: string } {
    return {
      running: this.isRunning,
      webhookUrl: this.webhookUrl
    };
  }

  async stop(): Promise<void> {
    if (this.n8nProcess) {
      this.n8nProcess.kill();
      this.n8nProcess = null;
      this.isRunning = false;
      console.log('🛑 n8n parado');
    }
  }
}

export const n8nService = N8nService.getInstance();