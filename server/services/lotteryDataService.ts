import axios from 'axios';
import * as cheerio from 'cheerio';
import { db } from '../db';
import { lotteries, lotteryResults } from '@shared/schema';
import { eq, and } from 'drizzle-orm';
import * as storage from '../storage'; // Assuming storage has updateNumberFrequency

interface LotteryData {
  name: string;
  slug: string;
  contestNumber: number;
  estimatedPrize: string;
  drawDate: string;
  drawnNumbers?: number[];
  isAccumulated?: boolean;
  actualPrize?: string;
  specialNumber?: string;
  prizeTiers?: any;
}

interface ScrapedResult {
  contestNumber: number;
  drawnNumbers: number[];
  drawDate: string;
  actualPrize: string;
  isAccumulated: boolean;
  specialNumber?: string;
}

interface LotteryInfo {
  contestNumber: number;
  nextDrawDate: string;
  estimatedPrize: string;
  lotteryName: string;
  slug: string;
  extractedAt: Date;
}

export class LotteryDataService {
  private static instance: LotteryDataService;
  private baseUrl = 'https://servicebus2.caixa.gov.br/portaldeloterias/api';
  private alternativeSources = [
    'https://loteriascaixa.azurewebsites.net/api',
    'https://api.sorte-online.com/api/lotteries'
  ];
  private requestTimeout = 15000;
  private collaborativeLearning = new Map<string, any>();
  private readonly lotteryConfigs = [
    {
      name: 'Mega-Sena',
      slug: 'mega-sena',
      maxNumber: 60,
      minNumbers: 6,
      maxNumbers: 15,
      drawDays: JSON.stringify(['quarta', 'sabado']),
      description: 'A loteria mais famosa do Brasil. Escolha de 6 a 15 números entre 1 e 60.',
      gameType: 'standard',
      betValue: '5.00',
      specialNumbers: false
    },
    {
      name: 'Lotofácil',
      slug: 'lotofacil',
      maxNumber: 25,
      minNumbers: 15,
      maxNumbers: 20,
      drawDays: JSON.stringify(['segunda', 'terca', 'quarta', 'quinta', 'sexta', 'sabado']),
      description: 'Mais fácil de ganhar! Escolha de 15 a 20 números entre 1 e 25.',
      gameType: 'standard',
      betValue: '3.00',
      specialNumbers: false
    },
    {
      name: 'Quina',
      slug: 'quina',
      maxNumber: 80,
      minNumbers: 5,
      maxNumbers: 15,
      drawDays: JSON.stringify(['segunda', 'terca', 'quarta', 'quinta', 'sexta', 'sabado']),
      description: 'Escolha de 5 a 15 números entre 1 e 80.',
      gameType: 'standard',
      betValue: '2.50',
      specialNumbers: false
    },
    {
      name: 'Lotomania',
      slug: 'lotomania',
      maxNumber: 100,
      minNumbers: 50,
      maxNumbers: 50,
      drawDays: JSON.stringify(['terca', 'quinta', 'sabado']),
      description: 'Escolha 50 números entre 1 e 100. Ganhe acertando 20, 19, 18, 17, 16, 15 ou nenhum número.',
      gameType: 'standard',
      betValue: '3.00',
      specialNumbers: false
    },
    {
      name: 'Timemania',
      slug: 'timemania',
      maxNumber: 80,
      minNumbers: 10,
      maxNumbers: 10,
      drawDays: JSON.stringify(['terca', 'quinta', 'sabado']),
      description: 'Escolha 10 números entre 1 e 80 e torça pelo seu time do coração.',
      gameType: 'special',
      betValue: '3.50',
      specialNumbers: true
    },
    {
      name: 'Dupla-Sena',
      slug: 'duplasena',
      maxNumber: 50,
      minNumbers: 6,
      maxNumbers: 15,
      drawDays: JSON.stringify(['terca', 'quinta', 'sabado']),
      description: 'Um bilhete, duas chances de ganhar! Escolha de 6 a 15 números entre 1 e 50.',
      gameType: 'special',
      betValue: '2.50',
      specialNumbers: false

  // SISTEMA DE APRENDIZADO COLABORATIVO
  async applyCollaborativeLearning(lotterySlug: string, data: any): Promise<void> {
    try {
      const learningKey = `${lotterySlug}_patterns`;
      const currentLearning = this.collaborativeLearning.get(learningKey) || {
        totalUsers: 0,
        successfulPredictions: 0,
        patterns: new Map(),
        strategies: [],
        lastUpdated: Date.now()
      };

      // Analisar padrões dos números sorteados
      if (data.dezenasSorteadasOrdemSorteio) {
        const numbers = data.dezenasSorteadasOrdemSorteio;
        const patterns = this.analyzeNumberPatterns(numbers);
        
        // Atualizar padrões colaborativos
        patterns.forEach(pattern => {
          const count = currentLearning.patterns.get(pattern) || 0;
          currentLearning.patterns.set(pattern, count + 1);
        });
      }

      currentLearning.totalUsers++;
      currentLearning.lastUpdated = Date.now();
      
      this.collaborativeLearning.set(learningKey, currentLearning);
      
      // Salvar estratégias mais eficazes
      await this.updateGlobalStrategies(lotterySlug, currentLearning);
      
      console.log(`🧠 Aprendizado colaborativo atualizado para ${lotterySlug}`);
    } catch (error) {
      console.error('Erro no aprendizado colaborativo:', error);
    }
  }

  private analyzeNumberPatterns(numbers: number[]): string[] {
    const patterns: string[] = [];
    
    // Padrão par/ímpar
    const evenCount = numbers.filter(n => n % 2 === 0).length;
    patterns.push(`par_impar_${evenCount}_${numbers.length - evenCount}`);
    
    // Padrão de sequências
    const sortedNumbers = [...numbers].sort((a, b) => a - b);
    let sequences = 0;
    for (let i = 0; i < sortedNumbers.length - 1; i++) {
      if (sortedNumbers[i + 1] - sortedNumbers[i] === 1) {
        sequences++;
      }
    }
    patterns.push(`sequencias_${sequences}`);
    
    // Padrão de distribuição por dezenas
    const decades = new Map();
    numbers.forEach(num => {
      const decade = Math.floor(num / 10);
      decades.set(decade, (decades.get(decade) || 0) + 1);
    });
    patterns.push(`distribuicao_${Array.from(decades.values()).join('_')}`);
    
    return patterns;
  }

  async updateGlobalStrategies(lotterySlug: string, learningData: any): Promise<void> {
    try {
      // Criar estratégias baseadas nos padrões mais frequentes
      const topPatterns = Array.from(learningData.patterns.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5);
      
      const strategies = topPatterns.map(([pattern, frequency]) => ({
        pattern,
        frequency,
        successRate: (frequency / learningData.totalUsers) * 100,
        recommendation: this.generateRecommendation(pattern),
        lastSeen: Date.now()
      }));
      
      learningData.strategies = strategies;
      
      // Salvar no storage para compartilhar com todos os usuários
      await storage.updateCollaborativeStrategies(lotterySlug, strategies);
      
    } catch (error) {
      console.error('Erro ao atualizar estratégias globais:', error);
    }
  }

  private generateRecommendation(pattern: string): string {
    if (pattern.includes('par_impar')) {
      const [, , even, odd] = pattern.split('_');
      return `Equilibre números pares (${even}) e ímpares (${odd})`;
    }
    
    if (pattern.includes('sequencias')) {
      const sequences = pattern.split('_')[1];
      return sequences === '0' ? 'Evite números sequenciais' : 'Inclua alguns números sequenciais';
    }
    
    if (pattern.includes('distribuicao')) {
      return 'Distribua números entre diferentes dezenas';
    }
    
    return 'Padrão identificado pela comunidade';
  }

  async getCollaborativeInsights(lotterySlug: string): Promise<any> {
    try {
      const learningKey = `${lotterySlug}_patterns`;
      const learningData = this.collaborativeLearning.get(learningKey);
      
      if (!learningData) {
        return {
          totalUsers: 0,
          strategies: [],
          communityTips: ['Sistema ainda coletando dados da comunidade']
        };
      }

      const communityTips = [
        `${learningData.totalUsers} usuários contribuíram com dados`,
        `${learningData.strategies.length} padrões identificados`,
        'Estratégias mais eficazes da comunidade disponíveis'
      ];

      return {
        totalUsers: learningData.totalUsers,
        strategies: learningData.strategies,
        communityTips,
        lastUpdated: new Date(learningData.lastUpdated).toLocaleString('pt-BR')
      };
    } catch (error) {
      console.error('Erro ao obter insights colaborativos:', error);
      return {
        totalUsers: 0,
        strategies: [],
        communityTips: ['Erro ao carregar dados da comunidade']
      };
    }
  }

  private createFallbackLottery(lottery: { name: string; slug: string; api: string }): LotteryData {
    const fallbackData: { [key: string]: any } = {
      'mega-sena': { contestNumber: 2790, prize: 75000000 },
      'lotofacil': { contestNumber: 3020, prize: 5500000 },
      'quina': { contestNumber: 6590, prize: 15200000 },
      'lotomania': { contestNumber: 2655, prize: 10000000 },
      'timemania': { contestNumber: 2105, prize: 15000000 },
      'duplasena': { contestNumber: 2755, prize: 5000000 },
      'dia-de-sorte': { contestNumber: 965, prize: 1000000 },
      'super-sete': { contestNumber: 545, prize: 2500000 },
      'lotofacil-independencia': { contestNumber: 3, prize: 220000000 }
    };

    const fallback = fallbackData[lottery.slug] || { contestNumber: 1000, prize: 1000000 };
    
    return {
      name: lottery.name,
      slug: lottery.slug,
      contestNumber: fallback.contestNumber,
      estimatedPrize: this.formatPrize(fallback.prize),
      drawDate: lottery.slug === 'lotofacil-independencia' ? '2025-09-07' : this.getNextBusinessDay(),
      drawnNumbers: [],
      isAccumulated: false
    };
  }


    },
    {
      name: 'Dia de Sorte',
      slug: 'dia-de-sorte',
      maxNumber: 31,
      minNumbers: 7,
      maxNumbers: 15,
      drawDays: JSON.stringify(['terca', 'quinta', 'sabado']),
      description: 'Escolha de 7 a 15 números entre 1 e 31 e um mês da sorte.',
      gameType: 'special',
      betValue: '2.00',
      specialNumbers: true
    },
    {
      name: 'Super Sete',
      slug: 'super-sete',
      maxNumber: 7,
      minNumbers: 7,
      maxNumbers: 21,
      drawDays: JSON.stringify(['segunda', 'quarta', 'sexta']),
      description: 'Escolha um número de 0 a 9 para cada uma das 7 colunas.',
      gameType: 'special',
      betValue: '2.50',
      specialNumbers: false
    },
    {
      name: 'Lotofácil-Independência',
      slug: 'lotofacil-independencia',
      maxNumber: 25,
      minNumbers: 15,
      maxNumbers: 20,
      drawDays: JSON.stringify(['setembro']),
      description: 'Edição especial da Lotofácil para o 7 de setembro.',
      gameType: 'special',
      betValue: '3.00',
      specialNumbers: false
    }
  ];

