
# 🚀 Guia de Portabilidade - SharkLoto

## Verificação de Sistema
Para verificar se todas as APIs estão funcionando:
```bash
curl http://localhost:5000/api/health
```

## Exportação Completa do Projeto

### 1. Dependências Essenciais
Certifique-se de que o arquivo `package.json` contém todas as dependências:
- **Backend**: Express, Drizzle ORM, PostgreSQL, Axios, Cheerio
- **Frontend**: React, Vite, TanStack Query, Tailwind CSS
- **Shared**: Zod para validação de schemas

### 2. Variáveis de Ambiente Obrigatórias
```env
DATABASE_URL=postgresql://user:password@host:port/database
NODE_ENV=production
PORT=5000
VITE_API_URL=http://localhost:5000
```

### 3. Estrutura de Banco de Dados
O projeto usa PostgreSQL com as seguintes tabelas principais:
- `lotteries` - Configurações das loterias
- `lottery_results` - Resultados históricos
- `user_games` - Jogos dos usuários
- `number_frequencies` - Análises de frequência
- `ai_models` - Modelos de IA treinados

### 4. Processo de Migração

#### Para qualquer plataforma (Vercel, Netlify, Railway, etc.):

1. **Preparar banco de dados PostgreSQL**
   ```sql
   -- Executar migrações em ordem:
   -- migrations/0000_yielding_overlord.sql
   -- migrations/0001_mushy_blue_blade.sql
   ```

2. **Configurar variáveis de ambiente**
   - DATABASE_URL para conexão com PostgreSQL
   - NODE_ENV=production
   - Outras variáveis específicas da plataforma

3. **Instalar dependências**
   ```bash
   npm install
   ```

4. **Build da aplicação**
   ```bash
   npm run build
   ```

5. **Inicialização**
   ```bash
   npm start
   ```

### 5. APIs Externas Utilizadas
- **Caixa Econômica Federal**: `https://servicebus2.caixa.gov.br/portaldeloterias/api`
- **Backup Web Scraping**: Sites oficiais das loterias
- **Cache local**: Sistema de cache em memória para otimização

### 6. Verificações Antes da Migração
Execute para verificar portabilidade:
```bash
curl http://localhost:5000/api/portability
```

### 7. Manutenção da Fidelidade
- ✅ **Código-fonte**: 100% TypeScript/JavaScript, sem dependências específicas do Replit
- ✅ **Banco de dados**: PostgreSQL padrão, compatível com qualquer provedor
- ✅ **APIs**: Todas as integrações usam endpoints públicos
- ✅ **Assets**: Imagens e recursos estáticos incluídos no projeto
- ✅ **Configuração**: Usa variáveis de ambiente padrão

### 8. Comandos de Verificação
```bash
# Verificar saúde do sistema
curl http://localhost:5000/api/health

# Verificar dados das loterias
curl http://localhost:5000/api/lotteries/upcoming

# Verificar IA
curl http://localhost:5000/api/ai/status

# Verificar conexão com banco
curl http://localhost:5000/api/lotteries
```

## Garantias de Portabilidade

✅ **100% Compatível** com qualquer provedor Node.js  
✅ **Zero dependências** específicas do Replit  
✅ **Banco PostgreSQL** padrão (Neon, Supabase, AWS RDS, etc.)  
✅ **APIs públicas** sem autenticação especial  
✅ **Build process** padrão com Vite  
✅ **Deployment** flexível (Docker, serverless, VPS)  

O projeto foi desenvolvido seguindo padrões da indústria e pode ser executado em qualquer ambiente que suporte Node.js + PostgreSQL.
