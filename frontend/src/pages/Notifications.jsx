// frontend/src/pages/Notifications.jsx
import React, { useState, useEffect } from 'react';
import {
  Bell,
  Check,
  CheckCheck,
  Trash2,
  Filter,
  BookOpen,
  FileText,
  MessageSquare,
  Award,
  Calendar,
  AlertCircle,
  X
} from 'lucide-react';
import Navbar from '../components/common/Navbar';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function Notifications() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [filter, setFilter] = useState('all'); // 'all', 'unread', 'read'
  const [typeFilter, setTypeFilter] = useState('all'); // 'all', 'assignment', 'grade', 'discussion', 'announcement'
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const response = await api.get('/notifications');
      setNotifications(response.data.data || []);
    } catch (error) {
      console.error('Error fetching notifications:', error);
      // Fallback to demo data
      setNotifications(getDemoNotifications());
    } finally {
      setLoading(false);
    }
  };

  const getDemoNotifications = () => [
    {
      id: 1,
      type: 'assignment',
      title: 'Tugas Baru: Project Website Portfolio',
      message: 'Tugas baru telah ditambahkan untuk mata kuliah Pemrograman Web Lanjutan. Deadline: 20 Jan 2025.',
      read: false,
      created_at: '2025-10-30T10:30:00',
      related_id: 5,
      related_type: 'assignment'
    },
    {
      id: 2,
      type: 'grade',
      title: 'Nilai Tugas 1 Sudah Tersedia',
      message: 'Nilai untuk Tugas 1: Perancangan ERD sudah dapat dilihat. Nilai Anda: 85/100',
      read: false,
      created_at: '2025-10-29T15:20:00',
      related_id: 3,
      related_type: 'grade'
    },
    {
      id: 3,
      type: 'discussion',
      title: 'Balasan Baru di Forum Diskusi',
      message: 'Dr. Budi Santoso membalas diskusi Anda tentang "Cara menggunakan React Hooks"',
      read: true,
      created_at: '2025-10-29T11:00:00',
      related_id: 1,
      related_type: 'discussion'
    },
    {
      id: 4,
      type: 'announcement',
      title: 'Pengumuman: Libur Nasional',
      message: 'Kuliah tanggal 17 Agustus 2025 diliburkan dalam rangka Hari Kemerdekaan RI',
      read: true,
      created_at: '2025-10-28T08:00:00',
      related_id: null,
      related_type: 'announcement'
    },
    {
      id: 5,
      type: 'assignment',
      title: 'Reminder: Deadline Tugas',
      message: 'Tugas "Implementasi SQL" akan berakhir dalam 3 hari (15 Jan 2025)',
      read: false,
      created_at: '2025-10-27T09:00:00',
      related_id: 2,
      related_type: 'assignment'
    }
  ];

  const markAsRead = async (notificationId) => {
    try {
      await api.put(`/notifications/${notificationId}/read`);
      setNotifications(notifications.map(notif =>
        notif.id === notificationId ? { ...notif, read: true } : notif
      ));
    } catch (error) {
      console.error('Error marking as read:', error);
      // Fallback: update locally
      setNotifications(notifications.map(notif =>
        notif.id === notificationId ? { ...notif, read: true } : notif
      ));
    }
  };

  const markAllAsRead = async () => {
    try {
      await api.put('/notifications/read-all');
      setNotifications(notifications.map(notif => ({ ...notif, read: true })));
      alert('Semua notifikasi telah ditandai sebagai dibaca');
    } catch (error) {
      console.error('Error marking all as read:', error);
      // Fallback: update locally
      setNotifications(notifications.map(notif => ({ ...notif, read: true })));
      alert('Semua notifikasi telah ditandai sebagai dibaca');
    }
  };

  const deleteNotification = async (notificationId) => {
    if (!confirm('Hapus notifikasi ini?')) return;

    try {
      await api.delete(`/notifications/${notificationId}`);
      setNotifications(notifications.filter(notif => notif.id !== notificationId));
    } catch (error) {
      console.error('Error deleting notification:', error);
      // Fallback: update locally
      setNotifications(notifications.filter(notif => notif.id !== notificationId));
    }
  };

  const clearAllNotifications = async () => {
    if (!confirm('Hapus semua notifikasi? Tindakan ini tidak dapat dibatalkan.')) return;

    try {
      // Delete all notifications one by one (or use batch delete endpoint if available)
      await Promise.all(notifications.map(notif => 
        api.delete(`/notifications/${notif.id}`)
      ));
      setNotifications([]);
      alert('Semua notifikasi telah dihapus');
    } catch (error) {
      console.error('Error clearing notifications:', error);
      setNotifications([]);
      alert('Semua notifikasi telah dihapus');
    }
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'assignment':
        return <FileText className="w-5 h-5" />;
      case 'grade':
        return <Award className="w-5 h-5" />;
      case 'discussion':
        return <MessageSquare className="w-5 h-5" />;
      case 'announcement':
        return <AlertCircle className="w-5 h-5" />;
      default:
        return <Bell className="w-5 h-5" />;
    }
  };

  const getNotificationColor = (type) => {
    switch (type) {
      case 'assignment':
        return 'bg-blue-100 text-blue-600';
      case 'grade':
        return 'bg-green-100 text-green-600';
      case 'discussion':
        return 'bg-purple-100 text-purple-600';
      case 'announcement':
        return 'bg-orange-100 text-orange-600';
      default:
        return 'bg-gray-100 text-gray-600';
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Baru saja';
    if (diffMins < 60) return `${diffMins} menit yang lalu`;
    if (diffHours < 24) return `${diffHours} jam yang lalu`;
    if (diffDays < 7) return `${diffDays} hari yang lalu`;
    return date.toLocaleDateString('id-ID', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  const filteredNotifications = notifications.filter(notif => {
    // Filter by read status
    if (filter === 'unread' && notif.read) return false;
    if (filter === 'read' && !notif.read) return false;

    // Filter by type
    if (typeFilter !== 'all' && notif.type !== typeFilter) return false;

    return true;
  });

  const unreadCount = notifications.filter(n => !n.read).length;

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="flex items-center justify-center h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading notifications...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <Bell className="w-8 h-8 text-blue-600" />
            Notifikasi
            {unreadCount > 0 && (
              <span className="px-3 py-1 bg-red-500 text-white text-sm font-semibold rounded-full">
                {unreadCount}
              </span>
            )}
          </h1>
          <p className="mt-2 text-gray-600">
            Pantau semua update dan pengumuman terkait kuliah Anda
          </p>
        </div>

        {/* Controls */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            {/* Filters */}
            <div className="flex flex-wrap gap-3">
              {/* Read Status Filter */}
              <div className="flex items-center gap-2">
                <Filter className="w-5 h-5 text-gray-400" />
                <select
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                >
                  <option value="all">Semua</option>
                  <option value="unread">Belum Dibaca</option>
                  <option value="read">Sudah Dibaca</option>
                </select>
              </div>

              {/* Type Filter */}
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
              >
                <option value="all">Semua Tipe</option>
                <option value="assignment">Tugas</option>
                <option value="grade">Nilai</option>
                <option value="discussion">Diskusi</option>
                <option value="announcement">Pengumuman</option>
              </select>
            </div>

            {/* Actions */}
            <div className="flex gap-2">
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="flex items-center gap-2 px-4 py-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors text-sm font-medium"
                >
                  <CheckCheck className="w-4 h-4" />
                  <span>Tandai Semua Dibaca</span>
                </button>
              )}
              {notifications.length > 0 && (
                <button
                  onClick={clearAllNotifications}
                  className="flex items-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors text-sm font-medium"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Hapus Semua</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Notifications List */}
        <div className="space-y-3">
          {filteredNotifications.length === 0 ? (
            <div className="bg-white rounded-lg shadow-sm p-12 text-center">
              <Bell className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Tidak Ada Notifikasi
              </h3>
              <p className="text-gray-600">
                {filter === 'unread' 
                  ? 'Semua notifikasi sudah dibaca' 
                  : 'Anda belum memiliki notifikasi'}
              </p>
            </div>
          ) : (
            filteredNotifications.map((notification) => (
              <div
                key={notification.id}
                className={`bg-white rounded-lg shadow-sm transition-all hover:shadow-md ${
                  !notification.read ? 'border-l-4 border-blue-600' : ''
                }`}
              >
                <div className="p-5">
                  <div className="flex items-start gap-4">
                    {/* Icon */}
                    <div className={`p-3 rounded-full flex-shrink-0 ${getNotificationColor(notification.type)}`}>
                      {getNotificationIcon(notification.type)}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1">
                          <h3 className={`font-semibold mb-1 ${
                            !notification.read ? 'text-gray-900' : 'text-gray-700'
                          }`}>
                            {notification.title}
                          </h3>
                          <p className="text-sm text-gray-600 mb-2">
                            {notification.message}
                          </p>
                          <div className="flex items-center gap-4 text-xs text-gray-500">
                            <span>{formatDate(notification.created_at)}</span>
                            {!notification.read && (
                              <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full font-medium">
                                Baru
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-2">
                          {!notification.read && (
                            <button
                              onClick={() => markAsRead(notification.id)}
                              className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                              title="Tandai sudah dibaca"
                            >
                              <Check className="w-5 h-5" />
                            </button>
                          )}
                          <button
                            onClick={() => deleteNotification(notification.id)}
                            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Hapus notifikasi"
                          >
                            <X className="w-5 h-5" />
                          </button>
                        </div>
                      </div>

                      {/* Action Button (if has related link) */}
                      {notification.related_id && (
                        <button
                          onClick={() => {
                            // Navigate based on related type
                            if (notification.related_type === 'assignment') {
                              window.location.href = `/assignments`;
                            } else if (notification.related_type === 'discussion') {
                              window.location.href = `/discussions`;
                            } else if (notification.related_type === 'grade') {
                              window.location.href = `/grades`;
                            }
                          }}
                          className="mt-3 text-sm text-blue-600 hover:text-blue-700 font-medium"
                        >
                          Lihat Detail →
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Statistics */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-blue-100 rounded-lg">
                <Bell className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Notifikasi</p>
                <p className="text-2xl font-bold text-gray-900">
                  {notifications.length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-red-100 rounded-lg">
                <AlertCircle className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Belum Dibaca</p>
                <p className="text-2xl font-bold text-gray-900">
                  {unreadCount}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-green-100 rounded-lg">
                <CheckCheck className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Sudah Dibaca</p>
                <p className="text-2xl font-bold text-gray-900">
                  {notifications.length - unreadCount}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}