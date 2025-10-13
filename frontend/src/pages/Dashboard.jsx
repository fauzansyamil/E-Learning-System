// src/pages/Dashboard.jsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { dashboardAPI } from '../services/api';
import Navbar from '../components/common/Navbar';

const StatCard = ({ icon, title, value, color }) => (
  <div className={`${color} rounded-xl shadow-lg p-6 text-white`}>
    <div className="flex items-center justify-between">
      <div>
        <p className="text-white text-opacity-80 text-sm">{title}</p>
        <p className="text-4xl font-bold mt-2">{value}</p>
      </div>
      <span className="text-5xl opacity-50">{icon}</span>
    </div>
  </div>
);

const ActivityItem = ({ icon, title, subtitle, time }) => (
  <div className="flex items-start space-x-3 p-3 rounded-lg hover:bg-gray-50">
    <span className="text-2xl">{icon}</span>
    <div className="flex-1">
      <p className="font-medium text-sm">{title}</p>
      <p className="text-xs text-gray-600">{subtitle}</p>
      <p className="text-xs text-gray-400 mt-1">{time}</p>
    </div>
  </div>
);

const Dashboard = ({ onNavigate }) => {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const statsResponse = await dashboardAPI.getStats();
      const activitiesResponse = await dashboardAPI.getRecentActivities();
      
      setStats(statsResponse.data.data);
      setActivities(activitiesResponse.data.data);
      setLoading(false);
    } catch (error) {
      console.error('Load dashboard error:', error);
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div>
        <Navbar onNavigate={onNavigate} currentPage="dashboard" />
        <div className="text-center py-20">Loading...</div>
      </div>
    );
  }

  return (
    <div>
      <Navbar onNavigate={onNavigate} currentPage="dashboard" />
      <div className="max-w-7xl mx-auto p-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800">Dashboard</h1>
          <p className="text-gray-600">Selamat datang, {user.full_name}!</p>
        </div>
        
        {/* Admin Dashboard */}
        {user.role === 'admin' && stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard icon="👥" title="Total Pengguna" value={stats.total_users} color="bg-blue-500" />
            <StatCard icon="👨‍🏫" title="Total Dosen" value={stats.total_dosen} color="bg-green-500" />
            <StatCard icon="👨‍🎓" title="Total Mahasiswa" value={stats.total_mahasiswa} color="bg-purple-500" />
            <StatCard icon="📚" title="Total Kelas" value={stats.total_classes} color="bg-orange-500" />
          </div>
        )}
        
        {/* Dosen Dashboard */}
        {user.role === 'dosen' && stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard icon="📚" title="Kelas Saya" value={stats.my_classes} color="bg-blue-500" />
            <StatCard icon="👥" title="Total Mahasiswa" value={stats.total_students} color="bg-green-500" />
            <StatCard icon="⏳" title="Tugas Pending" value={stats.pending_submissions} color="bg-yellow-500" />
            <StatCard icon="📄" title="Materi" value={stats.total_materials} color="bg-purple-500" />
          </div>
        )}
        
        {/* Mahasiswa Dashboard */}
        {user.role === 'mahasiswa' && stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard icon="📚" title="Kelas Saya" value={stats.enrolled_classes} color="bg-blue-500" />
            <StatCard icon="📝" title="Tugas Pending" value={stats.pending_assignments} color="bg-yellow-500" />
            <StatCard icon="⭐" title="Rata-rata Nilai" value={stats.average_grade} color="bg-green-500" />
            <StatCard icon="✅" title="Total Pengumpulan" value={stats.total_submissions} color="bg-purple-500" />
          </div>
        )}
        
        {/* Recent Activities */}
        <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-bold mb-4 flex items-center">
              <span className="mr-2">📊</span>
              Aktivitas Terbaru
            </h2>
            <div className="space-y-3">
              {activities.length === 0 ? (
                <p className="text-gray-500 text-center py-4">Tidak ada aktivitas</p>
              ) : (
                activities.map((activity, index) => (
                  <ActivityItem 
                    key={index}
                    icon={activity.type === 'assignment' ? '📝' : activity.type === 'grade' ? '⭐' : '📢'}
                    title={activity.title}
                    subtitle={activity.type}
                    time={new Date(activity.created_at).toLocaleDateString('id-ID')}
                  />
                ))
              )}
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-bold mb-4 flex items-center">
              <span className="mr-2">🎯</span>
              Quick Actions
            </h2>
            <div className="space-y-3">
              <button 
                onClick={() => onNavigate('classes')}
                className="w-full text-left p-4 rounded-lg border-2 border-blue-200 hover:border-blue-500 hover:bg-blue-50 transition-colors"
              >
                <div className="flex items-center space-x-3">
                  <span className="text-2xl">📚</span>
                  <div>
                    <p className="font-semibold">Lihat Kelas</p>
                    <p className="text-sm text-gray-600">Akses semua kelas Anda</p>
                  </div>
                </div>
              </button>
              
              <button 
                onClick={() => onNavigate('assignments')}
                className="w-full text-left p-4 rounded-lg border-2 border-green-200 hover:border-green-500 hover:bg-green-50 transition-colors"
              >
                <div className="flex items-center space-x-3">
                  <span className="text-2xl">📝</span>
                  <div>
                    <p className="font-semibold">Lihat Tugas</p>
                    <p className="text-sm text-gray-600">Kelola tugas dan pengumpulan</p>
                  </div>
                </div>
              </button>
              
              {(user.role === 'admin' || user.role === 'dosen') && (
                <button 
                  className="w-full text-left p-4 rounded-lg border-2 border-purple-200 hover:border-purple-500 hover:bg-purple-50 transition-colors"
                >
                  <div className="flex items-center space-x-3">
                    <span className="text-2xl">➕</span>
                    <div>
                      <p className="font-semibold">Buat Kelas Baru</p>
                      <p className="text-sm text-gray-600">Tambahkan kelas baru</p>
                    </div>
                  </div>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;