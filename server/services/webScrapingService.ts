
import axios, { AxiosResponse, AxiosRequestConfig } from 'axios';
import * as cheerio from 'cheerio';

interface LotteryDrawInfo {
  name: string;
  contestNumber: number;
  prize: string;
  date: string;
  nextDrawDate: string;
}

export class WebScrapingService {
  private static instance: WebScrapingService;
  private readonly baseUrl = 'https://servicebus2.caixa.gov.br/portaldeloterias/api';
  private readonly fallbackUrl = 'https://loterias.caixa.gov.br/api';
  private readonly requestTimeout = 15000; // 15 segundos
  private readonly maxRetries = 3;
  private readonly retryDelay = 2000; // 2 segundos
  private readonly userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

  private constructor() {
    // Singleton pattern - construtor privado
  }

  public static getInstance(): WebScrapingService {
    if (!WebScrapingService.instance) {
      WebScrapingService.instance = new WebScrapingService();
    }
    return WebScrapingService.instance;
  }

  async getLotteryInfo(): Promise<{ [key: string]: LotteryDrawInfo }> {
    try {
      console.log('Iniciando busca de dados das loterias...');
      
      const results: { [key: string]: LotteryDrawInfo } = {};
      const lotteryMappings = {
        'Lotofácil': 'lotofacil',
        'Mega-Sena': 'megasena', 
        'Quina': 'quina'
      };

      let successCount = 0;

      for (const [displayName, apiName] of Object.entries(lotteryMappings)) {
        try {
          const data = await this.fetchLotteryData(apiName, displayName);
          if (data) {
            results[displayName] = data;
            successCount++;
            console.log(`✓ ${displayName}: dados obtidos com sucesso`);
          } else {
            results[displayName] = this.getFallbackData(displayName);
            console.log(`⚠ ${displayName}: usando dados fallback`);
          }
        } catch (error) {
          console.error(`Erro ao buscar ${displayName}:`, this.sanitizeError(error));
          results[displayName] = this.getFallbackData(displayName);
        }
      }

      if (successCount === 0) {
        console.log('Nenhum dado real obtido, retornando fallback completo');
        return this.getAllFallbackData();
      }

      console.log(`Busca concluída: ${successCount}/${Object.keys(lotteryMappings).length} loterias atualizadas`);
      return results;

    } catch (error: any) {
      console.error('Erro geral no serviço de web scraping:', this.sanitizeError(error));
      return this.getAllFallbackData();
    }
  }

  private async fetchLotteryData(apiName: string, displayName: string): Promise<LotteryDrawInfo | null> {
    try {
      // Tentar API oficial da Caixa primeiro
      let response = await this.makeApiRequest(`${this.baseUrl}/${apiName}`);
      
      // Se falhar, tentar URL alternativa
      if (!response || !this.isValidResponse(response)) {
        response = await this.makeApiRequest(`${this.fallbackUrl}/${apiName}`);
      }

      if (!response || !this.isValidResponse(response)) {
        console.log(`API indisponível para ${displayName}`);
        return null;
      }

      return this.parseApiResponse(response.data, displayName);

    } catch (error) {
      console.error(`Erro ao buscar dados da API para ${displayName}:`, this.sanitizeError(error));
      return null;
    }
  }

