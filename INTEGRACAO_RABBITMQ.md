# 🔗 Integração: Payment Service + Notification Service

## 📡 Arquitetura de Mensageria

```
┌─────────────────────────────────────────────────────────────────┐
│                       CLIENTE HTTP                              │
└──────────────────────┬──────────────────────────────────────────┘
                       │
                       │ POST /payments
                       │ {userId, amount, description}
                       │
                       ▼
        ┌──────────────────────────────┐
        │   MS-PAYMENT-SERVICE         │
        │  (Porta 3001)               │
        │                              │
        │  1. Valida dados            │
        │  2. Cria pagamento (pending)│
        │  3. Salva no PostgreSQL     │
        │  4. Publica na fila         │
        │  5. Retorna 201             │
        └─────┬──────────────────┬─────┘
              │                  │
              │                  │ (Dentro de 3s)
              ▼                  ▼
        ┌─────────────┐    ┌──────────────┐
        │ PostgreSQL  │    │  Aguarda 3s  │
        │ (Tabela     │    │  Processa    │
        │  payments)  │    │  Paga        │
        └─────────────┘    └──────┬───────┘
                                  │
                                  ▼
                          ┌───────────────┐
                          │ Atualiza para │
                          │   SUCCESS     │
                          └───────┬───────┘
                                  │
              ┌───────────────────┼───────────────────┐
              │                   │                   │
              ▼                   ▼                   ▼
    ┌──────────────────┐  ┌──────────────────┐
    │ Fila RabbitMQ   │  │ Fila RabbitMQ    │
    │payment.pending  │  │payment.confirmed │
    │(ao receber)     │  │(ao confirmar)    │
    └────────┬─────────┘  └─────────┬────────┘
             │                      │
             │ MENSAGEM 1           │ MENSAGEM 2
             │ {                    │ {
             │  paymentId: uuid,    │  paymentId: uuid,
             │  userId: string,     │  userId: string,
             │  amount: decimal,    │  amount: decimal,
             │  status: pending,    │  status: success,
             │  event: PAYMENT_     │  event: PAYMENT_
             │          RECEIVED,   │          CONFIRMED,
             │  timestamp: iso      │  timestamp: iso
             │ }                    │ }
             │                      │
             ▼                      ▼
    ┌──────────────────────────────────┐
    │   MS-NOTIFICATION-SERVICE        │
    │   (Consumidor RabbitMQ)          │
    │                                  │
    │  1. Recebe mensagem na fila     │
    │  2. Processa evento             │
    │  3. Envia notificação            │
    │     (Email, SMS, Push, etc)     │
    └──────────────────────────────────┘
```

---

## 📨 Fluxo Detalhado de Mensagens

### **ETAPA 1: Cliente Cria Pagamento**
```
➡️ REQUEST:
POST http://localhost:3001/payments
Content-Type: application/json

{
  "userId": "user123",
  "amount": 150.50,
  "description": "Compra de produtos"
}
```

### **ETAPA 2: Payment Service Processa**
```
1. Validação ✅
   ✓ userId obrigatório
   ✓ amount obrigatório e > 0

2. Criar Pagamento ✅
   INSERT INTO payments (userId, amount, description, status)
   VALUES ('user123', 150.50, 'Compra de produtos', 'pending')
   
   Result: id = 550e8400-e29b-41d4-a716-446655440000

3. Respuesta HTTP 201 ✅
   {
     "message": "Solicitação de transação recebida com sucesso",
     "payment": {
       "id": "550e8400-e29b-41d4-a716-446655440000",
       "userId": "user123",
       "amount": "150.50",
       "status": "pending",  ← IMPORTANTE!
       "createdAt": "2026-04-22T10:30:00Z",
       "updatedAt": "2026-04-22T10:30:00Z"
     }
   }

4. Publica na Fila ✅
   QUEUE: payment.pending
   MENSAGEM:
   {
     "paymentId": "550e8400-e29b-41d4-a716-446655440000",
     "userId": "user123",
     "amount": 150.50,
     "description": "Compra de produtos",
     "status": "pending",
     "event": "PAYMENT_RECEIVED",
     "timestamp": "2026-04-22T10:30:00.000Z"
   }
```

### **ETAPA 3: Notification Service Consome (payment.pending)**
```
🎯 Consumidor rececionó a mensagem:

{
  "paymentId": "550e8400-e29b-41d4-a716-446655440000",
  "userId": "user123",
  "amount": 150.50,
  "status": "pending",
  "event": "PAYMENT_RECEIVED"
}

❓ O que fazer?
  → Enviar Email: "Pagamento recebido! Aguardando processamento..."
  → Enviar SMS: "Seu pagamento está sendo processado."
  → Salvar em Log: "user123 realizou pagamento de R$ 150,50"
```

### **ETAPA 4: Payment Service Processa (Assíncrono)**
```
⏰ Aguarda 3 segundos (simula processamento real)
   Tempo: 10:30:00 → 10:30:03

📝 Atualiza status no banco:
   UPDATE payments
   SET status = 'success',
       updatedAt = NOW()
   WHERE id = '550e8400-e29b-41d4-a716-446655440000'
```

### **ETAPA 5: Payment Service Publica (payment.confirmed)**
```
✅ Publica na Fila de Confirmação

QUEUE: payment.confirmed
MENSAGEM:
{
  "paymentId": "550e8400-e29b-41d4-a716-446655440000",
  "userId": "user123",
  "amount": 150.50,
  "description": "Compra de produtos",
  "status": "success",
  "event": "PAYMENT_CONFIRMED",
  "timestamp": "2026-04-22T10:30:03.000Z"
}
```

