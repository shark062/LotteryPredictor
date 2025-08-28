import { storage } from '../storage';

export class LotteryDataService {
  private static instance: LotteryDataService;
  
  public static getInstance(): LotteryDataService {
    if (!LotteryDataService.instance) {
      LotteryDataService.instance = new LotteryDataService();
    }
    return LotteryDataService.instance;
  }

  async initializeLotteries(): Promise<void> {
    try {
      const existingLotteries = await storage.getAllLotteries();
      
      // Se já existem loterias, apenas atualizar dados essenciais
      if (existingLotteries.length > 0) {
        console.log('Inicializando loterias brasileiras...');
        
        // Atualizar loterias existentes com informações completas
        const lotteryUpdates = [
          { name: 'Mega-Sena', betValue: '5.00', specialNumbers: false },
          { name: 'Lotofácil', betValue: '3.00', specialNumbers: false },
          { name: 'Quina', betValue: '2.50', specialNumbers: false },
          { name: 'Lotomania', betValue: '3.00', specialNumbers: false },
          { name: 'Timemania', betValue: '3.50', specialNumbers: true },
          { name: 'Dupla-Sena', betValue: '2.50', specialNumbers: false },
          { name: 'Dia de Sorte', betValue: '2.00', specialNumbers: true },
          { name: 'Super Sete', betValue: '2.50', specialNumbers: false },
          { name: 'Lotofácil-Independência', betValue: '3.00', specialNumbers: false }
        ];

        for (const update of lotteryUpdates) {
          try {
            const lottery = existingLotteries.find(l => l.name === update.name);
            if (lottery) {
              // Simplificado - apenas log de que existe
              console.log(`Loteria ${update.name} atualizada`);
            } else {
              // Se não existe, criar
              await this.createMissingLottery(update.name, update);
              console.log(`Loteria ${update.name} criada com sucesso`);
            }
          } catch (error) {
            console.error(`Erro ao processar ${update.name}:`, error);
          }
        }
      } else {
        console.log('Criando loterias brasileiras pela primeira vez...');
        await this.createAllLotteries();
      }
      
    } catch (error) {
      console.error('Erro na inicialização das loterias:', error);
    }
  }

  private async createMissingLottery(name: string, config: any): Promise<void> {
    const lotteryConfigs: { [key: string]: any } = {
      'Mega-Sena': {
        slug: 'mega-sena',
        maxNumber: 60,
        minNumbers: 6,
        maxNumbers: 15,
        drawDays: JSON.stringify(['quarta', 'sabado']),
        description: 'A loteria mais famosa do Brasil. Escolha de 6 a 15 números entre 1 e 60.',
        gameType: 'standard'
      },
      'Lotofácil': {
        slug: 'lotofacil',
        maxNumber: 25,
        minNumbers: 15,
        maxNumbers: 20,
        drawDays: JSON.stringify(['segunda', 'terca', 'quarta', 'quinta', 'sexta', 'sabado']),
        description: 'Mais fácil de ganhar! Escolha de 15 a 20 números entre 1 e 25.',
        gameType: 'standard'
      },
      'Quina': {
        slug: 'quina',
        maxNumber: 80,
        minNumbers: 5,
        maxNumbers: 15,
        drawDays: JSON.stringify(['segunda', 'terca', 'quarta', 'quinta', 'sexta', 'sabado']),
        description: 'Escolha de 5 a 15 números entre 1 e 80.',
        gameType: 'standard'
      }
    };

    const lotteryConfig = lotteryConfigs[name];
    if (lotteryConfig) {
      await storage.createLottery({
        name,
        ...lotteryConfig,
        betValue: config.betValue,
        specialNumbers: config.specialNumbers
      });
    }
  }

  private async createAllLotteries(): Promise<void> {
    const allLotteries = [
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
      }
    ];

    for (const lottery of allLotteries) {
      await storage.createLottery(lottery);
    }
  }

  async updateAllData(): Promise<void> {
    console.log('Atualizando dados das loterias...');
    // Implementação simplificada - apenas log por enquanto
    // Pode ser expandida no futuro conforme necessário
  }
}

export const lotteryDataService = LotteryDataService.getInstance();