  private async makeApiRequest(url: string): Promise<AxiosResponse | null> {
    let lastError: any;

    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        const config: AxiosRequestConfig = {
          timeout: this.requestTimeout,
          headers: {
            'User-Agent': this.userAgent,
            'Accept': 'application/json, text/plain, */*',
            'Accept-Language': 'pt-BR,pt;q=0.9,en;q=0.8',
            'Accept-Encoding': 'gzip, deflate, br',
            'Connection': 'keep-alive',
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache',
            'DNT': '1',
            'Sec-Fetch-Dest': 'empty',
            'Sec-Fetch-Mode': 'cors',
            'Sec-Fetch-Site': 'cross-site'
          },
          validateStatus: (status) => status >= 200 && status < 500,
          maxRedirects: 3,
          // Configurações de segurança
          maxContentLength: 10 * 1024 * 1024, // 10MB max
          maxBodyLength: 10 * 1024 * 1024, // 10MB max
          decompress: true
        };

        const response = await axios.get(url, config);

        if (response.status === 200 && response.data) {
          console.log(`✓ Requisição bem-sucedida na tentativa ${attempt} para: ${this.sanitizeUrl(url)}`);
          return response;
        }
        
        throw new Error(`Status HTTP inválido: ${response.status}`);

      } catch (error: any) {
        lastError = error;
        console.error(`Tentativa ${attempt}/${this.maxRetries} falhou para ${this.sanitizeUrl(url)}:`, this.sanitizeError(error));

        if (attempt < this.maxRetries) {
          const delay = this.retryDelay * attempt;
          console.log(`Aguardando ${delay}ms antes da próxima tentativa...`);
          await this.sleep(delay);
        }
      }
    }

    throw lastError;
  }

  private isValidResponse(response: AxiosResponse): boolean {
    return response && 
           response.status === 200 && 
           response.data && 
           typeof response.data === 'object' &&
           !Array.isArray(response.data);
  }

  private parseApiResponse(data: any, displayName: string): LotteryDrawInfo | null {
    try {
      if (!data || typeof data !== 'object') {
        return null;
      }

      // Estrutura comum das APIs da Caixa
      const contestNumber = this.extractNumber(data.numero || data.concurso || data.contest, 1000, 99999);
      const prize = this.formatPrize(data.valorEstimadoProximoConcurso || data.estimatedPrize || 'R$ 1.000.000,00');
      const drawDate = this.formatDate(data.dataProximoConcurso || data.nextDrawDate);

      if (!contestNumber) {
        console.log(`Número do concurso inválido para ${displayName}`);
        return null;
      }

      return {
        name: displayName,
        contestNumber,
        prize,
        date: new Date().toLocaleDateString('pt-BR'),
        nextDrawDate: drawDate || this.getDefaultNextDrawDate(displayName)
      };

    } catch (error) {
      console.error(`Erro ao processar resposta da API para ${displayName}:`, this.sanitizeError(error));
      return null;
    }
  }

  private extractNumber(value: any, min: number = 0, max: number = Number.MAX_SAFE_INTEGER): number | null {
    try {
      if (typeof value === 'number' && !isNaN(value) && value >= min && value <= max) {
        return Math.floor(value);
      }
      
      if (typeof value === 'string') {
        const parsed = parseInt(value, 10);
        if (!isNaN(parsed) && parsed >= min && parsed <= max) {
          return parsed;
        }
      }
      
      return null;
    } catch {
      return null;
    }
  }

  private formatPrize(prizeValue: any): string {
    try {
      if (!prizeValue) return 'R$ 1.000.000,00';
      
      const prizeStr = String(prizeValue);
      
      // Se já está formatado corretamente
      if (/^R\$\s*[\d.,]+$/.test(prizeStr)) {
        return prizeStr;
      }
      
      // Extrair apenas números
      const numbers = prizeStr.replace(/[^\d]/g, '');
      if (!numbers) return 'R$ 1.000.000,00';
      
      const value = parseInt(numbers, 10);
      if (isNaN(value) || value <= 0) return 'R$ 1.000.000,00';
      
      // Formatar como moeda brasileira
      return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
        minimumFractionDigits: 2
      }).format(value);
      
    } catch {
      return 'R$ 1.000.000,00';
    }
  }

  private formatDate(dateValue: any): string | null {
    try {
      if (!dateValue) return null;
      
      const date = new Date(dateValue);
      if (isNaN(date.getTime())) return null;
      
      return date.toLocaleDateString('pt-BR') + ' - 20:00h';
    } catch {
      return null;
    }
  }

  private getFallbackData(name: string): LotteryDrawInfo {
    const currentDate = new Date();
    const defaults: { [key: string]: Partial<LotteryDrawInfo> } = {
      'Lotofácil': {
        contestNumber: 3018 + Math.floor((currentDate.getTime() - new Date('2024-01-01').getTime()) / (1000 * 60 * 60 * 24)),
        prize: 'R$ 5.500.000,00',
        nextDrawDate: this.getNextWeekday('segunda')
      },
      'Mega-Sena': {
        contestNumber: 2788 + Math.floor((currentDate.getTime() - new Date('2024-01-01').getTime()) / (1000 * 60 * 60 * 24 * 3)),
        prize: 'R$ 65.000.000,00',
        nextDrawDate: this.getNextWeekday('sábado')
      },
      'Quina': {
        contestNumber: 6588 + Math.floor((currentDate.getTime() - new Date('2024-01-01').getTime()) / (1000 * 60 * 60 * 24)),
        prize: 'R$ 3.200.000,00',
        nextDrawDate: this.getNextWeekday('segunda')
      }
    };

    const defaultData = defaults[name] || {
      contestNumber: 1000,
      prize: 'R$ 1.000.000,00',
      nextDrawDate: this.getNextWeekday('segunda')
    };

    return {
      name,
      contestNumber: defaultData.contestNumber!,
      prize: defaultData.prize!,
      date: currentDate.toLocaleDateString('pt-BR'),
      nextDrawDate: defaultData.nextDrawDate!
    };
  }

  private getAllFallbackData(): { [key: string]: LotteryDrawInfo } {
    return {
      'Lotofácil': this.getFallbackData('Lotofácil'),
      'Mega-Sena': this.getFallbackData('Mega-Sena'),
      'Quina': this.getFallbackData('Quina')
    };
  }

  private getDefaultNextDrawDate(name: string): string {
    const dayMappings: { [key: string]: string } = {
      'Lotofácil': 'segunda',
      'Mega-Sena': 'sábado',
      'Quina': 'segunda'
    };
    return this.getNextWeekday(dayMappings[name] || 'segunda');
  }

  private getNextWeekday(dayName: string): string {
    try {
      const days = ['domingo', 'segunda', 'terça', 'quarta', 'quinta', 'sexta', 'sábado'];
      const today = new Date();
      const targetDay = days.indexOf(dayName.toLowerCase());
      
      if (targetDay === -1) {
        return today.toLocaleDateString('pt-BR') + ' - 20:00h';
      }
      
      const todayDay = today.getDay();
      let daysUntilTarget = targetDay - todayDay;
      
      if (daysUntilTarget <= 0) {
        daysUntilTarget += 7;
      }
      
      const targetDate = new Date(today);
      targetDate.setDate(today.getDate() + daysUntilTarget);
      
      return targetDate.toLocaleDateString('pt-BR') + ' - 20:00h';
    } catch {
      return new Date().toLocaleDateString('pt-BR') + ' - 20:00h';
    }
  }

  private sanitizeError(error: any): string {
    try {
      if (!error) return 'Erro desconhecido';
      
      if (typeof error === 'string') {
        return this.sanitizeUrl(error);
      }
      
      if (error.message) {
        return this.sanitizeUrl(String(error.message));
      }
      
      if (error.code) {
        return `Código do erro: ${error.code}`;
      }
      
      return 'Erro no processamento';
    } catch {
      return 'Erro na sanitização';
    }
  }

  private sanitizeUrl(text: string): string {
    try {
      return text.replace(/https?:\/\/[^\s]+/g, '[URL]')
                 .replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, '[EMAIL]')
                 .replace(/\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/g, '[IP]');
    } catch {
      return '[DADOS_SANITIZADOS]';
    }
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => {
      if (ms > 0 && ms < 60000) { // Máximo 1 minuto
        setTimeout(resolve, ms);
      } else {
        resolve();
      }
    });
  }
}

export const webScrapingService = WebScrapingService.getInstance();
