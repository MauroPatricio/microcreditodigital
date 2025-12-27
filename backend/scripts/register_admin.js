import axios from 'axios';

const registerUser = async () => {
    try {
        const res = await axios.post('http://localhost:5000/api/auth/register', {
            name: 'Admin Test',
            email: 'admin@test.com',
            password: 'password123',
            phone: '849999999',
            identityDocument: '110100100100A',
            dateOfBirth: '1990-01-01',
            address: 'Test Address'
        });
        console.log('User registered:', res.data);
    } catch (error) {
        if (error.response) {
            console.error('Registration failed:', error.response.data);
        } else {
            console.error('Registration failed:', error.message);
        }
    }
};

registerUser();
