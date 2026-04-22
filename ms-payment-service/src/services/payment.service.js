const Payment = require('../models/Payment');
const { getChannel, QUEUES } = require('../config/rabbitmq');

async function createPayment(data) {
  // Etapa I: Armazena a transação com status "pending"
  const payment = await Payment.create({
    userId: data.userId,
    amount: data.amount,
    description: data.description,
    status: 'pending',
  });

  console.log(`\n[Payment Service] ✅ Transação criada | ID: ${payment.id} | Status: pending`);

  // Etapa II: Publica mensagem na fila para notificação de recebimento
  const channel = getChannel();

  const pendingMessage = {
    paymentId: payment.id,
    userId: payment.userId,
    amount: payment.amount,
    description: payment.description,
    status: 'pending',
    event: 'PAYMENT_RECEIVED',
    timestamp: new Date().toISOString(),
  };

  channel.sendToQueue(
    QUEUES.PAYMENT_PENDING,
    Buffer.from(JSON.stringify(pendingMessage)),
    { persistent: true }
  );

  console.log(`[Payment Service] 📤 Mensagem publicada na fila: ${QUEUES.PAYMENT_PENDING}`);

  // Etapa IV e V: Confirma a transação de forma assíncrona (simulando processamento)
  setTimeout(async () => {
    try {
      // Etapa IV: Confirma a transação e atualiza para "success"
      await payment.update({ status: 'success' });
      console.log(`\n[Payment Service] ✅ Transação confirmada | ID: ${payment.id} | Status: success`);

      // Etapa V: Publica mensagem na fila para notificação de confirmação
      const confirmedMessage = {
        paymentId: payment.id,
        userId: payment.userId,
        amount: payment.amount,
        description: payment.description,
        status: 'success',
        event: 'PAYMENT_CONFIRMED',
        timestamp: new Date().toISOString(),
      };

      channel.sendToQueue(
        QUEUES.PAYMENT_CONFIRMED,
        Buffer.from(JSON.stringify(confirmedMessage)),
        { persistent: true }
      );

      console.log(`[Payment Service] 📤 Mensagem publicada na fila: ${QUEUES.PAYMENT_CONFIRMED}`);
    } catch (error) {
      console.error('[Payment Service] ❌ Erro ao confirmar transação:', error.message);
    }
  }, 3000); // Simula 3 segundos de processamento

  return payment;
}

async function getAllPayments() {
  return Payment.findAll({ order: [['createdAt', 'DESC']] });
}

async function getPaymentById(id) {
  return Payment.findByPk(id);
}

module.exports = { createPayment, getAllPayments, getPaymentById };
