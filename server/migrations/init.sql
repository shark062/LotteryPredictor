
-- Adicionar constraint UNIQUE na tabela number_frequency se não existir
ALTER TABLE number_frequency 
ADD CONSTRAINT lottery_number_unique UNIQUE (lottery_id, number);

-- Verificar se existem dados duplicados e remover se necessário
WITH duplicates AS (
  SELECT lottery_id, number, MIN(id) as keep_id
  FROM number_frequency
  GROUP BY lottery_id, number
  HAVING COUNT(*) > 1
)
DELETE FROM number_frequency 
WHERE id NOT IN (SELECT keep_id FROM duplicates);
