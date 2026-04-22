# 🚀 Melhorias e Extensões - Roadmap Futuro

## 📈 Melhorias Recomendadas (Fácil → Difícil)

---

## 🟢 FÁCIL (1-2 horas)

### 1. Adicionar Validação de CPF/CNPJ

```javascript
// npm install cpf-cnpj-validator

const { isValidCPF, isValidCNPJ } = require('cpf-cnpj-validator');

async function createPayment(req, res) {
  const { userId, amount, cpf } = req.body;
  
  if (!isValidCPF(cpf) && !isValidCNPJ(cpf)) {
    return res.status(400).json({
      error: 'CPF ou CNPJ inválido'
    });
  }
  
  // ... resto do código
}
```

### 2. Adicionar Paginação

```javascript
// GET /payments?page=1&limit=10

async function getAllPayments(req, res) {
  const { page = 1, limit = 10 } = req.query;
  const offset = (page - 1) * limit;
  
  const { count, rows } = await Payment.findAndCountAll({
    limit: parseInt(limit),
    offset: parseInt(offset),
    order: [['createdAt', 'DESC']]
  });
  
  return res.json({
    total: count,
    page: parseInt(page),
    limit: parseInt(limit),
    pages: Math.ceil(count / limit),
    data: rows
  });
}
```

### 3. Adicionar CORS

```javascript
// npm install cors

const cors = require('cors');

app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true
}));
```

### 4. Adicionar Variáveis de Ambiente com .env

```bash
# npm install dotenv

# .env
DATABASE_URL=postgres://admin:admin@localhost:5432/payments_db
RABBITMQ_URL=amqp://admin:admin@localhost:5672
PORT=3001
NODE_ENV=development
```

```javascript
// index.js
require('dotenv').config();

const PORT = process.env.PORT || 3001;
```

### 5. Adicionar Soft Delete (Manter histórico)

```javascript
// Payment.js
const Payment = sequelize.define('Payment', {
  // ... campos existentes
  deletedAt: {
    type: DataTypes.DATE,
    defaultValue: null
  }
});

// Para listar (excluir deletados)
Payment.findAll({
  where: { deletedAt: null }
});

// Para deletar (soft delete)
await payment.update({ deletedAt: new Date() });
```

---

## 🟡 MÉDIO (2-4 horas)

### 1. Implementar Autenticação JWT

```bash
npm install jsonwebtoken bcryptjs
```

```javascript
// auth.middleware.js
const jwt = require('jsonwebtoken');

function authMiddleware(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ error: 'Token não fornecido' });
  }
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = decoded.userId;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Token inválido' });
  }
}

module.exports = authMiddleware;
```

```javascript
// payment.routes.js
const authMiddleware = require('../middlewares/auth.middleware');

router.post('/', authMiddleware, paymentController.createPayment);
```

### 2. Adicionar Rate Limiting

```bash
npm install express-rate-limit
```

```javascript
const rateLimit = require('express-rate-limit');

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100 // Máx 100 requisições
});

app.use('/payments', limiter);
```

### 3. Implementar Logging com Winston

```bash
npm install winston
```

```javascript
// logger.js
const winston = require('winston');

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' })
  ]
});

module.exports = logger;
```

### 4. Adicionar Testes Unitários (Jest)

```bash
npm install --save-dev jest
```

```javascript
// payment.service.test.js
describe('Payment Service', () => {
  it('should create a payment with pending status', async () => {
    const payment = await createPayment({
      userId: 'test',
      amount: 100
    });
    
    expect(payment.status).toBe('pending');
    expect(payment.id).toBeDefined();
  });
});
```

### 5. Adicionar Documentação Swagger

```bash
npm install swagger-ui-express swagger-jsdoc
```

```javascript
// swagger.js
const swaggerUi = require('swagger-ui-express');
const swaggerJsdoc = require('swagger-jsdoc');

const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Payment API',
      version: '1.0.0'
    },
    servers: [{ url: 'http://localhost:3001' }]
  },
  apis: ['./src/routes/*.js']
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
```

---

## 🔴 DIFÍCIL (4+ horas)

### 1. Integrar Gateway de Pagamento Real

```bash
npm install stripe axios
```

