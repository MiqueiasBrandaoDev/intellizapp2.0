# Migração Intellizapp → Resumefy

## Visão Geral

Este documento detalha a migração de branding do sistema **Intellizapp** para **Resumefy**. A migração foi realizada **apenas na camada de interface (UI)**, mantendo todo o código interno, APIs, banco de dados e estrutura de arquivos intactos.

**Data da migração:** Janeiro 2026
**Versão:** 2.0-dev
**Branch:** dev2.0

---

## Resumo das Alterações

### Nomenclaturas Alteradas

| Termo Antigo | Termo Novo | Contexto |
|--------------|------------|----------|
| Intellizapp | Resumefy | Nome do sistema/marca |
| Intellizapp.IA | Resumefy | Nome completo do sistema |
| IntelliChat | ResumeChat | Chat com IA |
| IntelliCoins | ResumeCoins | Moeda virtual do sistema |

---

## Arquivos Modificados

### 1. Configuração Principal

#### `index.html`
```html
<!-- ANTES -->
<title>Intellizapp</title>
<meta name="description" content="Intellizapp - Your AI Assistant for WhatsApp" />
<meta name="keywords" content="Intellizapp, AI Assistant, WhatsApp, Chatbot, Automation" />
<meta name="author" content="Intellizapp Team" />

<!-- DEPOIS -->
<title>Resumefy</title>
<meta name="description" content="Resumefy - Your AI Assistant for WhatsApp" />
<meta name="keywords" content="Resumefy, AI Assistant, WhatsApp, Chatbot, Automation" />
<meta name="author" content="Resumefy Team" />
```

---

### 2. Páginas de Autenticação

#### `src/pages/auth/Login.tsx`
- Título principal: `Intellizapp.IA` → `Resumefy`
- Toast de boas-vindas: `"Bem-vindo ao Intellizapp.IA"` → `"Bem-vindo ao Resumefy"`
- Footer: `"Intellizapp.IA - Todos os direitos reservados"` → `"Resumefy - Todos os direitos reservados"`

#### `src/pages/auth/Register.tsx`
- Footer: `"Intellizapp.IA - Todos os direitos reservados"` → `"Resumefy - Todos os direitos reservados"`

#### `src/pages/auth/ForgotPassword.tsx`
- Footer (2 ocorrências): `"Intellizapp.IA - Todos os direitos reservados"` → `"Resumefy - Todos os direitos reservados"`

#### `src/pages/auth/ResetPassword.tsx`
- Footer (2 ocorrências): `"Intellizapp.IA - Todos os direitos reservados"` → `"Resumefy - Todos os direitos reservados"`

---

### 3. Layout do Dashboard

#### `src/components/layout/DashboardLayout.tsx`
- Logo no sidebar: `Intellizapp.IA` → `Resumefy`
- Item do menu: `IntelliChat` → `ResumeChat`

```tsx
// ANTES
<span className="text-xl font-bold cyber-text">Intellizapp.IA</span>
const intelliChatItem = { name: 'IntelliChat', ... };

// DEPOIS
<span className="text-xl font-bold cyber-text">Resumefy</span>
const intelliChatItem = { name: 'ResumeChat', ... };
```

---

### 4. Página do Chat com IA

#### `src/pages/IntelliChat.tsx`
- Título da página: `IntelliChat` → `ResumeChat`

```tsx
// ANTES
<h1 className="text-xl font-bold">IntelliChat</h1>

// DEPOIS
<h1 className="text-xl font-bold">ResumeChat</h1>
```

#### `src/components/IntelliChatHistoryModal.tsx`
- Descrição do modal: `"...com o IntelliChat"` → `"...com o ResumeChat"`

---

### 5. Página Meu Plano

#### `src/pages/MeuPlano.tsx`
Todas as ocorrências de `IntelliCoins` foram alteradas para `ResumeCoins`:

- Título do card: `IntelliCoins Disponíveis` → `ResumeCoins Disponíveis`
- Alerta de saldo baixo: `IntelliCoins baixos` → `ResumeCoins baixos`
- Avisos sobre transcrições
- Textos explicativos sobre funcionamento
- Labels e descrições

