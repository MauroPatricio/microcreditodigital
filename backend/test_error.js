import fetch from 'node-fetch';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '.env') });

const testEndpoint = async () => {
    const token = jwt.sign({ id: '6a2d1c4f8de5c6e100254aa9' }, process.env.JWT_SECRET, { expiresIn: '1h' });

    try {
        const response = await fetch('http://localhost:4000/api/credits/request', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                amount: 5000,
                term: 6,
                purpose: 'Desenvolvimento de Negócio',
                collateral: [],
                clientId: '6a2d34a044f3bdedd400c3bc'
            })
        });

        const data = await response.json();
        console.log("Status:", response.status);
        console.log("Response:", JSON.stringify(data, null, 2));
    } catch (e) {
        console.error(e);
    }
};

testEndpoint();
