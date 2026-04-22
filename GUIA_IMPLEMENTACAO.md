# 🚀 Microsserviço de Pagamentos - Guia Completo

## 📋 Resumo da Implementação

Seu microsserviço foi criado com a seguinte arquitetura:

```
ms-payment-service/
├── src/
│   ├── index.js              # Arquivo principal (Express + inicialização)
│   ├── config/
│   │   ├── database.js       # Conexão com PostgreSQL (Sequelize)
│   │   └── rabbitmq.js       # Conexão com RabbitMQ (amqplib)
│   ├── models/
│   │   └── Payment.js        # Modelo da tabela de pagamentos
│   ├── controllers/
│   │   └── payment.controller.js  # Lógica de requisições HTTP
│   ├── services/
│   │   └── payment.service.js     # Lógica de negócio
│   └── routes/
│       └── payment.routes.js      # Definição de rotas
├── Dockerfile
└── package.json
```

---

## 🔍 Explicação de Cada Arquivo

### **1. src/index.js** - Arquivo Principal
```javascript
// Inicializa o Express
// Conecta ao banco de dados com retry automático
// Conecta ao RabbitMQ com retry automático
// Inicia o servidor na porta 3001
```
**O que faz:**
- Cria a aplicação Express
- Tenta conectar ao banco 10 vezes (com intervalo de 3s)
- Tenta conectar ao RabbitMQ 10 vezes (com intervalo de 5s)
- Expõe endpoints em http://localhost:3001

### **2. src/config/database.js** - Conexão PostgreSQL
```javascript
// Usa Sequelize ORM
// Conecta em: postgres://admin:admin@localhost:5432/payments_db
// Sincroniza tabelas automaticamente no boot
```
**O que faz:**
- Gerencia conexão com PostgreSQL
- Cria/sincroniza tabelas automaticamente
- Permite usar o Sequelize para queries

### **3. src/config/rabbitmq.js** - Conexão RabbitMQ
```javascript
// Cria 2 filas:
// - payment.pending  (ao receber pagamento)
// - payment.confirmed (ao confirmar pagamento)
```
**O que faz:**
- Mantém conexão com RabbitMQ
- Cria as filas automaticamente
- Exporta função para enviar mensagens

### **4. src/models/Payment.js** - Modelo de Dados
```javascript
// Tabela: payments
// Colunas:
//   - id (UUID, chave primária)
//   - userId (string, obrigatório)
//   - amount (decimal 10,2)
//   - description (string, opcional)
//   - status (enum: pending, success, failed)
//   - createdAt, updatedAt (timestamps automáticos)
```

### **5. src/services/payment.service.js** - Lógica de Negócio
```javascript
// createPayment(data):
//   1. Cria pagamento com status "pending"
//   2. Envia mensagem para fila "payment.pending"
//   3. Aguarda 3s (simulai processamento)
//   4. Muda status para "success"
//   5. Envia mensagem para fila "payment.confirmed"

// getAllPayments():
//   - Retorna todos os pagamentos (ordenado por mais recente)

// getPaymentById(id):
//   - Retorna um pagamento específico
```

### **6. src/controllers/payment.controller.js** - Requisições HTTP
```javascript
// Valida dados de entrada
// Chama o service
// Retorna resposta estruturada em JSON
// Trata erros com status HTTP apropriado
```

### **7. src/routes/payment.routes.js** - Rotas da API
```javascript
// POST   /payments      - Criar novo pagamento
// GET    /payments      - Listar todos os pagamentos
// GET    /payments/:id  - Buscar um pagamento
```

---

## 🐳 Como Rodar o Projeto

### **Opção 1: Com Docker Compose (Recomendado)**

```bash
# Na raiz do projeto (onde está docker-compose.yml)
docker-compose up --build

# Saída esperada:
# [Payment Service] RabbitMQ conectado com sucesso
# [Payment Service] Banco de dados conectado com sucesso
# [Payment Service] 🚀 Serviço rodando na porta 3001
```

### **Opção 2: Local (sem Docker)**

```bash
# Terminal 1: Inicie PostgreSQL
# Terminal 2: Inicie RabbitMQ
# Terminal 3: Inicie o serviço

cd ms-payment-service
npm install
npm start

# Saída esperada:
# [Payment Service] Banco de dados conectado com sucesso
# [Payment Service] RabbitMQ conectado com sucesso
# [Payment Service] 🚀 Serviço rodando na porta 3001
```

---

## 🧪 Como Testar a API

### **1. Verificar Health Check**
```bash
curl http://localhost:3001/health
```

**Resposta esperada:**
```json
{
  "status": "ok",
  "service": "ms-payment-service"
}
```

### **2. Criar um Pagamento** ⭐
```bash
curl -X POST http://localhost:3001/payments \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "user123",
    "amount": 150.50,
    "description": "Compra de produtos"
  }'
```

**Resposta esperada (201 Created):**
```json
{
  "message": "Solicitação de transação recebida com sucesso",
  "payment": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "userId": "user123",
    "amount": "150.50",
    "description": "Compra de produtos",
    "status": "pending",
    "createdAt": "2026-04-22T10:30:00.000Z",
    "updatedAt": "2026-04-22T10:30:00.000Z"
  }
}
```

### **3. Listar Todos os Pagamentos**
```bash
curl http://localhost:3001/payments
```

