import axios from 'axios';
import * as cheerio from 'cheerio';
import fetch from 'node-fetch';
import { DataCache } from '../db';

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

interface CaixaAPIResponse {
  acumulado: boolean;
  dataApuracao: string;
  dataProximoConcurso: string;
  dezenasSorteadasOrdemSorteio: string[];
  numeroDoConcurso: number;
  valorEstimadoProximoConcurso: number;
  valorPremio: number;
}


export class CaixaLotteryService {
  private static instance: CaixaLotteryService;
  private baseUrl = 'https://servicebus2.caixa.gov.br/portaldeloterias/api';
  private requestTimeout = 8000;
  private maxRetries = 3; // Aumentado para maior robustez
  private cacheTimeout = 600000; // 10 minutos de cache
  private fallbackUrls = [
    'https://servicebus2.caixa.gov.br/portaldeloterias/api',
    'https://loterias.caixa.gov.br/Paginas/Mega-Sena.aspx', // URL de fallback
  ];
  private errorCount = new Map<string, number>();
  private lastSuccessTime = new Map<string, number>();

  public static getInstance(): CaixaLotteryService {
    if (!CaixaLotteryService.instance) {
      CaixaLotteryService.instance = new CaixaLotteryService();
    }
    return CaixaLotteryService.instance;
  }

  async getLatestResults(): Promise<{ [key: string]: LotteryResult }> {
    const cacheKey = 'lottery_results_latest';
    
    // Verificar cache primeiro
    const cachedResults = DataCache.get(cacheKey);
    if (cachedResults) {
      console.log('✅ Dados obtidos do cache (sem requisições à API)');
      return cachedResults;
    }

    const lotteries = [
      { name: 'Lotofácil', endpoint: 'lotofacil' },
      { name: 'Mega-Sena', endpoint: 'megasena' },
      { name: 'Quina', endpoint: 'quina' },
      { name: 'Lotomania', endpoint: 'lotomania' },
      { name: 'Timemania', endpoint: 'timemania' },
      { name: 'Dupla-Sena', endpoint: 'duplasena' },
      { name: 'Dia de Sorte', endpoint: 'diadesorte' },
      { name: 'Super Sete', endpoint: 'supersete' },
      { name: '+Milionária', endpoint: 'maismilionaria' }
    ];

    const results: { [key: string]: LotteryResult } = {};
    const validResults: string[] = [];
    const failedLotteries: string[] = [];

    // Buscar dados em paralelo para melhor performance
    const lotteryPromises = lotteries.map(async (lottery) => {
      try {
        console.log(`🔄 Buscando dados oficiais da ${lottery.name}...`);
        const result = await this.fetchLotteryDataWithRetry(lottery.endpoint, lottery.name);

        if (result && this.validateResult(result, lottery.name)) {
          results[lottery.name] = result;
          validResults.push(lottery.name);
          console.log(`✅ ${lottery.name}: dados oficiais válidos obtidos (concurso ${result.contest})`);
          // Resetar contador de erros em caso de sucesso
          this.errorCount.set(lottery.name, 0);
          this.lastSuccessTime.set(lottery.name, Date.now());
        } else {
          console.warn(`⚠️ ${lottery.name}: dados inválidos, ignorando`);
          failedLotteries.push(lottery.name);
        }
      } catch (error) {
        console.error(`❌ Erro ao buscar ${lottery.name}:`, error);
        failedLotteries.push(lottery.name);
        // Incrementar contador de erros
        const currentErrors = this.errorCount.get(lottery.name) || 0;
        this.errorCount.set(lottery.name, currentErrors + 1);
      }
    });

    // Aguardar todas as requisições
    await Promise.allSettled(lotteryPromises);

    // Auto-correção: se mais da metade falhou, tentar uma abordagem alternativa
    if (failedLotteries.length > lotteries.length / 2) {
      console.warn(`⚠️ Muitas falhas detectadas (${failedLotteries.length}/${lotteries.length}), tentando auto-correção...`);
      await this.attemptAutoCorrection(failedLotteries, results);
    }

    if (validResults.length === 0) {
      // Verificar se temos dados em cache antigo como fallback
      const oldCacheKey = 'lottery_results_fallback';
      const fallbackResults = DataCache.get(oldCacheKey);
      if (fallbackResults) {
        console.warn('⚠️ Usando dados de fallback do cache');
        return fallbackResults;
      }
      throw new Error('Nenhum resultado válido obtido da API da Caixa e sem dados de fallback');
    }

    // Salvar no cache principal e fallback
    DataCache.set(cacheKey, results, this.cacheTimeout);
    DataCache.set('lottery_results_fallback', results, 86400000); // 24h como fallback

    console.log(`✅ Resultados válidos obtidos: ${validResults.join(', ')}`);
    return results;
  }

