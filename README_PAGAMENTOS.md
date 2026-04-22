# 💳 Microsserviço de Pagamentos - CompreFácil

> Um microsserviço robusto de processamento de pagamentos com Node.js, Express, PostgreSQL e RabbitMQ

## 🎯 O que é este Projeto?

Sistema bacana que:

1. **Recebe pagamentos** via REST API
2. **Armazena** seus dados no PostgreSQL
3. **Processa** de forma assíncrona
4. **Notifica** via RabbitMQ para outros serviços

Tudo rodando em containers Docker! 🐳

---

## ⚡ Começar em 30 Segundos

```bash
# 1. Clone ou acesse o projeto
cd Desafio\ 2

# 2. Inicie com Docker
docker-compose up --build

# 3. Em outro terminal, teste
curl -X POST http://localhost:3001/payments \
  -H "Content-Type: application/json" \
  -d '{"userId":"você","amount":100,"description":"teste"}'
```

**Esperado:** Resposta com `status: "pending"` (muda para `"success"` em 3s) ✅

---

## 📚 Documentação Completa

### Iniciante? Comece aqui 👇

| Documento | Descrição | Tempo |
|-----------|-----------|-------|
| **[QUICK_START.md](./QUICK_START.md)** | Rodar e testar em 2 minutos | 2 min |
| **[GUIA_IMPLEMENTACAO.md](./GUIA_IMPLEMENTACAO.md)** | Explicação detalhada de tudo | 10 min |
| **[EXEMPLOS_TESTES.md](./EXEMPLOS_TESTES.md)** | 50+ exemplos prontos para copiar | variável |
| **[INTEGRACAO_RABBITMQ.md](./INTEGRACAO_RABBITMQ.md)** | Como as mensagens fluem | 5 min |

---

## 🏗️ Arquitetura Simplificada

```
┌──────────────┐
│   Cliente    │ POST /payments
└──────┬───────┘
       │
       ▼
┌──────────────────────────────┐
│  MS-Payment-Service          │
│  • Valida dados              │
│  • Cria pagamento            │
│  • Publica em RabbitMQ       │
└──────┬───────────────────────┘
       │
       ├──→ PostgreSQL (Armazena)
       │
       └──→ RabbitMQ (Notifica)
              │
              ▼
           MS-Notification-Service
           (Envia emails, SMS, etc)
```

---

## 📋 Endpoints da API

### `POST /payments` - Criar Pagamento ⭐

```bash
curl -X POST http://localhost:3001/payments \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "cliente123",
    "amount": 99.99,
    "description": "Seu pedido"
  }'
```

**Resposta (201):**
```json
{
  "message": "Solicitação de transação recebida com sucesso",
  "payment": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "userId": "cliente123",
    "amount": "99.99",
    "status": "pending",
    "createdAt": "2026-04-22T10:30:00.000Z"
  }
}
```

### `GET /payments` - Listar Todos

```bash
curl http://localhost:3001/payments
```

### `GET /payments/:id` - Buscar Um

```bash
curl http://localhost:3001/payments/550e8400-e29b-41d4-a716-446655440000
```

### `GET /health` - Status do Serviço

```bash
curl http://localhost:3001/health
```

---

## 🔄 Fluxo de um Pagamento

```
1. Cliente envia POST /payments
         ↓
2. Serviço valida dados
         ↓
3. Salva no PostgreSQL com status "pending"
         ↓
4. Publica mensagem em "payment.pending"
         ↓
5. Retorna 201 ao cliente ✅
         ↓
6. [Assíncrono] Aguarda 3 segundos
         ↓
7. Atualiza status para "success"
         ↓
8. Publica mensagem em "payment.confirmed"
         ↓
9. Notification Service recebe e notifica cliente
```

---

## 🛠️ Stack Tecnológico

| Tecnologia | Uso |
|-----------|-----|
| **Node.js** | Runtime |
| **Express** | Framework Web |
| **PostgreSQL** | Banco de dados |
| **Sequelize** | ORM (Object-Relational Mapping) |
| **RabbitMQ** | Message Broker |
| **amqplib** | Cliente RabbitMQ |
| **Docker** | Containerização |

---

## 📂 Estrutura do Projeto

