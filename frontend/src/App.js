import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from '@/components/ui/sonner';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Accounts from './pages/Accounts';
import Transactions from './pages/Transactions';
import RecurringTransactions from './pages/RecurringTransactions';
import Reports from './pages/Reports';
import Layout from './components/Layout';
import '@/App.css';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;
export const API = `${BACKEND_URL}/api`;

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const savedUser = localStorage.getItem('user');
    
    if (token && savedUser) {
      setUser(JSON.parse(savedUser));
    }
    setLoading(false);
  }, []);

  const ProtectedRoute = ({ children }) => {
    if (loading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
    return user ? children : <Navigate to="/login" />;
  };

  const PublicRoute = ({ children }) => {
    if (loading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
    return !user ? children : <Navigate to="/dashboard" />;
  };

  return (
    <div className="App">
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<PublicRoute><Login setUser={setUser} /></PublicRoute>} />
          <Route path="/register" element={<PublicRoute><Register setUser={setUser} /></PublicRoute>} />
          
          <Route path="/" element={<ProtectedRoute><Layout user={user} setUser={setUser} /></ProtectedRoute>}>
            <Route index element={<Navigate to="/dashboard" />} />
            <Route path="dashboard" element={<Dashboard user={user} />} />
            <Route path="accounts" element={<Accounts user={user} />} />
            <Route path="transactions" element={<Transactions user={user} />} />
            <Route path="recurring" element={<RecurringTransactions user={user} />} />
            <Route path="reports" element={<Reports user={user} />} />
          </Route>
        </Routes>
      </BrowserRouter>
      <Toaster position="top-right" richColors />
    </div>
  );
}

export default App;
