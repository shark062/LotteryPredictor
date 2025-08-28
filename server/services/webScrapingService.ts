
import axios from 'axios';
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
  private baseUrl = 'https://loterica-nova.com.br';
  private requestTimeout = 10000; // 10 segundos
  private maxRetries = 3;
  private retryDelay = 2000; // 2 segundos

  public static getInstance(): WebScrapingService {
    if (!WebScrapingService.instance) {
      WebScrapingService.instance = new WebScrapingService();
    }
    return WebScrapingService.instance;
  }

  async getLotteryInfo(): Promise<{ [key: string]: LotteryDrawInfo }> {
    const results: { [key: string]: LotteryDrawInfo } = {};
    
    try {
      console.log('Tentando buscar dados da Lotérica Nova...');
      
      const response = await this.makeRequestWithRetry();
      
      if (!response || response.status !== 200) {
        console.log('Falha na requisição, usando dados fallback');
        return this.getAllFallbackData();
      }

      const $ = cheerio.load(response.data);
      
      // Extrair dados das loterias principais
      const lotteryMappings = {
        'Lotofácil': 'lotofacil',
        'Mega-Sena': 'mega-sena', 
        'Quina': 'quina'
      };

      let successCount = 0;

      for (const [displayName, slug] of Object.entries(lotteryMappings)) {
        try {
          const data = await this.extractLotteryData($, displayName);
          if (data) {
            results[displayName] = data;
            successCount++;
          } else {
            results[displayName] = this.getFallbackData(displayName);
          }
        } catch (error) {
          console.error(`Erro ao extrair dados da ${displayName}:`, error);
          results[displayName] = this.getFallbackData(displayName);
        }
      }

      if (successCount === 0) {
        console.log('Nenhum dado real foi extraído, usando fallback completo');
        return this.getAllFallbackData();
      }

      console.log(`Dados extraídos com sucesso: ${successCount}/${Object.keys(lotteryMappings).length} loterias`);
      return results;

    } catch (error: any) {
      console.error('Erro no web scraping:', this.sanitizeError(error));
      return this.getAllFallbackData();
    }
  }

  private async makeRequestWithRetry(): Promise<any> {
    let lastError: any;

    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        const response = await axios.get(this.baseUrl, {
          timeout: this.requestTimeout,
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            'Accept-Language': 'pt-BR,pt;q=0.9,en;q=0.8',
            'Accept-Encoding': 'gzip, deflate, br',
            'Connection': 'keep-alive',
            'Upgrade-Insecure-Requests': '1',
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache'
          },
          validateStatus: (status) => status >= 200 && status < 500,
          maxRedirects: 5
        });

        if (response.status === 200) {
          console.log(`Requisição bem-sucedida na tentativa ${attempt}`);
          return response;
        }
        
        throw new Error(`Status HTTP: ${response.status}`);

      } catch (error: any) {
        lastError = error;
        console.error(`Tentativa ${attempt}/${this.maxRetries} falhou:`, this.sanitizeError(error));

        if (attempt < this.maxRetries) {
          const delay = this.retryDelay * attempt;
          console.log(`Aguardando ${delay}ms antes da próxima tentativa...`);
          await this.sleep(delay);
        }
      }
    }

    throw lastError;
  }

  private async extractLotteryData($: cheerio.CheerioAPI, lotteryName: string): Promise<LotteryDrawInfo | null> {
    try {
      // Normalizar nome da loteria para busca
      const normalizedName = this.normalizeLotteryName(lotteryName);
      
      // Múltiplos seletores para encontrar dados
      const selectors = [
        `h3:contains("${lotteryName}")`,
        `h2:contains("${lotteryName}")`,
        `*:contains("${normalizedName}")`,
        `.lottery-name:contains("${lotteryName}")`,
        `[data-lottery="${lotteryName.toLowerCase()}"]`
      ];

      let lotterySection: cheerio.Cheerio<any> = $();
      
      for (const selector of selectors) {
        lotterySection = $(selector).first();
        if (lotterySection.length > 0) break;
      }
      
      if (lotterySection.length === 0) {
        console.log(`Seção da ${lotteryName} não encontrada`);
        return null;
      }

      const container = lotterySection.closest('div, section, article, .card, .lottery-item');
      
      // Extrair dados com validação
      const contestNumber = this.extractContestNumber(container);
      const prize = this.extractPrize(container);
      const nextDrawDate = this.extractNextDrawDate(container);

      const result = {
        name: lotteryName,
        contestNumber: contestNumber || this.getDefaultContestNumber(lotteryName),
        prize: prize || this.getDefaultPrize(lotteryName),
        date: new Date().toLocaleDateString('pt-BR'),
        nextDrawDate: nextDrawDate || this.getDefaultNextDrawDate(lotteryName)
      };

      console.log(`Dados extraídos para ${lotteryName}:`, result);
      return result;

    } catch (error) {
      console.error(`Erro ao processar ${lotteryName}:`, this.sanitizeError(error));
      return null;
    }
  }

  private extractContestNumber(container: cheerio.Cheerio<any>): number | null {
    try {
      if (!container.length) return null;

      const patterns = [
        /concurso[:\s#]*(\d+)/i,
        /contest[:\s#]*(\d+)/i,
        /n[°º]?[:\s]*(\d+)/i,
        /sorteio[:\s#]*(\d+)/i,
        /(\d{4,5})/g // Números de 4-5 dígitos
      ];

      const text = container.text().replace(/\s+/g, ' ').trim();
      
      for (const pattern of patterns) {
        const matches = text.match(pattern);
        if (matches) {
          for (const match of matches) {
            const numberMatch = match.match(/(\d+)/);
            if (numberMatch) {
              const num = parseInt(numberMatch[1]);
              if (num >= 1000 && num <= 99999) { // Validação mais rigorosa
                return num;
              }
            }
          }
        }
      }
      
      return null;
    } catch (error) {
      console.error('Erro ao extrair número do concurso:', error);
      return null;
    }
  }

  private extractPrize(container: cheerio.Cheerio<any>): string | null {
    try {
      if (!container.length) return null;

      const text = container.text().replace(/\s+/g, ' ').trim();
      
      // Padrões mais específicos para valores monetários
      const patterns = [
        /R\$\s*[\d.,]+(?:\s*(?:milhão|milhões|mil|bilhão|bilhões))?/gi,
        /[\d.,]+\s*(?:milhão|milhões|mil|bilhão|bilhões)\s*(?:de\s*)?(?:reais)?/gi,
        /prêmio[:\s]*R\$\s*[\d.,]+/gi,
        /valor[:\s]*R\$\s*[\d.,]+/gi
      ];

      for (const pattern of patterns) {
        const matches = text.match(pattern);
        if (matches && matches.length > 0) {
          // Pegar o primeiro match válido
          const prizeText = matches[0].trim();
          if (this.isValidPrize(prizeText)) {
            return this.formatPrize(prizeText);
          }
        }
      }
      
      return null;
    } catch (error) {
      console.error('Erro ao extrair prêmio:', error);
      return null;
    }
  }

  private extractNextDrawDate(container: cheerio.Cheerio<any>): string | null {
    try {
      if (!container.length) return null;

      const text = container.text().replace(/\s+/g, ' ').trim();
      
      // Padrões para datas
      const patterns = [
        /(\d{1,2}\/\d{1,2}\/\d{4})/g,
        /(\d{1,2}-\d{1,2}-\d{4})/g,
        /(segunda|terça|quarta|quinta|sexta|sábado|domingo)[\s\-,]*(\d{1,2}\/\d{1,2}(?:\/\d{4})?)/gi,
        /próximo[:\s]*(segunda|terça|quarta|quinta|sexta|sábado|domingo)/gi
      ];

      for (const pattern of patterns) {
        const matches = text.match(pattern);
        if (matches && matches.length > 0) {
          const dateStr = matches[0].trim();
          if (this.isValidDate(dateStr)) {
            return this.formatDate(dateStr);
          }
        }
      }
      
      return null;
    } catch (error) {
      console.error('Erro ao extrair data do sorteio:', error);
      return null;
    }
  }

  private normalizeLotteryName(name: string): string {
    return name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Remove acentos
      .replace(/[^a-z0-9\s]/g, '') // Remove caracteres especiais
      .trim();
  }

  private isValidPrize(prizeText: string): boolean {
    // Verificar se contém números e moeda
    return /R\$.*\d/.test(prizeText) && !/0+$/.test(prizeText.replace(/[^0-9]/g, ''));
  }

  private isValidDate(dateStr: string): boolean {
    // Verificações básicas de formato de data
    return /\d{1,2}[\/\-]\d{1,2}/.test(dateStr) || 
           /(segunda|terça|quarta|quinta|sexta|sábado|domingo)/i.test(dateStr);
  }

  private formatPrize(prizeText: string): string {
    // Limpar e formatar valor do prêmio
    return prizeText.replace(/\s+/g, ' ').trim();
  }

  private formatDate(dateStr: string): string {
    // Adicionar horário padrão se não houver
    if (!dateStr.includes('20:00')) {
      return `${dateStr.trim()} - 20:00h`;
    }
    return dateStr.trim();
  }

  private getFallbackData(name: string): LotteryDrawInfo {
    const defaults: { [key: string]: Partial<LotteryDrawInfo> } = {
      'Lotofácil': {
        contestNumber: 3018,
        prize: 'R$ 5.500.000',
        nextDrawDate: this.getNextWeekday('segunda')
      },
      'Mega-Sena': {
        contestNumber: 2788,
        prize: 'R$ 65.000.000',
        nextDrawDate: this.getNextWeekday('sábado')
      },
      'Quina': {
        contestNumber: 6588,
        prize: 'R$ 3.200.000',
        nextDrawDate: this.getNextWeekday('segunda')
      }
    };

    const defaultData = defaults[name] || {
      contestNumber: 1000,
      prize: 'R$ 1.000.000',
      nextDrawDate: this.getNextWeekday('segunda')
    };

    return {
      name,
      contestNumber: defaultData.contestNumber!,
      prize: defaultData.prize!,
      date: new Date().toLocaleDateString('pt-BR'),
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

  private getDefaultContestNumber(name: string): number {
    const defaults: { [key: string]: number } = {
      'Lotofácil': 3018,
      'Mega-Sena': 2788,
      'Quina': 6588
    };
    return defaults[name] || 1000;
  }

  private getDefaultPrize(name: string): string {
    const defaults: { [key: string]: string } = {
      'Lotofácil': 'R$ 5.500.000',
      'Mega-Sena': 'R$ 65.000.000',
      'Quina': 'R$ 3.200.000'
    };
    return defaults[name] || 'R$ 1.000.000';
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
    } catch (error) {
      return new Date().toLocaleDateString('pt-BR') + ' - 20:00h';
    }
  }

  private sanitizeError(error: any): string {
    if (error?.message) {
      // Remover informações sensíveis dos erros
      return error.message.replace(/https?:\/\/[^\s]+/g, '[URL]');
    }
    return String(error);
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

export const webScrapingService = WebScrapingService.getInstance();
