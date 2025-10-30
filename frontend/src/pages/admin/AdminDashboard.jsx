// frontend/src/pages/admin/AdminDashboard.jsx
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Users,
  BookOpen,
  FileText,
  MessageSquare,
  TrendingUp,
  UserCheck,
  Calendar,
  Award
} from 'lucide-react';
import Navbar from '../../components/common/Navbar';
import api from '../../services/api';

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalClasses: 0,
    totalAssignments: 0,
    totalDiscussions: 0,
    activeStudents: 0,
    activeLecturers: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      // Fetch statistics from backend
      const [usersRes, classesRes] = await Promise.all([
        api.get('/users'),
        api.get('/classes')
      ]);

      setStats({
        totalUsers: usersRes.data.data?.length || 0,
        totalClasses: classesRes.data.data?.length || 0,
        totalAssignments: 0, // Will implement later
        totalDiscussions: 0, // Will implement later
        activeStudents: usersRes.data.data?.filter(u => u.role === 'mahasiswa' && u.is_active).length || 0,
        activeLecturers: usersRes.data.data?.filter(u => u.role === 'dosen' && u.is_active).length || 0
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    {
      title: 'Total Users',
      value: stats.totalUsers,
      icon: Users,
      color: 'blue',
      link: '/admin/users'
    },
    {
      title: 'Total Classes',
      value: stats.totalClasses,
      icon: BookOpen,
      color: 'green',
      link: '/admin/classes'
    },
    {
      title: 'Active Students',
      value: stats.activeStudents,
      icon: UserCheck,
      color: 'purple',
      link: '/admin/users?role=mahasiswa'
    },
    {
      title: 'Active Lecturers',
      value: stats.activeLecturers,
      icon: Award,
      color: 'orange',
      link: '/admin/users?role=dosen'
    }
  ];

  const quickActions = [
    { title: 'Manage Users', icon: Users, link: '/admin/users', color: 'blue' },
    { title: 'Manage Classes', icon: BookOpen, link: '/admin/classes', color: 'green' },
    { title: 'View Assignments', icon: FileText, link: '/assignments', color: 'purple' },
    { title: 'View Discussions', icon: MessageSquare, link: '/discussions', color: 'orange' },
    { title: 'View Schedule', icon: Calendar, link: '/schedule', color: 'pink' },
    { title: 'View Reports', icon: TrendingUp, link: '/admin/reports', color: 'indigo' }
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="flex items-center justify-center h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading dashboard...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="mt-2 text-gray-600">
            Manage your E-Learning system
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {statCards.map((card, index) => {
            const Icon = card.icon;
            return (
              <Link
                key={index}
                to={card.link}
                className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">{card.title}</p>
                    <p className="text-3xl font-bold text-gray-900 mt-2">{card.value}</p>
                  </div>
                  <div className={`w-12 h-12 bg-${card.color}-100 rounded-lg flex items-center justify-center`}>
                    <Icon className={`w-6 h-6 text-${card.color}-600`} />
                  </div>
                </div>
              </Link>
            );
          })}
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {quickActions.map((action, index) => {
              const Icon = action.icon;
              return (
                <Link
                  key={index}
                  to={action.link}
                  className="flex flex-col items-center p-4 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className={`w-12 h-12 bg-${action.color}-100 rounded-lg flex items-center justify-center mb-2`}>
                    <Icon className={`w-6 h-6 text-${action.color}-600`} />
                  </div>
                  <span className="text-sm font-medium text-gray-700 text-center">
                    {action.title}
                  </span>
                </Link>
              );
            })}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Recent Activity</h2>
          <div className="text-center text-gray-500 py-8">
            <TrendingUp className="w-12 h-12 mx-auto mb-3 text-gray-400" />
            <p>Recent activity will be displayed here</p>
          </div>
        </div>
      </div>
    </div>
  );
}