---

### 6. Página de Configurações

#### `src/pages/Settings.tsx`
- Aviso sobre transcrições: `"...consomem IntelliCoins..."` → `"...consomem ResumeCoins..."`

---

## O Que NÃO Foi Alterado

### Código Interno (Mantido como está)

Os seguintes itens foram **intencionalmente mantidos** para não quebrar o código:

#### 1. Nomes de Arquivos
```
src/pages/IntelliChat.tsx                    # Mantido
src/components/IntelliChatHistoryModal.tsx   # Mantido
src/hooks/useIntelliChatSessions.ts          # Mantido
```

#### 2. Interfaces e Types (`src/types/database.ts`)
```typescript
// Todos mantidos:
interface IntelliChatSession { ... }
interface IntelliChatMensagem { ... }
interface CreateIntelliChatSessionData { ... }
interface CreateIntelliChatMensagemData { ... }
interface IntelliChatSessionWithMessages { ... }
```

#### 3. Funções e Métodos da API (`src/services/api.ts`)
```typescript
// Todos mantidos:
sendIntelliChatMessage()
getUserSessions()           // Endpoint: /api/intellichat-sessions/...
getOrCreateActiveSession()
createNewSession()
getSessionMessages()
saveMessage()
updateSessionTitle()
activateSession()
```

#### 4. Hooks
```typescript
// Mantido:
useIntelliChatSessions()
```

#### 5. Variáveis Internas
```typescript
// Exemplo em MeuPlano.tsx - variável mantida:
const intelliCoinsDisponiveis = Math.floor((profile?.tokens_mes || 0) / 1000);
```

#### 6. Rotas da Aplicação (`src/App.tsx`)
```typescript
// Mantidas:
<Route path="intellichat" element={<IntelliChat />} />
// URL: /dashboard/intellichat
```

#### 7. Comentários no Código
```typescript
// Comentários como "// IntelliChat endpoints" foram mantidos
```

#### 8. Endpoints do Backend
Todos os endpoints do backend permanecem inalterados:
- `/api/intellichat`
- `/api/intellichat-sessions/*`

#### 9. Banco de Dados
Tabelas e colunas mantêm os nomes originais.

#### 10. Arquivos de Configuração Docker
- `docker-compose.yml`
- `docker-compose.easypanel.yml`
- Containers ainda nomeados como `intellizapp-*`

#### 11. Emails HTML do Backend
- `backend/email-*.html` - Mantêm referências a IntelliZapp.IA

#### 12. Landing Page
- `landing-page.html` - Mantém referências originais

---

## Guia para Desenvolvedores

### Regra Principal

> **Altere apenas o que o usuário VÊ na interface. Nunca altere nomes de variáveis, funções, arquivos, endpoints ou estruturas de dados.**

### Como Identificar o Que Alterar

| Tipo | Alterar? | Exemplo |
|------|----------|---------|
| Textos visíveis em tela | ✅ SIM | Títulos, labels, mensagens |
| Nomes de arquivos | ❌ NÃO | `IntelliChat.tsx` |
| Nomes de componentes | ❌ NÃO | `function IntelliChat()` |
| Interfaces/Types | ❌ NÃO | `IntelliChatSession` |
| Nomes de funções | ❌ NÃO | `sendIntelliChatMessage()` |
| Variáveis | ❌ NÃO | `intelliCoinsDisponiveis` |
| Endpoints da API | ❌ NÃO | `/api/intellichat` |
| Rotas da aplicação | ❌ NÃO | `/dashboard/intellichat` |
| Comentários | ❌ NÃO | `// IntelliChat endpoints` |

### Onde Procurar Textos para Alterar

Use grep/busca para encontrar textos visíveis:

```bash
# Buscar textos visíveis (geralmente entre > e <, ou em strings)
grep -r "Intellizapp" src/ --include="*.tsx"
grep -r "IntelliChat" src/ --include="*.tsx"
grep -r "IntelliCoins" src/ --include="*.tsx"
```

