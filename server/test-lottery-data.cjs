// Script de teste para verificar extração de dados reais
const axios = require('axios');
const cheerio = require('cheerio');

async function testLotteryDataExtraction() {
  try {
    console.log('Testando extração de dados da Lotérica Nova...');
    
    const response = await axios.get('https://lotericanova.com', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });

    const $ = cheerio.load(response.data);
    const results = {};

    // Buscar pela seção "Próximos concursos"
    $('h3:contains("Próximos"), h2:contains("Próximos")').each((i, element) => {
      console.log('Encontrou seção de próximos concursos');
      
      // Buscar loterias após esta seção
      $(element).parent().find('h3').each((j, lottery) => {
        const lotteryName = $(lottery).text().trim();
        console.log('Loteria encontrada:', lotteryName);
        
        if (['Lotomania', 'Lotofácil', 'Mega-Sena', 'Quina', 'Dia de Sorte', 'Timemania', 'Dupla-Sena', 'Super Sete'].includes(lotteryName)) {
          const container = $(lottery).parent();
          
          // Buscar dados próximos a este h3
          const texts = [];
          container.find('*').each((k, el) => {
            const text = $(el).text().trim();
            if (text && text.length < 100) {
              texts.push(text);
            }
          });
          
          console.log(`Textos encontrados para ${lotteryName}:`, texts);
          
          // Buscar padrões específicos
          let prize = '';
          let contestNumber = '';
          let date = '';
          
          texts.forEach(text => {
            if (text.includes('R$') && text.includes(',')) {
              prize = text;
            }
            if (text.match(/^\d{3,4}$/)) {
              contestNumber = text;
            }
            if (text.match(/\d{2}\/\d{2}\/\d{4}/)) {
              date = text;
            }
          });
          
          if (prize || contestNumber || date) {
            results[lotteryName] = { prize, contestNumber, date };
          }
        }
      });
    });

    console.log('Resultados extraídos:', results);
    return results;
    
  } catch (error) {
    console.error('Erro:', error.message);
  }
}

testLotteryDataExtraction();