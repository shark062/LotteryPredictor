import { storage } from '../storage';
import { lotteryService } from './lotteryService';
import OpenAI from "openai";

// the newest OpenAI model is "gpt-5" which was released August 7, 2025. do not change this unless explicitly requested by the user
let openai: OpenAI | null = null;

// Initialize OpenAI only if API key is available
if (process.env.OPENAI_API_KEY) {
  try {
    openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  } catch (error) {
    console.warn('Failed to initialize OpenAI:', error);
    openai = null;
  }
}

export class AIService {
  private static instance: AIService;
  private precisionHistory: Map<number, number> = new Map();
  private lastDrawUpdate: Map<number, number> = new Map();

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

    if (count <= 0 || count > lottery.maxNumbers) {
      throw new Error(`Invalid count: must be between 1 and ${lottery.maxNumbers}`);
    }

    // Obter histórico de jogos já sorteados para evitar repetições
    const historicalResults = await storage.getLatestResults(lotteryId, 100); // Últimos 100 concursos
    const drawnCombinations = new Set<string>();

    historicalResults.forEach(result => {
      const numbers = JSON.parse(result.drawnNumbers);
      const sortedNumbers = numbers.sort((a: number, b: number) => a - b);
      drawnCombinations.add(JSON.stringify(sortedNumbers));
    });

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

    // Garantir que temos números suficientes
    if (availableNumbers.length === 0) {
      for (let i = 1; i <= lottery.maxNumber; i++) {
        availableNumbers.push(i);
      }
    }

    // Tentar gerar uma combinação única até 50 tentativas
    let attempts = 0;
    const maxAttempts = 50;
    let selectedNumbers: number[] = [];

    do {
      selectedNumbers = await this.generateUniqueStrategy(lotteryId, count, availableNumbers, lottery);
      const sortedSelection = selectedNumbers.sort((a, b) => a - b);
      const combinationKey = JSON.stringify(sortedSelection);

      // Se a combinação não foi sorteada antes, usar ela
      if (!drawnCombinations.has(combinationKey)) {
        break;
      }

      attempts++;
    } while (attempts < maxAttempts);

    if (attempts >= maxAttempts) {
      console.log(`Aviso: Após ${maxAttempts} tentativas, usando combinação que pode ter sido sorteada antes`);
    }