  private async attemptAutoCorrection(failedLotteries: string[], currentResults: { [key: string]: LotteryResult }): Promise<void> {
    console.log('🔧 Iniciando auto-correção de APIs...');
    
    for (const lotteryName of failedLotteries) {
      try {
        // Tentar com timeout maior
        const originalTimeout = this.requestTimeout;
        this.requestTimeout = 15000; // 15 segundos
        
        const lottery = this.getLotteryByName(lotteryName);
        if (!lottery) continue;

        const result = await this.fetchLotteryDataWithAlternativeMethod(lottery.endpoint, lotteryName);
        
        if (result && this.validateResult(result, lotteryName)) {
          currentResults[lotteryName] = result;
          console.log(`✅ Auto-correção bem-sucedida para ${lotteryName}`);
        }
        
        // Restaurar timeout original
        this.requestTimeout = originalTimeout;
      } catch (error) {
        console.error(`❌ Auto-correção falhou para ${lotteryName}:`, error);
      }
    }
  }

  private getLotteryByName(name: string): { name: string; endpoint: string } | null {
    const lotteryMap: { [key: string]: string } = {
      'Lotofácil': 'lotofacil',
      'Mega-Sena': 'megasena',
      'Quina': 'quina',
      'Lotomania': 'lotomania',
      'Timemania': 'timemania',
      'Dupla-Sena': 'duplasena',
      'Dia de Sorte': 'diadesorte',
      'Super Sete': 'supersete'
    };
    
    const endpoint = lotteryMap[name];
    return endpoint ? { name, endpoint } : null;
  }

