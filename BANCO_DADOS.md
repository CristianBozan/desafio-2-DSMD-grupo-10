# 🗄️ Banco de Dados - Referência Técnica

## 📊 Diagrama da Tabela `payments`

```
┌─────────────────────────────────────────────────────┐
│              TABELA: payments                       │
├─────────────────────────────────────────────────────┤
│ Coluna      │ Tipo          │ Obrigatório │ Padrão  │
├─────────────────────────────────────────────────────┤
│ id          │ UUID          │ ✓ (PK)      │ AUTO    │
│ userId      │ VARCHAR(255)  │ ✓           │ -       │
│ amount      │ DECIMAL(10,2) │ ✓           │ -       │
│ description │ VARCHAR(255)  │ ✗           │ NULL    │
│ status      │ ENUM          │ ✓           │ pending │
│ createdAt   │ TIMESTAMP     │ ✓ (AUTO)    │ NOW()   │
│ updatedAt   │ TIMESTAMP     │ ✓ (AUTO)    │ NOW()   │
└─────────────────────────────────────────────────────┘

Status possíveis:
  • pending    (quando criado)
  • success    (após processamento bem-sucedido)
  • failed     (se houver erro)
```

---

## 🔑 Detalhes de Cada Campo

### **id** (UUID, Chave Primária)
```
Tipo: UUID (Universally Unique Identifier)
Exemplo: 550e8400-e29b-41d4-a716-446655440000

✓ Gerado automaticamente
✓ Cada pagamento tem um ID único
✓ Não pode ser nulo
✓ Não pode se repetir no banco
```

### **userId** (String, Obrigatório)
```
Tipo: VARCHAR(255)
Exemplo: "customer123" ou "alice@example.com"

✓ Identifica o cliente
✓ Obrigatório na requisição
✓ Pode se repetir (mesmo cliente faz vários pagamentos)
✗ Chave primária (use id para isso)
```

### **amount** (Decimal, Obrigatório)
```
Tipo: DECIMAL(10, 2)
Exemplos: 99.99, 1.50, 12345.67

✓ Suporta até 10 dígitos com 2 casas decimais
✓ Máximo: 99999999.99
✓ Mínimo: 0.01 (validado no controller)
✓ Armazenado com precisão (não floating point)
```

### **description** (String, Opcional)
```
Tipo: VARCHAR(255) ou NULL
Exemplos: "Compra de notebook", "Pagamento fatura"

✓ Descrição do pagamento
✗ Não obrigatório
✓ Pode ficar NULL
```

### **status** (ENUM, Obrigatório)
```
Tipo: ENUM('pending', 'success', 'failed')
Padrão: 'pending'

Estados após criação:
  pending  → Pagamento recebido, aguardando processamento
  ↓ (após 3s)
  success  → Pagamento processado com sucesso
  ↓ (se errror)
  failed   → Pagamento falhou

Transições:
  pending → success ✓ (Implementado)
  pending → failed  ✗ (Futuro)
```

### **createdAt** (TIMESTAMP)
```
Tipo: TIMESTAMP
Gerado: Automaticamente ao criar
Formato ISO: 2026-04-22T10:30:00.000Z

Imutável: Nunca muda após criação
Uso: Histórico de quando foi criado
```

### **updatedAt** (TIMESTAMP)
```
Tipo: TIMESTAMP
Gerado: Automaticamente ao criar
Atualizado: Sempre que o registro muda
Formato ISO: 2026-04-22T10:30:03.000Z

Muda quando: status muda (pending → success)
Uso: Saber quando foi modificado
```

---

## 📝 Exemplos Reais de Registros

### Dentro de 1 segundo (Status PENDING)
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "userId": "alice",
  "amount": "150.50",
  "description": "Notebook Dell",
  "status": "pending",
  "createdAt": "2026-04-22T10:30:00.000Z",
  "updatedAt": "2026-04-22T10:30:00.000Z"
}
```

### Depois de 3 segundos (Status SUCCESS)
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "userId": "alice",
  "amount": "150.50",
  "description": "Notebook Dell",
  "status": "success",
  "createdAt": "2026-04-22T10:30:00.000Z",
  "updatedAt": "2026-04-22T10:30:03.000Z"  ← Mudou!
}
```

---

## 🔍 Queries SQL Úteis

### Ver Todos os Pagamentos
```sql
SELECT * FROM payments ORDER BY "createdAt" DESC;
```

### Ver Pagamentos Pendentes
```sql
SELECT * FROM payments WHERE status = 'pending';
```

### Somar Valores de um Cliente
```sql
SELECT userId, SUM(amount) as total 
FROM payments 
WHERE status = 'success'
GROUP BY userId;
```

### Ver Pagamentos das Últimas 24h
```sql
SELECT * FROM payments 
WHERE "createdAt" > NOW() - INTERVAL '24 hours';
```

