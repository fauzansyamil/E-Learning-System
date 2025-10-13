// src/pages/Login.jsx
import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';

const Login = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    console.log('🔄 Attempting login...'); // Debug log
    console.log('Username:', username);
    console.log('Password:', password);
    
    try {
      const result = await login({ username, password });
      
      console.log('📥 Login result:', result); // Debug log
      
      if (result.success) {
        console.log('✅ Login successful!'); // Debug log
        onLogin();
      } else {
        console.log('❌ Login failed:', result.message); // Debug log
        setError(result.message || 'Login failed');
      }
    } catch (err) {
      console.error('❌ Login error:', err); // Debug log
      setError('Network error. Please check backend connection.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="relative">
              <div className="w-16 h-16 bg-green-500 rounded-lg transform rotate-12 absolute"></div>
              <div className="w-16 h-16 bg-red-500 rounded-lg transform -rotate-6 absolute left-4"></div>
              <div className="w-16 h-16 bg-blue-500 rounded-lg relative"></div>
            </div>
          </div>
          <h1 className="text-3xl font-bold text-gray-800 mt-4">E-Learning System</h1>
          <p className="text-gray-600 mt-2">Masuk ke akun Anda</p>
        </div>
        
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Username
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Masukkan username"
              required
              disabled={loading}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Masukkan password"
              required
              disabled={loading}
            />
          </div>
          
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 font-medium transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {loading ? 'Memproses...' : 'Masuk'}
          </button>
        </form>
        
        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <p className="text-sm font-semibold mb-2">Demo Accounts:</p>
          <div className="text-xs space-y-1">
            <p className="flex items-center">
              <span className="mr-2">👨‍💼</span>
              <span>Admin:</span>
              <code className="bg-gray-200 px-2 py-1 rounded ml-2">admin / admin123</code>
            </p>
            <p className="flex items-center">
              <span className="mr-2">👨‍🏫</span>
              <span>Dosen:</span>
              <code className="bg-gray-200 px-2 py-1 rounded ml-2">dosen1 / dosen123</code>
            </p>
            <p className="flex items-center">
              <span className="mr-2">👨‍🎓</span>
              <span>Mahasiswa:</span>
              <code className="bg-gray-200 px-2 py-1 rounded ml-2">mhs001 / mhs123</code>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;