  private async fetchLotteryDataWithAlternativeMethod(endpoint: string, lotteryName: string): Promise<LotteryResult | null> {
    // Método alternativo com headers diferentes e outras estratégias
    try {
      const response = await axios.get(`${this.baseUrl}/${endpoint}`, {
        timeout: this.requestTimeout,
        headers: {
          'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': '*/*',
          'Accept-Language': 'pt-BR,pt;q=0.9',
          'Accept-Encoding': 'gzip, deflate, br',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0',
          'DNT': '1',
          'Connection': 'keep-alive',
          'Upgrade-Insecure-Requests': '1'
        },
        validateStatus: function (status) {
          return status === 200;
        },
        maxRedirects: 3,
        decompress: true
      });

      if (response.data && response.status === 200) {
        return this.parseOfficialData(response.data, lotteryName);
      }
    } catch (error) {
      console.warn(`⚠️ Método alternativo também falhou para ${lotteryName}:`, error);
    }

    return null;
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

    // Validação específica por loteria para números
    let numbersAreValid = false;
    if (lotteryName === 'Super Sete') {
      // Super Sete aceita números de 0 a 9
      numbersAreValid = result.drawnNumbers.every(n => n >= 0 && n <= 9);
    } else {
      // Outras loterias aceitam números de 1 a 100
      numbersAreValid = result.drawnNumbers.every(n => n > 0 && n <= 100);
    }

    // Verificar se os números fazem sentido para a loteria específica
    const expectedNumberCount = this.getExpectedNumberCount(lotteryName);
    const hasCorrectCount = result.drawnNumbers.length === expectedNumberCount;

    const isValid = isValidContest && isValidDate && hasValidNumbers && numbersAreValid && hasCorrectCount;

    if (!isValid) {
      console.warn(`❌ Dados inválidos para ${lotteryName}:`, {
        contest: result.contest,
        date: result.date,
        numbersCount: result.drawnNumbers?.length,
        expectedCount: expectedNumberCount,
        numbersRange: lotteryName === 'Super Sete' ? '0-9' : '1-100',
        actualNumbers: result.drawnNumbers
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
      'Super Sete': 7,
      '+Milionária': 8 // 6 números + 2 trevos
    };

    return expectedCounts[lotteryName] || 6;
  }

  private parseOfficialData(data: any, lotteryName: string): LotteryResult {
    if (!data || typeof data !== 'object') {
      throw new Error(`Dados inválidos recebidos para ${lotteryName}`);
    }

    // Mapear dados da API oficial da Caixa
    const contest = parseInt(data.numero || data.numeroDoConcurso) || 0;
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
      const numbersText = data.dezenas || data.listaDezenas || data.dezenasSorteadasOrdemSorteio || '';
      if (typeof numbersText === 'string') {
        drawnNumbers = numbersText.split('-').map(n => {
          const num = parseInt(n.trim());
          if (isNaN(num)) {
            throw new Error(`Número inválido encontrado: ${n}`);
          }
          // Para Super Sete, aceitar números de 0 a 9
          if (lotteryName === 'Super Sete' && (num < 0 || num > 9)) {
            throw new Error(`Número fora do range para Super Sete: ${num}`);
          }
          // Para outras loterias, não aceitar números menores que 1
          if (lotteryName !== 'Super Sete' && num <= 0) {
            throw new Error(`Número inválido encontrado: ${n}`);
          }
          return num;
        });
      } else if (Array.isArray(numbersText)) {
        drawnNumbers = numbersText.map((n: string) => {
          const num = parseInt(n);
          if (isNaN(num)) {
            throw new Error(`Número inválido encontrado: ${n}`);
          }
          // Para Super Sete, aceitar números de 0 a 9
          if (lotteryName === 'Super Sete' && (num < 0 || num > 9)) {
            throw new Error(`Número fora do range para Super Sete: ${num}`);
          }
          // Para outras loterias, não aceitar números menores que 1
          if (lotteryName !== 'Super Sete' && num <= 0) {
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
    const accumulated = data.valorAcumuladoProximoConcurso || data.valorEstimadoProximoConcurso;
    const nextEstimate = data.valorEstimadoProximoConcurso;
    const totalPrize = data.valorArrecadado;
    const nextDraw = data.dataProximoConcurso;

    return {
      lottery: lotteryName,
      contest,
      date: date || new Date().toLocaleDateString('pt-BR'),
      drawnNumbers: drawnNumbers.map((n: number) => {
        return n;
      }),
      winners,
      accumulated: data.acumulado === true || data.acumulado === 'true',
      nextEstimate: nextEstimate && nextEstimate > 0 ? `R$ ${this.formatMoney(nextEstimate)}` : undefined,
      totalPrize: totalPrize && totalPrize > 0 ? `R$ ${this.formatMoney(totalPrize)}` : undefined,
      nextDraw: nextDraw || undefined
    };
  }

  private processWinnerData(data: any, lotteryName: string): any[] {
    const winners: any[] = [];

    if (data.listaRateioPremio && Array.isArray(data.listaRateioPremio)) {
      data.listaRateioPremio.forEach((prize: any) => {
        if (prize && typeof prize === 'object') {
          const hits = this.extractHitsFromDescription(prize.descricaoFaixa || '', lotteryName);
          const count = parseInt(prize.numeroDeGanhadores) || 0;
          const prizeValue = parseFloat(prize.valorPremio) || 0;

          if (hits > 0 && !isNaN(count) && !isNaN(prizeValue)) {
            winners.push({
              hits: hits,
              winnerCount: count,
              prizeValue: prizeValue > 0 ? `R$ ${this.formatMoney(prizeValue)}` : 'Não há ganhadores'
            });
          }
        }
      });
    } else if (lotteryName === 'Super Sete' && data.premios && Array.isArray(data.premios)) {
      // Tratamento específico para Super Sete
      data.premios.forEach((prize: any) => {
        if (prize && typeof prize === 'object') {
          const hits = this.extractHitsFromDescription(prize.faixa || '', lotteryName);
          const count = parseInt(prize.ganhadores) || 0;
          const prizeValue = parseFloat(prize.valor) || 0;

          if (hits > 0 && !isNaN(count) && !isNaN(prizeValue)) {
            winners.push({
              hits: hits,
              winnerCount: count,
              prizeValue: prizeValue > 0 ? `R$ ${this.formatMoney(prizeValue)}` : 'Não há ganhadores'
            });
          }
        }
      });
    }

    // Ordenar por número de acertos (maior primeiro)
    return winners.sort((a, b) => b.hits - a.hits);
  }

  private extractHitsFromDescription(description: string, lotteryName: string): number {
    if (!description) return 0;

    // Extrair número de acertos da descrição
    const match = description.match(/(\d+)/);
    if (match) {
      return parseInt(match[1]);
    }

    // Mapeamento específico por loteria
    const hitMappings: { [key: string]: { [key: string]: number } } = {
      'Mega-Sena': {
        'sena': 6,
        'quina': 5,
        'quadra': 4
      },
      'Lotofácil': {
        '15': 15,
        '14': 14,
        '13': 13,
        '12': 12,
        '11': 11
      },
      'Quina': {
        'quina': 5,
        'quadra': 4,
        'terno': 3,
        'duque': 2
      }
    };

    const lotteryMapping = hitMappings[lotteryName];
    if (lotteryMapping) {
      const desc = description.toLowerCase();
      for (const [key, value] of Object.entries(lotteryMapping)) {
        if (desc.includes(key)) {
          return value;
        }
      }
    }

    return 0;
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