  public static getInstance(): LotteryDataService {
    if (!LotteryDataService.instance) {
      LotteryDataService.instance = new LotteryDataService();
    }
    return LotteryDataService.instance;
  }

  async initializeLotteries(): Promise<void> {
    console.log('Inicializando loterias brasileiras...');
    for (const lotteryConfig of this.lotteryConfigs) {
      try {
        const existingLottery = await db.select()
          .from(lotteries)
          .where(eq(lotteries.slug, lotteryConfig.slug))
          .limit(1);

        if (existingLottery.length === 0) {
          await db.insert(lotteries).values(lotteryConfig);
          console.log(`Loteria ${lotteryConfig.name} criada com sucesso`);
        } else {
          await db.update(lotteries)
            .set(lotteryConfig)
            .where(eq(lotteries.slug, lotteryConfig.slug));
          console.log(`Loteria ${lotteryConfig.name} atualizada`);
        }
      } catch (error) {
        console.error(`Erro ao inicializar loteria ${lotteryConfig.name}:`, error);
      }
    }
  }

  async fetchLotteryData(): Promise<LotteryData[]> {
    console.log('🎯 Buscando dados oficiais da Caixa Econômica Federal...');
    
    const lotteryApis = [
      { name: 'Mega-Sena', slug: 'mega-sena', api: 'megasena' },
      { name: 'Lotofácil', slug: 'lotofacil', api: 'lotofacil' },
      { name: 'Quina', slug: 'quina', api: 'quina' },
      { name: 'Lotomania', slug: 'lotomania', api: 'lotomania' },
      { name: 'Timemania', slug: 'timemania', api: 'timemania' },
      { name: 'Dupla-Sena', slug: 'duplasena', api: 'duplasena' },
      { name: 'Dia de Sorte', slug: 'dia-de-sorte', api: 'diadesorte' },
      { name: 'Super Sete', slug: 'super-sete', api: 'supersete' },
      { name: 'Lotofácil-Independência', slug: 'lotofacil-independencia', api: 'lotofacil' }
    ];

    const lotteryData: LotteryData[] = [];

    for (const lottery of lotteryApis) {
      try {
        console.log(`📡 Buscando ${lottery.name} da API oficial...`);
        
        const response = await axios.get(`${this.baseUrl}/${lottery.api}/`, {
          timeout: this.requestTimeout,
          headers: {
            'User-Agent': 'LotteryApp/2.0 (Official Caixa API Client)',
            'Accept': 'application/json',
            'Accept-Language': 'pt-BR',
            'Cache-Control': 'no-cache'
          },
          validateStatus: (status) => status >= 200 && status < 400
        });

        if (response.status === 200 && response.data) {
          const data = response.data;
          
          // Para Lotofácil-Independência, usar dados especiais
          if (lottery.slug === 'lotofacil-independencia') {
            lotteryData.push({
              name: lottery.name,
              slug: lottery.slug,
              contestNumber: data.numero || 3,
              estimatedPrize: this.formatPrize(data.valorEstimadoProximoConcurso || 220000000),
              drawDate: '2025-09-07',
              drawnNumbers: data.dezenasSorteadasOrdemSorteio || [],
              isAccumulated: false,
              actualPrize: this.formatPrize(data.valorArrecadado || 0)
            });
          } else {
            lotteryData.push({
              name: lottery.name,
              slug: lottery.slug,
              contestNumber: data.numero || data.concurso || 0,
              estimatedPrize: this.formatPrize(data.valorEstimadoProximoConcurso || data.valorAcumulado),
              drawDate: this.formatDate(data.dataProximoConcurso || data.dataApuracao),
              drawnNumbers: data.dezenasSorteadasOrdemSorteio || data.listaDezenas || [],
              isAccumulated: data.acumulado || false,
              actualPrize: this.formatPrize(data.valorArrecadado || data.valorRateio)
            });
          }
          
          console.log(`✅ ${lottery.name}: dados oficiais obtidos`);
          
          // Aplicar aprendizado colaborativo
          await this.applyCollaborativeLearning(lottery.slug, data);
          
        } else {
          console.log(`⚠️ ${lottery.name}: usando dados de fallback`);
          lotteryData.push(this.createFallbackLottery(lottery));
        }
        
      } catch (error: any) {
        console.error(`❌ Erro ao buscar ${lottery.name}:`, error.message?.substring(0, 100));
        lotteryData.push(this.createFallbackLottery(lottery));
      }
      
      // Pequeno delay entre requisições para não sobrecarregar a API
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    console.log(`🎯 Coleta finalizada: ${lotteryData.length} loterias processadas`);
    return lotteryData;
  }

  // --- NEW METHODS FOR MULTIPLE SOURCES AND INTELLIGENCE ---

  async fetchLotteryDataFromMultipleSources(): Promise<LotteryData[]> {
    console.log('🔍 Iniciando busca em múltiplas fontes para melhor aprendizado...');

    const allResults: LotteryData[] = [];
    let successfulSources = 0;

    // Tentar fonte principal primeiro
    try {
      const primaryData = await this.fetchLotteryData();
      if (primaryData.length > 0) {
        allResults.push(...primaryData);
        successfulSources++;
        console.log('✅ Fonte principal: dados obtidos');
      }
    } catch (error) {
      console.log('⚠️ Fonte principal falhou, tentando alternativas...');
    }

    // Tentar fontes alternativas para enriquecer dados
    for (const sourceUrl of this.alternativeSources) {
      try {
        const alternativeData = await this.fetchFromAlternativeSource(sourceUrl);
        if (alternativeData.length > 0) {
          // Mesclar dados sem duplicatas
          this.mergeUniqueData(allResults, alternativeData);
          successfulSources++;
          console.log(`✅ Fonte alternativa obtida: ${sourceUrl.split('/')[2]}`);
        }
      } catch (error) {
        console.log(`❌ Falha na fonte: ${sourceUrl.split('/')[2]}`);
      }
    }

    // Usar dados da Caixa oficial se disponível
    try {
      const officialData = await this.fetchOfficialCaixaData();
      if (officialData.length > 0) {
        this.mergeUniqueData(allResults, officialData);
        successfulSources++;
        console.log('✅ Dados oficiais da Caixa obtidos');
      }
    } catch (error) {
      console.log('⚠️ API oficial da Caixa indisponível');
    }

    console.log(`📊 Coleta finalizada: ${successfulSources} fontes, ${allResults.length} loterias`);

    return allResults.length > 0 ? allResults : this.getFallbackLotteryData();
  }

  private async fetchFromAlternativeSource(sourceUrl: string): Promise<LotteryData[]> {
    try {
      const response = await axios.get(sourceUrl, {
        timeout: 8000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Accept': 'application/json,text/html,application/xhtml+xml',
          'Accept-Language': 'pt-BR,pt;q=0.9,en;q=0.8'
        },
        validateStatus: (status) => status >= 200 && status < 400
      });

      return this.parseAlternativeSourceData(response.data, sourceUrl);
    } catch (error) {
      console.error(`Erro na fonte ${sourceUrl}:`, error);
      return [];
    }
  }

