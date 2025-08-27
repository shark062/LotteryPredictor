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

      // In a real implementation, you would insert these into the database
      console.log('Default lotteries would be initialized here');
    }
  }

  async getUpcomingDraws(): Promise<{ [key: string]: { prize: string; date: string } }> {
    // In a real implementation, this would fetch from Brazilian lottery APIs
    // For now, return mock data structure
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    return {
      'Lotofácil': {
        prize: 'R$ 5.000.000',
        date: tomorrow.toLocaleDateString('pt-BR'),
      },
      'Mega-Sena': {
        prize: 'R$ 50.000.000', 
        date: this.getNextDrawDate('Sábado'),
      },
      'Quina': {
        prize: 'R$ 2.500.000',
        date: tomorrow.toLocaleDateString('pt-BR'),
      },
    };
  }

  private getNextDrawDate(dayName: string): string {
    const days = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
    const today = new Date();
    const targetDay = days.indexOf(dayName);
    const todayDay = today.getDay();
    
    let daysUntilTarget = targetDay - todayDay;
    if (daysUntilTarget <= 0) {
      daysUntilTarget += 7;
    }
    
    const targetDate = new Date(today);
    targetDate.setDate(today.getDate() + daysUntilTarget);
    
    return targetDate.toLocaleDateString('pt-BR');
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

    // Sort by frequency
    frequencies.sort((a, b) => b.frequency - a.frequency);
    
    const total = frequencies.length;
    const hotCount = Math.ceil(total * 0.3); // Top 30%
    const coldCount = Math.ceil(total * 0.3); // Bottom 30%
    
    const hot = frequencies.slice(0, hotCount).map(f => f.number);
    const cold = frequencies.slice(-coldCount).map(f => f.number);
    const mixed = frequencies
      .slice(hotCount, -coldCount)
      .map(f => f.number);

    return { hot, cold, mixed };
  }
}

export const lotteryService = LotteryService.getInstance();
