const amqp = require('amqplib');

let channel;
let connection;

const QUEUES = {
  PAYMENT_PENDING: 'payment.pending',
  PAYMENT_CONFIRMED: 'payment.confirmed',
};

async function connect() {
  const url = process.env.RABBITMQ_URL || 'amqp://admin:admin@localhost:5672';
  let retries = 10;

  while (retries > 0) {
    try {
      connection = await amqp.connect(url);
      channel = await connection.createChannel();

      await channel.assertQueue(QUEUES.PAYMENT_PENDING, { durable: true });
      await channel.assertQueue(QUEUES.PAYMENT_CONFIRMED, { durable: true });

      console.log('[Payment Service] RabbitMQ conectado com sucesso');
      return channel;
    } catch (error) {
      retries--;
      console.log(`[Payment Service] Falha na conexão com RabbitMQ. Tentando novamente... (${retries} tentativas restantes)`);
      await new Promise((resolve) => setTimeout(resolve, 5000));
    }
  }

  throw new Error('[Payment Service] Não foi possível conectar ao RabbitMQ após múltiplas tentativas');
}

function getChannel() {
  return channel;
}

module.exports = { connect, getChannel, QUEUES };
