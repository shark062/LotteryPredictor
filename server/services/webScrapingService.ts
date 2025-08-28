import axios from 'axios';

interface LotteryInfo {
  contestNumber: number;
  nextDrawDate: string;
  prize: string;
}

export class WebScrapingService {
  private static instance: WebScrapingService;
  private officialApiUrl = 'https://servicebus2.caixa.gov.br/portaldeloterias/api';
  private requestTimeout = 15000;

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

    for (const [displayName, apiName] of Object.entries(lotteryMappings)) {
      try {
        console.log(`🔄 Buscando ${displayName}...`);
        const data = await this.fetchOfficialLotteryInfo(apiName, displayName);
        if (data) {
          results[displayName] = data;
          console.log(`✅ ${displayName}: dados oficiais obtidos`);
        } else {
          throw new Error(`Dados não disponíveis para ${displayName}`);
        }
      } catch (error) {
        console.error(`❌ Erro ao buscar ${displayName}:`, error);
        throw new Error(`Falha ao obter dados oficiais de ${displayName}`);
      }
    }

    console.log(`✅ Busca concluída: ${Object.keys(results).length} loterias atualizadas`);
    return results;
  }

  private async fetchOfficialLotteryInfo(apiName: string, displayName: string): Promise<LotteryInfo | null> {
    try {
      const url = `${this.officialApiUrl}/${apiName}`;
      console.log(`🌐 Consultando API oficial: ${url}`);

      const response = await axios.get(url, {
        timeout: this.requestTimeout,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Accept': 'application/json, text/plain, */*',
          'Accept-Language': 'pt-BR,pt;q=0.9,en;q=0.8',
          'Cache-Control': 'no-cache',
          'Referer': 'https://loterias.caixa.gov.br/'
        }
      });

      if (response.data && response.status === 200) {
        return this.parseOfficialLotteryInfo(response.data, displayName);
      }

      throw new Error(`Resposta inválida da API oficial para ${displayName}`);
    } catch (error) {
      console.error(`Erro ao buscar dados oficiais para ${displayName}:`, error);

      // Tentar método alternativo - scraping do site oficial
      try {
        return await this.scrapeOfficialWebsite(apiName, displayName);
      } catch (scrapeError) {
        console.error(`Scraping também falhou para ${displayName}:`, scrapeError);
        throw error;
      }
    }
  }

  private async scrapeOfficialWebsite(apiName: string, displayName: string): Promise<LotteryInfo | null> {
    const url = `https://loterias.caixa.gov.br/wps/portal/loterias/landing/${apiName}`;
    console.log(`🌐 Fazendo scraping do site oficial: ${url}`);

    const response = await axios.get(url, {
      timeout: this.requestTimeout,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });

    // Extrair informações básicas do HTML
    const html = response.data;

    // Buscar padrões de dados no HTML
    const contestMatch = html.match(/concurso["\s]*:?\s*["\s]*(\d+)/i);
    const prizeMatch = html.match(/R\$\s*([\d.,]+)/);
    const dateMatch = html.match(/(\d{2}\/\d{2}\/\d{4})/);

    if (contestMatch && prizeMatch) {
      return {
        contestNumber: parseInt(contestMatch[1]),
        nextDrawDate: dateMatch ? `${dateMatch[1]} - 20:00h` : this.getNextDrawDate(displayName),
        prize: `R$ ${prizeMatch[1]}`
      };
    }

    throw new Error(`Não foi possível extrair dados do site oficial para ${displayName}`);
  }

  private parseOfficialLotteryInfo(data: any, displayName: string): LotteryInfo {
    console.log(`🔍 Processando dados da API para ${displayName}:`, {
      numero: data.numero,
      valorEstimado: data.valorEstimadoProximoConcurso,
      dataProximo: data.dataProximoConcurso,
      acumulado: data.acumulado
    });

    const contestNumber = data.numero || 0;
    const prize = data.valorEstimadoProximoConcurso || data.valorAcumuladoProximoConcurso || 0;
    const nextDrawDate = data.dataProximoConcurso;

    // Calcular próxima data de sorteio se não estiver disponível
    const formattedDate = nextDrawDate 
      ? this.formatDate(nextDrawDate) 
      : this.getNextDrawDate(displayName);

    const formattedPrize = prize > 0 ? `R$ ${this.formatMoney(parseFloat(prize))}` : this.getDefaultPrize(displayName);

    return {
      contestNumber: contestNumber + 1, // Próximo concurso
      nextDrawDate: formattedDate,
      prize: formattedPrize
    };
  }

  private formatDate(dateString: string): string {
    try {
      // A API da Caixa retorna datas no formato DD/MM/YYYY
      // Precisamos converter para formato que o JavaScript entende
      if (dateString && dateString.includes('/')) {
        const [day, month, year] = dateString.split('/');
        const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
        
        if (!isNaN(date.getTime())) {
          return `${date.toLocaleDateString('pt-BR')} - 20:00h`;
        }
      }
      
      // Tentar parser direto se não for formato DD/MM/YYYY
      const date = new Date(dateString);
      if (!isNaN(date.getTime())) {
        return `${date.toLocaleDateString('pt-BR')} - 20:00h`;
      }
      
      // Se não conseguir processar a data, usar o valor original ou calcular próxima
      return dateString || this.getNextDrawDate('');
    } catch (error) {
      console.warn(`Erro ao formatar data: ${dateString}`, error);
      return this.getNextDrawDate('');
    }
  }

  private getNextDrawDate(lotteryName: string): string {
    const today = new Date();
    const dayOfWeek = today.getDay();

    // Cronograma oficial dos sorteios
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

    while (!drawDays.includes(nextDate.getDay()) && daysToAdd <= 7) {
      nextDate.setDate(nextDate.getDate() + 1);
      daysToAdd++;
    }

    return `${nextDate.toLocaleDateString('pt-BR')} - 20:00h`;
  }

  private formatMoney(value: number): string {
    return value.toLocaleString('pt-BR', { 
      minimumFractionDigits: 0,
      maximumFractionDigits: 0 
    });
  }

  private getDefaultPrize(lotteryName: string): string {
    const defaultPrizes: { [key: string]: string } = {
      'Lotofácil': 'R$ 1.700.000',
      'Mega-Sena': 'R$ 3.000.000',
      'Quina': 'R$ 700.000',
      'Lotomania': 'R$ 300.000',
      'Timemania': 'R$ 1.400.000',
      'Dupla-Sena': 'R$ 450.000',
      'Dia de Sorte': 'R$ 200.000',
      'Super Sete': 'R$ 500.000'
    };
    return defaultPrizes[lotteryName] || 'R$ 500.000';
  }
}

export const webScrapingService = WebScrapingService.getInstance();