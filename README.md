# CompreFácil - Sistema de Pagamentos Distribuído

**Curso:** Superior de Tecnologia em Análise e Desenvolvimento de Sistemas  
**Unidade Curricular:** Desenvolvimento de Sistemas Móveis e Distribuídos  
**Docente:** Rafael de Faria Scheidt  
**Grupo 10:** Michel Angelo da Silva Tuma · Cristian Diego Bozan

---

Desafio 2 - Desenvolvimento de Sistemas Móveis e Distribuídos (SENAI)

Implementação de dois microsserviços independentes que se comunicam de forma assíncrona via RabbitMQ para processar pagamentos e enviar notificações.

---

## Arquitetura

```
┌─────────────────────┐        ┌───────────────┐        ┌──────────────────────────┐
│  ms-payment-service │ ──────▶│   RabbitMQ    │──────▶ │ ms-notification-service  │
│      (porta 3001)   │        │  (porta 5672) │        │       (porta 3002)       │
│                     │        └───────────────┘        │                          │
│  REST API           │              filas:             │  Consumer das filas:     │
│  + Publisher AMQP   │        payment.pending          │  - payment.pending       │
│                     │        payment.confirmed        │  - payment.confirmed     │
│  PostgreSQL         │                                 │                          │
│  (porta 5432)       │                                 │                          │
└─────────────────────┘                                 └──────────────────────────┘
```

## Fluxo de Processamento

```
Cliente → POST /payments
    │
    ▼
[I]  Payment Service: salva transação com status "pending" no PostgreSQL
    │
    ▼
[II] Payment Service: publica mensagem na fila "payment.pending"
    │
    ▼
[III] Notification Service: lê mensagem e envia notificação de recebimento ao usuário
    │
    ▼ (após 3 segundos - simulando processamento assíncrono)
    │
[IV] Payment Service: confirma transação, atualiza status para "success"
    │
    ▼
[V]  Payment Service: publica mensagem na fila "payment.confirmed"
    │
    ▼
[VI] Notification Service: lê mensagem e envia notificação de confirmação ao usuário
```

---

## Pré-requisitos

- [Docker](https://www.docker.com/) instalado
- [Docker Compose](https://docs.docker.com/compose/) instalado

---

## Como Executar

### 1. Clonar o repositório

```bash
git clone <url-do-repositorio>
cd desafio-2
```

### 2. Subir todos os serviços

```bash
docker-compose up --build
```

Para rodar em segundo plano:

```bash
docker-compose up --build -d
```

### 3. Verificar se os serviços estão rodando

```bash
docker-compose ps
```

Serviços disponíveis:

| Serviço               | URL                           | Descrição                          |
|-----------------------|-------------------------------|------------------------------------|
| ms-payment-service    | http://localhost:3001         | API REST de pagamentos             |
| ms-notification-service | http://localhost:3002       | Serviço de notificações            |
| RabbitMQ Management   | http://localhost:15672        | Painel do RabbitMQ (admin/admin)   |
| PostgreSQL            | localhost:5432                | Banco de dados (admin/admin)       |

---

## Endpoints da API (ms-payment-service)

### Criar uma transação de pagamento

**POST** `http://localhost:3001/payments`

**Body (JSON):**
```json
{
  "userId": "usuario123",
  "amount": 150.00,
  "description": "Compra de produto X"
}
```

**Resposta (201):**
```json
{
  "message": "Solicitação de transação recebida com sucesso",
  "payment": {
    "id": "uuid-gerado",
    "userId": "usuario123",
    "amount": "150.00",
    "description": "Compra de produto X",
    "status": "pending",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

---

### Listar todos os pagamentos

**GET** `http://localhost:3001/payments`

---

### Buscar pagamento por ID

**GET** `http://localhost:3001/payments/:id`

---

### Health Check

**GET** `http://localhost:3001/health`  
**GET** `http://localhost:3002/health`

---

## Exemplo de uso com cURL

```bash
curl -X POST http://localhost:3001/payments \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "usuario123",
    "amount": 250.00,
    "description": "Compra no e-commerce CompreFacil"
  }'
```

---

## Parar os serviços

```bash
docker-compose down
```

Para remover também os volumes (banco de dados):

```bash
docker-compose down -v
```

---

## Estrutura do Projeto

```
desafio-2/
├── docker-compose.yml
├── README.md
├── ms-payment-service/
│   ├── Dockerfile
│   ├── package.json
│   └── src/
│       ├── index.js
│       ├── config/
│       │   ├── database.js
│       │   └── rabbitmq.js
│       ├── models/
│       │   └── Payment.js
│       ├── controllers/
│       │   └── payment.controller.js
│       ├── routes/
│       │   └── payment.routes.js
│       └── services/
│           └── payment.service.js
└── ms-notification-service/
    ├── Dockerfile
    ├── package.json
    └── src/
        ├── index.js
        ├── config/
        │   └── rabbitmq.js
        └── consumers/
            └── notification.consumer.js
```

---

## Tecnologias Utilizadas

- **Node.js** — Runtime JavaScript
- **Express.js** — Framework web para a API REST
- **RabbitMQ** — Sistema de mensageria (AMQP)
- **PostgreSQL** — Banco de dados relacional
- **Sequelize** — ORM para PostgreSQL
- **amqplib** — Cliente AMQP para Node.js
- **Docker / Docker Compose** — Containerização dos serviços
