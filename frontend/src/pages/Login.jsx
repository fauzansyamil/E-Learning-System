// frontend/src/pages/Login.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Call backend API
      const response = await api.post('/auth/login', {
        username,
        password
      });

      const { token, user } = response.data;

      // Save to context and localStorage
      login(token, user);

      // Redirect based on role
      if (user.role === 'admin') {
        navigate('/admin/dashboard');
      } else if (user.role === 'lecturer') {
        navigate('/lecturer/dashboard');
      } else {
        navigate('/dashboard');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Login gagal. Silakan coba lagi.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row">
      {/* Left Side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-blue-600 via-blue-700 to-blue-900 text-white p-12 relative overflow-hidden">
        {/* Decorative circles */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full -mr-48 -mt-48"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-white/5 rounded-full -ml-48 -mb-48"></div>
        
        <div className="relative z-10 flex flex-col justify-between w-full">
          {/* Logo & Title */}
          <div>
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center text-4xl shadow-lg">
                🎓
              </div>
              <div>
                <h1 className="text-3xl font-bold">UTN E-Learning</h1>
                <p className="text-blue-200 text-sm">Universitas Teknologi Nusantara</p>
              </div>
            </div>

            <div className="mt-12 space-y-6">
              <div className="flex items-start space-x-4">
                <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center text-2xl flex-shrink-0">
                  📚
                </div>
                <div>
                  <h3 className="font-semibold text-lg mb-1">Pembelajaran Modern</h3>
                  <p className="text-blue-200 text-sm">Akses materi kuliah kapan saja, di mana saja</p>
                </div>
              </div>

              <div className="flex items-start space-x-4">
                <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center text-2xl flex-shrink-0">
                  💬
                </div>
                <div>
                  <h3 className="font-semibold text-lg mb-1">Kolaborasi Interaktif</h3>
                  <p className="text-blue-200 text-sm">Diskusi dengan dosen dan mahasiswa lain</p>
                </div>
              </div>

              <div className="flex items-start space-x-4">
                <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center text-2xl flex-shrink-0">
                  📊
                </div>
                <div>
                  <h3 className="font-semibold text-lg mb-1">Tracking Progress</h3>
                  <p className="text-blue-200 text-sm">Pantau perkembangan akademik secara real-time</p>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="text-sm text-blue-200">
            <p className="font-semibold mb-1">Universitas Teknologi Nusantara</p>
            <p>Jl. Pendidikan Teknologi No. 123, Jakarta Selatan 12640</p>
            <p className="text-sm text-blue-200 mt-2">
              📞 (021) 7818-9000 | ✉️ info@utn.ac.id
            </p>
            <p className="text-xs text-blue-300 mt-4">
              © 2025 Universitas Teknologi Nusantara. All rights reserved.
            </p>
          </div>
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-gray-50">
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <div className="lg:hidden text-center mb-8">
            <div className="inline-flex items-center space-x-3 mb-4">
              <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center text-2xl">
                🎓
              </div>
              <div className="text-left">
                <h1 className="text-xl font-bold text-gray-800">UTN</h1>
                <p className="text-sm text-gray-600">E-Learning</p>
              </div>
            </div>
          </div>

          {/* Welcome Text */}
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-gray-800 mb-2">Selamat Datang! 👋</h2>
            <p className="text-gray-600">Masuk ke akun E-Learning Anda</p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-5 p-4 bg-red-50 border border-red-200 rounded-xl">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleLogin} className="space-y-5">
            {/* Username Field */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Username atau Email
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <span className="text-gray-400 text-xl">👤</span>
                </div>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  placeholder="Masukkan username atau email"
                  required
                  disabled={loading}
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <span className="text-gray-400 text-xl">🔒</span>
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-12 pr-12 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  placeholder="Masukkan password"
                  required
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-600"
                  disabled={loading}
                >
                  <span className="text-xl">{showPassword ? '👁️' : '👁️‍🗨️'}</span>
                </button>
              </div>
            </div>

            {/* Remember Me & Forgot Password */}
            <div className="flex items-center justify-between">
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  disabled={loading}
                />
                <span className="text-sm text-gray-700">Ingat saya</span>
              </label>
              <button 
                type="button"
                className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                disabled={loading}
              >
                Lupa password?
              </button>
            </div>

            {/* Login Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-500/50 transition-all shadow-lg hover:shadow-xl disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {loading ? 'Memproses...' : 'Masuk'}
            </button>
          </form>

          {/* Demo Info */}
          <div className="mt-6 p-4 bg-blue-50 rounded-xl border border-blue-200">
            <p className="text-sm font-semibold text-blue-800 mb-2">🔑 Demo Accounts:</p>
            <div className="text-xs text-blue-700 space-y-1">
              <p>• <span className="font-medium">admin</span> / admin123</p>
              <p>• <span className="font-medium">lecturer1</span> / lecturer123</p>
              <p>• <span className="font-medium">student1</span> / student123</p>
            </div>
          </div>

          {/* Register Link */}
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Belum punya akun?{' '}
              <button className="text-blue-600 hover:text-blue-700 font-medium">
                Daftar sekarang
              </button>
            </p>
          </div>

          {/* Help Link */}
          <div className="mt-6 text-center">
            <p className="text-xs text-gray-500">
              Butuh bantuan?{' '}
              <button className="text-blue-600 hover:text-blue-700 font-medium">
                Hubungi IT Support
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}