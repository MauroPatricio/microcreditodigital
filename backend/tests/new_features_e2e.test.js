import fetch from 'node-fetch';
import FormData from 'form-data';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

describe('New Features E2E Flow (Institution Settings, Guarantor, Payment Upload)', () => {
    let ownerToken;
    let institutionId;
    let clientToken;
    let clientId;
    let managerToken;
    let creditId;
    let paymentId;
    let firstInstallmentId;

    const testFilePath = path.join(__dirname, 'dummy_receipt.jpg');

    beforeAll(() => {
        fs.writeFileSync(testFilePath, 'Dummy receipt content');
    });

    afterAll(() => {
        if (fs.existsSync(testFilePath)) {
            fs.unlinkSync(testFilePath);
        }
    });

    it('Step 1: Register Owner and get Institution', async () => {
        const response = await fetch('http://localhost:4000/api/auth/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                name: 'Admin E2E',
                email: 'admin.new_' + Date.now() + '@example.com',
                password: 'password123',
                phone: '84' + Math.floor(1000000 + Math.random() * 9000000),
                identityDocument: 'ADMIN' + Math.floor(Math.random() * 10000) + 'B',
                dateOfBirth: '1980-01-01',
                role: 'owner',
                institutionName: 'Nova Instituicao ' + Date.now(),
                institutionNuit: '400' + Math.floor(100000 + Math.random() * 900000)
            })
        });

        const data = await response.json();
        expect(response.status).toBe(201);
        ownerToken = data.data.token;
        institutionId = data.data.user.institution?._id || data.data.user.institution;
    });

    it('Step 2: Owner updates Institution Settings (Payment Accounts & Guarantor Required)', async () => {
        const response = await fetch('http://localhost:4000/api/institutions/my', {
            method: 'PUT',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${ownerToken}`
            },
            body: JSON.stringify({
                settings: {
                    guaranteeSettings: { isRequired: true, requiredDocuments: [] },
                    paymentAccounts: [
                        { provider: 'mpesa', accountName: 'Admin Mpesa', accountNumber: '840000000' }
                    ],
                    interestRates: { default: 20, management: 5, late: 10 }
                }
            })
        });

        const data = await response.json();
        expect(response.status).toBe(200);
        expect(data.data.settings.guaranteeSettings.isRequired).toBe(true);
    });

    it('Step 3: Register a new Client', async () => {
        const response = await fetch('http://localhost:4000/api/auth/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                name: 'Cliente com Garante',
                email: 'cliente.novo_' + Date.now() + '@example.com',
                password: 'password123',
                phone: '84' + Math.floor(1000000 + Math.random() * 9000000),
                identityDocument: '112233' + Math.floor(Math.random() * 10000) + 'B',
                dateOfBirth: '1990-01-01',
                role: 'client',
                institutionId: institutionId
            })
        });

        const data = await response.json();
        expect(response.status).toBe(201);
        clientToken = data.data.token;
        clientId = data.data.user._id;
    });

    it('Step 4: Owner configures initial cash balance and verifies client', async () => {
        await fetch('http://localhost:4000/api/cashflow/initial-balance', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${ownerToken}` },
            body: JSON.stringify({ initialBalance: 1000000 })
        });

        await fetch(`http://localhost:4000/api/clients/${clientId}/verify`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${ownerToken}` },
            body: JSON.stringify({ isVerified: true })
        });
    });

    it('Step 5: Client requests a credit WITH guarantor data', async () => {
        const response = await fetch('http://localhost:4000/api/credits/request', {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${clientToken}`
            },
            body: JSON.stringify({
                amount: 5000,
                term: 3,
                purpose: 'Emergencia',
                periodicity: 'monthly',
                interestRate: 20,
                amortizationType: 'price',
                guarantor: {
                    name: 'Fiador Teste',
                    phone: '820000000',
                    address: 'Rua do Fiador',
                    relationship: 'Irmão',
                    documentNumber: 'FIADOR123'
                }
            })
        });
        const data = await response.json();
        if (response.status !== 201) console.error("Credit Request Error:", data);
        expect(response.status).toBe(201);
        expect(data.success).toBe(true);
        creditId = data.data.credit._id;
    });

    it('Step 6: Owner Approves, Client signs contract, and Owner disburses credit', async () => {
        // Approve
        await fetch(`http://localhost:4000/api/credits/${creditId}/approve`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${ownerToken}` },
            body: JSON.stringify({ approvedAmount: 5000 })
        });

        // Generate Contract
        await fetch(`http://localhost:4000/api/credits/${creditId}/generate-contract`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${ownerToken}` },
            body: JSON.stringify({ templateName: 'Padrao' })
        });

        // Sign Contract
        await fetch(`http://localhost:4000/api/credits/${creditId}/sign-contract`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${clientToken}` },
            body: JSON.stringify({ method: 'otp' })
        });

        // Approve Contract
        await fetch(`http://localhost:4000/api/credits/${creditId}/approve-contract`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${ownerToken}` }
        });

        // Disburse
        await fetch(`http://localhost:4000/api/credits/${creditId}/disburse`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${ownerToken}` },
            body: JSON.stringify({ disbursementMethod: 'mpesa' })
        });
    });

    it('Step 7: Manager approves disbursement', async () => {
        const managerEmail = 'manager.new_' + Date.now() + '@example.com';
        await fetch('http://localhost:4000/api/users', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${ownerToken}` },
            body: JSON.stringify({
                name: 'Manager E2E', email: managerEmail, password: 'password123',
                phone: '84' + Math.floor(1000000 + Math.random() * 9000000),
                identityDocument: 'MGR' + Math.floor(Math.random() * 10000) + 'B',
                dateOfBirth: '1985-01-01', role: 'manager'
            })
        });
        const loginResponse = await fetch('http://localhost:4000/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: managerEmail, password: 'password123' })
        });
        const loginData = await loginResponse.json();
        managerToken = loginData.data.token;

        const res = await fetch(`http://localhost:4000/api/credits/${creditId}/approve-disbursement`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${managerToken}` }
        });
        if (res.status !== 200) console.error("Manager Approve Disbursement Error:", await res.text());
        expect(res.status).toBe(200);
    });

    it('Step 8: Fetch Installments', async () => {
        const response = await fetch(`http://localhost:4000/api/credits/${creditId}`, {
            method: 'GET',
            headers: { 'Authorization': `Bearer ${clientToken}` }
        });
        const data = await response.json();
        expect(response.status).toBe(200);
        firstInstallmentId = data.data.credit.installments[0]._id;
    });

    it('Step 9: Client uploads Payment Receipt (Multipart form)', async () => {
        const formData = new FormData();
        formData.append('creditId', creditId);
        formData.append('installmentId', firstInstallmentId);
        formData.append('amount', 2000);
        formData.append('paymentMethod', 'mpesa');
        formData.append('transactionId', 'TRANS' + Date.now());
        formData.append('receipt', fs.createReadStream(testFilePath));

        const response = await fetch('http://localhost:4000/api/payments', {
            method: 'POST',
            headers: { 
                'Authorization': `Bearer ${clientToken}`,
                ...formData.getHeaders()
            },
            body: formData
        });
        
        const responseText = await response.text();
        if (response.status !== 201) console.error("Payment Upload Error:", responseText);
        expect(response.status).toBe(201);
        const data = JSON.parse(responseText || '{}');
        
        paymentId = data.data?.payment?._id;
        expect(data.data?.payment?.status).toBe('pending');
        expect(data.data?.payment?.receiptUrl).toBeDefined();
    });

    it('Step 10: Owner reviews and confirms the payment', async () => {
        const response = await fetch(`http://localhost:4000/api/payments/${paymentId}/confirm`, {
            method: 'PUT',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${ownerToken}` 
            },
            body: JSON.stringify({ status: 'completed', notes: 'Valid receipt' })
        });
        
        const data = await response.json();
        expect(response.status).toBe(200);
        expect(['confirmed', 'completed']).toContain(data.data.payment.status);
    });
});
