/**
 * Serviço de envio de SMS
 * Pode ser configurado para usar Twilio ou outro provedor local
 */

class SMSService {
    constructor() {
        this.provider = process.env.SMS_PROVIDER || 'twilio';
        this.initialized = false;

        if (this.provider === 'twilio') {
            this.initializeTwilio();
        }
    }

    initializeTwilio() {
        try {
            if (!process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_AUTH_TOKEN) {
                console.warn('⚠️  Twilio não configurado. SMS desabilitado.');
                return;
            }

            // Em produção, você instalaria: npm install twilio
            // const twilio = require('twilio');
            // this.client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

            this.initialized = true;
            console.log('✅ Twilio SMS configurado');
        } catch (error) {
            console.error('❌ Erro ao configurar Twilio:', error.message);
            this.initialized = false;
        }
    }

    /**
     * Enviar SMS
     * @param {string} to - Número de telefone do destinatário
     * @param {string} message - Mensagem
     * @returns {Promise<Object>} - Resultado do envio
     */
    async sendSMS(to, message) {
        if (!this.initialized) {
            console.log('📱 SMS (simulado):', to, message);
            return { success: true, simulated: true };
        }

        try {
            // Em produção com Twilio:
            // const response = await this.client.messages.create({
            //   body: message,
            //   from: process.env.TWILIO_PHONE_NUMBER,
            //   to: to
            // });

            // Por agora, apenas simulamos
            console.log('📱 SMS enviado para:', to);
            console.log('   Mensagem:', message);

            return {
                success: true,
                to,
                message,
                simulated: true
            };
        } catch (error) {
            console.error('Erro ao enviar SMS:', error.message);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Enviar lembrete de pagamento via SMS
     * @param {string} phone - Telefone do cliente
     * @param {Object} installmentData - Dados da parcela
     * @returns {Promise<Object>} - Resultado do envio
     */
    async sendPaymentReminder(phone, installmentData) {
        const message = `CrediSmart+: Lembrete! Sua parcela ${installmentData.installmentNumber} de ${installmentData.amount.toFixed(2)} MT vence em ${installmentData.daysUntilDue} dias. Não se esqueça!`;

        return await this.sendSMS(phone, message);
    }

    /**
     * Enviar confirmação de pagamento via SMS
     * @param {string} phone - Telefone do cliente
     * @param {number} amount - Valor pago
     * @returns {Promise<Object>} - Resultado do envio
     */
    async sendPaymentConfirmation(phone, amount) {
        const message = `CrediSmart+: Pagamento de ${amount.toFixed(2)} MT confirmado com sucesso. Obrigado!`;

        return await this.sendSMS(phone, message);
    }

    /**
     * Enviar notificação de crédito aprovado via SMS
     * @param {string} phone - Telefone do cliente
     * @param {number} amount - Valor aprovado
     * @returns {Promise<Object>} - Resultado do envio
     */
    async sendCreditApproved(phone, amount) {
        const message = `CrediSmart+: Parabéns! Seu crédito de ${amount.toFixed(2)} MT foi aprovado. Aguarde o desembolso.`;

        return await this.sendSMS(phone, message);
    }
}

module.exports = new SMSService();
