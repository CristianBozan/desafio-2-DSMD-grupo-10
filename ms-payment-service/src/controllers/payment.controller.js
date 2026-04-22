const paymentService = require('../services/payment.service');

async function createPayment(req, res) {
  try {
    const { userId, amount, description } = req.body;

    if (!userId || !amount) {
      return res.status(400).json({
        error: 'Os campos userId e amount são obrigatórios',
      });
    }

    if (isNaN(amount) || Number(amount) <= 0) {
      return res.status(400).json({
        error: 'O campo amount deve ser um número positivo',
      });
    }

    const payment = await paymentService.createPayment({ userId, amount, description });

    return res.status(201).json({
      message: 'Solicitação de transação recebida com sucesso',
      payment,
    });
  } catch (error) {
    console.error('[Payment Controller] Erro:', error.message);
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
}

async function getAllPayments(req, res) {
  try {
    const payments = await paymentService.getAllPayments();
    return res.json(payments);
  } catch (error) {
    console.error('[Payment Controller] Erro:', error.message);
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
}

async function getPaymentById(req, res) {
  try {
    const payment = await paymentService.getPaymentById(req.params.id);

    if (!payment) {
      return res.status(404).json({ error: 'Pagamento não encontrado' });
    }

    return res.json(payment);
  } catch (error) {
    console.error('[Payment Controller] Erro:', error.message);
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
}

module.exports = { createPayment, getAllPayments, getPaymentById };
