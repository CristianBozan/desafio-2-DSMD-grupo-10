const express = require('express');
const { connect } = require('./config/rabbitmq');
const { startConsumers } = require('./consumers/notification.consumer');

const app = express();
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'ms-notification-service' });
});

const PORT = process.env.PORT || 3002;

async function start() {
  try {
    await connect();
    await startConsumers();

    app.listen(PORT, () => {
      console.log(`[Notification Service] 🚀 Serviço rodando na porta ${PORT}`);
      console.log(`[Notification Service] Health check: http://localhost:${PORT}/health\n`);
    });
  } catch (error) {
    console.error('[Notification Service] ❌ Erro ao iniciar:', error.message);
    process.exit(1);
  }
}

start();