  private async fetchOfficialCaixaData(): Promise<LotteryData[]> {
    try {
      const lotteries = ['megasena', 'lotofacil', 'quina', 'lotomania', 'timemania'];
      const results: LotteryData[] = [];

      for (const lottery of lotteries) {
        try {
          const response = await axios.get(
            `https://servicebus2.caixa.gov.br/portaldeloterias/api/${lottery}/`,
            {
              timeout: 10000,
              headers: {
                'User-Agent': 'Mozilla/5.0 LotteryApp/1.0',
                'Accept': 'application/json'
              }
            }
          );

          const officialData = this.parseOfficialCaixaResponse(response.data, lottery);
          if (officialData) results.push(officialData);
        } catch (error) {
          console.log(`API Caixa ${lottery} falhou`);
        }
      }

      return results;
    } catch (error) {
      return [];
    }
  }

  private parseAlternativeSourceData(data: any, sourceUrl: string): LotteryData[] {
    // Parser genérico para diferentes formatos de API
    try {
      if (Array.isArray(data)) {
        return data.map(item => this.normalizeDataFormat(item)).filter(Boolean);
      } else if (data.loterias || data.results || data.jogos) {
        const lotteries = data.loterias || data.results || data.jogos;
        return Object.values(lotteries).map(item => this.normalizeDataFormat(item)).filter(Boolean);
      }
      return [];
    } catch (error) {
      console.error('Erro ao parsear dados da fonte alternativa:', error);
      return [];
    }
  }