```javascript
// payment.service.js
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

async function createPayment(data) {
  // Criar charge no Stripe
  const charge = await stripe.charges.create({
    amount: Math.round(data.amount * 100), // Em centavos
    currency: 'usd',
    source: data.stripeToken,
    description: data.description
  });
  
  // Salvar no banco se bem-sucedido
  const payment = await Payment.create({
    userId: data.userId,
    amount: data.amount,
    stripeChargeId: charge.id,
    status: charge.paid ? 'success' : 'failed'
  });
  
  return payment;
}
```

### 2. Implementar Retry Automático com Dead Letter Queue

```javascript
// rabbitmq.js
async function connect() {
  // Criar fila de retry
  await channel.assertQueue('payment.pending.retry', { 
    durable: true,
    arguments: {
      'x-dead-letter-exchange': 'payment.dlx',
      'x-dead-letter-routing-key': 'payment.pending'
    }
  });
}

// Consumir com tentativas
async function consumeMessage(msg) {
  try {
    await processPayment(msg);
    channel.ack(msg);
  } catch (error) {
    // Rejeitar e reenviar para fila de retry
    channel.nack(msg, false, false);
  }
}
```

### 3. Adicionar Cache com Redis

```bash
npm install redis
```

```javascript
// redis-client.js
const redis = require('redis');
const client = redis.createClient({
  host: 'localhost',
  port: 6379
});

module.exports = client;
```

```javascript
// Usar no service
async function getPaymentById(id) {
  // Verificar cache
  const cached = await client.get(`payment:${id}`);
  if (cached) return JSON.parse(cached);
  
  // Buscar no banco
  const payment = await Payment.findByPk(id);
  
  // Cachear por 1 hora
  await client.setex(`payment:${id}`, 3600, JSON.stringify(payment));
  
  return payment;
}
```

### 4. Implementar Escalabilidade com Bull (Job Queue)

```bash
npm install bull
```

```javascript
// queues/payment.queue.js
const Queue = require('bull');
const paymentQueue = new Queue('payments', 'redis://localhost:6379');

paymentQueue.process(async (job) => {
  const { paymentId } = job.data;
  
  try {
    await confirmPayment(paymentId);
    return { success: true };
  } catch (error) {
    throw error; // Bull vai fazer retry
  }
});

// Adicionar job na fila
await paymentQueue.add(
  { paymentId: payment.id },
  { delay: 3000, attempts: 3 }
);
```

### 5. Implementar Webhooks para Sincronização

```javascript
// webhooks.controller.js
async function handleGatewayWebhook(req, res) {
  const { paymentId, status, stripeChargeId } = req.body;
  
  // Validar assinatura
  const signature = req.headers['x-webhook-signature'];
  if (!isValidSignature(signature, req.body)) {
    return res.status(401).json({ error: 'Invalid signature' });
  }
  
  // Atualizar pagamento
  await Payment.update(
    { status },
    { where: { id: paymentId } }
  );
  
  // Publicar evento
  const channel = getChannel();
  channel.sendToQueue('payment.webhook', Buffer.from(JSON.stringify({
    paymentId,
    status,
    timestamp: new Date().toISOString()
  })), { persistent: true });
  
  return res.json({ success: true });
}
```

---

## 🎯 Exemplo Completo: Melhorias Combinadas

```javascript
// payment.controller.js (versão melhorada)
const jwt = require('jsonwebtoken');
const logger = require('../logger');
const { validateCPF } = require('cpf-cnpj-validator');
const paymentService = require('../services/payment.service');
const authMiddleware = require('../middlewares/auth.middleware');

async function createPayment(req, res) {
  try {
    const { userId, amount, description, cpf } = req.body;
    const authenticatedUserId = req.userId; // Do JWT
    
    // Validações
    if (!userId || !amount || !cpf) {
      logger.warn('Validação falhou', { userId, amount, cpf });
      return res.status(400).json({
        error: 'userId, amount e cpf são obrigatórios'
      });
    }
    
    if (!validateCPF(cpf)) {
      return res.status(400).json({ error: 'CPF inválido' });
    }
    
    if (isNaN(amount) || Number(amount) <= 0) {
      return res.status(400).json({
        error: 'amount deve ser um número positivo'
      });
    }
    
    // Criar pagamento
    const payment = await paymentService.createPayment({
      userId,
      amount,
      description,
      cpf
    });
    
    logger.info('Pagamento criado', { 
      paymentId: payment.id, 
      userId,
      amount 
    });
    
    // Resposta com cache headers
    res.set('Cache-Control', 'no-cache');
    return res.status(201).json({
      message: 'Pagamento criado com sucesso',
      payment
    });
    
  } catch (error) {
    logger.error('Erro ao criar pagamento', { error: error.message });
    return res.status(500).json({ 
      error: 'Erro interno do servidor',
      requestId: req.id // Para rastreamento
    });
  }
}

module.exports = { createPayment };
```

