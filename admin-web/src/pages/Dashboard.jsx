import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import api from '../api';

const Dashboard = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [stats, setStats] = useState(null);

    useEffect(() => {
        // Determine greeting or load simple data if available
        // For now, just show user info
    }, []);

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <div style={{ padding: '2rem' }}>
            <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <h1>Dashboard</h1>
                <div>
                    <span>Welcome, {user?.name} ({user?.role})</span>
                    <button onClick={handleLogout} style={{ marginLeft: '1rem', padding: '0.5rem' }}>Logout</button>
                </div>
            </header>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem' }}>
                <div style={{ border: '1px solid #ccc', padding: '1rem', borderRadius: '8px' }}>
                    <h3>Features Ready</h3>
                    <p>Login confirmed.</p>
                </div>
                {/* Add more cards for Clients, Credits, etc. later */}
            </div>
        </div>
    );
};

export default Dashboard;
