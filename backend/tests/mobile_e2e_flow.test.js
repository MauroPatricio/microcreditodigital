import fetch from 'node-fetch';
import FormData from 'form-data';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

describe('E2E Mobile Flow Test (against localhost:4000)', () => {
    let clientToken;
    let clientId;
    let institutionId;
    let ownerToken;

    const testFilePath = path.join(__dirname, 'dummy_kyc_doc.pdf');

    beforeAll(() => {
        // Criar um arquivo dummy para upload
        fs.writeFileSync(testFilePath, 'Dummy PDF content for testing');
    });

    afterAll(() => {
        // Limpar o arquivo dummy
        if (fs.existsSync(testFilePath)) {
            fs.unlinkSync(testFilePath);
        }
    });

    it('Step 0: Should register an Owner to create an Institution', async () => {
        const response = await fetch('http://localhost:4000/api/auth/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                name: 'Owner E2E',
                email: 'owner.e2e_' + Date.now() + '@example.com',
                password: 'password123',
                phone: '84' + Math.floor(1000000 + Math.random() * 9000000),
                identityDocument: 'OWNER' + Math.floor(Math.random() * 10000) + 'B',
                dateOfBirth: '1980-01-01',
                role: 'owner',
                institutionName: 'Microcredito E2E ' + Date.now(),
                institutionNuit: '400' + Math.floor(100000 + Math.random() * 900000)
            })
        });

        const data = await response.json();
        
        if (!data.success) {
            console.error('Owner Register failed:', data);
        }
        
        expect(response.status).toBe(201);
        expect(data.success).toBe(true);
        expect(data.data.user.institution).toBeDefined();
        
        ownerToken = data.data.token;
        institutionId = data.data.user.institution;
    });

    it('Step 1: Should register a new user as a client', async () => {
        const response = await fetch('http://localhost:4000/api/auth/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                name: 'Joao Cliente E2E',
                email: 'joao.e2e_' + Date.now() + '@example.com',
                password: 'password123',
                phone: '84' + Math.floor(1000000 + Math.random() * 9000000), // Random phone to avoid duplicates
                identityDocument: '112233' + Math.floor(Math.random() * 10000) + 'B',
                dateOfBirth: '1990-01-01',
                role: 'client',
                institutionId: institutionId
            })
        });

        const data = await response.json();
        
        if (!data.success) {
            console.error('Client Register failed:', data);
        }
        
        expect(response.status).toBe(201);
        expect(data.success).toBe(true);
        expect(data.data.token).toBeDefined();
        
        clientToken = data.data.token;
        clientId = data.data.user._id;
    });

    it('Step 2: Should upload a KYC document', async () => {
        const formData = new FormData();
        formData.append('type', 'identity_card');
        formData.append('document', fs.createReadStream(testFilePath));

        const response = await fetch('http://localhost:4000/api/clients/documents/me', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${clientToken}`
                // node-fetch will automatically add the correct Content-Type with boundary for FormData
            },
            body: formData
        });

        const data = await response.json();
        
        if (!data.success) {
            console.error('Upload failed:', data);
        }

        expect(response.status).toBe(201);
        expect(data.success).toBe(true);
        expect(data.data.document).toBeDefined();
        expect(data.data.document.type).toBe('identity_card');
    });

    let managerToken;
    let creditId;

    it('Step 0.1: Should configure initial cash balance for institution', async () => {
        const response = await fetch('http://localhost:4000/api/cashflow/initial-balance', {
            method: 'PUT',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${ownerToken}`
            },
            body: JSON.stringify({
                initialBalance: 5000000
            })
        });
        const data = await response.json();
        expect(response.status).toBe(200);
        expect(data.success).toBe(true);
    });

    it('Step 0.2: Should register a Manager to act as Checker', async () => {
        const managerEmail = 'manager.e2e_' + Date.now() + '@example.com';
        const managerPassword = 'password123';
        
        // 1. Criar o utilizador gestor
        const createResponse = await fetch('http://localhost:4000/api/users', {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${ownerToken}`
            },
            body: JSON.stringify({
                name: 'Manager E2E',
                email: managerEmail,
                password: managerPassword,
                phone: '84' + Math.floor(1000000 + Math.random() * 9000000),
                identityDocument: 'MGR' + Math.floor(Math.random() * 10000) + 'B',
                dateOfBirth: '1985-01-01',
                role: 'manager'
            })
        });
        const createData = await createResponse.json();
        expect(createResponse.status).toBe(201);
        expect(createData.success).toBe(true);

        // 2. Fazer login para obter o token
        const loginResponse = await fetch('http://localhost:4000/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: managerEmail, password: managerPassword })
        });
        const loginData = await loginResponse.json();
        expect(loginResponse.status).toBe(200);
        managerToken = loginData.data.token;
    });

    it('Step 2.1: Owner verifies the Client account', async () => {
        const response = await fetch(`http://localhost:4000/api/clients/${clientId}/verify`, {
            method: 'PUT',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${ownerToken}`
            },
            body: JSON.stringify({ isVerified: true })
        });
        const data = await response.json();
        expect(response.status).toBe(200);
        expect(data.success).toBe(true);
    });

    it('Step 3: Client requests a credit', async () => {
        const response = await fetch('http://localhost:4000/api/credits/request', {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${clientToken}`
            },
            body: JSON.stringify({
                amount: 10000,
                term: 6,
                purpose: 'Negocio',
                periodicity: 'monthly',
                interestRate: 15,
                amortizationType: 'price'
            })
        });
        const data = await response.json();
        if (!data.success) console.error('Request Credit Failed:', data);
        expect(response.status).toBe(201);
        expect(data.success).toBe(true);
        creditId = data.data.credit._id;
    });

    it('Step 4: Owner approves credit', async () => {
        const response = await fetch(`http://localhost:4000/api/credits/${creditId}/approve`, {
            method: 'PUT',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${ownerToken}`
            },
            body: JSON.stringify({ approvedAmount: 10000 })
        });
        const data = await response.json();
        if (!data.success) console.error('Approve Credit Failed:', data);
        expect(response.status).toBe(200);
        expect(data.success).toBe(true);
    });

    it('Step 5: Owner generates contract', async () => {
        const response = await fetch(`http://localhost:4000/api/credits/${creditId}/generate-contract`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${ownerToken}`
            },
            body: JSON.stringify({ templateName: 'Padrao' })
        });
        const data = await response.json();
        if (!data.success) console.error('Generate contract Failed:', data);
        expect(response.status).toBe(200);
        expect(data.success).toBe(true);
    });

    it('Step 6: Client signs contract', async () => {
        const response = await fetch(`http://localhost:4000/api/credits/${creditId}/sign-contract`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${clientToken}`
            },
            body: JSON.stringify({ method: 'otp' })
        });
        const data = await response.json();
        expect(response.status).toBe(200);
        expect(data.success).toBe(true);
    });

    it('Step 7: Owner approves contract', async () => {
        const response = await fetch(`http://localhost:4000/api/credits/${creditId}/approve-contract`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${ownerToken}`
            }
        });
        const data = await response.json();
        expect(response.status).toBe(200);
        expect(data.success).toBe(true);
    });

    it('Step 8: Owner requests disbursement (Maker)', async () => {
        const response = await fetch(`http://localhost:4000/api/credits/${creditId}/disburse`, {
            method: 'PUT',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${ownerToken}`
            },
            body: JSON.stringify({ disbursementMethod: 'mpesa' })
        });
        const data = await response.json();
        if (!data.success) console.error('Disburse Request Failed:', data);
        expect(response.status).toBe(200);
        expect(data.success).toBe(true);
    });

    it('Step 9: Manager approves disbursement (Checker)', async () => {
        const response = await fetch(`http://localhost:4000/api/credits/${creditId}/approve-disbursement`, {
            method: 'PUT',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${managerToken}`
            }
        });
        const data = await response.json();
        if (!data.success) console.error('Disburse Approve Failed:', data);
        expect(response.status).toBe(200);
        expect(data.success).toBe(true);
    });

    let firstInstallmentId;
    let firstInstallmentAmount;

    it('Step 10: View Payment Plan (Installments)', async () => {
        const response = await fetch(`http://localhost:4000/api/credits/${creditId}`, {
            method: 'GET',
            headers: { 
                'Authorization': `Bearer ${clientToken}`
            }
        });
        const data = await response.json();
        expect(response.status).toBe(200);
        expect(data.success).toBe(true);
        expect(data.data.credit.installments).toBeDefined();
        expect(data.data.credit.installments.length).toBeGreaterThan(0);
        
        // Save for the next step
        firstInstallmentId = data.data.credit.installments[0]._id;
        firstInstallmentAmount = data.data.credit.installments[0].amount;
    });

    it('Step 11: Make a Payment', async () => {
        const response = await fetch('http://localhost:4000/api/payments', {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${clientToken}`
            },
            body: JSON.stringify({
                creditId: creditId,
                installmentId: firstInstallmentId,
                amount: firstInstallmentAmount,
                paymentMethod: 'mpesa'
            })
        });
        const data = await response.json();
        if (!data.success) console.error('Payment Failed:', data);
        expect(response.status).toBe(201);
        expect(data.success).toBe(true);
    });

    it('Step 12: View Reports (Cashflow Summary)', async () => {
        const response = await fetch('http://localhost:4000/api/cashflow/summary', {
            method: 'GET',
            headers: { 
                'Authorization': `Bearer ${ownerToken}`
            }
        });
        const data = await response.json();
        if (!data.success) console.error('Reports Failed:', data);
        expect(response.status).toBe(200);
        expect(data.success).toBe(true);
        expect(data.data.totalEntradas).toBeDefined();
    });

    it('Step 13: View Dashboard Analytics', async () => {
        const response = await fetch('http://localhost:4000/api/analytics/dashboard', {
            method: 'GET',
            headers: { 
                'Authorization': `Bearer ${ownerToken}`
            }
        });
        const data = await response.json();
        if (!data.success) console.error('Dashboard Failed:', data);
        expect(response.status).toBe(200);
        expect(data.success).toBe(true);
        expect(data.data.clients).toBeDefined();
    });
});
