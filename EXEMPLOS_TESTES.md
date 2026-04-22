# 🧪 Exemplos de Testes - Microsserviço de Pagamentos

## Teste Rápido (Copy & Paste)

### 1️⃣ Health Check
```bash
curl http://localhost:3001/health
```

**Esperado:** `{"status":"ok","service":"ms-payment-service"}`

---

### 2️⃣ Criar Pagamento Simples
```bash
curl -X POST http://localhost:3001/payments \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "cliente001",
    "amount": 99.99,
    "description": "Compra online"
  }'
```

**Esperado (201):**
```json
{
  "message": "Solicitação de transação recebida com sucesso",
  "payment": {
    "id": "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
    "userId": "cliente001",
    "amount": "99.99",
    "description": "Compra online",
    "status": "pending",
    "createdAt": "2026-04-22T...",
    "updatedAt": "2026-04-22T..."
  }
}
```

---

### 3️⃣ Criar Múltiplos Pagamentos
```bash
# Pagamento 1
curl -X POST http://localhost:3001/payments \
  -H "Content-Type: application/json" \
  -d '{"userId": "user1", "amount": 50.00, "description": "Pagamento 1"}'

# Pagamento 2
curl -X POST http://localhost:3001/payments \
  -H "Content-Type: application/json" \
  -d '{"userId": "user2", "amount": 150.75, "description": "Pagamento 2"}'

# Pagamento 3
curl -X POST http://localhost:3001/payments \
  -H "Content-Type: application/json" \
  -d '{"userId": "user3", "amount": 299.90, "description": "Pagamento 3"}'
```

---

### 4️⃣ Listar Todos os Pagamentos
```bash
curl http://localhost:3001/payments
```

**Esperado (200):**
```json
[
  {
    "id": "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
    "userId": "user3",
    "amount": "299.90",
    "description": "Pagamento 3",
    "status": "success",  // Mudou de pending para success
    "createdAt": "2026-04-22T10:30:03.000Z",
    "updatedAt": "2026-04-22T10:30:06.000Z"
  },
  {
    "id": "yyyyyyyy-yyyy-yyyy-yyyy-yyyyyyyyyyyy",
    "userId": "user2",
    "amount": "150.75",
    "description": "Pagamento 2",
    "status": "success",
    "createdAt": "2026-04-22T10:30:02.000Z",
    "updatedAt": "2026-04-22T10:30:05.000Z"
  },
  {
    "id": "zzzzzzzz-zzzz-zzzz-zzzz-zzzzzzzzzzzz",
    "userId": "user1",
    "amount": "50.00",
    "description": "Pagamento 1",
    "status": "success",
    "createdAt": "2026-04-22T10:30:01.000Z",
    "updatedAt": "2026-04-22T10:30:04.000Z"
  }
]
```

---

### 5️⃣ Buscar Pagamento Específico

```bash
# Substitua o ID pelo ID retornado no teste anterior
curl http://localhost:3001/payments/xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
```

**Esperado (200):**
```json
{
  "id": "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
  "userId": "cliente001",
  "amount": "99.99",
  "description": "Compra online",
  "status": "success",
  "createdAt": "2026-04-22T10:30:00.000Z",
  "updatedAt": "2026-04-22T10:30:03.000Z"
}
```

---

## 🚨 Testes de Erro

### ❌ Erro 1: Falta de userId
```bash
curl -X POST http://localhost:3001/payments \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 100.00,
    "description": "Teste sem userId"
  }'
```

**Esperado (400 Bad Request):**
```json
{
  "error": "Os campos userId e amount são obrigatórios"
}
```

---

### ❌ Erro 2: Falta de amount
```bash
curl -X POST http://localhost:3001/payments \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "client123",
    "description": "Teste sem amount"
  }'
```

**Esperado (400 Bad Request):**
```json
{
  "error": "Os campos userId e amount são obrigatórios"
}
```

---

### ❌ Erro 3: Amount inválido (negativo)
```bash
curl -X POST http://localhost:3001/payments \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "client123",
    "amount": -50,
    "description": "Teste com amount negativo"
  }'
```

**Esperado (400 Bad Request):**
```json
{
  "error": "O campo amount deve ser um número positivo"
}
```

---

### ❌ Erro 4: Amount zero
```bash
curl -X POST http://localhost:3001/payments \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "client123",
    "amount": 0,
    "description": "Teste com amount zero"
  }'
```

**Esperado (400 Bad Request):**
```json
{
  "error": "O campo amount deve ser um número positivo"
}
```

