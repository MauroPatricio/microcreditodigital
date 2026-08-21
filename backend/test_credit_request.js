import fetch from 'node-fetch';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '.env') });

const testEndpoint = async () => {
    // We need a valid token. Let's create one for the owner of the institution.
    // Actually we can just use the DB to find the owner user and sign a token
    const token = jwt.sign({ id: '6a2d1c4f8de5c6e100254aa9' }, process.env.JWT_SECRET, { expiresIn: '1h' });

    try {
        const response = await fetch('http://localhost:4000/api/credits/request', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                amount: 1000,
                term: 2,
                periodicity: 'monthly',
                interestRate: 15,
                amortizationType: 'price',
                purpose: 'Test credit',
                clientId: '6a2d1c4f8de5c6e100254aa9' // Same owner acting as client for test
            })
        });

        const data = await response.json();
        console.log("Status:", response.status);
        console.log("Response:", data);
    } catch (e) {
        console.error(e);
    }
};

testEndpoint();