---

## 📊 Exemplo de docker-compose Expandido

```yaml
version: '3.8'

services:
  postgres:
    image: postgres:15-alpine
    # ... existente

  rabbitmq:
    image: rabbitmq:3-management-alpine
    # ... existente

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"

  pgadmin:
    image: dpage/pgadmin4
    environment:
      PGADMIN_DEFAULT_EMAIL: admin@admin.com
      PGADMIN_DEFAULT_PASSWORD: admin
    ports:
      - "5050:80"

  ms-payment-service:
    build:
      context: ./ms-payment-service
      dockerfile: Dockerfile
    environment:
      DATABASE_URL: postgres://admin:admin@postgres:5432/payments_db
      RABBITMQ_URL: amqp://admin:admin@rabbitmq:5672
      REDIS_URL: redis://redis:6379
      JWT_SECRET: sua-chave-secreta-aqui
      STRIPE_SECRET_KEY: sk_test_seu_token
      PORT: 3001
    ports:
      - "3001:3001"
    depends_on:
      postgres:
        condition: service_healthy
      rabbitmq:
        condition: service_healthy
      redis:
        condition: service_started

volumes:
  postgres_data:
  redis_data:
```

---

## 🔒 Security Improvements

### 1. Input Sanitization

```bash
npm install express-validator
```

```javascript
const { body, validationResult } = require('express-validator');

router.post('/', [
  body('userId').trim().escape(),
  body('amount').isFloat({ min: 0.01 }),
  body('description').optional().trim().escape()
], paymentController.createPayment);
```

### 2. Helmet (Headers de Segurança)

```bash
npm install helmet
```

```javascript
const helmet = require('helmet');
app.use(helmet());
```

### 3. HTTPS em Produção

```javascript
const https = require('https');
const fs = require('fs');

const options = {
  key: fs.readFileSync('private.key'),
  cert: fs.readFileSync('certificate.crt')
};

https.createServer(options, app).listen(3001);
```

---

## 📈 Performance Improvements

### 1. Connection Pooling

```javascript
// database.js
const sequelize = new Sequelize(process.env.DATABASE_URL, {
  pool: {
    max: 10,
    min: 2,
    acquire: 30000,
    idle: 10000
  }
});
```

### 2. Compressão de Resposta

```bash
npm install compression
```

```javascript
const compression = require('compression');
app.use(compression());
```

### 3. Batch Processing para RabbitMQ

```javascript
// Processar múltiplas mensagens em batch
async function processBatch(messages) {
  const results = await Promise.all(
    messages.map(msg => processPayment(msg))
  );
  return results;
}
```

---

## 🎯 Checklist de Implementação

- [ ] Adicionar validação de CPF
- [ ] Adicionar paginação
- [ ] Adicionar CORS
- [ ] Arquivo .env com dotenv
- [ ] Soft delete
- [ ] JWT autenticação
- [ ] Rate limiting
- [ ] Logging Winston
- [ ] Testes Jest
- [ ] Swagger documentação
- [ ] Integração Stripe
- [ ] Retry automático
- [ ] Cache Redis
- [ ] Job Queue Bull
- [ ] Webhooks
- [ ] Helmet segurança
- [ ] Input sanitization
- [ ] HTTPS
- [ ] Connection pooling
- [ ] Compressão

---

## 📚 Recursos Extras

- [Stripe Documentation](https://stripe.com/docs)
- [RabbitMQ Tutorials](https://www.rabbitmq.com/getstarted.html)
- [Express Best Practices](https://expressjs.com/en/advanced/best-practice-security.html)
- [Node.js Performance](https://nodejs.org/en/docs/guides/nodejs-performance-best-practices/)
- [Docker Best Practices](https://docs.docker.com/develop/dev-best-practices/)

