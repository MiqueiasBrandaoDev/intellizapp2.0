-- ============================================
-- INTELLIZAP - MIGRAÇÃO COMPLETA PARA SUPABASE
-- Execute este SQL no SQL Editor do Supabase
-- ============================================
-- ORDEM DE EXECUÇÃO:
-- 1. Funções auxiliares
-- 2. Tabela usuarios (já existe, mas incluída para referência)
-- 3. Tabela grupos
-- 4. Tabela mensagens
-- 5. Tabela resumos
-- 6. Índices
-- 7. RLS (Row Level Security)
-- 8. Triggers
-- ============================================

-- ============================================
-- 1. FUNÇÕES AUXILIARES
-- ============================================

-- Função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 2. TABELA USUARIOS (referência - já deve existir)
-- ============================================
-- Se a tabela já existe, pule esta seção
-- DROP TABLE IF EXISTS usuarios CASCADE;

CREATE TABLE IF NOT EXISTS usuarios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_id UUID UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  nome VARCHAR(255),
  email VARCHAR(255) UNIQUE,
  instancia VARCHAR(255),
  is_admin BOOLEAN DEFAULT false,
  plano_ativo BOOLEAN DEFAULT false,
  max_grupos INTEGER DEFAULT 3,
  tokens_mes INTEGER DEFAULT 1000,
  "horaResumo" VARCHAR(10) DEFAULT '09:00',
  "resumoDiaAnterior" BOOLEAN DEFAULT false,
  transcricao_ativa BOOLEAN DEFAULT false,
  "transcricao-pvd" BOOLEAN DEFAULT false,
  "transcreverEu" BOOLEAN DEFAULT false,
  ludico BOOLEAN DEFAULT false,
  agendamento BOOLEAN DEFAULT false,
  "key-openai" VARCHAR(255),
  ambiente VARCHAR(10) DEFAULT 'prod',
  avatar_url TEXT,
  "dia-renovacao-tokens" INTEGER,
  criado_em TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 3. TABELA GRUPOS
-- ============================================
DROP TABLE IF EXISTS grupos CASCADE;

CREATE TABLE grupos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Identificação
  nome_grupo VARCHAR(255),
  grupo_id_externo VARCHAR(255),  -- ID do grupo no WhatsApp

  -- Relacionamento com usuário
  usuario_id UUID REFERENCES usuarios(id) ON DELETE CASCADE,

  -- Status
  ativo BOOLEAN DEFAULT true,

  -- Configurações do grupo
  transcricao_ativa BOOLEAN DEFAULT true,
  resumo_ativo BOOLEAN DEFAULT true,
  ludico BOOLEAN DEFAULT false,

  -- Timestamps
  criado_em TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Comentários das colunas
COMMENT ON TABLE grupos IS 'Grupos de WhatsApp vinculados aos usuários';
COMMENT ON COLUMN grupos.grupo_id_externo IS 'ID externo do grupo no WhatsApp (jid)';
COMMENT ON COLUMN grupos.transcricao_ativa IS 'Se a transcrição de áudios está ativa para este grupo';
COMMENT ON COLUMN grupos.resumo_ativo IS 'Se os resumos automáticos estão ativos para este grupo';
COMMENT ON COLUMN grupos.ludico IS 'Se o modo lúdico está ativo para este grupo';

-- ============================================
-- 4. TABELA MENSAGENS
-- ============================================
DROP TABLE IF EXISTS mensagens CASCADE;

CREATE TABLE mensagens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Relacionamentos
  grupo_id UUID REFERENCES grupos(id) ON DELETE CASCADE,
  usuario_id UUID REFERENCES usuarios(id) ON DELETE CASCADE,

  -- Conteúdo da mensagem
  mensagem TEXT,

  -- Informações do autor
  "nome-autor" VARCHAR(255) NOT NULL,
  "numero-autor" VARCHAR(50) NOT NULL,

  -- Timestamps
  data_mensagem TIMESTAMPTZ,
  criado_em TIMESTAMPTZ DEFAULT NOW()
);

-- Comentários das colunas
COMMENT ON TABLE mensagens IS 'Mensagens recebidas dos grupos de WhatsApp';
COMMENT ON COLUMN mensagens."nome-autor" IS 'Nome do autor da mensagem no WhatsApp';
COMMENT ON COLUMN mensagens."numero-autor" IS 'Número de telefone do autor';

-- ============================================
-- 5. TABELA RESUMOS
-- ============================================
DROP TABLE IF EXISTS resumos CASCADE;

-- Criar tipo ENUM para status (se não existir)
DO $$ BEGIN
  CREATE TYPE resumo_status AS ENUM ('enviado', 'erro', 'pendente');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

CREATE TABLE resumos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Relacionamentos
  grupo_id UUID NOT NULL REFERENCES grupos(id) ON DELETE CASCADE,
  usuario_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,

  -- Conteúdo do resumo
  conteudo TEXT NOT NULL,
  total_mensagens INTEGER DEFAULT 0,

  -- Status e erro
  status resumo_status DEFAULT 'pendente',
  erro_msg TEXT,

  -- Timestamps
  data_criacao TIMESTAMPTZ DEFAULT NOW(),
  data_envio TIMESTAMPTZ,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Comentários das colunas
