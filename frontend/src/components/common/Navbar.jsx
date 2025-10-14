// frontend/src/components/common/Navbar.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export default function Navbar({ currentPage = 'dashboard' }) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const menuItems = [
    { id: 'dashboard', icon: '🏠', label: 'Dashboard', path: '/dashboard' },
    { id: 'classes', icon: '📚', label: 'Mata Kuliah', path: '/classes' },
    { id: 'assignments', icon: '✏️', label: 'Tugas', path: '/assignments' },
    { id: 'grades', icon: '📊', label: 'Nilai', path: '/gradebook' },
    { id: 'schedule', icon: '📅', label: 'Jadwal', path: '/schedule' },
    { id: 'discussions', icon: '💬', label: 'Diskusi', path: '/discussions' },
    { id: 'notifications', icon: '🔔', label: 'Notifikasi', path: '/notifications' }
  ];

  return (
    <>
      {/* Desktop Sidebar */}
      <aside
        className={`${
          sidebarOpen ? 'w-64' : 'w-20'
        } bg-white shadow-lg transition-all duration-300 fixed left-0 top-0 h-full z-40 hidden lg:flex flex-col`}
      >
        {/* Logo */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-xl flex-shrink-0">
              🎓
            </div>
            {sidebarOpen && (
              <div>
                <h1 className="font-bold text-gray-800">UTN E-Learning</h1>
                <p className="text-xs text-gray-500 capitalize">{user?.role || 'Student'}</p>
              </div>
            )}
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => navigate(item.path)}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-colors ${
                currentPage === item.id
                  ? 'bg-blue-50 text-blue-600'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <span className="text-xl flex-shrink-0">{item.icon}</span>
              {sidebarOpen && <span className="font-medium">{item.label}</span>}
            </button>
          ))}
        </nav>

        {/* User Profile */}
        <div className="p-4 border-t border-gray-200">
          <div
            className={`flex items-center ${
              sidebarOpen ? 'space-x-3' : 'justify-center'
            } p-3 bg-gray-50 rounded-xl mb-3`}
          >
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0">
              {user?.name?.charAt(0) || 'U'}
            </div>
            {sidebarOpen && (
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-800 text-sm truncate">
                  {user?.name || 'User'}
                </p>
                <p className="text-xs text-gray-500 truncate">{user?.username || 'user'}</p>
              </div>
            )}
          </div>

          {/* Toggle & Logout Buttons */}
          <div className="space-y-2">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="w-full flex items-center justify-center space-x-2 px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-xl transition-colors"
            >
              <span className="text-xl">{sidebarOpen ? '◀' : '▶'}</span>
              {sidebarOpen && <span className="text-sm">Tutup</span>}
            </button>

            <button
              onClick={handleLogout}
              className="w-full flex items-center justify-center space-x-2 px-4 py-2 text-red-600 hover:bg-red-50 rounded-xl transition-colors"
            >
              <span className="text-xl">🚪</span>
              {sidebarOpen && <span className="text-sm font-medium">Logout</span>}
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile Top Bar */}
      <div className="lg:hidden bg-white shadow-md fixed top-0 left-0 right-0 z-50">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-xl">
              🎓
            </div>
            <div>
              <h1 className="font-bold text-gray-800">UTN E-Learning</h1>
              <p className="text-xs text-gray-500">
                {menuItems.find((m) => m.id === currentPage)?.label || 'Dashboard'}
              </p>
            </div>
          </div>

          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg"
          >
            <span className="text-2xl">{mobileMenuOpen ? '✕' : '☰'}</span>
          </button>
        </div>

        {/* Mobile Menu Dropdown */}
        {mobileMenuOpen && (
          <div className="border-t border-gray-200 p-4 bg-white">
            <nav className="space-y-2 mb-4">
              {menuItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => {
                    navigate(item.path);
                    setMobileMenuOpen(false);
                  }}
                  className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-colors ${
                    currentPage === item.id
                      ? 'bg-blue-50 text-blue-600'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <span className="text-xl">{item.icon}</span>
                  <span className="font-medium">{item.label}</span>
                </button>
              ))}
            </nav>

            {/* User Info & Logout */}
            <div className="pt-4 border-t border-gray-200">
              <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-xl mb-3">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold">
                  {user?.name?.charAt(0) || 'U'}
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-gray-800 text-sm">
                    {user?.name || 'User'}
                  </p>
                  <p className="text-xs text-gray-500 capitalize">{user?.role || 'Student'}</p>
                </div>
              </div>

              <button
                onClick={handleLogout}
                className="w-full flex items-center justify-center space-x-2 px-4 py-3 text-red-600 bg-red-50 hover:bg-red-100 rounded-xl transition-colors"
              >
                <span className="text-xl">🚪</span>
                <span className="font-medium">Logout</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Spacer for fixed navbar on mobile */}
      <div className="lg:hidden h-16"></div>

      {/* Spacer for sidebar on desktop */}
      <div className={`hidden lg:block ${sidebarOpen ? 'w-64' : 'w-20'} flex-shrink-0`}></div>
    </>
  );
}