### Contar Pagamentos Por Status
```sql
SELECT status, COUNT(*) as total 
FROM payments 
GROUP BY status;
```

### Buscar um Pagamento por ID
```sql
SELECT * FROM payments WHERE id = '550e8400-e29b-41d4-a716-446655440000';
```

---

## 🔐 Constraints e Validações

### No Banco de Dados (PostgreSQL)
```sql
- PRIMARY KEY (id)          ← Cada ID é único
- NOT NULL (userId)         ← userId obrigatório
- NOT NULL (amount)         ← amount obrigatório
- NOT NULL (status)         ← status obrigatório
- CHECK (amount > 0)        ← amount deve ser positivo
- DEFAULT CURRENT_TIMESTAMP ← createdAt automático
- DEFAULT CURRENT_TIMESTAMP ← updatedAt automático
```

### Na Aplicação (Node.js)
```javascript
// Validação em payment.controller.js
if (!userId || !amount) {
  return res.status(400).json({
    error: 'Os campos userId e amount são obrigatórios'
  });
}

if (isNaN(amount) || Number(amount) <= 0) {
  return res.status(400).json({
    error: 'O campo amount deve ser um número positivo'
  });
}
```

---

## 📈 Performance e Índices

Para melhorias futuras:

```sql
-- Buscar rápido por userId
CREATE INDEX idx_payments_userId ON payments(userId);

-- Buscar rápido por status
CREATE INDEX idx_payments_status ON payments(status);

-- Buscar rápido por data
CREATE INDEX idx_payments_createdAt ON payments("createdAt");

-- Combo: userId + status (pagamentos pendentes de um cliente)
CREATE INDEX idx_payments_userId_status ON payments(userId, status);
```

---

## 🔄 Relacionamentos Futuros

Se expandir o projeto, pode adicionar:

```sql
-- Tabela de clientes
CREATE TABLE customers (
  id UUID PRIMARY KEY,
  name VARCHAR(255),
  email VARCHAR(255),
  cpf VARCHAR(11)
);

-- Relacionar pagamentos com clientes
ALTER TABLE payments 
ADD COLUMN customerId UUID REFERENCES customers(id);

-- Tabela de produtos
CREATE TABLE products (
  id UUID PRIMARY KEY,
  name VARCHAR(255),
  price DECIMAL(10,2)
);

-- Tabela de itens do pagamento
CREATE TABLE payment_items (
  id UUID PRIMARY KEY,
  paymentId UUID REFERENCES payments(id),
  productId UUID REFERENCES products(id),
  quantity INT,
  unit_price DECIMAL(10,2)
);
```

---

## 🛠️ Gerenciar o Banco

### Via Docker

```bash
# Acessar container PostgreSQL
docker exec -it comprefacil-postgres psql -U admin -d payments_db

# Ver tabelas
\dt

# Ver estrutura completa
\d payments

# Sair
\q
```

### Via Software (pgAdmin)

Se quiser GUI melhor, pode adicionar ao docker-compose:

```yaml
pgadmin:
  image: dpage/pgadmin4
  environment:
    PGADMIN_DEFAULT_EMAIL: admin@admin.com
    PGADMIN_DEFAULT_PASSWORD: admin
  ports:
    - "5050:80"
```

Acesse em: http://localhost:5050

---

## 📊 Estatísticas Úteis

### Contar registros
```sql
SELECT COUNT(*) FROM payments;
```

### Valor total processado
```sql
SELECT SUM(amount) FROM payments WHERE status = 'success';
```

### Cliente com mais pagamentos
```sql
SELECT userId, COUNT(*) as qtd, SUM(amount) as total
FROM payments
GROUP BY userId
ORDER BY qtd DESC
LIMIT 1;
```

### Taxa de sucesso
```sql
SELECT 
  status,
  COUNT(*) as total,
  ROUND(100.0 * COUNT(*) / (SELECT COUNT(*) FROM payments), 2) as percentual
FROM payments
GROUP BY status;
```

---

## 🔒 Backup

Exemplo de backup automático:

```bash
# Backup completo
docker exec comprefacil-postgres pg_dump -U admin payments_db > backup.sql

# Restaurar
docker exec -i comprefacil-postgres psql -U admin payments_db < backup.sql
```

---

## 📋 Schema Completo (Gerado por Sequelize)

```javascript
// Gerado automaticamente por Sequelize
const payments = {
  tableName: 'payments',
  timestamps: true,  // Adiciona createdAt e updatedAt automaticamente
  
  columns: {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,  // Gera UUID automático
      primaryKey: true
    },
    userId: {
      type: DataTypes.STRING,
      allowNull: false
    },
    amount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false
    },
    description: {
      type: DataTypes.STRING,
      allowNull: true  // Opcional
    },
    status: {
      type: DataTypes.ENUM('pending', 'success', 'failed'),
      defaultValue: 'pending',
      allowNull: false
    }
  }
};
```