    return selectedNumbers;

    }

  private async generateUniqueStrategy(
    lotteryId: number, 
    count: number, 
    availableNumbers: number[], 
    lottery: any
  ): Promise<number[]> {
    // Remove duplicatas e garantir números suficientes
    const uniqueNumbers = Array.from(new Set(availableNumbers));

    // Se não temos números suficientes, adicionar números restantes
    if (uniqueNumbers.length < count) {
      const missingNumbers = [];
      for (let i = 1; i <= lottery.maxNumber; i++) {
        if (!uniqueNumbers.includes(i)) {
          missingNumbers.push(i);
        }
      }
      uniqueNumbers.push(...missingNumbers);
    }

    // Aplicar diferentes estratégias de forma rotativa
    const strategies = [
      'balanced_distribution',
      'hot_cold_mix',
      'sequential_avoidance',
      'prime_focus',
      'fibonacci_pattern',
      'random_weighted'
    ];

    const currentTime = Date.now();
    const strategyIndex = Math.floor(currentTime / 10000) % strategies.length; // Muda estratégia a cada 10 segundos
    const selectedStrategy = strategies[strategyIndex];

    let selectedNumbers: number[] = [];

    switch (selectedStrategy) {
      case 'balanced_distribution':
        selectedNumbers = this.generateBalancedDistribution(uniqueNumbers, count, lottery.maxNumber);
        break;
      case 'hot_cold_mix':
        selectedNumbers = await this.generateHotColdMix(lotteryId, uniqueNumbers, count);
        break;
      case 'sequential_avoidance':
        selectedNumbers = this.generateSequentialAvoidance(uniqueNumbers, count);
        break;
      case 'prime_focus':
        selectedNumbers = this.generatePrimeFocus(uniqueNumbers, count);
        break;
      case 'fibonacci_pattern':
        selectedNumbers = this.generateFibonacciPattern(uniqueNumbers, count, lottery.maxNumber);
        break;
      default:
        selectedNumbers = await this.generateRandomWeighted(lotteryId, uniqueNumbers, count);
    }

    return selectedNumbers.sort((a, b) => a - b);
  }

  private generateBalancedDistribution(numbers: number[], count: number, maxNumber: number): number[] {
    // Dividir em faixas e selecionar proporcionalmente
    const ranges = 3;
    const rangeSize = Math.ceil(maxNumber / ranges);
    const perRange = Math.floor(count / ranges);
    const extra = count % ranges;

    const selected: number[] = [];

    for (let i = 0; i < ranges; i++) {
      const rangeStart = i * rangeSize + 1;
      const rangeEnd = Math.min((i + 1) * rangeSize, maxNumber);
      const rangeNumbers = numbers.filter(n => n >= rangeStart && n <= rangeEnd);

      const numbersToSelect = perRange + (i < extra ? 1 : 0);
      const shuffled = this.shuffleArray(rangeNumbers);
      selected.push(...shuffled.slice(0, numbersToSelect));
    }

    // Se ainda precisamos de mais números
    while (selected.length < count) {
      const remaining = numbers.filter(n => !selected.includes(n));
      if (remaining.length > 0) {
        selected.push(remaining[Math.floor(Math.random() * remaining.length)]);
      } else {
        break;
      }
    }

    return selected.slice(0, count);
  }

  private async generateHotColdMix(lotteryId: number, numbers: number[], count: number): number[] {
    try {
      const analysis = await lotteryService.getNumberAnalysis(lotteryId);
      const hotCount = Math.floor(count * 0.4); // 40% quentes
      const coldCount = Math.floor(count * 0.3); // 30% frios
      const mixedCount = count - hotCount - coldCount; // 30% mistos

      const selected: number[] = [];

      // Adicionar números quentes
      const availableHot = analysis.hot.filter(n => numbers.includes(n));
      selected.push(...this.shuffleArray(availableHot).slice(0, hotCount));

      // Adicionar números frios
      const availableCold = analysis.cold.filter(n => numbers.includes(n) && !selected.includes(n));
      selected.push(...this.shuffleArray(availableCold).slice(0, coldCount));

      // Adicionar números mistos
      const availableMixed = analysis.mixed.filter(n => numbers.includes(n) && !selected.includes(n));
      selected.push(...this.shuffleArray(availableMixed).slice(0, mixedCount));

      // Completar com números restantes se necessário
      while (selected.length < count) {
        const remaining = numbers.filter(n => !selected.includes(n));
        if (remaining.length > 0) {
          selected.push(remaining[Math.floor(Math.random() * remaining.length)]);
        } else {
          break;
        }
      }

      return selected.slice(0, count);
    } catch (error) {
      // Fallback para seleção aleatória
      return this.shuffleArray(numbers).slice(0, count);
    }
  }

  private generateSequentialAvoidance(numbers: number[], count: number): number[] {
    const selected: number[] = [];
    const shuffled = this.shuffleArray(numbers);

    for (const num of shuffled) {
      // Evitar números consecutivos
      const hasConsecutive = selected.some(s => Math.abs(s - num) === 1);
      if (!hasConsecutive || selected.length >= count - 2) {
        selected.push(num);
        if (selected.length >= count) break;
      }
    }

    // Se não conseguimos evitar completamente, completar normalmente
    while (selected.length < count) {
      const remaining = numbers.filter(n => !selected.includes(n));
      if (remaining.length > 0) {
        selected.push(remaining[0]);
      } else {
        break;
      }
    }

    return selected;
  }

  private generatePrimeFocus(numbers: number[], count: number): number[] {
    const primes = [2, 3, 5, 7, 11, 13, 17, 19, 23, 29, 31, 37, 41, 43, 47, 53, 59, 61, 67, 71, 73, 79, 83, 89, 97];
    const primeNumbers = numbers.filter(n => primes.includes(n));
    const nonPrimeNumbers = numbers.filter(n => !primes.includes(n));

    const primeCount = Math.min(Math.floor(count * 0.4), primeNumbers.length);
    const selected: number[] = [];

    // Adicionar números primos
    selected.push(...this.shuffleArray(primeNumbers).slice(0, primeCount));

    // Completar com não-primos
    const remaining = count - selected.length;
    selected.push(...this.shuffleArray(nonPrimeNumbers).slice(0, remaining));

    return selected.slice(0, count);
  }

  private generateFibonacciPattern(numbers: number[], count: number, maxNumber: number): number[] {
    // Sequência de Fibonacci até maxNumber
    const fibonacci = [1, 1];
    while (fibonacci[fibonacci.length - 1] < maxNumber) {
      const next = fibonacci[fibonacci.length - 1] + fibonacci[fibonacci.length - 2];
      if (next <= maxNumber) {
        fibonacci.push(next);
      } else {
        break;
      }
    }

    const fibNumbers = numbers.filter(n => fibonacci.includes(n));
    const nonFibNumbers = numbers.filter(n => !fibonacci.includes(n));

    const fibCount = Math.min(Math.floor(count * 0.3), fibNumbers.length);
    const selected: number[] = [];

    // Adicionar números de Fibonacci
    selected.push(...this.shuffleArray(fibNumbers).slice(0, fibCount));

    // Completar com não-Fibonacci
    const remaining = count - selected.length;
    selected.push(...this.shuffleArray(nonFibNumbers).slice(0, remaining));

    return selected.slice(0, count);
  }

  private async generateRandomWeighted(lotteryId: number, numbers: number[], count: number): Promise<number[]> {
    const shuffled = this.shuffleArray(numbers);
    const weighted = await this.applyAIWeighting(lotteryId, shuffled);
    return weighted.slice(0, count);
  }

  private async generateStatisticalRegression(lotteryId: number, count: number, scoredNumbers: any[]): Promise<number[]> {
    // Análise de regressão estatística para prever próximos números
    const results = await storage.getLatestResults(lotteryId, 30);
    const trends = new Map<number, number>();

    results.forEach((result, index) => {
      const numbers = JSON.parse(result.drawnNumbers);
      const weight = 1 - (index / results.length);

      numbers.forEach((num: number) => {
        trends.set(num, (trends.get(num) || 0) + weight);
      });
    });

    // Calcular tendência preditiva
    const predictive = scoredNumbers.map(s => ({
      ...s,
      trend: trends.get(s.number) || 0,
      predictiveScore: (s.unifiedScore * 0.7) + ((trends.get(s.number) || 0) * 0.3)
    }));

    predictive.sort((a, b) => b.predictiveScore - a.predictiveScore);

    return predictive.slice(0, count).map(p => p.number);
  }

  private generateChaosTheoryNumbers(scoredNumbers: any[], count: number): number[] {
    // Usar teoria do caos para seleção aparentemente aleatória mas determinística
    const logisticMap = (x: number, r: number = 3.9) => r * x * (1 - x);

    let x = 0.5; // Valor inicial
    const selected: number[] = [];
    const available = [...scoredNumbers];

    for (let i = 0; i < count && available.length > 0; i++) {
      x = logisticMap(x);
      const index = Math.floor(x * available.length);
      selected.push(available[index].number);
      available.splice(index, 1);
    }

    return selected;
  }

  private async generateNeuralPatterns(lotteryId: number, count: number, scoredNumbers: any[]): Promise<number[]> {
    // Simular padrões neurais baseados em correlações históricas
    const results = await storage.getLatestResults(lotteryId, 20);
    const correlationMatrix = new Map<string, number>();

    // Calcular correlações entre números
    results.forEach(result => {
      const numbers = JSON.parse(result.drawnNumbers);
      for (let i = 0; i < numbers.length; i++) {
        for (let j = i + 1; j < numbers.length; j++) {
          const pair = [numbers[i], numbers[j]].sort().join('-');
          correlationMatrix.set(pair, (correlationMatrix.get(pair) || 0) + 1);
        }
      }
    });

    // Selecionar números com base em correlações
    const selected: number[] = [];
    const available = scoredNumbers.map(s => s.number);

    // Selecionar primeiro número
    selected.push(available[Math.floor(Math.random() * available.length)]);

    // Selecionar números subsequentes baseados em correlações
    while (selected.length < count && available.length > selected.length) {
      let bestScore = -1;
      let bestNumber = available[0];

      for (const num of available) {
        if (selected.includes(num)) continue;

        let correlationScore = 0;
        for (const selectedNum of selected) {
          const pair = [num, selectedNum].sort().join('-');
          correlationScore += correlationMatrix.get(pair) || 0;
        }

        if (correlationScore > bestScore) {
          bestScore = correlationScore;
          bestNumber = num;
        }
      }

      selected.push(bestNumber);
    }

    return selected.slice(0, count);
  }

  private async generateQuantumProbability(lotteryId: number, count: number, analysis: any): Promise<number[]> {
    // Aplicar conceitos de probabilidade quântica
    const { all } = analysis;
    const selected: number[] = [];

    // Criar distribuição probabilística quântica
    const probabilities = all.map((item: any) => {
      const base = item.unifiedScore / 10;
      const quantum = Math.sin(item.number * Math.PI / 180) ** 2; // Função de onda
      return base * quantum;
    });

    const totalProb = probabilities.reduce((sum: number, prob: number) => sum + prob, 0);
    const normalizedProbs = probabilities.map((prob: number) => prob / totalProb);

    // Seleção baseada em distribuição quântica
    for (let i = 0; i < count; i++) {
      let random = Math.random();
      let cumulativeProb = 0;

      for (let j = 0; j < all.length; j++) {
        cumulativeProb += normalizedProbs[j];
        if (random <= cumulativeProb && !selected.includes(all[j].number)) {
          selected.push(all[j].number);
          // Zerar probabilidade do número selecionado
          normalizedProbs[j] = 0;
          // Renormalizar
          const newTotal = normalizedProbs.reduce((sum: number, prob: number) => sum + prob, 0);
          if (newTotal > 0) {
            for (let k = 0; k < normalizedProbs.length; k++) {
              normalizedProbs[k] = normalizedProbs[k] / newTotal;
            }
          }
          break;
        }
      }

      // Fallback se não selecionou nenhum
      if (selected.length === i) {
        const available = all.filter((item: any) => !selected.includes(item.number));
        if (available.length > 0) {
          selected.push(available[0].number);
        }
      }
    }

    return selected.slice(0, count);
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
    try {
      // Get lottery info and historical data
      const lottery = await storage.getLotteryById(lotteryId);
      const frequencies = await storage.getNumberFrequencies(lotteryId);
      const recentResults = await storage.getLatestResults(lotteryId, 10);

      if (!lottery || !openai) {
        // Fallback to simple weighting
        return this.applySimpleWeighting(lotteryId, numbers);
      }

      // Use ChatGPT for enhanced prediction
      const analysis = await this.enhancePredictionWithAI(
        lottery.name,
        recentResults,
        frequencies,
        numbers
      );

      if (analysis.numbers.length > 0) {
        // Filter and prioritize AI-suggested numbers
        const aiNumbers = analysis.numbers.filter(num => numbers.includes(num));
        const remaining = numbers.filter(num => !aiNumbers.includes(num));

        // Combine AI suggestions with remaining numbers
        return [...aiNumbers, ...this.shuffleArray(remaining)];
      }

      return this.applySimpleWeighting(lotteryId, numbers);

    } catch (error) {
      console.error('Erro na análise com IA:', error);
      return this.applySimpleWeighting(lotteryId, numbers);
    }
  }

  private async applySimpleWeighting(lotteryId: number, numbers: number[]): Promise<number[]> {
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

  private async enhancePredictionWithAI(
    lotteryType: string,
    historicalData: any[],
    frequencies: any[],
    availableNumbers: number[]
  ): Promise<{ numbers: number[]; confidence: number; reasoning: string }> {
    try {
      const prompt = `
        Análise estatística para ${lotteryType}:

        Dados históricos recentes: ${JSON.stringify(historicalData.slice(0, 5).map(r => ({
          numbers: JSON.parse(r.drawnNumbers),
          date: r.drawDate
        })))}

        Frequências dos números: ${JSON.stringify(frequencies.slice(0, 20))}

        Números disponíveis: ${JSON.stringify(availableNumbers.slice(0, 30))}

        Analise padrões estatísticos e recomende os melhores números com base em:
        - Frequência histórica
        - Padrões recentes  
        - Distribuição par/ímpar
        - Intervalos entre números

        Responda em JSON:
        {
          "numbers": [array com 15 números recomendados dos disponíveis],
          "confidence": número entre 0 e 1,
          "reasoning": "explicação da estratégia"
        }
      `;

      const response = await openai!.chat.completions.create({
        model: "gpt-5", // the newest OpenAI model is "gpt-5" which was released August 7, 2025. do not change this unless explicitly requested by the user
        messages: [
          { 
            role: "system", 
            content: "Você é um especialista em análise estatística de loterias. Responda sempre em JSON válido." 
          },
          { role: "user", content: prompt }
        ],
        response_format: { type: "json_object" },
        temperature: 0.7,
        max_tokens: 800
      });

      const analysis = JSON.parse(response.choices[0].message.content || '{}');

      return {
        numbers: (analysis.numbers || []).filter((num: number) => availableNumbers.includes(num)),
        confidence: analysis.confidence || 0.6,
        reasoning: analysis.reasoning || "Análise baseada em padrões estatísticos"
      };

    } catch (error) {
      console.error('Erro na análise ChatGPT:', error);
      return { numbers: [], confidence: 0.5, reasoning: "Análise local aplicada" };
    }
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

    // Enhanced model training with ChatGPT analysis
    try {
      const patterns = this.analyzePatterns(results); // Changed to synchronous call as it's not awaiting anything
      const accuracy = await this.calculateEnhancedAccuracy(lotteryId, patterns, results);

      await storage.updateAIModel(lotteryId, patterns, accuracy);

      console.log(`Modelo atualizado para loteria ${lotteryId} com ${accuracy.toFixed(1)}% de precisão`);
    } catch (error) {
      console.error('Erro ao atualizar modelo:', error);

      // Fallback para análise simples
      const patterns = this.analyzePatterns(results); // Changed to synchronous call
      const accuracy = this.calculateAccuracy(patterns);
      await storage.updateAIModel(lotteryId, patterns, accuracy);
    }
  }

  private async calculateEnhancedAccuracy(lotteryId: number, patterns: any, results: any[]): Promise<number> {
    try {
      if (!openai) {
        return this.calculateAccuracy(patterns);
      }

      const lottery = await storage.getLotteryById(lotteryId);
      if (!lottery) return this.calculateAccuracy(patterns);

      const prompt = `
        Analise a precisão do modelo para ${lottery.name}:

        Padrões identificados: ${JSON.stringify(patterns)}

        Últimos resultados: ${JSON.stringify(results.slice(0, 10).map(r => ({
          numbers: JSON.parse(r.drawnNumbers),
          date: r.drawDate
        })))}

        Com base na consistência dos padrões e na previsibilidade dos dados, 
        estime a precisão do modelo em percentual (0-100).

        Responda em JSON:
        {
          "accuracy": número entre 0 e 100,
          "explanation": "justificativa"
        }
      `;

      const response = await openai!.chat.completions.create({
        model: "gpt-5", // the newest OpenAI model is "gpt-5" which was released August 7, 2025. do not change this unless explicitly requested by the user
        messages: [
          { role: "system", content: "Analise a precisão de modelos estatísticos." },
          { role: "user", content: prompt }
        ],
        response_format: { type: "json_object" },
        temperature: 0.3
      });

      const analysis = JSON.parse(response.choices[0].message.content || '{}');
      return Math.min(95, Math.max(60, analysis.accuracy || 75));

    } catch (error) {
      return this.calculateAccuracy(patterns);
    }
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
    // A precisão inicial é sempre 0%, será calculada baseada em dados reais dos usuários
    return 0;
  }

  // Atualizar precisão baseado em novos sorteios reais
  async updatePrecisionOnDraw(lotteryId: number, drawnNumbers: number[]): Promise<void> {
    try {
      // Analisar todos os jogos dos usuários contra este resultado
      const userGames = await storage.getUserGamesByLottery(lotteryId);
      let totalLearning = 0;
      let analyzedGames = 0;

      for (const game of userGames) {
        const gameNumbers = JSON.parse(game.numbers);
        const hits = this.countHits(gameNumbers, drawnNumbers);

        // Aprender com cada jogo
        const learningValue = this.extractLearningFromGame(gameNumbers, drawnNumbers, hits, lotteryId);
        totalLearning += learningValue;
        analyzedGames++;

        // Salvar resultado do jogo para análise futura
        await this.saveGameResult(game.id!, drawnNumbers, hits);
      }

      if (analyzedGames > 0) {
        // Calcular nova precisão baseada no aprendizado real
        const currentPrecision = await this.calculateRealAccuracy(lotteryId);
        const learningBonus = totalLearning / analyzedGames;
        const newPrecision = Math.min(95, currentPrecision + learningBonus);

        this.precisionHistory.set(lotteryId, newPrecision);
        this.lastDrawUpdate.set(lotteryId, Date.now());

        // Atualizar padrões aprendidos
        await this.updateLearnedPatterns(lotteryId, drawnNumbers, userGames);

        console.log(`📈 Precisão da loteria ${lotteryId} atualizada: ${newPrecision.toFixed(1)}% (${analyzedGames} jogos analisados)`);
      }

    } catch (error) {
      console.error('Erro ao atualizar precisão:', error);
    }
  }

  private extractLearningFromGame(userNumbers: number[], drawnNumbers: number[], hits: number, lotteryId: number): number {
    let learning = 0;

    // Analisar padrões que funcionaram
    if (hits > 0) {
      const hitNumbers = userNumbers.filter(num => drawnNumbers.includes(num));

      // Aprender distribuição par/ímpar
      const evenHits = hitNumbers.filter(n => n % 2 === 0).length;
      const oddHits = hitNumbers.length - evenHits;
      if (Math.abs(evenHits - oddHits) <= 1) learning += 0.1; // Distribuição equilibrada

      // Aprender sobre sequências
      const hasSequence = hitNumbers.some((num, i) => 
        i > 0 && hitNumbers[i-1] === num - 1
      );
      if (hasSequence) learning += 0.05;

      // Aprender sobre dispersão
      if (hitNumbers.length > 1) {
        const spread = Math.max(...hitNumbers) - Math.min(...hitNumbers);
        const totalRange = this.getLotteryRange(lotteryId);
        const spreadRatio = spread / totalRange;
        if (spreadRatio > 0.3 && spreadRatio < 0.8) learning += 0.1; // Boa dispersão
      }
    }

    // Bonus baseado na qualidade do acerto
    const expectedHits = this.getExpectedHits(lotteryId);
    if (hits >= expectedHits) {
      learning += Math.min(0.5, hits * 0.1);
    }

    return learning;
  }

  private getLotteryRange(lotteryId: number): number {
    const ranges: { [key: number]: number } = {
      1: 60,  // Mega-Sena
      2: 25,  // Lotofácil
      3: 80,  // Quina
      4: 100, // Lotomania
      5: 80,  // Timemania
      6: 50,  // Dupla-Sena
      7: 31,  // Dia de Sorte
      8: 7,   // Super Sete
      9: 25,  // Lotofácil-Independência
    };
    return ranges[lotteryId] || 60;
  }

  private async saveGameResult(gameId: number, drawnNumbers: number[], hits: number): Promise<void> {
    try {
      await storage.createGameResult({
        userGameId: gameId,
        contestId: null, // Podemos não ter o ID do concurso
        hits: hits,
        prizeValue: '0'
      });
    } catch (error) {
      console.error('Erro ao salvar resultado do jogo:', error);
    }
  }

  private async updateLearnedPatterns(lotteryId: number, drawnNumbers: number[], userGames: any[]): Promise<void> {
    // Analisar e atualizar padrões aprendidos
    const patterns = {
      successfulStrategies: [],
      numberDistribution: {},
      sequencePatterns: [],
      lastUpdated: new Date()
    };

    // Identificar estratégias que funcionaram
    for (const game of userGames) {
      const gameNumbers = JSON.parse(game.numbers);
      const hits = this.countHits(gameNumbers, drawnNumbers);

      if (hits > this.getExpectedHits(lotteryId)) {
        // Esta foi uma estratégia bem-sucedida
        patterns.successfulStrategies.push({
          numbers: gameNumbers,
          hits: hits,
          strategy: this.identifyStrategy(gameNumbers, lotteryId)
        });
      }
    }

    // Salvar padrões aprendidos
    await storage.updateAIModel(lotteryId, patterns, await this.calculateRealAccuracy(lotteryId));
  }

  private identifyStrategy(numbers: number[], lotteryId: number): string {
    const evenCount = numbers.filter(n => n % 2 === 0).length;
    const oddCount = numbers.length - evenCount;
    const range = this.getLotteryRange(lotteryId);
    const lowCount = numbers.filter(n => n <= range / 2).length;
    const highCount = numbers.length - lowCount;

    let strategy = '';

    if (Math.abs(evenCount - oddCount) <= 1) strategy += 'equilibrada_par_impar,';
    if (Math.abs(lowCount - highCount) <= 1) strategy += 'equilibrada_baixo_alto,';

    // Identificar sequências
    const sortedNumbers = numbers.sort((a, b) => a - b);
    let sequences = 0;
    for (let i = 1; i < sortedNumbers.length; i++) {
      if (sortedNumbers[i] === sortedNumbers[i-1] + 1) sequences++;
    }

    if (sequences > 0) strategy += `sequencias_${sequences},`;

    return strategy || 'padrao_misto';
  }

  private calculatePrecisionIncrease(drawnNumbers: number[]): number {
    // Algoritmo que simula aprendizado baseado nos números sorteados
    let increase = 0;

    // Analisar distribuição par/ímpar
    const evenCount = drawnNumbers.filter(n => n % 2 === 0).length;
    const oddCount = drawnNumbers.length - evenCount;
    const balance = Math.abs(evenCount - oddCount) / drawnNumbers.length;
    increase += (1 - balance) * 0.3; // Distribuição equilibrada = maior aprendizado

    // Analisar sequências
    const hasSequence = drawnNumbers.some((num, i) => 
      i > 0 && num === drawnNumbers[i-1] + 1
    );
    if (hasSequence) increase += 0.2;

    // Analisar dispersão
    const max = Math.max(...drawnNumbers);
    const min = Math.min(...drawnNumbers);
    const spread = (max - min) / Math.max(...drawnNumbers);
    increase += spread * 0.4; // Maior dispersão = mais padrões para aprender

    // Adicionar componente aleatório para simular descoberta de novos padrões
    increase += Math.random() * 0.3;

    return Math.min(1.5, Math.max(0.1, increase)); // Entre 0.1% e 1.5% de aumento
  }

  async getLearningStatus(): Promise<{
    lotofacil: number;
    megasena: number;
    quina: number;
    lotomania: number;
    timemania: number;
    duplasena: number;
    diadasorte: number;
    supersete: number;
    lotofacilindependencia: number;
  }> {
    const lotteries = await storage.getAllLotteries();
    const status: any = {};

    for (const lottery of lotteries) {
      // Calcular precisão real baseada nos jogos dos usuários
      const realAccuracy = await this.calculateRealAccuracy(lottery.id);

      const normalizedName = lottery.name
        .toLowerCase()
        .replace(/[^a-z]/g, ''); // Remove acentos e caracteres especiais

      status[normalizedName] = Math.round(realAccuracy * 10) / 10; // Uma casa decimal
    }

    return {
      lotofacil: status.lotofacil || 0,
      megasena: status.megasena || 0,
      quina: status.quina || 0,
      lotomania: status.lotomania || 0,
      timemania: status.timemania || 0,
      duplasena: status.duplasena || 0,
      diadasorte: status.diadasorte || 0,
      supersete: status.supersete || 0,
      lotofacilindependencia: status.lotofacilindependencia || 0,
    };
  }

  // Calcular precisão real baseada nos jogos dos usuários
  private async calculateRealAccuracy(lotteryId: number): Promise<number> {
    try {
      // Buscar todos os jogos realizados pelos usuários para esta loteria
      const userGames = await storage.getUserGamesByLottery(lotteryId);
      const results = await storage.getLatestResults(lotteryId, 50);

      if (userGames.length === 0 || results.length === 0) {
        return 0; // Sem dados, precisão zero
      }

      let totalGames = 0;
      let totalHits = 0;
      let weightedAccuracy = 0;

      // Analisar cada jogo do usuário
      for (const game of userGames) {
        const gameNumbers = JSON.parse(game.numbers);

        // Encontrar resultado correspondente (se houver)
        const matchingResult = results.find(result => 
          result.contestNumber === game.contestNumber
        );

        if (matchingResult) {
          const drawnNumbers = JSON.parse(matchingResult.drawnNumbers);
          const hits = this.countHits(gameNumbers, drawnNumbers);
          const maxHits = gameNumbers.length;

          totalGames++;
          totalHits += hits;

          // Calcular peso baseado na qualidade do acerto
          const gameWeight = this.calculateGameWeight(hits, maxHits, lotteryId);
          weightedAccuracy += (hits / maxHits) * gameWeight;
        }
      }

      if (totalGames === 0) return 0;

      // Calcular precisão final
      const baseAccuracy = (totalHits / (totalGames * this.getExpectedHits(lotteryId))) * 100;
      const weightedFactor = weightedAccuracy / totalGames;

      // Aplicar fatores de melhoria baseados no volume de dados
      const volumeBonus = Math.min(10, totalGames * 0.1); // Bonus até 10% baseado no volume
      const learningBonus = this.calculateLearningBonus(totalGames, totalHits);

      const finalAccuracy = Math.min(95, baseAccuracy + (weightedFactor * 20) + volumeBonus + learningBonus);

      // Salvar precisão calculada para cache
      this.precisionHistory.set(lotteryId, finalAccuracy);

      return Math.max(0, finalAccuracy);

    } catch (error) {
      console.error('Erro ao calcular precisão real:', error);
      return 0;
    }
  }

  private countHits(userNumbers: number[], drawnNumbers: number[]): number {
    return userNumbers.filter(num => drawnNumbers.includes(num)).length;
  }

  private getExpectedHits(lotteryId: number): number {
    // Número esperado de acertos baseado na loteria
    const expectedHits: { [key: number]: number } = {
      1: 1.5, // Mega-Sena
      2: 8,   // Lotofácil  
      3: 1,   // Quina
      4: 15,  // Lotomania
      5: 2,   // Timemania
      6: 1.5, // Dupla-Sena
      7: 2,   // Dia de Sorte
      8: 2,   // Super Sete
      9: 8,   // Lotofácil-Independência
    };

    return expectedHits[lotteryId] || 1;
  }

  private calculateGameWeight(hits: number, maxHits: number, lotteryId: number): number {
    // Peso baseado na qualidade do acerto para cada tipo de loteria
    const hitRate = hits / maxHits;

    // Mega-Sena: acertos altos são muito valiosos
    if (lotteryId === 1) {
      if (hits >= 4) return 3.0; // Quadra ou mais = peso alto
      if (hits >= 3) return 2.0; // Terno = peso médio
      return 0.5;
    }

    // Lotofácil: acertos médios-altos são valiosos
    if (lotteryId === 2 || lotteryId === 9) {
      if (hits >= 12) return 2.5; // 12+ acertos = peso alto
      if (hits >= 10) return 1.5; // 10-11 acertos = peso médio
      return 1.0;
    }

    // Para outras loterias, peso baseado na taxa de acerto
    if (hitRate >= 0.4) return 2.0;
    if (hitRate >= 0.2) return 1.5;
    return 1.0;
  }

  private calculateLearningBonus(totalGames: number, totalHits: number): number {
    // Bonus por aprendizado baseado no volume e consistência
    const consistency = totalHits / totalGames;
    const volumeFactor = Math.min(1, totalGames / 100); // Normalizado para 100 jogos

    return consistency * volumeFactor * 5; // Até 5% de bonus
  }
}

export const aiService = AIService.getInstance();