COMMENT ON TABLE resumos IS 'Resumos gerados automaticamente para os grupos';
COMMENT ON COLUMN resumos.conteudo IS 'Conteúdo do resumo gerado pela IA';
COMMENT ON COLUMN resumos.total_mensagens IS 'Quantidade de mensagens processadas no resumo';
COMMENT ON COLUMN resumos.status IS 'Status do envio: pendente, enviado ou erro';
COMMENT ON COLUMN resumos.erro_msg IS 'Mensagem de erro caso o envio falhe';

-- ============================================
-- 6. ÍNDICES
-- ============================================

-- Índices para usuarios
CREATE INDEX IF NOT EXISTS idx_usuarios_auth_id ON usuarios(auth_id);
CREATE INDEX IF NOT EXISTS idx_usuarios_email ON usuarios(email);
CREATE INDEX IF NOT EXISTS idx_usuarios_instancia ON usuarios(instancia);
CREATE INDEX IF NOT EXISTS idx_usuarios_plano_ativo ON usuarios(plano_ativo);
CREATE INDEX IF NOT EXISTS idx_usuarios_is_admin ON usuarios(is_admin);

-- Índices para grupos
CREATE INDEX idx_grupos_usuario_id ON grupos(usuario_id);
CREATE INDEX idx_grupos_grupo_id_externo ON grupos(grupo_id_externo);
CREATE INDEX idx_grupos_ativo ON grupos(ativo);
CREATE INDEX idx_grupos_criado_em ON grupos(criado_em);
CREATE INDEX idx_grupos_usuario_ativo ON grupos(usuario_id, ativo);

-- Índices para mensagens
CREATE INDEX idx_mensagens_grupo_id ON mensagens(grupo_id);
CREATE INDEX idx_mensagens_usuario_id ON mensagens(usuario_id);
CREATE INDEX idx_mensagens_data_mensagem ON mensagens(data_mensagem);
CREATE INDEX idx_mensagens_grupo_data ON mensagens(grupo_id, data_mensagem);
CREATE INDEX idx_mensagens_numero_autor ON mensagens("numero-autor");

-- Índices para resumos
CREATE INDEX idx_resumos_grupo_id ON resumos(grupo_id);
CREATE INDEX idx_resumos_usuario_id ON resumos(usuario_id);
CREATE INDEX idx_resumos_status ON resumos(status);
CREATE INDEX idx_resumos_data_criacao ON resumos(data_criacao);
CREATE INDEX idx_resumos_data_envio ON resumos(data_envio);
CREATE INDEX idx_resumos_usuario_status ON resumos(usuario_id, status);
CREATE INDEX idx_resumos_grupo_data ON resumos(grupo_id, data_criacao);

-- ============================================
-- 7. ROW LEVEL SECURITY (RLS)
-- ============================================

-- Habilitar RLS em todas as tabelas
ALTER TABLE usuarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE grupos ENABLE ROW LEVEL SECURITY;
ALTER TABLE mensagens ENABLE ROW LEVEL SECURITY;
ALTER TABLE resumos ENABLE ROW LEVEL SECURITY;

-- ============================================
-- POLÍTICAS PARA USUARIOS
-- ============================================

-- Usuários podem ver seus próprios dados
DROP POLICY IF EXISTS "Users can view own profile" ON usuarios;
CREATE POLICY "Users can view own profile" ON usuarios
  FOR SELECT USING (auth.uid() = auth_id);

-- Usuários podem atualizar seus próprios dados
DROP POLICY IF EXISTS "Users can update own profile" ON usuarios;
CREATE POLICY "Users can update own profile" ON usuarios
  FOR UPDATE USING (auth.uid() = auth_id);

-- Usuários podem inserir seu próprio perfil
DROP POLICY IF EXISTS "Users can insert own profile" ON usuarios;
CREATE POLICY "Users can insert own profile" ON usuarios
  FOR INSERT WITH CHECK (auth.uid() = auth_id);

-- ============================================
-- POLÍTICAS PARA GRUPOS
-- ============================================

-- Usuários podem ver seus próprios grupos
DROP POLICY IF EXISTS "Users can view own groups" ON grupos;
CREATE POLICY "Users can view own groups" ON grupos
  FOR SELECT USING (
    usuario_id IN (
      SELECT id FROM usuarios WHERE auth_id = auth.uid()
    )
  );

-- Usuários podem criar grupos para si mesmos
DROP POLICY IF EXISTS "Users can create own groups" ON grupos;
CREATE POLICY "Users can create own groups" ON grupos
  FOR INSERT WITH CHECK (
    usuario_id IN (
      SELECT id FROM usuarios WHERE auth_id = auth.uid()
    )
  );

-- Usuários podem atualizar seus próprios grupos
DROP POLICY IF EXISTS "Users can update own groups" ON grupos;
CREATE POLICY "Users can update own groups" ON grupos
  FOR UPDATE USING (
    usuario_id IN (
      SELECT id FROM usuarios WHERE auth_id = auth.uid()
    )
  );

