// frontend/src/pages/Dashboard.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/common/Navbar';
import api from '../services/api';

export default function Dashboard() {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const response = await api.get('/dashboard');
      setDashboardData(response.data);
    } catch (error) {
      console.error('Error fetching dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="text-6xl mb-4">⏳</div>
          <p className="text-gray-600">Memuat dashboard...</p>
        </div>
      </div>
    );
  }

  const stats = [
    { 
      label: 'Mata Kuliah', 
      value: dashboardData?.stats?.totalClasses || '6', 
      icon: '📚', 
      color: 'bg-blue-100',
      link: '/classes'
    },
    { 
      label: 'Tugas Aktif', 
      value: dashboardData?.stats?.activeAssignments || '8', 
      icon: '✏️', 
      color: 'bg-orange-100',
      link: '/assignments'
    },
    { 
      label: 'Rata-rata Nilai', 
      value: dashboardData?.stats?.averageGrade || '88.5', 
      icon: '📊', 
      color: 'bg-green-100',
      link: '/gradebook'
    },
    { 
      label: 'Kehadiran', 
      value: dashboardData?.stats?.attendance || '95%', 
      icon: '✅', 
      color: 'bg-purple-100',
      link: '/attendance'
    }
  ];

  const upcomingAssignments = dashboardData?.upcomingAssignments || [
    {
      title: 'Build Simple Component',
      course: 'Pemrograman Web Lanjutan',
      deadline: '2025-10-27',
      urgent: true
    },
    {
      title: 'Laporan Proyek Database',
      course: 'Basis Data',
      deadline: '2025-10-28',
      urgent: true
    },
    {
      title: 'Implementasi Binary Search Tree',
      course: 'Struktur Data',
      deadline: '2025-11-01',
      urgent: false
    }
  ];

  const recentActivities = dashboardData?.recentActivities || [
    {
      icon: '✓',
      text: 'Tugas "Setup Environment" dinilai',
      detail: 'Nilai: 95/100',
      time: '2 jam lalu',
      color: 'text-green-600'
    },
    {
      icon: '📝',
      text: 'Quiz baru tersedia',
      detail: 'React Hooks - Deadline 25 Okt',
      time: '5 jam lalu',
      color: 'text-blue-600'
    },
    {
      icon: '💬',
      text: 'Balasan diskusi baru',
      detail: 'Error saat install dependencies',
      time: '1 hari lalu',
      color: 'text-purple-600'
    }
  ];

  const todaySchedule = dashboardData?.todaySchedule || [
    {
      time: '13:00',
      title: 'Pemrograman Web',
      room: 'Lab Komputer 3',
      color: 'bg-blue-50'
    },
    {
      time: '15:30',
      title: 'Struktur Data',
      room: 'Ruang 401',
      color: 'bg-green-50'
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar currentPage="dashboard" />

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800">Dashboard</h1>
          <p className="text-gray-600 mt-2">
            Selamat datang kembali, {user?.name || 'User'}! 👋
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {stats.map((stat, index) => (
            <div 
              key={index} 
              onClick={() => navigate(stat.link)}
              className="bg-white rounded-xl shadow-md overflow-hidden cursor-pointer hover:shadow-lg transition-all"
            >
              <div className="p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">{stat.label}</p>
                    <p className="text-3xl font-bold text-gray-800 mt-1">{stat.value}</p>
                  </div>
                  <div className={`${stat.color} w-14 h-14 rounded-full flex items-center justify-center text-2xl`}>
                    {stat.icon}
                  </div>
                </div>
              </div>
              <div className={`${stat.color} h-1`}></div>
            </div>
          ))}
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Upcoming Assignments */}
          <div className="lg:col-span-2 bg-white rounded-xl shadow-md">
            <div className="p-5 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-gray-800">📝 Tugas Mendatang</h3>
                <button 
                  onClick={() => navigate('/assignments')}
                  className="text-sm text-blue-600 hover:text-blue-700"
                >
                  Lihat Semua →
                </button>
              </div>
            </div>
            <div className="p-5 space-y-3">
              {upcomingAssignments.map((assignment, index) => (
                <div
                  key={index}
                  className={`p-4 rounded-lg border-l-4 ${
                    assignment.urgent
                      ? 'bg-red-50 border-red-500'
                      : 'bg-blue-50 border-blue-500'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-semibold text-gray-800">{assignment.title}</h4>
                      <p className="text-sm text-gray-600 mt-1">{assignment.course}</p>
                    </div>
                    <span className={`text-xs font-medium ${assignment.urgent ? 'text-red-600' : 'text-blue-600'}`}>
                      {assignment.deadline}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Calendar Widget */}
          <div className="bg-white rounded-xl shadow-md">
            <div className="p-5 border-b border-gray-200">
              <h3 className="text-lg font-bold text-gray-800">📅 Kalender</h3>
            </div>
            <div className="p-5">
              <div className="text-center mb-4">
                <p className="text-sm text-gray-600">Oktober 2025</p>
                <p className="text-3xl font-bold text-gray-800">{new Date().getDate()}</p>
                <p className="text-sm text-gray-600">
                  {new Date().toLocaleDateString('id-ID', { weekday: 'long' })}
                </p>
              </div>
              <div className="space-y-3">
                {todaySchedule.map((schedule, index) => (
                  <div key={index} className={`p-3 ${schedule.color} rounded-lg`}>
                    <div className="flex items-start space-x-2">
                      <span className={`${schedule.color.replace('bg-', 'text-').replace('-50', '-600')} font-bold text-sm`}>
                        {schedule.time}
                      </span>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-800">{schedule.title}</p>
                        <p className="text-xs text-gray-600">{schedule.room}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Recent Activities */}
        <div className="mt-6 bg-white rounded-xl shadow-md">
          <div className="p-5 border-b border-gray-200">
            <h3 className="text-lg font-bold text-gray-800">🔔 Aktivitas Terbaru</h3>
          </div>
          <div className="p-5">
            <div className="space-y-4">
              {recentActivities.map((activity, index) => (
                <div key={index} className="flex items-start space-x-4">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${activity.color} bg-opacity-10 flex-shrink-0`}>
                    <span className="text-xl">{activity.icon}</span>
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-gray-800">{activity.text}</p>
                    <p className="text-sm text-gray-600">{activity.detail}</p>
                    <p className="text-xs text-gray-500 mt-1">{activity.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}