### **ETAPA 6: Notification Service Consome (payment.confirmed)**
```
🎯 Consumidor recebeu a mensagem:

{
  "paymentId": "550e8400-e29b-41d4-a716-446655440000",
  "userId": "user123",
  "amount": 150.50,
  "status": "success",
  "event": "PAYMENT_CONFIRMED"
}

❓ O que fazer?
  → Enviar Email: "Pagamento confirmado com sucesso! 🎉"
  → Enviar SMS: "Seu pagamento foi aprovado!"
  → Atualizar dashboard: Mostrar transação como completa
  → Gerar recibo: Salvar comprovante
```

---

## 🔍 Monitorar as Filas em Tempo Real

### **Dashboard RabbitMQ**

```
URL: http://localhost:15672
User: admin
Pass: admin

Navegue em:
Queues → Clique em payment.pending ou payment.confirmed
```

Você verá:
- **Ready**: Mensagens aguardando consumo
- **Unacked**: Mensagens em processamento
- **Total**: Total de mensagens

### **Script para Monitorar via CLI**

```bash
# Listar todas as filas
docker exec comprefacil-rabbitmq rabbitmqctl list_queues name messages consumers

# Resultado esperado:
# Listing queues ...
# name                    messages  consumers
# payment.pending         0         1
# payment.confirmed       0         1
# ok
```

---

## 🧪 Teste Completo: Ponta a Ponta

1. **Inicie tudo:**
```bash
docker-compose up
```

2. **Em outro terminal, crie um pagamento:**
```bash
curl -X POST http://localhost:3001/payments \
  -H "Content-Type: application/json" \
  -d '{"userId": "alice", "amount": 500, "description": "Notebook"}'
```

3. **Observe os logs (em tempo real):**

```
[ts 10:30:00] Payment Service:
  ✅ Transação criada | ID: 550e8400... | Status: pending
  📤 Mensagem publicada na fila: payment.pending

[ts 10:30:00] Notification Service:
  📨 Mensagem recebida de: payment.pending
  ✉️ Email enviado: "Pagamento recebido"

[ts 10:30:03] Payment Service:
  ✅ Transação confirmada | ID: 550e8400... | Status: success
  📤 Mensagem publicada na fila: payment.confirmed

[ts 10:30:03] Notification Service:
  📨 Mensagem recebida de: payment.confirmed
  ✉️ Email enviado: "Pagamento confirmado"
```

4. **Consulte o pagamento:**
```bash
curl http://localhost:3001/payments/550e8400-e29b-41d4-a716-446655440000
```

**Resposta:**
```json
{
  "status": "success",  ← Mudou!
  "updatedAt": "2026-04-22T10:30:03.000Z"
}
```

---

## 🔐 Garantias de Entrega com RabbitMQ

### **Durable Queues** (Já implementado ✅)
```javascript
// Em rabbitmq.js
channel.assertQueue(QUEUES.PAYMENT_PENDING, { durable: true });
```

Significa:
- Se RabbitMQ desligar, as mensagens NÃO serão perdidas
- Quando RabbitMQ reiniciar, as mensagens continuarão lá
- Garantia de entrega at-least-once

### **Persistent Messages** (Já implementado ✅)
```javascript
// Em payment.service.js
channel.sendToQueue(QUEUES.PAYMENT_PENDING, Buffer.from(...), {
  persistent: true  ← Grava no disco
});
```

Significa:
- Se o servidor cair ao enviar, a mensagem não será perdida
- Garante que a mensagem chegue ao consumidor

---

## 📊 Exemplo de Fluxo Completo em Timeline

```
Tempo    | Evento                          | Banco        | Fila
---------|----------------------------------|--------------|------------------
10:30:00 | POST /payments                 | -            | -
10:30:00 | Criar pagamento (pending)      | INSERT       | -
10:30:00 | Responder 201 ao cliente       | ✓            | -
10:30:00 | Publicar em payment.pending    | ✓            | pending: 1
10:30:00 | Notification consome msg       | ✓            | pending: 0
10:30:00 | Notification envia email       | ✓            | pending: 0
10:30:03 | Confirmar pagamento (success)  | UPDATE       | -
10:30:03 | Publicar em payment.confirmed  | ✓            | confirmed: 1
10:30:03 | Notification consome msg       | ✓            | confirmed: 0
10:30:03 | Notification envia confirmação | ✓            | confirmed: 0
```

---

## 🎯 Quando Usar Cada Fila

### **payment.pending**
✅ Use quando:
- Pagamento foi recebido
- Cliente precisa ser notificado imediatamente
- Processos iniciais devem começar

### **payment.confirmed**
✅ Use quando:
- Pagamento foi processado com sucesso
- Cliente pode receber seu produto/serviço
- Sistema de entrega pode começar

---

## 🚀 Próxima Etapa: Implementar Notification Service

O arquivo `ms-notification-service` já existe! Você pode usar as filas criadas aqui para:

1. Ouvir `payment.pending` e enviar notificações iniciais
2. Ouvir `payment.confirmed` e enviar confirmações
3. Integrar com serviços de email (SendGrid, AWS SES)
4. Registrar logs de notificações
5. Implementar retry de falhas

