import axios from 'axios';
import * as crypto from 'crypto';

class MpesaService {
  constructor() {
    this.MPESA_API_URL = process.env.MPESA_API_URL || 'https://api.sandbox.vm.co.mz:18352/ipg/v1x/b2c/';
    this.MPESA_PUBLIC_KEY = process.env.MPESA_PUBLIC_KEY || 'SUA_CHAVE_PUBLICA_RSA_M_PESA_AQUI';
    this.MPESA_API_KEY = process.env.MPESA_API_KEY || 'SEU_API_KEY';
    this.MPESA_SERVICE_PROVIDER_CODE = process.env.MPESA_SERVICE_PROVIDER_CODE || '171717';
  }

  generateMpesaToken() {
    try {
      const buffer = Buffer.from(this.MPESA_API_KEY);
      const encrypted = crypto.publicEncrypt(
        {
          key: `-----BEGIN PUBLIC KEY-----\n${this.MPESA_PUBLIC_KEY}\n-----END PUBLIC KEY-----`,
          padding: crypto.constants.RSA_PKCS1_PADDING,
        },
        buffer
      );
      return encrypted.toString('base64');
    } catch (error) {
      throw new Error(`Falha ao criptografar Token M-Pesa: ${error.message}`);
    }
  }

  async executeMpesaPayout({ amount, phoneNumber, referenceId }) {
    if (process.env.NODE_ENV !== 'production') {
      return this.simulateLocalPayout({ amount, phoneNumber, referenceId }, 'M-Pesa');
    }

    try {
      const bearerToken = this.generateMpesaToken();

      const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${bearerToken}`,
        'Origin': 'developer.mpesa.vm.co.mz'
      };

      const cleanPhone = phoneNumber.replace('+', '');

      const body = {
        input_TransactionReference: referenceId.substring(0, 12),
        input_CustomerMSISDN: cleanPhone,
        input_Amount: amount.toString(),
        input_ThirdPartyReference: referenceId.substring(0, 12),
        input_ServiceProviderCode: this.MPESA_SERVICE_PROVIDER_CODE
      };

      const response = await axios.post(this.MPESA_API_URL, body, { headers, timeout: 15000 });

      if (response.data && response.data.output_ResponseCode === 'INS-0') {
        return {
          success: true,
          transactionId: response.data.output_TransactionID
        };
      } else {
        return {
          success: false,
          errorMessage: response.data?.output_ResponseDesc || 'Transação rejeitada pelo M-Pesa.'
        };
      }
    } catch (error) {
      console.error('Erro na chamada da API M-Pesa:', error.response?.data || error.message);
      return {
        success: false,
        errorMessage: error.response?.data?.output_ResponseDesc || error.message || 'Falha de comunicação externa.'
      };
    }
  }

  async simulateLocalPayout(payload, gateway) {
    console.log(`[SIMULADOR ${gateway}] Processando levantamento de ${payload.amount} MT para ${payload.phoneNumber}...`);
    
    // Simulate delay
    await new Promise((resolve) => setTimeout(resolve, 1500));

    // Basic check for Mozambican prefixes
    if (!payload.phoneNumber.startsWith('258') && !payload.phoneNumber.startsWith('84') && !payload.phoneNumber.startsWith('85') && gateway === 'M-Pesa') {
      return {
        success: false,
        errorMessage: 'Prefixo inválido para M-Pesa. Deve começar com 25884, 84 ou 85.'
      };
    }

    const mockTxId = `TX_${gateway.toUpperCase()}_${Math.random().toString(36).substring(2, 9).toUpperCase()}`;

    return {
      success: true,
      transactionId: mockTxId
    };
  }
}

export const mpesaService = new MpesaService();
