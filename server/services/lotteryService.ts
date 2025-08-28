import { storage } from '../storage';
import { Lottery, LotteryResult } from '@shared/schema';

export class LotteryService {
  private static instance: LotteryService;
  
  public static getInstance(): LotteryService {
    if (!LotteryService.instance) {
      LotteryService.instance = new LotteryService();
    }
    return LotteryService.instance;
  }

  async initializeLotteries(): Promise<void> {
    const existingLotteries = await storage.getAllLotteries();
    
    if (existingLotteries.length === 0) {
      // Initialize all Brazilian lotteries to match lotteryDataService configuration
      const defaultLotteries = [
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

      // Create lotteries in database
      for (const lottery of defaultLotteries) {
        const createdLottery = await storage.createLottery(lottery);
        // Initialize frequency data for the lottery
        await this.initializeFrequencyData(createdLottery.id, lottery.maxNumber);
      }
      console.log('Default lotteries initialized successfully');
    }
  }

  async getUpcomingDraws(): Promise<{ [key: string]: { prize: string; date: string; contestNumber: number } }> {
    try {
      console.log('🔄 Buscando dados dos próximos sorteios...');
      
      // Tentar múltiplas fontes de dados
      let result: { [key: string]: { prize: string; date: string; contestNumber: number } } = {};
      
      // Primeira tentativa: Web scraping service
      try {
        const { webScrapingService } = await import('./webScrapingService');
        const scrapedData = await webScrapingService.getLotteryInfo();
        
        for (const [name, info] of Object.entries(scrapedData)) {
          const lotteryInfo = info as any;
          if (lotteryInfo && lotteryInfo.prize && lotteryInfo.nextDrawDate) {
            result[name] = {
              prize: lotteryInfo.prize,
              date: lotteryInfo.nextDrawDate,
              contestNumber: lotteryInfo.contestNumber || 1000
            };
          }
        }
        console.log(`✅ Web scraping: ${Object.keys(result).length} loterias obtidas`);
      } catch (error) {
        console.warn('⚠️ Erro no web scraping principal:', error);
      }
      
      // Segunda tentativa: Caixa lottery service como fallback
      if (Object.keys(result).length < 3) {
        try {
          const { caixaLotteryService } = await import('./caixaLotteryService');
          const officialData = await caixaLotteryService.getLatestResults();
          
          for (const [name, info] of Object.entries(officialData)) {
            if (!result[name] && info) {
              result[name] = {
                prize: 'R$ 1.000.000', // Default value since prize data comes from another source
                date: this.getNextDrawDate('Sábado'),
                contestNumber: info.contest || 1000
              };
            }
          }
          console.log(`✅ Caixa API: ${Object.keys(result).length} loterias totais`);
        } catch (error) {
          console.warn('⚠️ Erro na API da Caixa:', error);
        }
      }
      
      // Se ainda não tem dados suficientes, usar dados estáticos
      if (Object.keys(result).length === 0) {
        console.log('📋 Usando dados estáticos como fallback');
        return this.getFallbackData();
      }
      
      // Filtrar loterias especiais baseadas na data
      const filteredResult: { [key: string]: { prize: string; date: string; contestNumber: number } } = {};
      for (const [key, value] of Object.entries(result)) {
        if (key === 'Lotofácil-Independência' && !this.shouldShowLotofacilIndependencia()) {
          continue;
        }
        filteredResult[key] = value;
      }
      
      return filteredResult;
    } catch (error) {
      console.error('Erro ao obter dados atualizados, usando fallback:', error);
      
      // Fallback para dados estáticos em caso de erro
      const now = new Date();
      const currentHour = now.getHours();
      
      // Se passou das 20h, consideramos o próximo dia
      const referenceDate = currentHour >= 20 ? new Date(now.getTime() + 24 * 60 * 60 * 1000) : now;
      
      return this.getFallbackData();
    }
  }

  private getFallbackData(): { [key: string]: { prize: string; date: string; contestNumber: number } } {
    const now = new Date();
    const currentHour = now.getHours();
    
    // Se passou das 20h, consideramos o próximo dia
    const referenceDate = currentHour >= 20 ? new Date(now.getTime() + 24 * 60 * 60 * 1000) : now;
    
    return {
      'Lotofácil': {
        prize: 'R$ 5.500.000',
        date: this.getNextDrawDate('Segunda', referenceDate),
        contestNumber: 3015,
      },
      'Mega-Sena': {
        prize: 'R$ 65.000.000', 
        date: this.getNextDrawDate('Sábado', referenceDate),
        contestNumber: 2785,
      },
      'Quina': {
        prize: 'R$ 3.200.000',
        date: this.getNextDrawDate('Segunda', referenceDate),
        contestNumber: 6585,
      },
      'Lotomania': {
        prize: 'R$ 8.500.000',
        date: this.getNextDrawDate('Terça', referenceDate),
        contestNumber: 2650,
      },
      'Timemania': {
        prize: 'R$ 12.000.000',
        date: this.getNextDrawDate('Quinta', referenceDate),
        contestNumber: 2100,
      },
      'Dupla-Sena': {
        prize: 'R$ 4.200.000',
        date: this.getNextDrawDate('Terça', referenceDate),
        contestNumber: 2750,
      },
      'Dia de Sorte': {
        prize: 'R$ 800.000',
        date: this.getNextDrawDate('Quinta', referenceDate),
        contestNumber: 960,
      },
      'Super Sete': {
        prize: 'R$ 2.300.000',
        date: this.getNextDrawDate('Sexta', referenceDate),
        contestNumber: 540,
      }
    };
  }

  private shouldShowLotofacilIndependencia(): boolean {
    const now = new Date();
    const currentMonth = now.getMonth() + 1; // Janeiro = 1
    const currentDay = now.getDate();
    
    // Mostrar apenas de agosto a setembro (antes do sorteio)
    // Ocultar após 7 de setembro até o próximo ano
    if (currentMonth === 8) return true; // Agosto todo
    if (currentMonth === 9 && currentDay <= 7) return true; // Até 7 de setembro
    return false; // Resto do ano oculto
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

  async getHistoricalData(lotteryId: number, limit = 20): Promise<LotteryResult[]> {
    return await storage.getLatestResults(lotteryId, limit);
  }

  async updateFrequencyAnalysis(lotteryId: number): Promise<void> {
    const results = await storage.getLatestResults(lotteryId, 20);
    const frequencyMap = new Map<number, number>();
    
    // Count frequency of each number
    results.forEach(result => {
      const numbers = JSON.parse(result.drawnNumbers);
      numbers.forEach((num: number) => {
        frequencyMap.set(num, (frequencyMap.get(num) || 0) + 1);
      });
    });

    // Update frequency data in database
    frequencyMap.forEach(async (frequency, number) => {
      await storage.updateNumberFrequency(lotteryId, number, frequency);
    });
  }

  async getNumberAnalysis(lotteryId: number): Promise<{
    hot: number[];
    cold: number[];
    mixed: number[];
  }> {
    const frequencies = await storage.getNumberFrequencies(lotteryId);
    const lottery = await storage.getLotteryById(lotteryId);
    
    if (!lottery) {
      throw new Error('Lottery not found');
    }

    // If no frequency data exists, initialize it
    if (frequencies.length === 0) {
      await this.initializeFrequencyData(lotteryId, lottery.maxNumber);
      return await this.getNumberAnalysis(lotteryId);
    }

    // Sort by frequency
    frequencies.sort((a, b) => b.frequency - a.frequency);
    
    const total = frequencies.length;
    
    if (total < 3) {
      // Not enough data for proper analysis, return all numbers in mixed
      return {
        hot: [],
        cold: [],
        mixed: frequencies.map(f => f.number)
      };
    }
    
    const hotCount = Math.max(1, Math.ceil(total * 0.3)); // Top 30%, at least 1
    const coldCount = Math.max(1, Math.ceil(total * 0.3)); // Bottom 30%, at least 1
    
    const hot = frequencies.slice(0, hotCount).map(f => f.number);
    const cold = frequencies.slice(-coldCount).map(f => f.number);
    const mixed = frequencies
      .slice(hotCount, total - coldCount)
      .map(f => f.number);

    return { hot, cold, mixed };
  }

  async initializeFrequencyData(lotteryId: number, maxNumber: number): Promise<void> {
    // Clear existing data first
    await storage.clearNumberFrequencies(lotteryId);
    
    // Initialize with realistic frequency data
    for (let i = 1; i <= maxNumber; i++) {
      // Gerar frequências mais realistas baseadas em distribuição normal
      const baseFrequency = Math.floor(Math.random() * 20) + 5; // 5-25 frequency
      const variation = Math.floor(Math.random() * 10) - 5; // -5 to +5 variation
      const frequency = Math.max(1, baseFrequency + variation);
      await storage.updateNumberFrequency(lotteryId, i, frequency);
    }
  }
}

export const lotteryService = LotteryService.getInstance();
