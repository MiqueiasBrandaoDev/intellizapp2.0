-- ============================================
-- SUPABASE SETUP - TABELA USUARIOS
-- Execute este SQL no SQL Editor do Supabase
-- ============================================

-- 1. REMOVER TABELA ANTIGA
DROP TABLE IF EXISTS usuarios CASCADE;

-- 2. CRIAR TABELA USUARIOS
CREATE TABLE usuarios (
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

-- 3. CRIAR ÍNDICES
CREATE INDEX idx_usuarios_auth_id ON usuarios(auth_id);
CREATE INDEX idx_usuarios_email ON usuarios(email);

-- 4. HABILITAR RLS (Row Level Security)
ALTER TABLE usuarios ENABLE ROW LEVEL SECURITY;

-- 5. POLÍTICAS DE SEGURANÇA

-- Usuários podem ver seus próprios dados
CREATE POLICY "Users can view own profile" ON usuarios
  FOR SELECT USING (auth.uid() = auth_id);

-- Usuários podem atualizar seus próprios dados
CREATE POLICY "Users can update own profile" ON usuarios
  FOR UPDATE USING (auth.uid() = auth_id);

-- Usuários podem inserir seu próprio perfil
CREATE POLICY "Users can insert own profile" ON usuarios
  FOR INSERT WITH CHECK (auth.uid() = auth_id);

-- 6. TRIGGER PARA ATUALIZAR updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_usuarios_updated_at
  BEFORE UPDATE ON usuarios
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();