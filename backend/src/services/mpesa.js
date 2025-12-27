import axios from 'axios';

/**
 * Serviço de integração com M-Pesa API
 * Documentação: https://developer.mpesa.vm.co.mz
 */

class MPesaService {
    constructor() {
        this.apiUrl = process.env.MPESA_API_URL || 'https://api.mpesa.vm.co.mz';
        this.publicKey = process.env.MPESA_PUBLIC_KEY;
        this.serviceProviderCode = process.env.MPESA_SERVICE_PROVIDER_CODE;
    }

    /**
     * Iniciar pagamento via M-Pesa
     * @param {Object} paymentData - Dados do pagamento
     * @returns {Promise<Object>} - Resposta da API
     */
    async initiatePayment(paymentData) {
        try {
            const { amount, customerMSISDN, reference, thirdPartyReference } = paymentData;

            const payload = {
                input_Amount: amount,
                input_CustomerMSISDN: customerMSISDN,
                input_ServiceProviderCode: this.serviceProviderCode,
                input_ThirdPartyReference: thirdPartyReference || `CS-${Date.now()}`,
                input_TransactionReference: reference || `PAY-${Date.now()}`
            };

            const response = await axios.post(
                `${this.apiUrl}/ipg/v1x/c2bPayment/singleStage/`,
                payload,
                {
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${this.publicKey}`
                    }
                }
            );

            return {
                success: true,
                transactionId: response.data.output_TransactionID,
                conversationId: response.data.output_ConversationID,
                responseCode: response.data.output_ResponseCode,
                responseDescription: response.data.output_ResponseDesc
            };
        } catch (error) {
            console.error('Erro ao processar pagamento M-Pesa:', error.message);
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
                `${this.apiUrl}/ipg/v1x/queryTransactionStatus/`,
                {
                    params: {
                        input_QueryReference: transactionId,
                        input_ServiceProviderCode: this.serviceProviderCode
                    },
                    headers: {
                        'Authorization': `Bearer ${this.publicKey}`
                    }
                }
            );

            return {
                success: true,
                status: response.data.output_ResponseCode,
                description: response.data.output_ResponseDesc
            };
        } catch (error) {
            console.error('Erro ao consultar transação M-Pesa:', error.message);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Validar webhook do M-Pesa
     * @param {Object} webhookData - Dados do webhook
     * @returns {boolean} - Validação bem-sucedida
     */
    validateWebhook(webhookData) {
        // Implementar validação de assinatura conforme documentação M-Pesa
        // Por agora, retornamos true
        return true;
    }
}

export default new MPesaService();
