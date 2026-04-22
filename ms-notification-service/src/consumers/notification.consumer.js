const { getChannel, QUEUES } = require('../config/rabbitmq');

function sendNotification(event, data) {
  const timestamp = new Date().toISOString();

  if (event === 'PAYMENT_RECEIVED') {
    console.log('\n==========================================');
    console.log('[Notification Service] 🔔 NOTIFICAÇÃO ENVIADA AO USUÁRIO');
    console.log('==========================================');
    console.log(`📧 Para:        Usuário ${data.userId}`);
    console.log(`📋 Assunto:     Solicitação de pagamento recebida`);
    console.log(`💬 Mensagem:    Olá! Recebemos sua solicitação de pagamento.`);
    console.log(`💰 Valor:       R$ ${Number(data.amount).toFixed(2)}`);
    console.log(`📝 Descrição:   ${data.description || 'Não informada'}`);
    console.log(`🔑 ID:          ${data.paymentId}`);
    console.log(`⏰ Status:      Pendente - em processamento`);
    console.log(`🕐 Horário:     ${timestamp}`);
    console.log('==========================================\n');
  } else if (event === 'PAYMENT_CONFIRMED') {
    console.log('\n==========================================');
    console.log('[Notification Service] ✅ NOTIFICAÇÃO ENVIADA AO USUÁRIO');
    console.log('==========================================');
    console.log(`📧 Para:        Usuário ${data.userId}`);
    console.log(`📋 Assunto:     Pagamento confirmado com sucesso!`);
    console.log(`💬 Mensagem:    Seu pagamento foi confirmado! Obrigado pela compra.`);
    console.log(`💰 Valor:       R$ ${Number(data.amount).toFixed(2)}`);
    console.log(`📝 Descrição:   ${data.description || 'Não informada'}`);
    console.log(`🔑 ID:          ${data.paymentId}`);
    console.log(`⏰ Status:      Confirmado ✅`);
    console.log(`🕐 Horário:     ${timestamp}`);
    console.log('==========================================\n');
  }
}

async function startConsumers() {
  const channel = getChannel();

  // Etapa III: Consumer para pagamento recebido (status pending)
  channel.consume(QUEUES.PAYMENT_PENDING, (message) => {
    if (message !== null) {
      try {
        const data = JSON.parse(message.content.toString());
        console.log(`[Notification Service] 📥 Mensagem recebida da fila: ${QUEUES.PAYMENT_PENDING}`);

        // Envia notificação ao usuário sobre o recebimento da solicitação
        sendNotification('PAYMENT_RECEIVED', data);

        channel.ack(message);
      } catch (error) {
        console.error('[Notification Service] ❌ Erro ao processar mensagem:', error.message);
        channel.nack(message, false, false);
      }
    }
  });

  // Etapa VI: Consumer para pagamento confirmado (status success)
  channel.consume(QUEUES.PAYMENT_CONFIRMED, (message) => {
    if (message !== null) {
      try {
        const data = JSON.parse(message.content.toString());
        console.log(`[Notification Service] 📥 Mensagem recebida da fila: ${QUEUES.PAYMENT_CONFIRMED}`);

        // Envia notificação ao usuário sobre a confirmação do pagamento
        sendNotification('PAYMENT_CONFIRMED', data);

        channel.ack(message);
      } catch (error) {
        console.error('[Notification Service] ❌ Erro ao processar mensagem:', error.message);
        channel.nack(message, false, false);
      }
    }
  });

  console.log('[Notification Service] 👂 Consumers iniciados. Aguardando mensagens...');
  console.log(`  - Ouvindo fila: ${QUEUES.PAYMENT_PENDING}`);
  console.log(`  - Ouvindo fila: ${QUEUES.PAYMENT_CONFIRMED}\n`);
}

module.exports = { startConsumers };