-- Usuários podem deletar seus próprios grupos
DROP POLICY IF EXISTS "Users can delete own groups" ON grupos;
CREATE POLICY "Users can delete own groups" ON grupos
  FOR DELETE USING (
    usuario_id IN (
      SELECT id FROM usuarios WHERE auth_id = auth.uid()
    )
  );

-- ============================================
-- POLÍTICAS PARA MENSAGENS
-- ============================================

-- Usuários podem ver mensagens dos seus grupos
DROP POLICY IF EXISTS "Users can view messages from own groups" ON mensagens;
CREATE POLICY "Users can view messages from own groups" ON mensagens
  FOR SELECT USING (
    grupo_id IN (
      SELECT g.id FROM grupos g
      JOIN usuarios u ON g.usuario_id = u.id
      WHERE u.auth_id = auth.uid()
    )
  );

-- Usuários podem inserir mensagens em seus grupos
DROP POLICY IF EXISTS "Users can insert messages in own groups" ON mensagens;
CREATE POLICY "Users can insert messages in own groups" ON mensagens
  FOR INSERT WITH CHECK (
    grupo_id IN (
      SELECT g.id FROM grupos g
      JOIN usuarios u ON g.usuario_id = u.id
      WHERE u.auth_id = auth.uid()
    )
  );

-- Usuários podem deletar mensagens dos seus grupos
DROP POLICY IF EXISTS "Users can delete messages from own groups" ON mensagens;
CREATE POLICY "Users can delete messages from own groups" ON mensagens
  FOR DELETE USING (
    grupo_id IN (
      SELECT g.id FROM grupos g
      JOIN usuarios u ON g.usuario_id = u.id
      WHERE u.auth_id = auth.uid()
    )
  );

-- ============================================
-- POLÍTICAS PARA RESUMOS
-- ============================================

-- Usuários podem ver seus próprios resumos
DROP POLICY IF EXISTS "Users can view own resumos" ON resumos;
CREATE POLICY "Users can view own resumos" ON resumos
  FOR SELECT USING (
    usuario_id IN (
      SELECT id FROM usuarios WHERE auth_id = auth.uid()
    )
  );

-- Usuários podem criar resumos para seus grupos
DROP POLICY IF EXISTS "Users can create own resumos" ON resumos;
CREATE POLICY "Users can create own resumos" ON resumos
  FOR INSERT WITH CHECK (
    usuario_id IN (
      SELECT id FROM usuarios WHERE auth_id = auth.uid()
    )
    AND grupo_id IN (
      SELECT g.id FROM grupos g
      JOIN usuarios u ON g.usuario_id = u.id
      WHERE u.auth_id = auth.uid()
    )
  );

-- Usuários podem atualizar seus próprios resumos
DROP POLICY IF EXISTS "Users can update own resumos" ON resumos;
CREATE POLICY "Users can update own resumos" ON resumos
  FOR UPDATE USING (
    usuario_id IN (
      SELECT id FROM usuarios WHERE auth_id = auth.uid()
    )
  );

-- Usuários podem deletar seus próprios resumos
DROP POLICY IF EXISTS "Users can delete own resumos" ON resumos;
CREATE POLICY "Users can delete own resumos" ON resumos
  FOR DELETE USING (
    usuario_id IN (
      SELECT id FROM usuarios WHERE auth_id = auth.uid()
    )
  );

-- ============================================
-- 8. TRIGGERS
-- ============================================

-- Trigger para atualizar updated_at na tabela usuarios
DROP TRIGGER IF EXISTS update_usuarios_updated_at ON usuarios;
CREATE TRIGGER update_usuarios_updated_at
  BEFORE UPDATE ON usuarios
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger para atualizar updated_at na tabela grupos
DROP TRIGGER IF EXISTS update_grupos_updated_at ON grupos;
CREATE TRIGGER update_grupos_updated_at
  BEFORE UPDATE ON grupos
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger para atualizar updated_at na tabela resumos
DROP TRIGGER IF EXISTS update_resumos_updated_at ON resumos;
CREATE TRIGGER update_resumos_updated_at
  BEFORE UPDATE ON resumos
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 9. FUNÇÃO PARA AUTO-CRIAR PERFIL DE USUÁRIO
-- ============================================

-- Função que cria automaticamente um registro em usuarios quando um usuário se registra
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.usuarios (auth_id, email, nome)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1))
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger que dispara quando um novo usuário é criado no auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- 10. VERIFICAÇÃO FINAL
-- ============================================

-- Verificar se todas as tabelas foram criadas
SELECT
  table_name,
  (SELECT count(*) FROM information_schema.columns WHERE table_name = t.table_name) as columns_count
FROM information_schema.tables t
WHERE table_schema = 'public'
  AND table_name IN ('usuarios', 'grupos', 'mensagens', 'resumos')
ORDER BY table_name;

-- ============================================
-- FIM DA MIGRAÇÃO
-- ============================================
