const express = require('express');
const { sequelize } = require('./config/database');
const { connect } = require('./config/rabbitmq');
const paymentRoutes = require('./routes/payment.routes');

const app = express();
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'ms-payment-service' });
});

// Rotas de pagamento
app.use('/payments', paymentRoutes);

const PORT = process.env.PORT || 3001;

async function connectDatabase() {
  let retries = 10;
  while (retries > 0) {
    try {
      await sequelize.authenticate();
      console.log('[Payment Service] Banco de dados conectado com sucesso');
      await sequelize.sync({ force: false });
      console.log('[Payment Service] Tabelas sincronizadas');
      return;
    } catch (error) {
      retries--;
      console.log(`[Payment Service] Falha na conexão com o banco. Tentando novamente... (${retries} tentativas restantes)`);
      await new Promise((resolve) => setTimeout(resolve, 3000));
    }
  }
  throw new Error('[Payment Service] Não foi possível conectar ao banco de dados');
}

async function start() {
  try {
    await connectDatabase();
    await connect();

    app.listen(PORT, () => {
      console.log(`\n[Payment Service] 🚀 Serviço rodando na porta ${PORT}`);
      console.log(`[Payment Service] Endpoints disponíveis:`);
      console.log(`  POST http://localhost:${PORT}/payments`);
      console.log(`  GET  http://localhost:${PORT}/payments`);
      console.log(`  GET  http://localhost:${PORT}/payments/:id\n`);
    });
  } catch (error) {
    console.error('[Payment Service] ❌ Erro ao iniciar:', error.message);
    process.exit(1);
  }
}

start();