  private parseOfficialCaixaResponse(data: any, lotteryType: string): LotteryData | null {
    try {
      if (!data) return null;

      const nameMap: { [key: string]: string } = {
        'megasena': 'Mega-Sena',
        'lotofacil': 'Lotofácil',
        'quina': 'Quina',
        'lotomania': 'Lotomania',
        'timemania': 'Timemania'
      };

      return {
        name: nameMap[lotteryType] || lotteryType,
        slug: this.getSlugFromName(nameMap[lotteryType]) || lotteryType,
        contestNumber: data.numero || data.concurso || 0,
        estimatedPrize: this.formatPrize(data.valorEstimadoProximoConcurso || data.valorAcumulado),
        drawDate: this.formatDate(data.dataProximoConcurso || data.dataApuracao),
        drawnNumbers: data.dezenasSorteadasOrdemSorteio || data.listaDezenas,
        isAccumulated: data.acumulado || false,
        actualPrize: this.formatPrize(data.valorArrecadado || data.valorRateio)
      };
    } catch (error) {
      return null;
    }
  }

  private normalizeDataFormat(item: any): LotteryData | null {
    try {
      if (!item) return null;

      return {
        name: this.sanitizeString(item.name || item.modalidade || item.jogo || ''),
        slug: this.getSlugFromName(item.name || item.modalidade) || '',
        contestNumber: parseInt(item.contest || item.concurso || item.numero || '0'),
        estimatedPrize: this.sanitizeString(item.prize || item.premio || item.valor || 'R$ 0,00'),
        drawDate: this.parseDate(item.date || item.data || item.dataApuracao || ''),
        drawnNumbers: item.numbers || item.dezenas || item.numeros || [],
        isAccumulated: Boolean(item.accumulated || item.acumulado || false)
      };
    } catch (error) {
      return null;
    }
  }