```
ms-payment-service/
├── src/
│   ├── index.js                    # Arquivo principal
│   ├── config/
│   │   ├── database.js             # Conexão PostgreSQL
│   │   └── rabbitmq.js             # Conexão RabbitMQ
│   ├── models/
│   │   └── Payment.js              # Modelo de dados
│   ├── controllers/
│   │   └── payment.controller.js   # Lógica HTTP
│   ├── services/
│   │   └── payment.service.js      # Lógica de negócio
│   └── routes/
│       └── payment.routes.js       # Definição de rotas
├── Dockerfile                      # Container config
└── package.json                    # Dependências
```

---

## 🧪 Testando Tudo

### Resumo Rápido
```bash
# Terminal 1: Iniciar
docker-compose up

# Terminal 2: Testar
chmod +x teste.sh
./teste.sh
```

### Ou Manual
```bash
# 1. Health check
curl http://localhost:3001/health

# 2. Criar pagamento
curl -X POST http://localhost:3001/payments \
  -H "Content-Type: application/json" \
  -d '{"userId":"teste","amount":100}'

# 3. Ver dados
curl http://localhost:3001/payments
```

---

## 🔌 Monitorar RabbitMQ

```
Dashboard: http://localhost:15672
Usuário: admin
Senha: admin
```

Você verá as filas:
- `payment.pending` - Pagamentos recebidos
- `payment.confirmed` - Pagamentos confirmados

---

## ✨ Características

✅ **Validação de Entrada** - userId e amount obrigatórios
✅ **Status Automático** - pending → success em 3s
✅ **Mensageria** - Integração com RabbitMQ
✅ **Persistência** - PostgreSQL com timestamps
✅ **Docker** - Tudo containerizado
✅ **Tratamento de Erros** - Respostas HTTP apropriadas
✅ **Health Check** - Monitoramento de status
✅ **Retry Automático** - Reconexão em caso de falha

---

## 🚀 Próximos Passos

- [ ] Implementar autenticação (JWT)
- [ ] Adicionar validação de CPF/CNPJ
- [ ] Integrar com gateway de pagamento real
- [ ] Implementar testes automatizados
- [ ] Adicionar logs estruturados
- [ ] Implementar rate limiting
- [ ] Documentação com OpenAPI/Swagger

---

## 📖 Leitura Recomendada

1. **Iniciante**: [QUICK_START.md](./QUICK_START.md) (2 minutos)
2. **Desenvolvimento**: [GUIA_IMPLEMENTACAO.md](./GUIA_IMPLEMENTACAO.md) (10 minutos)
3. **Testes**: [EXEMPLOS_TESTES.md](./EXEMPLOS_TESTES.md) (conforme necessário)
4. **Advanced**: [INTEGRACAO_RABBITMQ.md](./INTEGRACAO_RABBITMQ.md) (5 minutos)

---

## 🆘 Troubleshooting

### Erro: "Não consegue conectar ao banco"
```bash
# Verifique se PostgreSQL está rodando
docker-compose logs postgres

# Ou reinicie
docker-compose down && docker-compose up
```

### Erro: "Não consegue conectar ao RabbitMQ"
```bash
# Acesse o dashboard
curl http://localhost:15672
# User: admin, Pass: admin
```

### Porta 3001 já em uso
```bash
# Use outra porta
PORT=3002 npm start
```

---

## 📞 Suporte

Se algo não funcionar:

1. Leia o [GUIA_IMPLEMENTACAO.md](./GUIA_IMPLEMENTACAO.md)
2. Verifique os [EXEMPLOS_TESTES.md](./EXEMPLOS_TESTES.md)
3. Veja os logs: `docker-compose logs ms-payment-service`
4. Reinicie tudo: `docker-compose down && docker-compose up`

---

## 📄 Licença

Projeto académico - Faculdade SESI-SENAI

---

## 🎓 Créditos

Desenvolvido para o Desafio 2 de Desenvolvimento de Sistemas Móveis e Distribuídos - Quarto Semestre

---

<div align="center">

**Made with ❤️ usando Node.js + Express + PostgreSQL + RabbitMQ**

[⬆ Voltar ao topo](#-microsserviço-de-pagamentos---comprefácil)

</div>
