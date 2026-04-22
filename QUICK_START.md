# ⚡ Quick Start - 2 Minutos

## 🚀 Rodar Tudo em Segundos

### 1. Iniciar com Docker
```bash
# Na pasta raiz do projeto
docker-compose up --build

# Aguarde aparecer:
# [Payment Service] 🚀 Serviço rodando na porta 3001
```

### 2. Testar em Outro Terminal
```bash
# Health check
curl http://localhost:3001/health

# Criar pagamento
curl -X POST http://localhost:3001/payments \
  -H "Content-Type: application/json" \
  -d '{"userId": "john", "amount": 250.00, "description": "Compra"}'

# Listar pagamentos
curl http://localhost:3001/payments
```

---

## 🎯 3 Endpoints Principais

| Método | URL | Descrição |
|--------|-----|-----------|
| `GET` | `http://localhost:3001/health` | Verificar status |
| `POST` | `http://localhost:3001/payments` | Criar pagamento |
| `GET` | `http://localhost:3001/payments` | Listar pagamentos |

---

## 📝 Criar Pagamento

```bash
curl -X POST http://localhost:3001/payments \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "user123",
    "amount": 99.99,
    "description": "Meu pagamento"
  }'
```

**Resposta:** 
```json
{
  "message": "Solicitação de transação recebida com sucesso",
  "payment": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "userId": "user123",
    "amount": "99.99",
    "status": "pending"  ← Muda para "success" em 3s
  }
}
```

---

## 📊 Fluxo em 1 Minuto

```
1. POST /payments com {userId, amount} → 201 Created
2. Salva no PostgreSQL com status "pending"
3. Envia mensagem para fila RabbitMQ "payment.pending"
4. Cliente recebe resposta imediatamente
5. [Após 3s] Muda status para "success"
6. Envia mensagem para fila RabbitMQ "payment.confirmed"
7. Notification Service pode processar as mensagens
```

---

## ✅ Requisitos Atendidos

- ✅ HTTP POST /pagamento
- ✅ Salva no PostgreSQL com status "PENDENTE"
- ✅ Envia para fila RabbitMQ
- ✅ Retorna pagamento criado
- ✅ Express + PostgreSQL + RabbitMQ
- ✅ Async/await
- ✅ Tratamento de erros

---

## 🔗 Outros Recursos

- 📖 Guia Completo: [GUIA_IMPLEMENTACAO.md](./GUIA_IMPLEMENTACAO.md)
- 🧪 Exemplos Testes: [EXEMPLOS_TESTES.md](./EXEMPLOS_TESTES.md)
- 📡 Integração RabbitMQ: [INTEGRACAO_RABBITMQ.md](./INTEGRACAO_RABBITMQ.md)

