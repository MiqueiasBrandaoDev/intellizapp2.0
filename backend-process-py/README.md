# IntelliZap Process Backend (Python)

Backend de processamento para o IntelliZap - responsável por toda lógica de negócio, processamento de mensagens, geração de resumos e integrações com IA.

## Objetivo

Este backend substitui os workflows do n8n e centraliza todo o processamento de dados do IntelliZap. Ele opera de forma independente da interface (frontend), trabalhando diretamente com o banco de dados Supabase.

### Responsabilidades

- **Receber webhooks** da Evolution API (mensagens do WhatsApp)
- **Processar mensagens** e armazená-las no banco
- **Gerar resumos** usando OpenAI/LLMs
- **Transcrever áudios** recebidos nos grupos
- **Agendar tarefas** (envio de resumos diários)
- **Enviar mensagens** de volta para o WhatsApp via Evolution API

## Arquitetura SaaS

O IntelliZap é uma aplicação SaaS multi-tenant onde:

```
┌─────────────────────────────────────────────────────────────────┐
│                         USUÁRIOS                                │
│  Cada usuário tem sua própria instância do WhatsApp conectada   │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      EVOLUTION API                              │
│         (Gerencia conexões WhatsApp dos usuários)               │
│                                                                 │
│  - Cada usuário = 1 instância                                   │
│  - Webhooks enviados para este backend                          │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                 BACKEND PROCESS (Este projeto)                  │
│                                                                 │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │   Webhooks   │  │  Scheduler   │  │   Workers    │          │
│  │   Receiver   │  │   (Cron)     │  │  (Async)     │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
│         │                 │                 │                   │
│         └─────────────────┴─────────────────┘                   │
│                           │                                     │
│                           ▼                                     │
│                  ┌──────────────┐                               │
│                  │   Services   │                               │
│                  │  (Lógica)    │                               │
│                  └──────────────┘                               │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    SUPABASE (PostgreSQL)                        │
│                                                                 │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐       │
│  │ usuarios │  │  grupos  │  │mensagens │  │ resumos  │       │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘       │
└─────────────────────────────────────────────────────────────────┘
```

## Estrutura do Projeto

```
backend-process-py/
├── README.md
├── requirements.txt
├── .env.example
├── main.py                    # Entry point da aplicação
├── config/
│   ├── __init__.py
│   ├── settings.py            # Configurações (env vars)
│   └── database.py            # Conexão Supabase
├── api/
│   ├── __init__.py
│   ├── routes/
│   │   ├── __init__.py
│   │   ├── webhooks.py        # Endpoints para webhooks Evolution
│   │   └── health.py          # Health check
│   └── dependencies.py        # Injeção de dependências
├── services/
│   ├── __init__.py
│   ├── message_service.py     # Processamento de mensagens
│   ├── resumo_service.py      # Geração de resumos
│   ├── transcription_service.py  # Transcrição de áudios
│   ├── openai_service.py      # Integração OpenAI
│   └── evolution_service.py   # Integração Evolution API
├── workers/
│   ├── __init__.py
│   ├── scheduler.py           # Agendador de tarefas
│   └── tasks/
│       ├── __init__.py
│       ├── daily_resumo.py    # Task: envio de resumos diários
│       └── cleanup.py         # Task: limpeza de dados antigos
├── models/
│   ├── __init__.py
│   ├── usuario.py
│   ├── grupo.py
│   ├── mensagem.py
│   └── resumo.py
├── schemas/
│   ├── __init__.py
│   ├── webhook.py             # Schemas dos webhooks Evolution
│   └── resumo.py              # Schemas de request/response
└── utils/
    ├── __init__.py
    ├── logger.py              # Configuração de logs
    └── helpers.py             # Funções auxiliares
```

## Fluxo de Dados

### 1. Recebimento de Mensagem

```
Evolution API → Webhook → message_service → Supabase (mensagens)
```

1. Evolution API envia webhook com mensagem
2. Backend identifica o grupo e usuário
3. Verifica se grupo está ativo e cadastrado
4. Salva mensagem no banco de dados

### 2. Geração de Resumo (Agendado)

```
Scheduler → resumo_service → OpenAI → Supabase (resumos) → Evolution API
```

1. Scheduler dispara no horário configurado pelo usuário
2. Busca mensagens do período (último dia ou desde último resumo)
3. Envia para OpenAI gerar resumo
4. Salva resumo no banco
5. Envia resumo para o grupo via Evolution API

### 3. Transcrição de Áudio

```
Webhook (áudio) → transcription_service → OpenAI Whisper → Evolution API
```

1. Recebe webhook com mensagem de áudio
2. Baixa o áudio da Evolution API
3. Transcreve usando OpenAI Whisper
4. Envia transcrição como resposta no grupo

## Modelo de Dados

### Tabela: usuarios
| Campo | Tipo | Descrição |
|-------|------|-----------|
| id | UUID | ID interno |
| auth_id | UUID | ID do Supabase Auth |
| instancia | VARCHAR | Nome da instância Evolution |
| horaResumo | VARCHAR | Horário para envio do resumo (ex: "09:00") |
| transcricao_ativa | BOOLEAN | Se transcrição está habilitada |
| key-openai | VARCHAR | Chave OpenAI do usuário (opcional) |
| tokens_mes | INTEGER | Limite de tokens por mês |

