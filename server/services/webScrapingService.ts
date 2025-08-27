import axios from 'axios';
import * as cheerio from 'cheerio';

interface LotteryDrawInfo {
  name: string;
  contestNumber: number | null;
  prize: string | null;
  date: string;
  nextDrawDate: string | null;
}

// Define um tipo mais específico para os resultados esperados de uma loteria
interface LotteryInfo {
  [key: string]: {
    contestNumber: number | null;
    prize: string | null;
    nextDrawDate: string | null;
  };
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

  async getLotteryInfo(): Promise<LotteryInfo> {
    const results: LotteryInfo = {};

    try {
      // Buscar informações das principais loterias
      const lotteries = [
        { name: 'Lotofácil', path: '/lotofacil' },
        { name: 'Mega-Sena', path: '/mega-sena' },
        { name: 'Quina', path: '/quina' }
      ];

      for (const lottery of lotteries) {
        try {
          console.log(`Buscando dados para ${lottery.name}...`);
          const response = await axios.get(`${this.baseUrl}${lottery.path}`, {
            timeout: 15000,
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
              'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
              'Accept-Language': 'pt-BR,pt;q=0.9,en;q=0.8',
              'Accept-Encoding': 'gzip, deflate',
              'DNT': '1',
              'Connection': 'keep-alive',
              'Upgrade-Insecure-Requests': '1',
            }
          });

          if (response.status === 200) {
            const $ = cheerio.load(response.data);

            // Extrair dados específicos de cada loteria
            const contestNumber = this.extractContestNumber($);
            const prize = this.extractPrize($);
            const nextDrawDate = this.extractNextDrawDate($);

            results[lottery.name] = {
              contestNumber,
              prize,
              nextDrawDate
            };

            console.log(`Dados obtidos para ${lottery.name}:`, results[lottery.name]);
          } else {
            throw new Error(`Status HTTP ${response.status}`);
          }
        } catch (error: any) {
          console.error(`Erro ao buscar ${lottery.name}:`, error.message);
          // Usar dados de fallback para esta loteria específica
          results[lottery.name] = this.getFallbackData(lottery.name);
        }
      }

      // Se não conseguiu obter nenhum dado, usar todos os fallbacks
      if (Object.keys(results).length === 0) {
        return {
          'Lotofácil': this.getFallbackData('Lotofácil'),
          'Mega-Sena': this.getFallbackData('Mega-Sena'),
          'Quina': this.getFallbackData('Quina')
        };
      }

    } catch (error: any) {
      console.error('Erro geral no web scraping:', error);
      // Retornar dados de fallback completos
      return {
        'Lotofácil': this.getFallbackData('Lotofácil'),
        'Mega-Sena': this.getFallbackData('Mega-Sena'),
        'Quina': this.getFallbackData('Quina')
      };
    }

    return results;
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
    // Procurar por padrões de data do próximo concurso
    const dateSelectors = [
      '.next-draw-date',
      '.proximo-concurso',
      '.data-proximo-sorteio',
      '.next-draw'
    ];

    for (const selector of dateSelectors) {
      const element = $(selector);
      if (element.length > 0) {
        return element.text().trim();
      }
    }

    // Se não encontrar, calcular próxima data baseada no dia atual
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toLocaleDateString('pt-BR') + ' - 20:00h';
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

    return this.getNextDrawDateForLottery(name, referenceDate);
  }

  private getNextDrawDateForLottery(lotteryName: string, referenceDate: Date = new Date()): string {
    const days = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];

    const drawDaysMap: { [key: string]: string[] } = {
      'Lotofácil': ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'],
      'Mega-Sena': ['Quarta', 'Sábado'],
      'Quina': ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado']
    };

    const lotteryDrawDays = drawDaysMap[lotteryName as keyof typeof drawDaysMap] || ['Sábado'];

    let nextDrawDate = new Date(referenceDate);
    let attempts = 0;

    while (attempts < 7) {
      const dayIndex = nextDrawDate.getDay();
      const dayName = days[dayIndex];

      if (lotteryDrawDays.includes(dayName)) {
        return nextDrawDate.toLocaleDateString('pt-BR') + ' - 20:00h';
      }

      nextDrawDate.setDate(nextDrawDate.getDate() + 1);
      attempts++;
    }

    // Fallback caso não encontre um dia de sorteio válido nos próximos 7 dias
    return nextDrawDate.toLocaleDateString('pt-BR') + ' - 20:00h';
  }


  private getFallbackData(lotteryName: string): {
    contestNumber: number | null;
    prize: string | null;
    nextDrawDate: string | null;
  } {
    const baseData = {
      'Lotofácil': {
        contestNumber: 3015,
        prize: 'R$ 5.500.000',
        nextDrawDate: this.getNextDrawDateForLottery('Lotofácil')
      },
      'Mega-Sena': {
        contestNumber: 2785,
        prize: 'R$ 65.000.000',
        nextDrawDate: this.getNextDrawDateForLottery('Mega-Sena')
      },
      'Quina': {
        contestNumber: 6585,
        prize: 'R$ 3.200.000',
        nextDrawDate: this.getNextDrawDateForLottery('Quina')
      }
    };

    return baseData[lotteryName as keyof typeof baseData] || {
      contestNumber: 1000,
      prize: 'R$ 1.000.000',
      nextDrawDate: new Date().toLocaleDateString('pt-BR') + ' - 20:00h'
    };
  }
}

export const webScrapingService = WebScrapingService.getInstance();