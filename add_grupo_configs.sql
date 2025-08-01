-- Adicionar colunas de configuração por grupo
-- Execute este script no banco de dados para adicionar as novas colunas

ALTER TABLE grupos 
ADD COLUMN transcricao_ativa BOOLEAN DEFAULT TRUE COMMENT 'Se a transcrição de áudios está ativa para este grupo',
ADD COLUMN resumo_ativo BOOLEAN DEFAULT TRUE COMMENT 'Se os resumos automáticos estão ativos para este grupo',
ADD COLUMN ludico BOOLEAN DEFAULT FALSE COMMENT 'Se o modo lúdico está ativo para este grupo';

-- Atualizar grupos existentes com valores padrão
UPDATE grupos 
SET transcricao_ativa = TRUE, resumo_ativo = TRUE, ludico = FALSE 
WHERE transcricao_ativa IS NULL OR resumo_ativo IS NULL OR ludico IS NULL;