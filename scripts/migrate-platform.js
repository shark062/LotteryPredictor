#!/usr/bin/env node

/**
 * Script de Migração Automática para Shark Loto
 * Facilita a migração entre diferentes plataformas de deploy
 */

const fs = require('fs');
const path = require('path');
const deployConfig = require('../deploy.config.js');

class PlatformMigrator {
  constructor() {
    this.supportedPlatforms = Object.keys(deployConfig);
    this.backupDir = path.join(__dirname, '..', 'platform-backup');
  }

  async migrate(targetPlatform) {
    console.log(`🚀 Iniciando migração para ${targetPlatform}...`);
    
    if (!this.supportedPlatforms.includes(targetPlatform)) {
      throw new Error(`Plataforma não suportada: ${targetPlatform}`);
    }

    const config = deployConfig[targetPlatform];
    
    try {
      // 1. Fazer backup dos arquivos atuais
      await this.createBackup();
      
      // 2. Gerar arquivos de configuração específicos da plataforma
      await this.generatePlatformFiles(targetPlatform, config);
      
      // 3. Atualizar package.json se necessário
      await this.updatePackageJson(config);
      
      // 4. Gerar documentação de deploy
      await this.generateDeployDocs(targetPlatform, config);
      
      console.log(`✅ Migração para ${targetPlatform} concluída com sucesso!`);
      console.log(`📖 Consulte DEPLOY-${targetPlatform.toUpperCase()}.md para instruções específicas`);
      
    } catch (error) {
      console.error(`❌ Erro na migração:`, error.message);
      await this.restoreBackup();
      throw error;
    }
  }

  async createBackup() {
    console.log('💾 Criando backup dos arquivos atuais...');
    
    if (!fs.existsSync(this.backupDir)) {
      fs.mkdirSync(this.backupDir, { recursive: true });
    }

    const filesToBackup = [
      'package.json',
      'Dockerfile',
      'docker-compose.yml',
      'vercel.json',
      'netlify.toml',
      'Procfile',
      '.do/app.yaml'
    ];

    for (const file of filesToBackup) {
      const filePath = path.join(__dirname, '..', file);
      if (fs.existsSync(filePath)) {
        const backupPath = path.join(this.backupDir, file);
        const backupDir = path.dirname(backupPath);
        
        if (!fs.existsSync(backupDir)) {
          fs.mkdirSync(backupDir, { recursive: true });
        }
        
        fs.copyFileSync(filePath, backupPath);
      }
    }
    
    console.log('✅ Backup criado');
  }

  async generatePlatformFiles(platform, config) {
    console.log(`🔧 Gerando arquivos para ${platform}...`);
    
    if (config.files) {
      for (const [fileName, content] of Object.entries(config.files)) {
        const filePath = path.join(__dirname, '..', fileName);
        const fileDir = path.dirname(filePath);
        
        if (!fs.existsSync(fileDir)) {
          fs.mkdirSync(fileDir, { recursive: true });
        }
        
        if (typeof content === 'object') {
          fs.writeFileSync(filePath, JSON.stringify(content, null, 2));
        } else {
          fs.writeFileSync(filePath, content.trim());
        }
        
        console.log(`📝 Criado: ${fileName}`);
      }
    }
  }

  async updatePackageJson(config) {
    console.log('📦 Atualizando package.json...');
    
    const packagePath = path.join(__dirname, '..', 'package.json');
    let packageJson = {};
    
    if (fs.existsSync(packagePath)) {
      packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
    }

    // Adicionar scripts específicos da plataforma
    if (config.build) {
      packageJson.scripts = packageJson.scripts || {};
      packageJson.scripts.build = config.build.join(' ');
    }

    if (config.run) {
      packageJson.scripts = packageJson.scripts || {};
      packageJson.scripts.start = config.run.join(' ');
    }

    // Adicionar engines se especificado
    if (config.files && config.files['package.json.engines']) {
      packageJson.engines = config.files['package.json.engines'];
    }

    fs.writeFileSync(packagePath, JSON.stringify(packageJson, null, 2));
    console.log('✅ package.json atualizado');
  }

  async generateDeployDocs(platform, config) {
    console.log('📚 Gerando documentação de deploy...');
    
    const docs = this.generatePlatformDocs(platform, config);
    const docsPath = path.join(__dirname, '..', `DEPLOY-${platform.toUpperCase()}.md`);
    
    fs.writeFileSync(docsPath, docs);
    console.log(`✅ Documentação criada: DEPLOY-${platform.toUpperCase()}.md`);
  }

