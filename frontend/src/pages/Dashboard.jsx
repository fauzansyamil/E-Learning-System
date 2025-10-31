// frontend/src/pages/Dashboard.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/common/Navbar';
import api from '../services/api';
import {
  BookOpen,
  FileText,
  BarChart3,
  CheckCircle,
  Clock,
  Calendar,
  MessageSquare,
  Award,
  TrendingUp,
  ArrowRight,
  Bell,
  MapPin
} from 'lucide-react';

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
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Memuat dashboard...</p>
        </div>
      </div>
    );
  }

  const stats = [
    {
      label: 'Mata Kuliah',
      value: dashboardData?.stats?.totalClasses || '6',
      icon: BookOpen,
      color: 'from-blue-500 to-blue-600',
      bgColor: 'bg-blue-50',
      textColor: 'text-blue-600',
      link: '/classes'
    },
    {
      label: 'Tugas Aktif',
      value: dashboardData?.stats?.activeAssignments || '8',
      icon: FileText,
      color: 'from-orange-500 to-orange-600',
      bgColor: 'bg-orange-50',
      textColor: 'text-orange-600',
      link: '/assignments'
    },
    {
      label: 'Rata-rata Nilai',
      value: dashboardData?.stats?.averageGrade || '88.5',
      icon: BarChart3,
      color: 'from-green-500 to-green-600',
      bgColor: 'bg-green-50',
      textColor: 'text-green-600',
      link: '/gradebook'
    },
    {
      label: 'Kehadiran',
      value: dashboardData?.stats?.attendance || '95%',
      icon: CheckCircle,
      color: 'from-purple-500 to-purple-600',
      bgColor: 'bg-purple-50',
      textColor: 'text-purple-600',
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
      icon: Award,
      text: 'Tugas "Setup Environment" dinilai',
      detail: 'Nilai: 95/100',
      time: '2 jam lalu',
      color: 'text-green-600',
      bgColor: 'bg-green-50'
    },
    {
      icon: FileText,
      text: 'Quiz baru tersedia',
      detail: 'React Hooks - Deadline 25 Okt',
      time: '5 jam lalu',
      color: 'text-blue-600',
      bgColor: 'bg-blue-50'
    },
    {
      icon: MessageSquare,
      text: 'Balasan diskusi baru',
      detail: 'Error saat install dependencies',
      time: '1 hari lalu',
      color: 'text-purple-600',
      bgColor: 'bg-purple-50'
    }
  ];

  const todaySchedule = dashboardData?.todaySchedule || [
    {
      time: '13:00',
      title: 'Pemrograman Web',
      room: 'Lab Komputer 3',
      color: 'bg-blue-50',
      borderColor: 'border-blue-500',
      textColor: 'text-blue-700'
    },
    {
      time: '15:30',
      title: 'Struktur Data',
      room: 'Ruang 401',
      color: 'bg-green-50',
      borderColor: 'border-green-500',
      textColor: 'text-green-700'
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar currentPage="dashboard" />

      {/* Hero Header */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold mb-2">
                Selamat datang kembali, {user?.full_name || user?.username || 'User'}! 👋
              </h1>
              <p className="text-blue-100 text-lg">
                Hari ini {new Date().toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
              </p>
            </div>
            <div className="hidden md:block">
              <div className="flex items-center space-x-4">
                <TrendingUp className="w-20 h-20 opacity-20" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8 -mt-16">
          {stats.map((stat, index) => (
            <div
              key={index}
              onClick={() => navigate(stat.link)}
              className="bg-white rounded-xl shadow-lg overflow-hidden cursor-pointer hover:shadow-xl transform hover:-translate-y-1 transition-all duration-200"
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className={`${stat.bgColor} p-3 rounded-lg`}>
                    <stat.icon className={`w-6 h-6 ${stat.textColor}`} />
                  </div>
                  <ArrowRight className="w-5 h-5 text-gray-400" />
                </div>
                <p className="text-sm text-gray-600 font-medium">{stat.label}</p>
                <p className="text-3xl font-bold text-gray-800 mt-2">{stat.value}</p>
              </div>
              <div className={`h-1 bg-gradient-to-r ${stat.color}`}></div>
            </div>
          ))}
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Upcoming Assignments */}
          <div className="lg:col-span-2 bg-white rounded-xl shadow-md overflow-hidden">
            <div className="bg-gradient-to-r from-orange-50 to-red-50 px-6 py-4 border-b border-orange-100">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="bg-orange-100 p-2 rounded-lg">
                    <FileText className="w-5 h-5 text-orange-600" />
                  </div>
                  <h3 className="text-lg font-bold text-gray-800">Tugas Mendatang</h3>
                </div>
                <button
                  onClick={() => navigate('/assignments')}
                  className="flex items-center space-x-1 text-sm text-orange-600 hover:text-orange-700 font-medium"
                >
                  <span>Lihat Semua</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
            <div className="p-6 space-y-4">
              {upcomingAssignments.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <FileText className="w-16 h-16 mx-auto mb-3 text-gray-300" />
                  <p>Tidak ada tugas mendatang</p>
                </div>
              ) : (
                upcomingAssignments.map((assignment, index) => (
                  <div
                    key={index}
                    className={`p-4 rounded-lg border-l-4 hover:shadow-md transition-shadow ${
                      assignment.urgent
                        ? 'bg-red-50 border-red-500'
                        : 'bg-blue-50 border-blue-500'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-800 mb-1">{assignment.title}</h4>
                        <p className="text-sm text-gray-600 flex items-center">
                          <BookOpen className="w-4 h-4 mr-1" />
                          {assignment.course}
                        </p>
                      </div>
                      <div className="text-right ml-4">
                        <div className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${
                          assignment.urgent
                            ? 'bg-red-100 text-red-700'
                            : 'bg-blue-100 text-blue-700'
                        }`}>
                          <Clock className="w-3 h-3 mr-1" />
                          {assignment.deadline}
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Calendar & Schedule Widget */}
          <div className="space-y-6">
            {/* Calendar */}
            <div className="bg-white rounded-xl shadow-md overflow-hidden">
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-6 py-4 border-b border-blue-100">
                <div className="flex items-center space-x-3">
                  <div className="bg-blue-100 p-2 rounded-lg">
                    <Calendar className="w-5 h-5 text-blue-600" />
                  </div>
                  <h3 className="text-lg font-bold text-gray-800">Jadwal Hari Ini</h3>
                </div>
              </div>
              <div className="p-6">
                <div className="text-center mb-6 pb-6 border-b border-gray-100">
                  <p className="text-sm text-gray-500 uppercase tracking-wide">
                    {new Date().toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })}
                  </p>
                  <p className="text-5xl font-bold text-gray-800 my-2">{new Date().getDate()}</p>
                  <p className="text-sm font-medium text-gray-600">
                    {new Date().toLocaleDateString('id-ID', { weekday: 'long' })}
                  </p>
                </div>
                <div className="space-y-3">
                  {todaySchedule.length === 0 ? (
                    <p className="text-center text-gray-500 text-sm py-4">Tidak ada jadwal hari ini</p>
                  ) : (
                    todaySchedule.map((schedule, index) => (
                      <div key={index} className={`p-4 ${schedule.color} rounded-lg border-l-4 ${schedule.borderColor}`}>
                        <div className="flex items-start space-x-3">
                          <div className="flex-shrink-0">
                            <Clock className={`w-5 h-5 ${schedule.textColor}`} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className={`font-bold text-sm ${schedule.textColor}`}>
                              {schedule.time}
                            </p>
                            <p className="text-sm font-semibold text-gray-800 mt-1">{schedule.title}</p>
                            <p className="text-xs text-gray-600 flex items-center mt-1">
                              <MapPin className="w-3 h-3 mr-1" />
                              {schedule.room}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
                <button
                  onClick={() => navigate('/schedule-enhanced')}
                  className="w-full mt-4 py-2 text-sm font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors"
                >
                  Lihat Jadwal Lengkap
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Activities */}
        <div className="mt-6 bg-white rounded-xl shadow-md overflow-hidden">
          <div className="bg-gradient-to-r from-purple-50 to-pink-50 px-6 py-4 border-b border-purple-100">
            <div className="flex items-center space-x-3">
              <div className="bg-purple-100 p-2 rounded-lg">
                <Bell className="w-5 h-5 text-purple-600" />
              </div>
              <h3 className="text-lg font-bold text-gray-800">Aktivitas Terbaru</h3>
            </div>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {recentActivities.map((activity, index) => (
                <div key={index} className="flex items-start space-x-4 p-3 hover:bg-gray-50 rounded-lg transition-colors">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center ${activity.bgColor} flex-shrink-0`}>
                    <activity.icon className={`w-5 h-5 ${activity.color}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-800">{activity.text}</p>
                    <p className="text-sm text-gray-600 mt-1">{activity.detail}</p>
                    <p className="text-xs text-gray-500 mt-2 flex items-center">
                      <Clock className="w-3 h-3 mr-1" />
                      {activity.time}
                    </p>
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
