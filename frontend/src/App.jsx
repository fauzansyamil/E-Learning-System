// src/App.jsx
import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Classes from './pages/Classes';
import Assignments from './pages/Assignments';

function AppContent() {
  const [currentPage, setCurrentPage] = useState('login');
  const { isAuthenticated } = useAuth();

  const handleNavigation = (page) => {
    setCurrentPage(page);
  };

  const handleLogin = () => {
    setCurrentPage('dashboard');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {currentPage === 'login' && <Login onLogin={handleLogin} />}
      {currentPage === 'dashboard' && isAuthenticated && <Dashboard onNavigate={handleNavigation} />}
      {currentPage === 'classes' && isAuthenticated && <Classes onNavigate={handleNavigation} />}
      {currentPage === 'assignments' && isAuthenticated && <Assignments onNavigate={handleNavigation} />}
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;