**Resposta esperada:**
```json
[
  {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "userId": "user123",
    "amount": "150.50",
    "description": "Compra de produtos",
    "status": "success",  // Muda após 3 segundos
    "createdAt": "2026-04-22T10:30:00.000Z",
    "updatedAt": "2026-04-22T10:30:03.000Z"
  }
]
```

### **4. Buscar um Pagamento Específico**
```bash
curl http://localhost:3001/payments/550e8400-e29b-41d4-a716-446655440000
```

### **5. Testar com Dados Inválidos**
```bash
# Falta userId
curl -X POST http://localhost:3001/payments \
  -H "Content-Type: application/json" \
  -d '{"amount": 100}'

# Resposta (400 Bad Request):
# {"error": "Os campos userId e amount são obrigatórios"}
```

---

## 🔄 Fluxo Completo de Processamento

```
┌─────────────────────────────────────────────────────────────┐
│ 1. Cliente envia POST /payments com {userId, amount, desc}  │
└────────────────┬────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────┐
│ 2. Controller valida os dados                               │
│    - userId é obrigatório                                   │
│    - amount é obrigatório e deve ser > 0                    │
└────────────────┬────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────┐
│ 3. Service cria pagamento com status "pending"              │
│    - Salva no PostgreSQL                                    │
│    - Log: "Transação criada"                                │
└────────────────┬────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────┐
│ 4. Service envia mensagem para fila "payment.pending"       │
│    JSON: {paymentId, userId, amount, status, event}        │
│    Log: "Mensagem publicada"                                │
└────────────────┬────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────┐
│ 5. Controller retorna 201 com payment criado                │
│    [Resposta volta para o cliente]                          │
└────────────────┬────────────────────────────────────────────┘
                 │ [Processamento assíncrono, continua...]
                 ▼
┌─────────────────────────────────────────────────────────────┐
│ 6. Aguarda 3 segundos (simulando processamento)             │
└────────────────┬────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────┐
│ 7. Service atualiza status para "success"                   │
│    - Atualiza no PostgreSQL                                 │
│    - Log: "Transação confirmada"                            │
└────────────────┬────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────┐
│ 8. Service envia mensagem para fila "payment.confirmed"     │
│    JSON: {paymentId, userId, amount, status, event}        │
│    Log: "Mensagem publicada"                                │
└─────────────────────────────────────────────────────────────┘
```

---

## 🛠️ Variáveis de Ambiente

No `docker-compose.yml` já estão configuradas:

```env
DATABASE_URL = postgres://admin:admin@postgres:5432/payments_db
RABBITMQ_URL = amqp://admin:admin@rabbitmq:5672
PORT = 3001
```

Se quiser rodar localmente, defina:
```bash
export DATABASE_URL="postgres://admin:admin@localhost:5432/payments_db"
export RABBITMQ_URL="amqp://admin:admin@localhost:5672"
export PORT=3001
```

---

## 📦 Tecnologias Utilizadas

| Tecnologia | Versão | Propósito |
|-----------|--------|----------|
| **Node.js** | - | Runtime JavaScript |
| **Express** | 4.18.2 | Framework Web |
| **Sequelize** | 6.35.1 | ORM para PostgreSQL |
| **pg** | 8.11.3 | Driver PostgreSQL |
| **amqplib** | 0.10.3 | Cliente RabbitMQ |
| **PostgreSQL** | 15 | Banco de dados relacional |
| **RabbitMQ** | 3 | Message Broker |

---

## ✅ Checklist de Requisitos

- [x] Recebe POST /payments com valor
- [x] Salva no PostgreSQL com status "PENDENTE"
- [x] Envia mensagem para fila RabbitMQ
- [x] Retorna pagamento criado (201)
- [x] Usa Express para API
- [x] Usa pg para PostgreSQL
- [x] Usa amqplib para RabbitMQ
- [x] Código organizado em arquivos separados
- [x] Usa async/await
- [x] Trata erros básicos
- [x] Tabela com id, valor, status
- [x] Cria fila "pagamentos"
- [x] Envia JSON com id e status

---

## 🤝 Observações Importantes

1. **Status inicial**: O pagamento começa como "pending"
2. **Processamento assíncrono**: Muda para "success" após 3 segundos
3. **Mensagens duplicadas**: Se RabbitMQ cair, as mensagens não são retransmitidas (use `durable: true` para persistência)
4. **UUID automático**: Cada pagamento recebe um ID único automático
5. **Timestamps**: `createdAt` e `updatedAt` são preenchidos automaticamente

---

## 🚨 Possíveis Erros e Soluções

### Erro: "Não foi possível conectar ao banco de dados"
```
Solução: Verifique se PostgreSQL está rodando na porta 5432
```

### Erro: "Não foi possível conectar ao RabbitMQ"
```
Solução: Verifique se RabbitMQ está rodando na porta 5672
```

### Erro ao criar pagamento: "userId e amount são obrigatórios"
```
Solução: Verifique o JSON da requisição POST
```

---

## 📞 Próximos Passos (Melhorias Futuras)

- [ ] Adicionar autenticação (JWT)
- [ ] Implementar validação de CPF/CNPJ
- [ ] Integrar com gateway de pagamento real
- [ ] Adicionar logs estruturados (Winston/Pino)
- [ ] Implementar testes unitários (Jest)
- [ ] Adicionar métricas (Prometheus)
- [ ] Implementar rate limiting
- [ ] Adicionar documentação Swagger/OpenAPI

