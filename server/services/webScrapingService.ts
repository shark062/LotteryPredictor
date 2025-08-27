
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
  private baseUrl = 'https://lotericanova.com';

  public static getInstance(): WebScrapingService {
    if (!WebScrapingService.instance) {
      WebScrapingService.instance = new WebScrapingService();
    }
    return WebScrapingService.instance;
  }

  async getLotteryInfo(): Promise<{ [key: string]: LotteryDrawInfo }> {
    try {
      const results: { [key: string]: LotteryDrawInfo } = {};

      // Scrape cada loteria
      const lotteries = [
        { name: 'Lotofácil', url: '/lotofacil' },
        { name: 'Mega-Sena', url: '/mega-sena' },
        { name: 'Quina', url: '/quina' }
      ];

      for (const lottery of lotteries) {
        try {
          const info = await this.scrapeLotteryPage(lottery.url, lottery.name);
          if (info) {
            results[lottery.name] = info;
          }
        } catch (error) {
          console.error(`Erro ao obter dados da ${lottery.name}:`, error);
          // Fallback para dados padrão se houver erro
          results[lottery.name] = this.getFallbackData(lottery.name);
        }
      }

      return results;
    } catch (error) {
      console.error('Erro geral no web scraping:', error);
      return this.getFallbackData();
    }
  }

  private async scrapeLotteryPage(url: string, name: string): Promise<LotteryDrawInfo | null> {
    try {
      const response = await axios.get(`${this.baseUrl}${url}`, {
        timeout: 10000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
      });

      const $ = cheerio.load(response.data);
      
      // Buscar informações específicas baseadas na estrutura do site
      const contestNumber = this.extractContestNumber($);
      const prize = this.extractPrize($);
      const nextDrawDate = this.extractNextDrawDate($);

      return {
        name,
        contestNumber: contestNumber || this.getDefaultContestNumber(name),
        prize: prize || this.getDefaultPrize(name),
        date: new Date().toLocaleDateString('pt-BR'),
        nextDrawDate: nextDrawDate || this.getDefaultNextDrawDate(name)
      };
    } catch (error) {
      console.error(`Erro ao fazer scraping da página ${url}:`, error);
      return null;
    }
  }

  private extractContestNumber($: cheerio.CheerioAPI): number | null {
    // Procurar por padrões comuns de número de concurso
    const patterns = [
      '.concurso',
      '.contest',
      '.numero-concurso',
      '[data-contest]',
      'span:contains("Concurso")',
      'div:contains("Concurso")'
    ];

    for (const pattern of patterns) {
      const element = $(pattern);
      if (element.length > 0) {
        const text = element.text();
        const match = text.match(/(\d+)/);
        if (match) {
          return parseInt(match[1]);
        }
      }
    }

    return null;
  }

  private extractPrize($: cheerio.CheerioAPI): string | null {
    // Procurar por padrões comuns de prêmio
    const patterns = [
      '.premio',
      '.prize',
      '.valor-premio',
      '[data-prize]',
      'span:contains("R$")',
      'div:contains("milhão")',
      'div:contains("milhões")'
    ];

    for (const pattern of patterns) {
      const element = $(pattern);
      if (element.length > 0) {
        const text = element.text().trim();
        if (text.includes('R$') || text.includes('milhão')) {
          return text;
        }
      }
    }

    return null;
  }

  private extractNextDrawDate($: cheerio.CheerioAPI): string | null {
    // Procurar por padrões de data do próximo sorteio
    const patterns = [
      '.proximo-sorteio',
      '.next-draw',
      '.data-sorteio',
      '[data-date]',
      'span:contains("próximo")',
      'div:contains("sorteio")'
    ];

    for (const pattern of patterns) {
      const element = $(pattern);
      if (element.length > 0) {
        const text = element.text().trim();
        // Procurar por padrões de data
        const dateMatch = text.match(/(\d{1,2}\/\d{1,2}\/\d{4})/);
        if (dateMatch) {
          return `${dateMatch[1]} - 20:00h`;
        }
      }
    }

    return null;
  }

  private getDefaultContestNumber(name: string): number {
    const defaults: { [key: string]: number } = {
      'Lotofácil': 3015,
      'Mega-Sena': 2785,
      'Quina': 6585
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
    const now = new Date();
    const currentHour = now.getHours();
    
    // Se passou das 20h, consideramos o próximo dia
    const referenceDate = currentHour >= 20 ? new Date(now.getTime() + 24 * 60 * 60 * 1000) : now;
    
    const dayNames: { [key: string]: string } = {
      'Lotofácil': 'Segunda',
      'Mega-Sena': 'Sábado',
      'Quina': 'Segunda'
    };

    return this.getNextDrawDate(dayNames[name] || 'Segunda', referenceDate);
  }

  private getNextDrawDate(dayName: string, referenceDate: Date = new Date()): string {
    const days = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
    const targetDay = days.indexOf(dayName);
    const todayDay = referenceDate.getDay();
    
    let daysUntilTarget = targetDay - todayDay;
    if (daysUntilTarget <= 0) {
      daysUntilTarget += 7;
    }
    
    const targetDate = new Date(referenceDate);
    targetDate.setDate(referenceDate.getDate() + daysUntilTarget);
    
    return targetDate.toLocaleDateString('pt-BR') + ' - 20:00h';
  }

  private getFallbackData(name?: string): any {
    if (name) {
      return {
        name,
        contestNumber: this.getDefaultContestNumber(name),
        prize: this.getDefaultPrize(name),
        date: new Date().toLocaleDateString('pt-BR'),
        nextDrawDate: this.getDefaultNextDrawDate(name)
      };
    }

    return {
      'Lotofácil': {
        name: 'Lotofácil',
        contestNumber: 3015,
        prize: 'R$ 5.500.000',
        date: new Date().toLocaleDateString('pt-BR'),
        nextDrawDate: this.getDefaultNextDrawDate('Lotofácil')
      },
      'Mega-Sena': {
        name: 'Mega-Sena',
        contestNumber: 2785,
        prize: 'R$ 65.000.000',
        date: new Date().toLocaleDateString('pt-BR'),
        nextDrawDate: this.getDefaultNextDrawDate('Mega-Sena')
      },
      'Quina': {
        name: 'Quina',
        contestNumber: 6585,
        prize: 'R$ 3.200.000',
        date: new Date().toLocaleDateString('pt-BR'),
        nextDrawDate: this.getDefaultNextDrawDate('Quina')
      }
    };
  }
}

export const webScrapingService = WebScrapingService.getInstance();
