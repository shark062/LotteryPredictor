// Configuração de Deploy Multiplataforma para Shark Loto
// Este arquivo define como o projeto deve ser deployado em diferentes plataformas

const deployConfig = {
  // Configuração para Replit (atual)
  replit: {
    build: null, // Não precisa de build - usa vite dev server
    run: ["npm", "run", "dev"],
    deployment_target: "vm", // VM para manter estado em memória
    environment: {
      NODE_ENV: "production",
      PORT: "5000",
      HOST: "0.0.0.0"
    },
    dependencies: {
      node_version: "18",
      package_manager: "npm"
    }
  },

  // Configuração para Vercel
  vercel: {
    build: ["npm", "run", "build"],
    run: ["npm", "start"],
    deployment_target: "autoscale",
    files: {
      "vercel.json": {
        version: 2,
        builds: [
          { src: "server/index.ts", use: "@vercel/node" },
          { src: "client/package.json", use: "@vercel/static-build" }
        ],
        routes: [
          { src: "/api/(.*)", dest: "/server/index.ts" },
          { src: "/(.*)", dest: "/client/dist/$1" }
        ],
        env: {
          DATABASE_URL: "@database_url",
          OPENAI_API_KEY: "@openai_api_key"
        }
      },
      "package.json.scripts.build": "cd client && npm run build",
      "package.json.scripts.start": "cd server && npm start"
    }
  },

  // Configuração para Netlify
  netlify: {
    build: ["npm", "run", "build:netlify"],
    deployment_target: "autoscale",
    files: {
      "netlify.toml": {
        build: {
          command: "npm run build:netlify",
          publish: "client/dist"
        },
        functions: {
          directory: "netlify/functions"
        },
        redirects: [
          { from: "/api/*", to: "/.netlify/functions/api", status: 200 },
          { from: "/*", to: "/index.html", status: 200 }
        ]
      }
    }
  },

  // Configuração para Heroku
  heroku: {
    build: ["npm", "run", "build:heroku"],
    run: ["npm", "start"],
    deployment_target: "vm",
    files: {
      "Procfile": "web: npm start",
      "package.json.engines": {
        node: ">=18.0.0",
        npm: ">=8.0.0"
      },
      "package.json.scripts.start": "node server/dist/index.js",
      "package.json.scripts.build:heroku": "npm run build:client && npm run build:server"
    }
  },

  // Configuração para Railway
  railway: {
    build: ["npm", "run", "build"],
    run: ["npm", "start"],
    deployment_target: "vm",
    environment: {
      RAILWAY_STATIC_URL: "true",
      PORT: "$PORT"
    }
  },

  // Configuração para DigitalOcean App Platform
  digitalocean: {
    build: ["npm", "run", "build"],
    run: ["npm", "start"],
    deployment_target: "vm",
    files: {
      ".do/app.yaml": {
        name: "shark-loto",
        services: [
          {
            name: "api",
            source_dir: "/",
            build_command: "npm run build",
            run_command: "npm start",
            environment_slug: "node-js",
            instance_count: 1,
            instance_size_slug: "basic-xxs",
            envs: [
              { key: "DATABASE_URL", scope: "RUN_AND_BUILD_TIME" },
              { key: "OPENAI_API_KEY", scope: "RUN_TIME" }
            ]
          }
        ]
      }
    }
  },

  // Configuração Docker (para qualquer plataforma que suporte containers)
  docker: {
    files: {
      "Dockerfile": `
FROM node:18-alpine

WORKDIR /app

# Copiar package files
COPY package*.json ./
COPY client/package*.json ./client/
COPY server/package*.json ./server/

# Instalar dependências
RUN npm ci --only=production

# Copiar código fonte
COPY . .

# Build da aplicação
RUN npm run build

# Expor porta
EXPOSE 5000

# Comando de inicialização
CMD ["npm", "start"]
      `,
      "docker-compose.yml": `
version: '3.8'
services:
  app:
    build: .
    ports:
      - "5000:5000"
    environment:
      - NODE_ENV=production
      - DATABASE_URL=\${DATABASE_URL}
      - OPENAI_API_KEY=\${OPENAI_API_KEY}
    depends_on:
      - postgres
  
  postgres:
    image: postgres:15-alpine
    environment:
      - POSTGRES_DB=sharkloto
      - POSTGRES_USER=\${DB_USER:-postgres}
      - POSTGRES_PASSWORD=\${DB_PASSWORD:-postgres}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"

volumes:
  postgres_data:
      `,
      ".dockerignore": `
node_modules
npm-debug.log
.git
.gitignore
README.md
.env
.nyc_output
coverage
.DS_Store
      `
    }
  }
};

module.exports = deployConfig;