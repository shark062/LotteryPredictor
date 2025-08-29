
-- Tabela para estatísticas processadas pelo n8n
CREATE TABLE IF NOT EXISTS n8n_statistics (
  id SERIAL PRIMARY KEY,
  lottery_name VARCHAR(100) NOT NULL UNIQUE,
  statistics_data JSONB NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela para estratégias geradas pelo n8n
CREATE TABLE IF NOT EXISTS n8n_strategies (
  id SERIAL PRIMARY KEY,
  strategies_data JSONB NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_n8n_statistics_lottery_name ON n8n_statistics(lottery_name);
CREATE INDEX IF NOT EXISTS idx_n8n_statistics_created_at ON n8n_statistics(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_n8n_strategies_created_at ON n8n_strategies(created_at DESC);
