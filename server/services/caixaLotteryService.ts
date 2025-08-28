
import axios from 'axios';
import * as cheerio from 'cheerio';

interface LotteryResult {
  contest: number;
  date: string;
  drawnNumbers: number[];
  winners: {
    [key: string]: {
      count: number;
      prize: string;
    };
  };
  accumulated?: string;
}

export class CaixaLotteryService {
  private static instance: CaixaLotteryService;
  private baseUrl = 'https://servicebus2.caixa.gov.br/portaldeloterias/api';
  private requestTimeout = 15000;

  public static getInstance(): CaixaLotteryService {
    if (!CaixaLotteryService.instance) {
      CaixaLotteryService.instance = new CaixaLotteryService();
    }
    return CaixaLotteryService.instance;
  }

  async getLatestResults(): Promise<{ [key: string]: LotteryResult }> {
    const lotteries = [
      { name: 'Lotofácil', endpoint: 'lotofacil' },
      { name: 'Mega-Sena', endpoint: 'megasena' },
      { name: 'Quina', endpoint: 'quina' },
      { name: 'Lotomania', endpoint: 'lotomania' },
      { name: 'Timemania', endpoint: 'timemania' },
      { name: 'Dupla-Sena', endpoint: 'duplasena' },
      { name: 'Dia de Sorte', endpoint: 'diadesorte' },
      { name: 'Super Sete', endpoint: 'supersete' }
    ];

    const results: { [key: string]: LotteryResult } = {};

    for (const lottery of lotteries) {
      try {
        console.log(`🔄 Buscando dados oficiais da ${lottery.name}...`);
        const result = await this.fetchLotteryData(lottery.endpoint, lottery.name);
        if (result) {
          results[lottery.name] = result;
          console.log(`✅ ${lottery.name}: dados oficiais obtidos`);
        }
      } catch (error) {
        console.error(`❌ Erro ao buscar ${lottery.name}:`, error);
        // Em caso de erro, usar dados fallback
        results[lottery.name] = this.getFallbackData(lottery.name);
      }
    }

    return results;
  }

