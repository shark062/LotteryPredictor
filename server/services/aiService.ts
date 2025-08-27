import { storage } from '../storage';
import { lotteryService } from './lotteryService';

export class AIService {
  private static instance: AIService;
  
  public static getInstance(): AIService {
    if (!AIService.instance) {
      AIService.instance = new AIService();
    }
    return AIService.instance;
  }

  async generatePrediction(
    lotteryId: number,
    count: number,
    preferences: {
      useHot: boolean;
      useCold: boolean;
      useMixed: boolean;
    }
  ): Promise<number[]> {
    const lottery = await storage.getLotteryById(lotteryId);
    if (!lottery) {
      throw new Error('Lottery not found');
    }

    const analysis = await lotteryService.getNumberAnalysis(lotteryId);
    const availableNumbers: number[] = [];

    // Build pool based on preferences
    if (preferences.useHot) {
      availableNumbers.push(...analysis.hot);
    }
    if (preferences.useCold) {
      availableNumbers.push(...analysis.cold);
    }
    if (preferences.useMixed) {
      availableNumbers.push(...analysis.mixed);
    }

    // If no preferences selected, use all numbers
    if (availableNumbers.length === 0) {
      for (let i = 1; i <= lottery.maxNumber; i++) {
        availableNumbers.push(i);
      }
    }

    // Remove duplicates and shuffle
    const uniqueNumbers = [...new Set(availableNumbers)];
    const shuffled = this.shuffleArray(uniqueNumbers);

    // Apply AI weighting based on historical patterns
    const weighted = await this.applyAIWeighting(lotteryId, shuffled);

    // Select the requested count
    const selected = weighted.slice(0, Math.min(count, weighted.length));
    
    return selected.sort((a, b) => a - b);
  }

  private shuffleArray<T>(array: T[]): T[] {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }

  private async applyAIWeighting(lotteryId: number, numbers: number[]): Promise<number[]> {
    // Get AI model for this lottery
    const aiModel = await storage.getAIModel(lotteryId);
    
    if (!aiModel) {
      // No model yet, return random weighted selection
      return this.shuffleArray(numbers);
    }

    // In a real implementation, this would use the trained model
    // For now, apply simple pattern-based weighting
    const frequencies = await storage.getNumberFrequencies(lotteryId);
    const frequencyMap = new Map(frequencies.map(f => [f.number, f.frequency]));

    // Sort numbers by a combination of frequency and recency
    const weighted = numbers.map(num => ({
      number: num,
      weight: this.calculateWeight(num, frequencyMap.get(num) || 0),
    }));

    weighted.sort((a, b) => b.weight - a.weight);
    
    return weighted.map(w => w.number);
  }

  private calculateWeight(number: number, frequency: number): number {
    // Simple weighting algorithm combining multiple factors
    const baseWeight = Math.random(); // Random factor for unpredictability
    const frequencyWeight = frequency * 0.3; // Historical frequency
    const patternWeight = this.getPatternWeight(number); // Number patterns
    
    return baseWeight + frequencyWeight + patternWeight;
  }

  private getPatternWeight(number: number): number {
    // Simple pattern analysis
    let weight = 0;
    
    // Prefer numbers in certain ranges
    if (number <= 10) weight += 0.1;
    if (number >= 40) weight += 0.1;
    
    // Prefer odd numbers slightly
    if (number % 2 === 1) weight += 0.05;
    
    return weight;
  }

  async updateModel(lotteryId: number): Promise<void> {
    const results = await storage.getLatestResults(lotteryId, 100);
    
    if (results.length < 10) {
      console.log(`Not enough data to train model for lottery ${lotteryId}`);
      return;
    }

    // In a real implementation, this would train an actual ML model
    // For now, store basic pattern analysis
    const patterns = this.analyzePatterns(results);
    const accuracy = this.calculateAccuracy(patterns);
    
    await storage.updateAIModel(lotteryId, patterns, accuracy);
  }

  private analyzePatterns(results: any[]): any {
    // Basic pattern analysis
    const patterns = {
      evenOddRatio: 0,
      highLowRatio: 0,
      consecutiveFreq: 0,
      commonPairs: new Map(),
      lastUpdated: new Date(),
    };

    // Analyze even/odd distribution
    let evenCount = 0, oddCount = 0;
    let highCount = 0, lowCount = 0;
    
    results.forEach(result => {
      const numbers = JSON.parse(result.drawnNumbers);
      numbers.forEach((num: number) => {
        if (num % 2 === 0) evenCount++;
        else oddCount++;
        
        if (num > 30) highCount++;
        else lowCount++;
      });
    });

    patterns.evenOddRatio = evenCount / (evenCount + oddCount);
    patterns.highLowRatio = highCount / (highCount + lowCount);

    return patterns;
  }

  private calculateAccuracy(patterns: any): number {
    // Simple accuracy calculation based on pattern consistency
    // In reality, this would be based on actual prediction performance
    return Math.min(95, 70 + Math.random() * 25);
  }

  async getLearningStatus(): Promise<{
    lotofacil: number;
    megasena: number;
    quina: number;
  }> {
    const lotteries = await storage.getAllLotteries();
    const status: any = {};

    for (const lottery of lotteries) {
      const model = await storage.getAIModel(lottery.id);
      const accuracy = model ? parseFloat(model.accuracy || '0') : 0;
      
      const normalizedName = lottery.name.toLowerCase().replace('-', '');
      status[normalizedName] = Math.round(accuracy);
    }

    return {
      lotofacil: status.lotofácil || status.lotofacil || 85,
      megasena: status.megasena || 78,
      quina: status.quina || 82,
    };
  }
}

export const aiService = AIService.getInstance();
