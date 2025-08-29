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
  private requestTimeout = 8000;
  private maxRetries = 2;

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
    const validResults: string[] = [];

    for (const lottery of lotteries) {
      try {
        console.log(`🔄 Buscando dados oficiais da ${lottery.name}...`);
        const result = await this.fetchLotteryDataWithRetry(lottery.endpoint, lottery.name);

        if (result && this.validateResult(result, lottery.name)) {
          results[lottery.name] = result;
          validResults.push(lottery.name);
          console.log(`✅ ${lottery.name}: dados oficiais válidos obtidos (concurso ${result.contest})`);
        } else {
          console.warn(`⚠️ ${lottery.name}: dados inválidos, ignorando`);
        }
      } catch (error) {
        console.error(`❌ Erro ao buscar ${lottery.name}:`, error);
        // Não adicionar dados de fallback - apenas dados reais
      }
    }

    if (validResults.length === 0) {
      throw new Error('Nenhum resultado válido obtido da API da Caixa');
    }

    console.log(`✅ Resultados válidos obtidos: ${validResults.join(', ')}`);
    return results;
  }

  private async fetchLotteryDataWithRetry(endpoint: string, lotteryName: string): Promise<LotteryResult | null> {
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        console.log(`🔄 Tentativa ${attempt}/${this.maxRetries} para ${lotteryName}`);

        const result = await this.fetchLotteryData(endpoint, lotteryName);
        if (result && this.validateResult(result, lotteryName)) {
          return result;
        }

        throw new Error(`Dados inválidos na tentativa ${attempt}`);
      } catch (error) {
        lastError = error as Error;

        if (attempt < this.maxRetries) {
          console.warn(`⚠️ Tentativa ${attempt} falhou, tentando novamente em 2s...`);
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
      }
    }

    throw lastError || new Error(`Falha após ${this.maxRetries} tentativas`);
  }

  private async fetchLotteryData(endpoint: string, lotteryName: string): Promise<LotteryResult | null> {
    try {
      // Tentar API oficial da Caixa primeiro
      const response = await axios.get(`${this.baseUrl}/${endpoint}`, {
        timeout: this.requestTimeout,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'application/json, text/plain, */*',
          'Accept-Language': 'pt-BR,pt;q=0.9,en;q=0.8',
          'Accept-Encoding': 'gzip, deflate, br',
          'Cache-Control': 'no-cache',
          'Referer': 'https://loterias.caixa.gov.br/',
          'Origin': 'https://loterias.caixa.gov.br'
        },
        validateStatus: function (status) {
          return status === 200; // Aceitar apenas status 200
        }
      });

      if (response.data && response.status === 200) {
        return this.parseOfficialData(response.data, lotteryName);
      }
    } catch (apiError) {
      if (axios.isAxiosError(apiError)) {
        if (apiError.response?.status === 403) {
          throw new Error(`Acesso negado pela API da Caixa para ${lotteryName}`);
        }
        if (apiError.response?.status === 429) {
          throw new Error(`Rate limit atingido para ${lotteryName}`);
        }
      }
      throw apiError;
    }

    return null;
  }

  private validateResult(result: LotteryResult, lotteryName: string): boolean {
    // Validar dados essenciais
    if (!result) return false;

    const isValidContest = result.contest > 0 && result.contest < 99999;
    const isValidDate = result.date && result.date.match(/\d{1,2}\/\d{1,2}\/\d{4}/);
    const hasValidNumbers = result.drawnNumbers && result.drawnNumbers.length > 0;
    const numbersAreValid = result.drawnNumbers.every(n => n > 0 && n <= 100);

    // Verificar se os números fazem sentido para a loteria específica
    const expectedNumberCount = this.getExpectedNumberCount(lotteryName);
    const hasCorrectCount = result.drawnNumbers.length === expectedNumberCount;

    const isValid = isValidContest && isValidDate && hasValidNumbers && numbersAreValid && hasCorrectCount;

    if (!isValid) {
      console.warn(`❌ Dados inválidos para ${lotteryName}:`, {
        contest: result.contest,
        date: result.date,
        numbersCount: result.drawnNumbers?.length,
        expectedCount: expectedNumberCount
      });
    }

    return isValid;
  }

  private getExpectedNumberCount(lotteryName: string): number {
    const expectedCounts: { [key: string]: number } = {
      'Lotofácil': 15,
      'Mega-Sena': 6,
      'Quina': 5,
      'Lotomania': 20,
      'Timemania': 7, // 7 números + time
      'Dupla-Sena': 6,
      'Dia de Sorte': 7,
      'Super Sete': 7
    };

    return expectedCounts[lotteryName] || 6;
  }

  private parseOfficialData(data: any, lotteryName: string): LotteryResult {
    if (!data || typeof data !== 'object') {
      throw new Error(`Dados inválidos recebidos para ${lotteryName}`);
    }

    // Mapear dados da API oficial da Caixa
    const contest = parseInt(data.numero) || parseInt(data.concurso) || 0;
    const date = data.dataApuracao || data.data || '';
    let drawnNumbers: number[] = [];

    if (lotteryName === 'Super Sete' && data.grupos && Array.isArray(data.grupos)) {
      // Super Sete tem um formato diferente, com sorteios por grupo
      const allGroupNumbers: number[] = [];
      data.grupos.forEach((group: any) => {
        if (group.numeros && typeof group.numeros === 'string') {
          const numbersText = group.numeros;
          const numbers = numbersText.split('-').map(n => {
            const num = parseInt(n.trim());
            if (isNaN(num)) {
              throw new Error(`Número inválido encontrado: ${n}`);
            }
            // Para Super Sete, aceitar números de 0 a 9
            if (lotteryName === 'Super Sete' && (num < 0 || num > 9)) {
              throw new Error(`Número fora do range para Super Sete: ${num}`);
            }
            // Para outras loterias, não aceitar números menores que 1
            if (lotteryName !== 'Super Sete' && num < 1) {
              throw new Error(`Número inválido encontrado: ${n}`);
            }
            return num;
          });
          allGroupNumbers.push(...numbers);
        }
      });
      drawnNumbers = allGroupNumbers;
    } else {
      // Loterias com formato padrão
      const numbersText = data.dezenas || data.listaDezenas || '';
      if (typeof numbersText === 'string') {
        drawnNumbers = numbersText.split('-').map(n => {
          const num = parseInt(n.trim());
          if (isNaN(num) || num <= 0) {
            throw new Error(`Número inválido encontrado: ${n}`);
          }
          return num;
        });
      } else if (Array.isArray(numbersText)) {
        drawnNumbers = numbersText.map((n: string) => {
          const num = parseInt(n);
          if (isNaN(num) || num <= 0) {
            throw new Error(`Número inválido encontrado: ${n}`);
          }
          return num;
        });
      } else {
        throw new Error(`Formato de dezenas inesperado para ${lotteryName}`);
      }
    }


    // Validar dados essenciais antes de processar
    if (contest <= 0) {
      throw new Error(`Número do concurso inválido: ${contest}`);
    }

    if (!Array.isArray(drawnNumbers) || drawnNumbers.length === 0) {
      throw new Error(`Números sorteados inválidos para ${lotteryName}`);
    }

    // Processar premiação baseado no tipo de loteria
    const winners = this.processWinnerData(data, lotteryName);
    const accumulated = data.valorAcumuladoProximoConcurso;

    return {
      contest,
      date: date || new Date().toLocaleDateString('pt-BR'),
      drawnNumbers: drawnNumbers.map((n: number) => {
        return n;
      }),
      winners,
      accumulated: accumulated && accumulated > 0 ? `R$ ${this.formatMoney(accumulated)}` : undefined
    };
  }

  private processWinnerData(data: any, lotteryName: string): { [key: string]: { count: number; prize: string } } {
    const winners: { [key: string]: { count: number; prize: string } } = {};

    if (data.listaRateioPremio && Array.isArray(data.listaRateioPremio)) {
      data.listaRateioPremio.forEach((prize: any) => {
        if (prize && typeof prize === 'object') {
          const description = this.getPrizeDescription(prize.descricaoFaixa, lotteryName);
          const count = parseInt(prize.numeroDeGanhadores) || 0;
          const prizeValue = parseFloat(prize.valorPremio) || 0;

          if (description && !isNaN(count) && !isNaN(prizeValue)) {
            winners[description] = {
              count: count,
              prize: `R$ ${this.formatMoney(prizeValue)}`
            };
          }
        }
      });
    } else if (lotteryName === 'Super Sete' && data.premios && Array.isArray(data.premios)) {
      // Tratamento específico para Super Sete, que pode ter o formato de premiação diferente
      data.premios.forEach((prize: any) => {
        if (prize && typeof prize === 'object') {
          const description = prize.faixa; // Assumindo que 'faixa' contém a descrição dos acertos
          const count = parseInt(prize.ganhadores) || 0;
          const prizeValue = parseFloat(prize.valor) || 0;

          if (description && !isNaN(count) && !isNaN(prizeValue)) {
            winners[description] = {
              count: count,
              prize: `R$ ${this.formatMoney(prizeValue)}`
            };
          }
        }
      });
    }

    return winners;
  }

  private getPrizeDescription(originalDesc: string, lotteryName: string): string {
    if (!originalDesc) return '';

    // Mapear descrições para formato padrão
    const descriptions: { [key: string]: { [key: string]: string } } = {
      'Lotofácil': {
        '15': '15 pontos',
        '14': '14 pontos',
        '13': '13 pontos',
        '12': '12 pontos',
        '11': '11 pontos'
      },
      'Mega-Sena': {
        '6': 'Sena (6 números)',
        '5': 'Quina (5 números)',
        '4': 'Quadra (4 números)'
      },
      'Quina': {
        '5': 'Quina (5 números)',
        '4': 'Quadra (4 números)',
        '3': 'Terno (3 números)',
        '2': 'Duque (2 números)'
      },
      'Super Sete': {
        '7': '7 acertos',
        '6': '6 acertos',
        '5': '5 acertos',
        '4': '4 acertos',
        '3': '3 acertos'
      }
    };

    // Extrair número de acertos da descrição original
    const match = originalDesc.match(/(\d+)/);
    const lotteryKey = lotteryName;

    if (match && descriptions[lotteryKey]) {
      return descriptions[lotteryKey][match[1]] || originalDesc;
    }

    return originalDesc;
  }

  private formatMoney(value: number): string {
    if (isNaN(value)) return '0,00';
    return value.toLocaleString('pt-BR', { minimumFractionDigits: 2 });
  }
}

export const caixaLotteryService = CaixaLotteryService.getInstance();