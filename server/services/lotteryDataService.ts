import axios from 'axios';
import * as cheerio from 'cheerio';
import { db } from '../db';
import { lotteries, lotteryResults } from '@shared/schema';
import { eq, and } from 'drizzle-orm';

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
  private baseUrl = 'https://loterica-nova.com.br';
  private requestTimeout = 12000;
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
    try {
      console.log('Buscando dados atualizados das loterias...');
      const response = await axios.get(this.baseUrl, {
        timeout: this.requestTimeout,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'pt-BR,pt;q=0.9,en;q=0.8'
        },
        validateStatus: (status) => status >= 200 && status < 500
      });

      if (response.status !== 200) {
        console.log('Status não é 200, retornando array vazio');
        return [];
      }

      const $ = cheerio.load(response.data);
      const lotteryData: LotteryData[] = [];

      $('.grid-cols-3 > div').each((index, element) => {
        try {
          const $element = $(element);
          const name = $element.find('h3').text().trim();
          const prizeText = $element.find('h4').text().trim();
          const contestInfo = $element.find('p').text().trim();

          if (name && prizeText && contestInfo) {
            const contestMatch = contestInfo.match(/(\d+)\s*\|\s*(\d{2}\/\d{2}\/\d{4})/);
            if (contestMatch) {
              const contestNumber = parseInt(contestMatch[1]);
              const drawDate = contestMatch[2];
              
              const slug = this.getSlugFromName(name);
              if (slug) {
                lotteryData.push({
                  name,
                  slug,
                  contestNumber,
                  estimatedPrize: prizeText,
                  drawDate: this.parseDate(drawDate)
                });
              }
            }
          }
        } catch (error) {
          console.error('Erro ao processar elemento da loteria:', error);
        }
      });

      console.log(`Dados de ${lotteryData.length} loterias coletados`);
      return lotteryData;
    } catch (error) {
      console.error('Erro ao buscar dados das loterias:', error);
      return [];
    }
  }

  async fetchResultsData(): Promise<void> {
    try {
      console.log('Buscando resultados das loterias...');
      const response = await axios.get(`${this.baseUrl}/premiacoes`, {
        timeout: 15000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'pt-BR,pt;q=0.9,en;q=0.8'
        },
        validateStatus: (status) => status >= 200 && status < 500
      });

      if (response.status !== 200) {
        console.log('Erro ao buscar resultados: status', response.status);
        return;
      }

      const $ = cheerio.load(response.data);
      
      const processResults = async () => {
        const elements = $('div[class*="border"]').toArray();
        for (const element of elements) {
        try {
          const $element = $(element);
          const dateText = $element.find('p').first().text().trim();
          const lotteryName = $element.find('h3').text().trim();
          const contestText = $element.find('p').eq(1).text().trim();
          const numbersButton = $element.find('button').text().trim();
          
          if (dateText && lotteryName && contestText) {
            const contestNumber = parseInt(contestText);
            const drawDate = this.parseDate(dateText);
            const slug = this.getSlugFromName(lotteryName);
            
            if (slug && contestNumber && drawDate) {
              const drawnNumbers = this.extractNumbersFromText(numbersButton);
              const isAccumulated = $element.text().includes('Acumulou');
              const prizeText = $element.find('td').last().text().trim();
              
              await this.saveResult({
                contestNumber,
                drawnNumbers: drawnNumbers || [],
                drawDate,
                actualPrize: prizeText,
                isAccumulated,
                slug
              });
            }
          }
          } catch (error) {
            console.error('Erro ao processar resultado:', error);
          }
        }
      };
      
      await processResults();
      
    } catch (error) {
      console.error('Erro ao buscar resultados:', error);
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

      if (existingResult.length === 0) {
        await db.insert(lotteryResults).values(resultToSave);
        console.log(`Resultado salvo: ${resultData.slug} #${resultData.contestNumber}`);
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

    const lotteries = ['mega-sena', 'lotofacil', 'quina']; // Limit to common lotteries for this method

    for (const slug of lotteries) {
      try {
        const data = await this.getLotteryResults(slug);
        if (data) {
          result[slug] = data;
        }
      } catch (error) {
        console.error(`Erro ao obter dados da loteria ${slug}:`, error);
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
    const numberMatches = text.match(/\d+/g);
    if (numberMatches) {
      return numberMatches.map(num => parseInt(num)).filter(num => num > 0 && num <= 100);
    }
    return null;
  }

  private parsePrizeValue(prizeText: string): string {
    const match = prizeText.match(/R\$\s*([\d.,]+)/);
    if (match) {
      return match[1].replace(/\./g, '').replace(',', '.');
    }
    return '0';
  }

  async updateAllData(): Promise<void> {
    console.log('Iniciando atualização completa dos dados das loterias...');
    try {
      await this.initializeLotteries(); 
      await this.fetchResultsData(); 
      
      console.log('Atualização completa finalizada com sucesso!');
    } catch (error) {
      console.error('Erro na atualização dos dados:', error);
    }
  }
}

export const lotteryDataService = LotteryDataService.getInstance();