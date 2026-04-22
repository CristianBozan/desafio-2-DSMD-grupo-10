const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/payment.controller');

// POST /payments - Criar nova transação de pagamento
router.post('/', paymentController.createPayment);

// GET /payments - Listar todos os pagamentos
router.get('/', paymentController.getAllPayments);

// GET /payments/:id - Buscar pagamento por ID
router.get('/:id', paymentController.getPaymentById);

module.exports = router;
