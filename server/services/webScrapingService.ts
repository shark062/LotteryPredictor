
import axios from 'axios';

interface LotteryInfo {
  contestNumber: number;
  nextDrawDate: string;
  prize: string;
}

export class WebScrapingService {
  private static instance: WebScrapingService;
  private officialApiUrl = 'https://servicebus2.caixa.gov.br/portaldeloterias/api';
  private requestTimeout = 10000;
  private maxRetries = 3;

  public static getInstance(): WebScrapingService {
    if (!WebScrapingService.instance) {
      WebScrapingService.instance = new WebScrapingService();
    }
    return WebScrapingService.instance;
  }

  async getLotteryInfo(): Promise<{ [key: string]: LotteryInfo }> {
    console.log('🔄 Buscando informações oficiais dos próximos sorteios...');

    const lotteryMappings: { [key: string]: string } = {
      'Lotofácil': 'lotofacil',
      'Mega-Sena': 'megasena',
      'Quina': 'quina',
      'Lotomania': 'lotomania',
      'Timemania': 'timemania',
      'Dupla-Sena': 'duplasena',
      'Dia de Sorte': 'diadesorte',
      'Super Sete': 'supersete'
    };

    const results: { [key: string]: LotteryInfo } = {};
    const errors: string[] = [];

    for (const [displayName, apiName] of Object.entries(lotteryMappings)) {
      try {
        console.log(`🔄 Buscando ${displayName}...`);
        const data = await this.fetchOfficialLotteryInfoWithRetry(apiName, displayName);
        if (data && this.validateLotteryData(data)) {
          results[displayName] = data;
          console.log(`✅ ${displayName}: dados oficiais válidos obtidos`);
        } else {
          errors.push(`Dados inválidos para ${displayName}`);
        }
      } catch (error) {
        console.error(`❌ Erro ao buscar ${displayName}:`, error);
        errors.push(`Falha ao obter dados de ${displayName}`);
      }
    }

    if (Object.keys(results).length === 0) {
      throw new Error(`Nenhuma loteria válida encontrada. Erros: ${errors.join(', ')}`);
    }

    console.log(`✅ Busca concluída: ${Object.keys(results).length} loterias válidas de ${Object.keys(lotteryMappings).length} tentativas`);
    return results;
  }