  generatePlatformDocs(platform, config) {
    const platformNames = {
      replit: 'Replit',
      vercel: 'Vercel',
      netlify: 'Netlify',
      heroku: 'Heroku',
      railway: 'Railway',
      digitalocean: 'DigitalOcean App Platform',
      docker: 'Docker'
    };

    const platformName = platformNames[platform] || platform;

    return `# Deploy no ${platformName}

## Shark Loto 💵 - Guia de Deploy

### Pré-requisitos

- Node.js 18+
- NPM 8+
- Banco PostgreSQL (Neon Database recomendado)

### Variáveis de Ambiente Necessárias

\`\`\`
DATABASE_URL=postgresql://username:password@host:port/database
OPENAI_API_KEY=sk-...
NODE_ENV=production
\`\`\`

### Instruções de Deploy

${this.getPlatformInstructions(platform, config)}

### Configuração do Banco de Dados

1. Configure uma instância PostgreSQL
2. Execute as migrações: \`npm run db:push\`
3. Verifique a conectividade

### Monitoramento

- Health check: \`GET /health\`
- Logs de aplicação disponíveis no console
- Métricas de performance via endpoint interno

### Troubleshooting

${this.getTroubleshootingTips(platform)}

---

*Gerado automaticamente pelo sistema de migração Shark Loto*
`;
  }

  getPlatformInstructions(platform, config) {
    const instructions = {
      replit: `
1. Faça fork do projeto no Replit
2. Configure as variáveis de ambiente no Secrets
3. Execute: \`npm install\`
4. Inicie com: \`npm run dev\`
`,
      vercel: `
1. Conecte o repositório ao Vercel
2. Configure as variáveis de ambiente
3. O deploy será automático a cada push
4. Domínio customizado opcional
`,
      netlify: `
1. Conecte o repositório ao Netlify
2. Configure build command: \`npm run build:netlify\`
3. Configure publish directory: \`client/dist\`
4. Adicione variáveis de ambiente
`,
      heroku: `
1. Instale o Heroku CLI
2. \`heroku create shark-loto\`
3. \`git push heroku main\`
4. \`heroku config:set DATABASE_URL=...\`
`,
      railway: `
1. Conecte o repositório ao Railway
2. Configure as variáveis de ambiente
3. Deploy automático configurado
`,
      digitalocean: `
1. Use o arquivo .do/app.yaml fornecido
2. Configure via DigitalOcean CLI ou interface web
3. Adicione variáveis de ambiente
`,
      docker: `
1. Build da imagem: \`docker build -t shark-loto .\`
2. Execute: \`docker-compose up -d\`
3. Configure variáveis no .env
`
    };

    return instructions[platform] || 'Instruções específicas não disponíveis.';
  }

  getTroubleshootingTips(platform) {
    return `
- **Erro de conexão com banco**: Verifique DATABASE_URL
- **Erro de CORS**: Configure allowedHosts corretamente
- **Erro de build**: Verifique dependências do Node.js
- **Performance lenta**: Ative cache e otimizações
- **Logs**: Consulte os logs da plataforma para detalhes
`;
  }

  async restoreBackup() {
    console.log('🔄 Restaurando backup...');
    
    if (!fs.existsSync(this.backupDir)) {
      console.log('❌ Nenhum backup encontrado');
      return;
    }

    const backupFiles = this.getAllFiles(this.backupDir);
    
    for (const file of backupFiles) {
      const relativePath = path.relative(this.backupDir, file);
      const targetPath = path.join(__dirname, '..', relativePath);
      
      fs.copyFileSync(file, targetPath);
    }
    
    console.log('✅ Backup restaurado');
  }

  getAllFiles(dir) {
    const files = [];
    
    const traverse = (currentDir) => {
      const items = fs.readdirSync(currentDir);
      
      for (const item of items) {
        const fullPath = path.join(currentDir, item);
        const stat = fs.statSync(fullPath);
        
        if (stat.isDirectory()) {
          traverse(fullPath);
        } else {
          files.push(fullPath);
        }
      }
    };
    
    traverse(dir);
    return files;
  }

  listPlatforms() {
    console.log('🚀 Plataformas suportadas:');
    console.log('');
    
    for (const platform of this.supportedPlatforms) {
      const config = deployConfig[platform];
      console.log(`• ${platform} - ${config.deployment_target}`);
    }
    
    console.log('');
    console.log('Uso: node scripts/migrate-platform.js <plataforma>');
  }
}

// CLI Interface
async function main() {
  const migrator = new PlatformMigrator();
  const targetPlatform = process.argv[2];

  if (!targetPlatform) {
    migrator.listPlatforms();
    return;
  }

  try {
    await migrator.migrate(targetPlatform);
  } catch (error) {
    console.error('❌ Falha na migração:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = PlatformMigrator;