### Checklist para Novas Alterações de Branding

1. [ ] Verificar `index.html` (título e meta tags)
2. [ ] Verificar páginas de autenticação (`src/pages/auth/`)
3. [ ] Verificar layout do dashboard (`src/components/layout/`)
4. [ ] Verificar páginas principais (`src/pages/`)
5. [ ] Verificar modais e componentes com texto visível
6. [ ] **NÃO** alterar imports, exports, nomes de arquivos
7. [ ] **NÃO** alterar estruturas de tipos/interfaces
8. [ ] **NÃO** alterar endpoints ou rotas

### Exemplo Prático

**Situação:** Preciso alterar "ResumeChat" para "SmartChat"

**Correto:**
```tsx
// Em IntelliChat.tsx - APENAS o texto visível
<h1 className="text-xl font-bold">SmartChat</h1>

// O nome do arquivo e função permanecem:
// Arquivo: IntelliChat.tsx
// Função: export default function IntelliChat()
```

**Incorreto:**
```tsx
// NÃO faça isso:
// - Renomear arquivo para SmartChat.tsx
// - Renomear função para SmartChat()
// - Alterar imports/exports
```

---

## Arquivos de Referência

### Estrutura de Arquivos Relevantes

```
src/
├── pages/
│   ├── auth/
│   │   ├── Login.tsx           # ✅ Alterado (textos)
│   │   ├── Register.tsx        # ✅ Alterado (footer)
│   │   ├── ForgotPassword.tsx  # ✅ Alterado (footer)
│   │   └── ResetPassword.tsx   # ✅ Alterado (footer)
│   ├── IntelliChat.tsx         # ✅ Alterado (título) | Nome arquivo mantido
│   ├── MeuPlano.tsx            # ✅ Alterado (ResumeCoins)
│   └── Settings.tsx            # ✅ Alterado (aviso)
├── components/
│   ├── layout/
│   │   └── DashboardLayout.tsx # ✅ Alterado (logo, menu)
│   └── IntelliChatHistoryModal.tsx # ✅ Alterado (descrição) | Nome mantido
├── hooks/
│   └── useIntelliChatSessions.ts   # ❌ Não alterado (código)
├── services/
│   └── api.ts                      # ❌ Não alterado (código)
├── types/
│   └── database.ts                 # ❌ Não alterado (interfaces)
└── contexts/
    └── AuthContext.tsx             # ❌ Não alterado (código)
```

---

## Notas Adicionais

### Por Que Não Alterar o Código Interno?

1. **Risco de quebra:** Alterar nomes de funções/variáveis requer atualizar todas as referências
2. **Banco de dados:** Estruturas de dados estão vinculadas aos nomes atuais
3. **Backend:** APIs esperam os nomes atuais nos endpoints
4. **Testes:** Testes podem depender dos nomes atuais
5. **Versionamento:** Facilita comparação entre versões

### Migração Completa (Se Necessário no Futuro)

Se for decidido fazer uma migração completa de código, será necessário:

1. Criar script de migração para renomear arquivos
2. Atualizar todos os imports/exports
3. Atualizar interfaces e types
4. Atualizar endpoints da API (backend)
5. Migrar dados do banco (se necessário)
6. Atualizar documentação da API
7. Atualizar testes
8. Atualizar configurações Docker

**Recomendação:** Manter a abordagem atual (apenas UI) a menos que haja uma necessidade crítica de migração completa.

---

## Histórico de Alterações

| Data | Alteração | Autor |
|------|-----------|-------|
| Jan/2026 | Migração inicial Intellizapp → Resumefy | Claude AI |
| Jan/2026 | IntelliChat → ResumeChat | Claude AI |
| Jan/2026 | IntelliCoins → ResumeCoins | Claude AI |

---

## Contato e Suporte

Para dúvidas sobre esta migração ou o padrão de desenvolvimento, consulte este documento ou entre em contato com a equipe de desenvolvimento.
