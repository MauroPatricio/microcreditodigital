import fetch from 'node-fetch';

const testData = {
    name: 'Test Owner',
    email: 'testowner@example.com',
    phone: '846543210',
    password: 'test1234',
    identityDocument: '123456789BI',
    dateOfBirth: '1990-01-01',
    address: 'Maputo, Mozambique',
    role: 'owner',
    institutionName: 'Test Institution',
    institutionNuit: '123456789'
};

async function testRegister() {
    try {
        console.log('Testing registration endpoint...');
        console.log('Data:', JSON.stringify(testData, null, 2));

        const response = await fetch('http://127.0.0.1:4000/api/auth/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(testData)
        });

        const data = await response.json();

        console.log('\nStatus:', response.status);
        console.log('Response:', JSON.stringify(data, null, 2));

    } catch (error) {
        console.error('Error:', error.message);
    }
}

testRegister();