  private async fetchOfficialLotteryInfoWithRetry(apiName: string, displayName: string): Promise<LotteryInfo | null> {
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        console.log(`🔄 Tentativa ${attempt}/${this.maxRetries} para ${displayName}`);
        
        const data = await this.fetchOfficialLotteryInfo(apiName, displayName);
        if (data && this.validateLotteryData(data)) {
          return data;
        }
        
        throw new Error(`Dados inválidos recebidos na tentativa ${attempt}`);
      } catch (error) {
        lastError = error as Error;
        console.warn(`⚠️ Tentativa ${attempt} falhou para ${displayName}: ${lastError.message}`);
        
        if (attempt < this.maxRetries) {
          // Aguardar antes da próxima tentativa
          await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
        }
      }
    }

    throw lastError || new Error(`Falha após ${this.maxRetries} tentativas`);
  }

  private async fetchOfficialLotteryInfo(apiName: string, displayName: string): Promise<LotteryInfo | null> {
    try {
      const url = `${this.officialApiUrl}/${apiName}`;
      console.log(`🌐 Consultando API oficial: ${url}`);

      const response = await axios.get(url, {
        timeout: this.requestTimeout,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'application/json, text/plain, */*',
          'Accept-Language': 'pt-BR,pt;q=0.9,en;q=0.8',
          'Accept-Encoding': 'gzip, deflate, br',
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache',
          'Referer': 'https://loterias.caixa.gov.br/',
          'Origin': 'https://loterias.caixa.gov.br',
          'DNT': '1',
          'Connection': 'keep-alive',
          'Sec-Fetch-Dest': 'empty',
          'Sec-Fetch-Mode': 'cors',
          'Sec-Fetch-Site': 'same-site'
        },
        validateStatus: function (status) {
          return status === 200; // Aceitar apenas status 200
        }
      });

      if (response.data && response.status === 200) {
        const parsedData = this.parseOfficialLotteryInfo(response.data, displayName);
        if (this.validateLotteryData(parsedData)) {
          return parsedData;
        }
      }

      throw new Error(`Dados inválidos recebidos da API oficial`);
    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 403) {
          console.warn(`🚫 Acesso negado (403) para ${displayName}. API pode estar bloqueando requests.`);
          throw new Error(`API bloqueou acesso para ${displayName}`);
        }
        if (error.response?.status === 429) {
          console.warn(`⏰ Rate limit (429) para ${displayName}. Muitas requisições.`);
          throw new Error(`Rate limit atingido para ${displayName}`);
        }
        if (error.code === 'ENOTFOUND') {
          throw new Error(`Erro de conectividade para ${displayName}`);
        }
      }
      throw error;
    }
  }

  private validateLotteryData(data: LotteryInfo | null): boolean {
    if (!data) return false;
    
    // Validar se os dados são reais e não falsos
    const isValidContest = data.contestNumber > 0 && data.contestNumber < 99999;
    const isValidPrize = data.prize && data.prize.includes('R$') && !data.prize.includes('NaN');
    const isValidDate = data.nextDrawDate && data.nextDrawDate.match(/\d{2}\/\d{2}\/\d{4}/);
    
    return isValidContest && isValidPrize && isValidDate;
  }

  private parseOfficialLotteryInfo(data: any, displayName: string): LotteryInfo {
    console.log(`🔍 Processando dados da API para ${displayName}`);

    if (!data || typeof data !== 'object') {
      throw new Error(`Dados inválidos recebidos para ${displayName}`);
    }

    const contestNumber = parseInt(data.numero) || 0;
    const prize = parseFloat(data.valorEstimadoProximoConcurso) || parseFloat(data.valorAcumuladoProximoConcurso) || 0;
    const nextDrawDate = data.dataProximoConcurso;

    // Validar dados essenciais
    if (contestNumber <= 0) {
      throw new Error(`Número do concurso inválido para ${displayName}: ${contestNumber}`);
    }

    if (prize <= 0) {
      throw new Error(`Valor do prêmio inválido para ${displayName}: ${prize}`);
    }

    // Calcular próxima data de sorteio
    const formattedDate = nextDrawDate 
      ? this.formatDate(nextDrawDate) 
      : this.getNextDrawDate(displayName);

    const formattedPrize = `R$ ${this.formatMoney(prize)}`;

    return {
      contestNumber: contestNumber + 1, // Próximo concurso
      nextDrawDate: formattedDate,
      prize: formattedPrize
    };
  }

  private formatDate(dateString: string): string {
    try {
      if (!dateString) throw new Error('Data vazia');

      let date: Date;
      
      // Tentar formato DD/MM/YYYY primeiro
      if (dateString.includes('/')) {
        const [day, month, year] = dateString.split('/').map(Number);
        if (!day || !month || !year || day > 31 || month > 12) {
          throw new Error('Formato de data inválido');
        }
        date = new Date(year, month - 1, day);
      } else {
        // Tentar parser direto
        date = new Date(dateString);
      }
      
      if (isNaN(date.getTime())) {
        throw new Error('Data inválida');
      }

      // Verificar se a data não está muito no passado ou futuro
      const now = new Date();
      const diffDays = Math.abs((date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      
      if (diffDays > 365) {
        throw new Error('Data fora do intervalo válido');
      }
      
      return `${date.toLocaleDateString('pt-BR')} - 20:00h`;
    } catch (error) {
      console.warn(`Erro ao formatar data: ${dateString}`, error);
      return this.getNextDrawDate('');
    }
  }

  private getNextDrawDate(lotteryName: string): string {
    const today = new Date();
    const dayOfWeek = today.getDay();

    // Cronograma oficial dos sorteios da Caixa
    const schedules: { [key: string]: number[] } = {
      'Lotofácil': [1, 2, 3, 4, 5, 6], // Segunda a sábado
      'Mega-Sena': [3, 6], // Quarta e sábado
      'Quina': [1, 2, 3, 4, 5, 6], // Segunda a sábado
      'Lotomania': [2, 5], // Terça e sexta
      'Timemania': [2, 4, 6], // Terça, quinta e sábado
      'Dupla-Sena': [2, 4, 6], // Terça, quinta e sábado
      'Dia de Sorte': [2, 4, 6], // Terça, quinta e sábado
      'Super Sete': [1, 3, 6] // Segunda, quarta e sábado
    };

    const drawDays = schedules[lotteryName] || [1, 2, 3, 4, 5, 6];

    // Encontrar próximo dia de sorteio
    let nextDate = new Date(today);
    let daysToAdd = 1;

    // Se já passou das 20h, considerar o próximo dia
    if (today.getHours() >= 20) {
      nextDate.setDate(nextDate.getDate() + 1);
    }

    while (!drawDays.includes(nextDate.getDay()) && daysToAdd <= 7) {
      nextDate.setDate(nextDate.getDate() + 1);
      daysToAdd++;
    }

    return `${nextDate.toLocaleDateString('pt-BR')} - 20:00h`;
  }

  private formatMoney(value: number): string {
    if (isNaN(value) || value <= 0) {
      throw new Error(`Valor monetário inválido: ${value}`);
    }
    
    return value.toLocaleString('pt-BR', { 
      minimumFractionDigits: 0,
      maximumFractionDigits: 0 
    });
  }
}

export const webScrapingService = WebScrapingService.getInstance();