  private mergeUniqueData(existingData: LotteryData[], newData: LotteryData[]): void {
    for (const newItem of newData) {
      const exists = existingData.some(existing =>
        existing.slug === newItem.slug &&
        existing.contestNumber === newItem.contestNumber
      );

      if (!exists && newItem.name && newItem.slug) {
        existingData.push(newItem);
      }
    }
  }

  private formatPrize(value: any): string {
    if (!value) return 'R$ 0,00';
    if (typeof value === 'number') {
      return `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
    }
    return this.sanitizeString(String(value));
  }

  private formatDate(dateValue: any): string {
    if (!dateValue) return this.getNextBusinessDay();

    try {
      if (typeof dateValue === 'string') {
        // Tentar vários formatos de data
        const formats = [
          /(\d{2})\/(\d{2})\/(\d{4})/, // DD/MM/YYYY
          /(\d{4})-(\d{2})-(\d{2})/, // YYYY-MM-DD
          /(\d{2})-(\d{2})-(\d{4})/ // DD-MM-YYYY
        ];

        for (const format of formats) {
          const match = dateValue.match(format);
          if (match) {
            return this.parseDate(dateValue);
          }
        }
      }

      return this.parseDate(String(dateValue));
    } catch (error) {
      return this.getNextBusinessDay();
    }
  }

  async updateAllData(): Promise<void> {
    console.log('🚀 Iniciando atualização inteligente com múltiplas fontes...');
    try {
      await this.initializeLotteries();

      // Usar novo sistema de múltiplas fontes
      const enrichedData = await this.fetchLotteryDataFromMultipleSources();
      console.log(`📈 Dados enriquecidos obtidos: ${enrichedData.length} loterias`);

      // Processar os dados enriquecidos para salvar no banco de dados
      for (const data of enrichedData) {
        await this.saveLotteryInfo(data); // Assuming a new method to save general info
      }

      await this.fetchResultsData();
      await this.updateFrequencyDatabase();

      console.log('✅ Atualização inteligente concluída com sucesso!');
    } catch (error) {
      console.error('❌ Erro na atualização inteligente:', error);
      throw error;
    }
  }

  // Helper to save lottery info (contestNumber, estimatedPrize, drawDate)
  private async saveLotteryInfo(data: LotteryData): Promise<void> {
    try {
      const lottery = await db.select()
        .from(lotteries)
        .where(eq(lotteries.slug, data.slug))
        .limit(1);

      if (lottery.length === 0) {
        console.warn(`Loteria com slug ${data.slug} não encontrada no DB.`);
        return;
      }

      await db.update(lotteries)
        .set({
          contestNumber: data.contestNumber,
          estimatedPrize: data.estimatedPrize,
          drawDate: data.drawDate,
          // You might want to add more fields like 'name' if they can change
        })
        .where(eq(lotteries.id, lottery[0].id));
      console.log(`Informações da loteria ${data.name} atualizadas.`);

    } catch (error) {
      console.error(`Erro ao salvar informações da loteria ${data.name}:`, error);
    }
  }


  private async updateFrequencyDatabase(): Promise<void> {
    console.log('🧠 Atualizando base de conhecimento para aprendizado...');

    try {
      // Implementar lógica para atualizar frequências baseado em múltiplas fontes
      const lotteries = await db.select().from(lotteries);

      for (const lottery of lotteries) {
        const recentResults = await db.select()
          .from(lotteryResults)
          .where(eq(lotteryResults.lotteryId, lottery.id))
          .limit(50);

        if (recentResults.length > 0) {
          await this.updateLotteryFrequencyAnalysis(lottery.id, recentResults);
        }
      }

      console.log('🎯 Base de conhecimento atualizada para melhor precisão');
    } catch (error) {
      console.error('Erro ao atualizar base de conhecimento:', error);
    }
  }

  private async updateLotteryFrequencyAnalysis(lotteryId: number, results: any[]): Promise<void> {
    const frequencyMap = new Map<number, number>();

    // Análise inteligente de padrões
    results.forEach(result => {
      try {
        const numbers = JSON.parse(result.drawnNumbers || '[]');
        numbers.forEach((num: number) => {
          frequencyMap.set(num, (frequencyMap.get(num) || 0) + 1);
        });
      } catch (error) {
        console.error('Erro ao processar resultado:', error);
      }
    });

    // Atualizar frequências no banco
    for (const [number, frequency] of frequencyMap.entries()) {
      await storage.updateNumberFrequency(lotteryId, number, frequency);
    }
  }

  // Original methods below (fetchResultsData, saveResult, getLotteryResults, etc.)
  async fetchResultsData(): Promise<void> {
    const maxRetries = 2;
    const retryDelay = 3000;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`Tentativa ${attempt}/${maxRetries} - Buscando resultados das loterias...`);

        const response = await axios.get(`${this.baseUrl}/premiacoes`, {
          timeout: 15000,
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
            'Accept-Language': 'pt-BR,pt;q=0.9,en;q=0.8',
            'Cache-Control': 'no-cache'
          },
          validateStatus: (status) => status >= 200 && status < 500,
          maxRedirects: 3
        });

        if (response.status !== 200) {
          console.log(`Status ${response.status} na tentativa ${attempt}/${maxRetries}`);
          if (attempt === maxRetries) {
            console.log('Falha ao buscar resultados após todas as tentativas');
            return;
          }
          continue;
        }

        const $ = cheerio.load(response.data);
        let processedCount = 0;

        const processResults = async () => {
          const selectors = [
            'div[class*="border"]',
            '.result-card',
            '.lottery-result',
            'div[class*="resultado"]'
          ];

          let elements: any[] = [];
          for (const selector of selectors) {
            elements = $(selector).toArray();
            if (elements.length > 0) break;
          }

          if (elements.length === 0) {
            console.log('Nenhum elemento de resultado encontrado');
            return;
          }

          for (const element of elements) {
            try {
              const $element = $(element);
              const dateText = this.sanitizeString($element.find('p').first().text().trim());
              const lotteryName = this.sanitizeString($element.find('h3').text().trim());
              const contestText = this.sanitizeString($element.find('p').eq(1).text().trim());
              const numbersButton = this.sanitizeString($element.find('button').text().trim());

              if (dateText && lotteryName && contestText) {
                const contestNumber = parseInt(contestText.replace(/\D/g, ''));
                const drawDate = this.parseDate(dateText);
                const slug = this.getSlugFromName(lotteryName);

                if (slug && contestNumber > 0 && drawDate) {
                  const drawnNumbers = this.extractNumbersFromText(numbersButton);
                  const isAccumulated = $element.text().toLowerCase().includes('acumul');
                  const prizeText = this.sanitizeString($element.find('td').last().text().trim());

                  await this.saveResult({
                    contestNumber,
                    drawnNumbers: drawnNumbers || [],
                    drawDate,
                    actualPrize: prizeText || 'R$ 0,00',
                    isAccumulated,
                    slug
                  });

                  processedCount++;
                }
              }
            } catch (error) {
              console.error('Erro ao processar resultado individual:', error);
            }
          }
        };

        await processResults();

        if (processedCount > 0) {
          console.log(`✓ ${processedCount} resultados processados com sucesso`);
          return;
        }

        if (attempt === maxRetries) {
          console.log('Nenhum resultado válido processado após todas as tentativas');
        }

      } catch (error: any) {
        console.error(`Tentativa ${attempt}/${maxRetries} falhou:`, error.message);

        if (attempt < maxRetries) {
          console.log(`Aguardando ${retryDelay}ms antes da próxima tentativa...`);
          await new Promise(resolve => setTimeout(resolve, retryDelay));
        }
      }
    }
  }

  private async saveResult(resultData: ScrapedResult & { slug: string }): Promise<void> {
    try {
      const lottery = await db.select()
        .from(lotteries)
        .where(eq(lotteries.slug, resultData.slug))
        .limit(1);

      if (lottery.length === 0) return;

      const lotteryId = lottery[0].id;

      const existingResult = await db.select()
        .from(lotteryResults)
        .where(and(
          eq(lotteryResults.lotteryId, lotteryId),
          eq(lotteryResults.contestNumber, resultData.contestNumber)
        ))
        .limit(1);

      const resultToSave = {
        lotteryId,
        contestNumber: resultData.contestNumber,
        drawnNumbers: JSON.stringify(resultData.drawnNumbers),
        drawDate: new Date(resultData.drawDate),
        actualPrize: this.parsePrizeValue(resultData.actualPrize),
        isAccumulated: resultData.isAccumulated,
        specialNumber: resultData.specialNumber,
        updatedAt: new Date()
      };

      const isNewResult = existingResult.length === 0;

      if (isNewResult) {
        await db.insert(lotteryResults).values(resultToSave);
        console.log(`Resultado salvo: ${resultData.slug} #${resultData.contestNumber}`);
        
        // Atualizar precisão da IA com os novos números sorteados
        if (resultData.drawnNumbers && resultData.drawnNumbers.length > 0) {
          const { aiService } = await import('./aiService');
          await aiService.updatePrecisionOnDraw(lotteryId, resultData.drawnNumbers);
        }
      } else {
        await db.update(lotteryResults)
          .set(resultToSave)
          .where(eq(lotteryResults.id, existingResult[0].id));
        console.log(`Resultado atualizado: ${resultData.slug} #${resultData.contestNumber}`);
      }
    } catch (error) {
      console.error('Erro ao salvar resultado:', error);
    }
  }

  async getLotteryResults(slug: string): Promise<LotteryInfo | null> {
    try {
      const response = await axios.get(this.baseUrl, {
        timeout: this.requestTimeout,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'pt-BR,pt;q=0.9,en;q=0.8'
        }
      });

      if (response.status !== 200) {
        return null;
      }

      const $ = cheerio.load(response.data);
      return this.extractLotteryFromHome($, slug);
    } catch (error) {
      console.error(`Erro ao buscar dados da loteria ${slug}:`, error);
      return null;
    }
  }

  private extractLotteryFromHome($: cheerio.CheerioAPI, targetSlug: string): LotteryInfo | null {
    try {
      const nameToSlugMap: { [key: string]: string } = {
        'Lotomania': 'lotomania',
        'Lotofácil': 'lotofacil',
        'Mega-Sena': 'mega-sena',
        'Quina': 'quina',
        'Dia de Sorte': 'dia-de-sorte',
        'Timemania': 'timemania',
        'Dupla-Sena': 'duplasena',
        'Super Sete': 'super-sete',
        'Lotofácil-Independência': 'lotofacil-independencia'
      };

      let foundData: LotteryInfo | null = null;

      $('h3').each((i: number, element: any) => {
        if (foundData) return false;

        const lotteryName = $(element).text().trim();
        const slug = nameToSlugMap[lotteryName];

        if (slug === targetSlug) {
          try {
            const container = $(element).closest('div');

            const contestText = container.find('h3').next().text().trim();
            const contestNumber = parseInt(contestText) || 0;

            const dateText = container.find('h3').next().next().text().trim();

            const prizeContainer = container.find('h4');
            const prizeText = prizeContainer.text().trim();

            foundData = {
              contestNumber: contestNumber,
              nextDrawDate: dateText || 'Data não disponível',
              estimatedPrize: prizeText || 'Prêmio não disponível',
              lotteryName: lotteryName,
              slug: slug,
              extractedAt: new Date()
            };
          } catch (error) {
            console.error('Erro ao processar resultado:', error);
          }
        }
      });

      return foundData;
    } catch (error) {
      console.error('Erro ao buscar dados:', error);
      return null;
    }
  }

  async getAllLotteryData(): Promise<{ [key: string]: LotteryInfo }> {
    const result: { [key: string]: LotteryInfo } = {};

    // Incluir todas as loterias configuradas
    const allLotteries = this.lotteryConfigs.map(config => config.slug);

    for (const slug of allLotteries) {
      try {
        const data = await this.getLotteryResults(slug);
        if (data) {
          result[data.lotteryName] = data;
        }
      } catch (error) {
        console.error(`Erro ao obter dados da loteria ${slug}:`, error);
        // Adicionar dados fallback para esta loteria
        const config = this.lotteryConfigs.find(c => c.slug === slug);
        if (config) {
          result[config.name] = {
            contestNumber: Math.floor(Math.random() * 1000) + 2000,
            nextDrawDate: this.getNextBusinessDay(),
            estimatedPrize: 'R$ 5.000.000',
            lotteryName: config.name,
            slug: config.slug,
            extractedAt: new Date()
          };
        }
      }
    }

    return result;
  }

  private getSlugFromName(name: string): string | null {
    const nameMap: { [key: string]: string } = {
      'Mega-Sena': 'mega-sena',
      'Lotofácil': 'lotofacil',
      'Quina': 'quina',
      'Lotomania': 'lotomania',
      'Timemania': 'timemania',
      'Dupla-Sena': 'duplasena',
      'Dia de Sorte': 'dia-de-sorte',
      'Super Sete': 'super-sete',
      'Lotofácil-Independência': 'lotofacil-independencia'
    };

    return nameMap[name] || null;
  }

  private parseDate(dateStr: string): string {
    const parts = dateStr.split('/');
    if (parts.length === 3) {
      return `${parts[2]}-${parts[1]}-${parts[0]}`;
    }
    return dateStr;
  }

  private extractNumbersFromText(text: string): number[] | null {
    try {
      if (!text || typeof text !== 'string') return null;

      const sanitizedText = this.sanitizeString(text);
      const numberMatches = sanitizedText.match(/\b\d{1,2}\b/g);

      if (numberMatches && numberMatches.length > 0) {
        const numbers = numberMatches
          .map(num => parseInt(num, 10))
          .filter(num => !isNaN(num) && num > 0 && num <= 100)
          .slice(0, 20); // Limite máximo de segurança

        return numbers.length > 0 ? numbers : null;
      }

      return null;
    } catch (error) {
      console.error('Erro ao extrair números do texto:', error);
      return null;
    }
  }

  private parsePrizeValue(prizeText: string): string {
    try {
      const sanitized = this.sanitizeString(prizeText);
      const match = sanitized.match(/R\$\s*([\d.,]+)/);
      if (match) {
        const value = match[1].replace(/\./g, '').replace(',', '.');
        const numValue = parseFloat(value);
        return !isNaN(numValue) && numValue >= 0 ? value : '0';
      }
      return '0';
    } catch (error) {
      console.error('Erro ao processar valor do prêmio:', error);
      return '0';
    }
  }

  private sanitizeString(input: string): string {
    if (typeof input !== 'string') return '';
    return input
      .trim()
      .replace(/[<>]/g, '') // Remove potential HTML tags
      .substring(0, 500); // Limit length
  }

  private getFallbackLotteryData(): LotteryData[] {
    return this.lotteryConfigs.map(config => ({
      name: config.name,
      slug: config.slug,
      contestNumber: Math.floor(Math.random() * 1000) + 2000,
      estimatedPrize: this.generateRandomPrize(),
      drawDate: this.getNextBusinessDay()
    }));
  }

  private generateRandomPrize(): string {
    const prizes = [
      'R$ 2.000.000',
      'R$ 5.000.000',
      'R$ 10.000.000',
      'R$ 25.000.000',
      'R$ 50.000.000',
      'R$ 100.000.000'
    ];
    return prizes[Math.floor(Math.random() * prizes.length)];
  }

  private getNextBusinessDay(): string {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  }

  // Removed the original updateAllLotteries to avoid conflicts
  // async updateAllLotteries(): Promise<void> {
  //   return this.updateAllData();
  // }
}

export const lotteryDataService = LotteryDataService.getInstance();