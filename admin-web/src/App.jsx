import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Layout from './components/Layout';

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) return (
    <div style={{
      height: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'var(--bg-main)',
      color: 'var(--accent)'
    }}>
      Loading...
    </div>
  );

  if (!user) return <Navigate to="/login" />;

  return children;
};

// Placeholder components or actual pages
const Placeholder = ({ title }) => (
  <Layout>
    <div className="card">
      <h2>{title}</h2>
      <p style={{ color: 'var(--text-muted)', marginTop: '1rem' }}>Esta funcionalidade está em desenvolvimento.</p>
    </div>
  </Layout>
);

import ClientList from './pages/ClientList';
import ClientProfile from './pages/ClientProfile';
import LoanList from './pages/LoanList';
import LoanDetail from './pages/LoanDetail';
import PaymentList from './pages/PaymentList';
import InstitutionSettings from './pages/InstitutionSettings';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import OwnerRegister from './pages/OwnerRegister';
import Reports from './pages/Reports';
import CommissionSettings from './pages/CommissionSettings';
import AgentPerformance from './pages/AgentPerformance';
import MyCommissions from './pages/MyCommissions';
import SmsLogs from './pages/SmsLogs';
import AuditLogs from './pages/AuditLogs';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password/:token" element={<ResetPassword />} />
          <Route path="/register-owner" element={<OwnerRegister />} />

          <Route path="/dashboard" element={<ProtectedRoute><Layout><Dashboard /></Layout></ProtectedRoute>} />
          <Route path="/clients" element={<ProtectedRoute><ClientList /></ProtectedRoute>} />
          <Route path="/clients/:id" element={<ProtectedRoute><ClientProfile /></ProtectedRoute>} />
          <Route path="/loans" element={<ProtectedRoute><LoanList /></ProtectedRoute>} />
          <Route path="/credits/:id" element={<ProtectedRoute><LoanDetail /></ProtectedRoute>} />
          <Route path="/payments" element={<ProtectedRoute><PaymentList /></ProtectedRoute>} />
          <Route path="/reports" element={<ProtectedRoute><Reports /></ProtectedRoute>} />
          <Route path="/commissions" element={<ProtectedRoute><CommissionSettings /></ProtectedRoute>} />
          <Route path="/agent-performance" element={<ProtectedRoute><AgentPerformance /></ProtectedRoute>} />
          <Route path="/my-commissions" element={<ProtectedRoute><MyCommissions /></ProtectedRoute>} />
          <Route path="/sms-logs" element={<ProtectedRoute><SmsLogs /></ProtectedRoute>} />
          <Route path="/audit-logs" element={<ProtectedRoute><AuditLogs /></ProtectedRoute>} />
          <Route path="/settings" element={<ProtectedRoute><InstitutionSettings /></ProtectedRoute>} />

          <Route path="/" element={<Navigate to="/dashboard" />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
