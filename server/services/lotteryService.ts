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
      // Initialize default Brazilian lotteries
      const defaultLotteries = [
        {
          name: 'Lotofácil',
          maxNumber: 25,
          minNumbers: 15,
          maxNumbers: 20,
          drawDays: JSON.stringify(['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado']),
        },
        {
          name: 'Mega-Sena',
          maxNumber: 60,
          minNumbers: 6,
          maxNumbers: 15,
          drawDays: JSON.stringify(['Quarta', 'Sábado']),
        },
        {
          name: 'Quina',
          maxNumber: 80,
          minNumbers: 5,
          maxNumbers: 15,
          drawDays: JSON.stringify(['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado']),
        },
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
    };
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
    for (const [number, frequency] of frequencyMap) {
      await storage.updateNumberFrequency(lotteryId, number, frequency);
    }
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

  private async initializeFrequencyData(lotteryId: number, maxNumber: number): Promise<void> {
    // Initialize with random frequency data for demonstration
    for (let i = 1; i <= maxNumber; i++) {
      const frequency = Math.floor(Math.random() * 15) + 1; // 1-15 frequency
      await storage.updateNumberFrequency(lotteryId, i, frequency);
    }
  }
}

export const lotteryService = LotteryService.getInstance();
