import axios from 'axios';

/**
 * Serviço de integração com e-Mola API
 * Documentação: https://developer.emola.co.mz
 */

class EMolaService {
    constructor() {
        this.apiUrl = process.env.EMOLA_API_URL || 'https://api.emola.co.mz';
        this.apiKey = process.env.EMOLA_API_KEY;
        this.merchantId = process.env.EMOLA_MERCHANT_ID;
    }

    /**
     * Iniciar pagamento via e-Mola
     * @param {Object} paymentData - Dados do pagamento
     * @returns {Promise<Object>} - Resposta da API
     */
    async initiatePayment(paymentData) {
        try {
            const { amount, customerPhone, reference, description } = paymentData;

            const payload = {
                merchant_id: this.merchantId,
                amount: amount,
                customer_phone: customerPhone,
                reference: reference || `CS-${Date.now()}`,
                description: description || 'Pagamento de crédito CrediSmart+'
            };

            const response = await axios.post(
                `${this.apiUrl}/v1/payments`,
                payload,
                {
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${this.apiKey}`
                    }
                }
            );

            return {
                success: true,
                transactionId: response.data.transaction_id,
                status: response.data.status,
                message: response.data.message
            };
        } catch (error) {
            console.error('Erro ao processar pagamento e-Mola:', error.message);
            return {
                success: false,
                error: error.message,
                details: error.response?.data
            };
        }
    }

    /**
     * Consultar status de transação
     * @param {string} transactionId - ID da transação
     * @returns {Promise<Object>} - Status da transação
     */
    async queryTransaction(transactionId) {
        try {
            const response = await axios.get(
                `${this.apiUrl}/v1/payments/${transactionId}`,
                {
                    headers: {
                        'Authorization': `Bearer ${this.apiKey}`
                    }
                }
            );

            return {
                success: true,
                status: response.data.status,
                amount: response.data.amount,
                completedAt: response.data.completed_at
            };
        } catch (error) {
            console.error('Erro ao consultar transação e-Mola:', error.message);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Validar webhook do e-Mola
     * @param {Object} webhookData - Dados do webhook
     * @returns {boolean} - Validação bem-sucedida
     */
    validateWebhook(webhookData) {
        // Implementar validação de assinatura conforme documentação e-Mola
        // Por agora, retornamos true
        return true;
    }
}

export default new EMolaService();
