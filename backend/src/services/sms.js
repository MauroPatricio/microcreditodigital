import SmsLog from '../models/SmsLog.js';

/**
 * Serviço de envio de SMS
 * Pode ser configurado para usar Twilio ou outro provedor local
 */
class SMSService {
    constructor() {
        this.provider = process.env.SMS_PROVIDER || 'local';
        this.initialized = false;
        this.fromNumber = process.env.TWILIO_PHONE_NUMBER || 'CrediSmart';

        if (this.provider === 'twilio') {
            this.initializeTwilio();
        } else {
            console.log('✅ SMS em modo local/simulado');
        }
    }

    initializeTwilio() {
        try {
            if (!process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_AUTH_TOKEN) {
                console.warn('⚠️  Twilio não configurado. SMS desabilitado.');
                return;
            }
            // Em produção: this.client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
            this.initialized = true;
            console.log('✅ Twilio SMS configurado');
        } catch (error) {
            console.error('❌ Erro ao configurar Twilio:', error.message);
            this.initialized = false;
        }
    }

    /**
     * Enviar SMS genérico e registrar no banco
     */
    async sendSMS(to, message, type, institutionId, userId, creditId) {
        let status = 'sent';
        let error = null;

        if (!this.initialized && this.provider === 'twilio') {
            status = 'failed';
            error = 'Provedor não inicializado';
        }

        try {
            if (this.initialized && this.provider === 'twilio') {
                // await this.client.messages.create({ ... });
                console.log(`📱 [TWILIO] SMS para ${to}: ${message}`);
            } else {
                console.log(`📱 [SIMULADO] SMS para ${to}: ${message}`);
            }

            // Registrar log independentemente do sucesso (para rastrear falhas também)
            await SmsLog.create({
                institution: institutionId,
                recipient: to,
                user: userId,
                credit: creditId,
                type,
                message,
                status: status,
                provider: this.provider,
                error
            });

            return { success: status === 'sent', to, message };
        } catch (err) {
            console.error(`Erro ao enviar/logar SMS: ${err.message}`);

            // Tentar logar a falha se ainda não logamos
            try {
                await SmsLog.create({
                    institution: institutionId,
                    recipient: to,
                    user: userId,
                    credit: creditId,
                    type,
                    message,
                    status: 'failed',
                    provider: this.provider,
                    error: err.message
                });
            } catch (logErr) { }

            return { success: false, error: err.message };
        }
    }

    // --- TEMPLATES ---

    async sendCreditApproved(to, amount, institution, userId, creditId) {
        const message = `${institution.name}: Parabéns! Seu crédito de ${this.formatCurrency(amount)} foi aprovado. O contrato foi gerado e aguarda sua assinatura digital.`;
        return this.sendSMS(to, message, 'approval', institution._id, userId, creditId);
    }

    async sendCreditRejected(to, reason, institution, userId, creditId) {
        const message = `${institution.name}: Informamos que seu pedido de crédito não foi aprovado nesta fase. Motivo: ${reason || 'Políticas internas'}.`;
        return this.sendSMS(to, message, 'rejection', institution._id, userId, creditId);
    }

    async sendDisbursementNotice(to, amount, method, institution, userId, creditId) {
        const message = `${institution.name}: O valor de ${this.formatCurrency(amount)} foi desembolsado via ${method.toUpperCase()}. Verifique sua conta.`;
        return this.sendSMS(to, message, 'disbursement', institution._id, userId, creditId);
    }

    async sendPaymentConfirmation(to, amount, balance, institution, userId, creditId) {
        const message = `${institution.name}: Confirmamos o recebimento de ${this.formatCurrency(amount)}. Saldo devedor atual: ${this.formatCurrency(balance)}. Obrigado!`;
        return this.sendSMS(to, message, 'payment', institution._id, userId, creditId);
    }

    async sendPaymentReminder(to, amount, dueDate, daysUntil, institution, userId, creditId) {
        const msgType = daysUntil > 0 ? 'reminder' : 'overdue';
        const message = `${institution.name}: Lembrete de pagamento. Sua parcela de ${this.formatCurrency(amount)} ${daysUntil > 0 ? `vence em ${daysUntil} dias (${dueDate})` : `está vencida desde ${dueDate}`}. Evite multas.`;
        return this.sendSMS(to, message, msgType, institution._id, userId, creditId);
    }

    async sendOTP(to, otp, institution) {
        const message = `${institution?.name || 'CrediSmart+'}: Seu código de verificação é ${otp}. Valido por 10 minutos.`;
        return this.sendSMS(to, message, 'otp', institution?._id);
    }

    formatCurrency(value) {
        return new Intl.NumberFormat('pt-MZ', { style: 'currency', currency: 'MZN' }).format(value);
    }
}

export default new SMSService();