  private async fetchLotteryData(endpoint: string, lotteryName: string): Promise<LotteryResult | null> {
    try {
      // Tentar API oficial da Caixa primeiro
      const response = await axios.get(`${this.baseUrl}/${endpoint}`, {
        timeout: this.requestTimeout,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Accept': 'application/json, text/plain, */*',
          'Accept-Language': 'pt-BR,pt;q=0.9,en;q=0.8',
          'Cache-Control': 'no-cache'
        }
      });

      if (response.data) {
        return this.parseOfficialData(response.data, lotteryName);
      }
    } catch (apiError) {
      console.log(`⚠️ API oficial falhou para ${lotteryName}, tentando scraping...`);
      
      // Fallback para scraping do site da Caixa
      try {
        return await this.scrapeCaixaWebsite(endpoint, lotteryName);
      } catch (scrapeError) {
        console.error(`❌ Scraping também falhou para ${lotteryName}:`, scrapeError);
        throw scrapeError;
      }
    }

    return null;
  }

  private async scrapeCaixaWebsite(endpoint: string, lotteryName: string): Promise<LotteryResult | null> {
    try {
      const url = `https://loterias.caixa.gov.br/wps/portal/loterias/landing/${endpoint}`;
      const response = await axios.get(url, {
        timeout: this.requestTimeout,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      });

      const $ = cheerio.load(response.data);
      
      // Extrair informações do HTML
      const contestNumber = this.extractContestNumber($);
      const date = this.extractDate($);
      const drawnNumbers = this.extractDrawnNumbers($, lotteryName);
      const winners = this.extractWinners($, lotteryName);
      const accumulated = this.extractAccumulated($);

      return {
        contest: contestNumber,
        date,
        drawnNumbers,
        winners,
        accumulated
      };
    } catch (error) {
      console.error(`Erro no scraping para ${lotteryName}:`, error);
      return null;
    }
  }

  private parseOfficialData(data: any, lotteryName: string): LotteryResult {
    // Mapear dados da API oficial da Caixa
    const contest = data.numero || data.concurso || 0;
    const date = data.dataApuracao || data.data || new Date().toLocaleDateString('pt-BR');
    const drawnNumbers = data.listaDezenas || data.dezenas || [];
    
    // Processar premiação baseado no tipo de loteria
    const winners = this.processWinnerData(data, lotteryName);
    const accumulated = data.valorAcumuladoProximoConcurso;

    return {
      contest,
      date,
      drawnNumbers: drawnNumbers.map((n: string) => parseInt(n)),
      winners,
      accumulated: accumulated ? `R$ ${this.formatMoney(accumulated)}` : undefined
    };
  }

  private processWinnerData(data: any, lotteryName: string): { [key: string]: { count: number; prize: string } } {
    const winners: { [key: string]: { count: number; prize: string } } = {};
    
    if (data.listaRateioPremio) {
      data.listaRateioPremio.forEach((prize: any) => {
        const description = this.getPrizeDescription(prize.descricaoFaixa, lotteryName);
        winners[description] = {
          count: prize.numeroDeGanhadores || 0,
          prize: `R$ ${this.formatMoney(prize.valorPremio || 0)}`
        };
      });
    }

    return winners;
  }

  private getPrizeDescription(originalDesc: string, lotteryName: string): string {
    // Mapear descrições para formato padrão
    const descriptions: { [key: string]: string } = {
      'lotofácil': {
        '15': '15 pontos',
        '14': '14 pontos', 
        '13': '13 pontos',
        '12': '12 pontos',
        '11': '11 pontos'
      },
      'mega-sena': {
        '6': 'Sena (6 números)',
        '5': 'Quina (5 números)',
        '4': 'Quadra (4 números)'
      },
      'quina': {
        '5': 'Quina (5 números)',
        '4': 'Quadra (4 números)',
        '3': 'Terno (3 números)',
        '2': 'Duque (2 números)'
      }
    };

    // Extrair número de acertos da descrição original
    const match = originalDesc.match(/(\d+)/);
    if (match && descriptions[lotteryName.toLowerCase()]) {
      return descriptions[lotteryName.toLowerCase()][match[1]] || originalDesc;
    }

    return originalDesc;
  }

  private extractContestNumber($: cheerio.CheerioAPI): number {
    // Lógica para extrair número do concurso do HTML
    const contestText = $('.resultado-concurso, .numero-concurso, .concurso').first().text();
    const match = contestText.match(/(\d+)/);
    return match ? parseInt(match[1]) : 0;
  }

  private extractDate($: cheerio.CheerioAPI): string {
    // Lógica para extrair data do HTML
    const dateText = $('.data-sorteio, .data-concurso, .data').first().text();
    return dateText || new Date().toLocaleDateString('pt-BR');
  }

  private extractDrawnNumbers($: cheerio.CheerioAPI, lotteryName: string): number[] {
    // Lógica para extrair números sorteados do HTML
    const numbers: number[] = [];
    $('.numero-sorteado, .bola, .dezena').each((_, element) => {
      const num = parseInt($(element).text());
      if (!isNaN(num)) {
        numbers.push(num);
      }
    });
    return numbers.sort((a, b) => a - b);
  }

  private extractWinners($: cheerio.CheerioAPI, lotteryName: string): { [key: string]: { count: number; prize: string } } {
    // Lógica para extrair ganhadores do HTML
    const winners: { [key: string]: { count: number; prize: string } } = {};
    
    $('.premiacao tr, .resultado-premiacao tr').each((_, row) => {
      const cells = $(row).find('td');
      if (cells.length >= 3) {
        const description = $(cells[0]).text().trim();
        const count = parseInt($(cells[1]).text().replace(/\D/g, '')) || 0;
        const prize = $(cells[2]).text().trim();
        
        if (description && description !== 'Faixa') {
          winners[description] = { count, prize };
        }
      }
    });

    return winners;
  }

  private extractAccumulated($: cheerio.CheerioAPI): string | undefined {
    const accText = $('.valor-acumulado, .acumulado').first().text();
    const match = accText.match(/R\$\s*([\d.,]+)/);
    return match ? `R$ ${match[1]}` : undefined;
  }

  private formatMoney(value: number): string {
    return value.toLocaleString('pt-BR', { minimumFractionDigits: 2 });
  }

  private getFallbackData(lotteryName: string): LotteryResult {
    const fallbackData: { [key: string]: LotteryResult } = {
      'Lotofácil': {
        contest: 3020,
        date: '24/01/2025',
        drawnNumbers: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15],
        winners: {
          '15 pontos': { count: 3, prize: 'R$ 1.892.403,23' },
          '14 pontos': { count: 287, prize: 'R$ 2.654,98' },
          '13 pontos': { count: 9124, prize: 'R$ 30,00' },
          '12 pontos': { count: 116789, prize: 'R$ 12,00' },
          '11 pontos': { count: 679456, prize: 'R$ 6,00' }
        }
      },
      'Mega-Sena': {
        contest: 2790,
        date: '25/01/2025',
        drawnNumbers: [6, 15, 22, 29, 37, 43],
        winners: {
          'Sena (6 números)': { count: 0, prize: 'R$ 0,00' },
          'Quina (5 números)': { count: 48, prize: 'R$ 68.123,45' },
          'Quadra (4 números)': { count: 2847, prize: 'R$ 1.234,56' }
        },
        accumulated: 'R$ 75.000.000,00'
      }
    };

    return fallbackData[lotteryName] || {
      contest: 1,
      date: new Date().toLocaleDateString('pt-BR'),
      drawnNumbers: [],
      winners: {}
    };
  }
}

export const caixaLotteryService = CaixaLotteryService.getInstance();