### Tabela: grupos
| Campo | Tipo | Descrição |
|-------|------|-----------|
| id | UUID | ID interno |
| grupo_id_externo | VARCHAR | JID do grupo no WhatsApp |
| usuario_id | UUID | FK para usuarios |
| ativo | BOOLEAN | Se está monitorando o grupo |
| resumo_ativo | BOOLEAN | Se gera resumos para este grupo |
| transcricao_ativa | BOOLEAN | Se transcreve áudios neste grupo |

### Tabela: mensagens
| Campo | Tipo | Descrição |
|-------|------|-----------|
| id | UUID | ID interno |
| grupo_id | UUID | FK para grupos |
| mensagem | TEXT | Conteúdo da mensagem |
| nome-autor | VARCHAR | Nome do autor |
| numero-autor | VARCHAR | Número do autor |
| data_mensagem | TIMESTAMP | Data/hora da mensagem |

### Tabela: resumos
| Campo | Tipo | Descrição |
|-------|------|-----------|
| id | UUID | ID interno |
| grupo_id | UUID | FK para grupos |
| usuario_id | UUID | FK para usuarios |
| conteudo | TEXT | Conteúdo do resumo gerado |
| total_mensagens | INTEGER | Quantidade de mensagens processadas |
| status | ENUM | 'pendente', 'enviado', 'erro' |
| data_envio | TIMESTAMP | Quando foi enviado |

## Configuração do Ambiente

### Variáveis de Ambiente

```env
# Supabase
SUPABASE_URL=https://seu-projeto.supabase.co
SUPABASE_SERVICE_KEY=sua-service-role-key

# Evolution API
EVOLUTION_API_URL=https://sua-evolution-api.com
EVOLUTION_API_KEY=sua-api-key

# OpenAI (fallback quando usuário não tem chave própria)
OPENAI_API_KEY=sua-chave-openai

# Aplicação
PORT=8000
ENV=development
LOG_LEVEL=INFO
```

## Integrações Externas

### Evolution API

Base URL configurada via env. Endpoints utilizados:

| Método | Endpoint | Uso |
|--------|----------|-----|
| POST | `/message/sendText/{instance}` | Enviar mensagem de texto |
| GET | `/message/mediaBase64/{instance}` | Baixar mídia (áudio) |
| GET | `/group/fetchAllGroups/{instance}` | Listar grupos |

### OpenAI API

| Endpoint | Uso |
|----------|-----|
| `/v1/chat/completions` | Geração de resumos (GPT-4) |
| `/v1/audio/transcriptions` | Transcrição de áudio (Whisper) |

## Desenvolvimento

### Instalação

```bash
cd backend-process-py
python -m venv venv
source venv/bin/activate  # Linux/Mac
# ou: venv\Scripts\activate  # Windows

pip install -r requirements.txt
```

### Executar em Desenvolvimento

```bash
uvicorn main:app --reload --port 8000
```

### Executar Testes

```bash
pytest tests/ -v
```

## Considerações SaaS

### Multi-tenancy

- Cada usuário tem sua própria instância Evolution
- Dados são isolados por `usuario_id`
- RLS do Supabase garante isolamento em nível de banco

### Limites e Quotas

- `tokens_mes`: limite de tokens OpenAI por usuário/mês
- `max_grupos`: limite de grupos por usuário
- Implementar rate limiting por instância

### Billing (Futuro)

- Rastrear uso de tokens por usuário
- Resetar contadores mensalmente (`dia-renovacao-tokens`)
- Diferentes planos = diferentes limites

## Webhooks da Evolution API

### Eventos Suportados

| Evento | Descrição | Ação |
|--------|-----------|------|
| `messages.upsert` | Nova mensagem recebida | Salvar no banco |
| `messages.update` | Mensagem atualizada | Atualizar status |
| `groups.update` | Grupo atualizado | Sincronizar dados |

### Estrutura do Webhook

```json
{
  "event": "messages.upsert",
  "instance": "nome-da-instancia",
  "data": {
    "key": {
      "remoteJid": "grupo-id@g.us",
      "fromMe": false,
      "id": "message-id"
    },
    "message": {
      "conversation": "texto da mensagem"
    },
    "messageTimestamp": 1234567890,
    "pushName": "Nome do Autor"
  }
}
```

## Logs e Monitoramento

- Logs estruturados em JSON para fácil parsing
- Níveis: DEBUG, INFO, WARNING, ERROR
- Incluir sempre: `usuario_id`, `grupo_id`, `instancia`

## Segurança

- Validar assinatura dos webhooks da Evolution
- Nunca expor chaves de API nos logs
- Usar service_role key apenas no backend
- Sanitizar inputs antes de enviar para OpenAI

## Deploy

Recomendado: Docker + Railway/Render/Fly.io

```dockerfile
FROM python:3.11-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY . .
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
```

---

## Próximos Passos

1. [ ] Configurar estrutura base do projeto
2. [ ] Implementar conexão com Supabase
3. [ ] Criar endpoint de webhook
4. [ ] Implementar service de mensagens
5. [ ] Implementar service de resumos
6. [ ] Implementar scheduler para resumos diários
7. [ ] Implementar transcrição de áudios
8. [ ] Testes unitários e de integração
9. [ ] Deploy em produção