---

### ❌ Erro 5: Amount texto
```bash
curl -X POST http://localhost:3001/payments \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "client123",
    "amount": "não sou número",
    "description": "Teste com amount texto"
  }'
```

**Esperado (400 Bad Request):**
```json
{
  "error": "O campo amount deve ser um número positivo"
}
```

---

### ❌ Erro 6: Pagamento não encontrado
```bash
curl http://localhost:3001/payments/00000000-0000-0000-0000-000000000000
```

**Esperado (404 Not Found):**
```json
{
  "error": "Pagamento não encontrado"
}
```

---

## 🧬 Observar o Status em Tempo Real

Execute este teste e observe o status mudar de `pending` para `success` em 3 segundos:

```bash
# Cria pagamento e salva o ID
PAYMENT_ID=$(curl -s -X POST http://localhost:3001/payments \
  -H "Content-Type: application/json" \
  -d '{"userId": "test", "amount": 100}' \
  | grep -o '"id":"[^"]*"' | sed 's/"id":"\|"//g')

# Mostra status IMEDIATAMENTE (deve ser pending)
echo "Status AGORA:"
curl -s http://localhost:3001/payments/$PAYMENT_ID | grep -o '"status":"[^"]*"'

# Aguarda 4 segundos
sleep 4

# Mostra status DEPOIS (deve ser success)
echo "Status DEPOIS:"
curl -s http://localhost:3001/payments/$PAYMENT_ID | grep -o '"status":"[^"]*"'
```

---

## 🔌 Monitorar RabbitMQ

### Dashboard RabbitMQ
```
URL: http://localhost:15672
Usuário: admin
Senha: admin
```

Você verá as duas filas:
- `payment.pending` - Mensagens de pagamentos recebidos
- `payment.confirmed` - Mensagens de pagamentos confirmados

---

## 📊 Teste de Carga (Stress Test)

Envie 10 pagamentos rapidamente:

```bash
for i in {1..10}; do
  curl -X POST http://localhost:3001/payments \
    -H "Content-Type: application/json" \
    -d "{\"userId\": \"user$i\", \"amount\": $((i * 10)).99, \"description\": \"Pagamento $i\"}" \
    &
done
wait
```

---

## 🔍 Inspecionar Logs do Container

```bash
# Ver logs em tempo real
docker logs -f comprefacil-payment-service

# Ou com docker-compose
docker-compose logs -f ms-payment-service
```

Você verá algo como:
```
[Payment Service] ✅ Transação criada | ID: ... | Status: pending
[Payment Service] 📤 Mensagem publicada na fila: payment.pending
[Payment Service] ✅ Transação confirmada | ID: ... | Status: success
[Payment Service] 📤 Mensagem publicada na fila: payment.confirmed
```

---

## 📝 Script Completo para Teste Automático

Salve como `teste.sh`:

```bash
#!/bin/bash

echo "🧪 Iniciando testes..."

# 1. Health check
echo -e "\n1️⃣ Health Check"
curl -s http://localhost:3001/health | jq .

# 2. Criar pagamento
echo -e "\n2️⃣ Criar Pagamento"
PAYMENT=$(curl -s -X POST http://localhost:3001/payments \
  -H "Content-Type: application/json" \
  -d '{"userId": "test_user", "amount": 123.45, "description": "Teste automático"}')
echo $PAYMENT | jq .
PAYMENT_ID=$(echo $PAYMENT | jq -r '.payment.id')

# 3. Listar pagamentos
echo -e "\n3️⃣ Listar Todos"
curl -s http://localhost:3001/payments | jq .

# 4. Buscar pagamento específico (status pending)
echo -e "\n4️⃣ Buscar Pagamento (Status PENDING)"
curl -s http://localhost:3001/payments/$PAYMENT_ID | jq .

# 5. Aguardar 3 segundos
echo -e "\n⏳ Aguardando 3 segundos para mudança de status..."
sleep 3

# 6. Buscar novamente (status success)
echo -e "\n5️⃣ Buscar Pagamento (Status SUCCESS)"
curl -s http://localhost:3001/payments/$PAYMENT_ID | jq .

# 7. Testar erro
echo -e "\n6️⃣ Testar Erro (Falta de userId)"
curl -s -X POST http://localhost:3001/payments \
  -H "Content-Type: application/json" \
  -d '{"amount": 100}' | jq .

echo -e "\n✅ Testes concluídos!"
```

Execute com:
```bash
chmod +x teste.sh
./teste.sh
```

