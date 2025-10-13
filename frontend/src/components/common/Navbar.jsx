// src/components/common/Navbar.jsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { notificationAPI } from '../../services/api';

const Navbar = ({ onNavigate, currentPage }) => {
  const { user, logout } = useAuth();
  const [showNotif, setShowNotif] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (user) {
      loadNotifications();
    }
  }, [user]);

  const loadNotifications = async () => {
    try {
      const response = await notificationAPI.getNotifications();
      setNotifications(response.data.data.notifications);
      setUnreadCount(response.data.data.unread_count);
    } catch (error) {
      console.error('Load notifications error:', error);
    }
  };

  const handleMarkAsRead = async (id) => {
    try {
      await notificationAPI.markAsRead(id);
      loadNotifications();
    } catch (error) {
      console.error('Mark as read error:', error);
    }
  };

  const handleLogout = () => {
    logout();
    onNavigate('login');
  };

  return (
    <nav className="bg-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          <button onClick={() => onNavigate('dashboard')} className="flex items-center space-x-2">
            <span className="text-2xl">📚</span>
            <span className="text-xl font-bold text-blue-600">E-Learning</span>
          </button>
          
          <div className="flex items-center space-x-6">
            <button 
              onClick={() => onNavigate('dashboard')} 
              className={`${currentPage === 'dashboard' ? 'text-blue-600 font-semibold' : 'text-gray-700'} hover:text-blue-600`}
            >
              Dashboard
            </button>
            <button 
              onClick={() => onNavigate('classes')} 
              className={`${currentPage === 'classes' ? 'text-blue-600 font-semibold' : 'text-gray-700'} hover:text-blue-600`}
            >
              Kelas
            </button>
            <button 
              onClick={() => onNavigate('assignments')} 
              className={`${currentPage === 'assignments' ? 'text-blue-600 font-semibold' : 'text-gray-700'} hover:text-blue-600`}
            >
              Tugas
            </button>
            
            <div className="relative">
              <button 
                onClick={() => setShowNotif(!showNotif)}
                className="relative text-gray-700 hover:text-blue-600"
              >
                <span className="text-2xl">🔔</span>
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                    {unreadCount}
                  </span>
                )}
              </button>
              
              {showNotif && (
                <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-xl border z-50">
                  <div className="p-4 border-b">
                    <h3 className="font-semibold">Notifikasi</h3>
                  </div>
                  <div className="max-h-96 overflow-y-auto">
                    {notifications.length === 0 ? (
                      <div className="p-4 text-center text-gray-500">
                        Tidak ada notifikasi
                      </div>
                    ) : (
                      notifications.map(notif => (
                        <div 
                          key={notif.id} 
                          onClick={() => handleMarkAsRead(notif.id)}
                          className={`p-4 border-b hover:bg-gray-50 cursor-pointer ${!notif.is_read ? 'bg-blue-50' : ''}`}
                        >
                          <div className="flex items-start space-x-2">
                            <span className="text-xl">
                              {notif.type === 'assignment' ? '📝' : 
                               notif.type === 'grade' ? '⭐' : 
                               notif.type === 'material' ? '📚' : '📢'}
                            </span>
                            <div className="flex-1">
                              <h4 className="font-semibold text-sm">{notif.title}</h4>
                              <p className="text-xs text-gray-600">{notif.message}</p>
                              <p className="text-xs text-gray-400 mt-1">
                                {new Date(notif.created_at).toLocaleString('id-ID')}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
            
            <div className="flex items-center space-x-3">
              <div className="text-right">
                <p className="text-sm font-medium">{user?.full_name}</p>
                <p className="text-xs text-gray-500 capitalize">{user?.role}</p>
              </div>
              <button 
                onClick={handleLogout}
                className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition-colors"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;