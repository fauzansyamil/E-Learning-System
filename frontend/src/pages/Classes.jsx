// frontend/src/pages/Classes.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/common/Navbar';
import api from '../services/api';
import {
  BookOpen,
  Users,
  Calendar,
  MapPin,
  TrendingUp,
  AlertCircle,
  Award,
  ArrowRight,
  Clock,
  GraduationCap
} from 'lucide-react';

export default function Classes() {
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchClasses();
  }, []);

  const fetchClasses = async () => {
    try {
      const response = await api.get('/classes');
      setClasses(response.data);
    } catch (error) {
      console.error('Error fetching classes:', error);
      // Fallback to dummy data if API fails
      setClasses(getDummyClasses());
    } finally {
      setLoading(false);
    }
  };

  const getDummyClasses = () => [
    {
      id: 1,
      code: 'TI-301',
      name: 'Pemrograman Web Lanjutan',
      instructor: 'Dr. Budi Santoso, M.Kom',
      semester: 'Genap 2024/2025',
      credits: 3,
      schedule: 'Senin, 13:00 - 15:30',
      room: 'Lab Komputer 3',
      enrolled: 42,
      capacity: 50,
      progress: 65,
      color: 'from-blue-500 to-blue-700',
      bgColor: 'bg-blue-50',
      textColor: 'text-blue-600'
    },
    {
      id: 2,
      code: 'TI-202',
      name: 'Struktur Data',
      instructor: 'Prof. Dr. Siti Rahmawati',
      semester: 'Genap 2024/2025',
      credits: 3,
      schedule: 'Selasa, 15:30 - 18:00',
      room: 'Ruang 401',
      enrolled: 45,
      capacity: 50,
      progress: 72,
      color: 'from-green-500 to-green-700',
      bgColor: 'bg-green-50',
      textColor: 'text-green-600'
    },
    {
      id: 3,
      code: 'TI-203',
      name: 'Basis Data',
      instructor: 'Dr. Ahmad Fauzi',
      semester: 'Genap 2024/2025',
      credits: 3,
      schedule: 'Rabu, 09:00 - 11:30',
      room: 'Lab Database',
      enrolled: 38,
      capacity: 50,
      progress: 58,
      color: 'from-purple-500 to-purple-700',
      bgColor: 'bg-purple-50',
      textColor: 'text-purple-600'
    },
    {
      id: 4,
      code: 'TI-304',
      name: 'Interaksi Manusia Komputer',
      instructor: 'Dr. Linda Wijaya',
      semester: 'Genap 2024/2025',
      credits: 3,
      schedule: 'Kamis, 13:00 - 15:30',
      room: 'Lab Multimedia',
      enrolled: 40,
      capacity: 50,
      progress: 45,
      color: 'from-orange-500 to-orange-700',
      bgColor: 'bg-orange-50',
      textColor: 'text-orange-600'
    }
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar currentPage="classes" />
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Memuat mata kuliah...</p>
          </div>
        </div>
      </div>
    );
  }

  const totalCredits = classes.reduce((sum, c) => sum + (c.credits || 0), 0);
  const avgProgress = classes.length > 0
    ? Math.round(classes.reduce((sum, c) => sum + (c.progress || 0), 0) / classes.length)
    : 0;
  const needsAttention = classes.filter(c => (c.progress || 0) < 60).length;

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar currentPage="classes" />

      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center space-x-3 mb-3">
                <BookOpen className="w-10 h-10" />
                <h1 className="text-4xl font-bold">Mata Kuliah</h1>
              </div>
              <p className="text-blue-100 text-lg">
                Semester Genap 2024/2025 • {classes.length} Mata Kuliah Aktif
              </p>
            </div>
            <div className="hidden md:block">
              <GraduationCap className="w-24 h-24 opacity-20" />
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Summary */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8 -mt-16">
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-2">
              <div className="bg-blue-50 p-3 rounded-lg">
                <BookOpen className="w-6 h-6 text-blue-600" />
              </div>
            </div>
            <div className="text-3xl font-bold text-gray-800">{classes.length}</div>
            <div className="text-sm text-gray-600 mt-1 font-medium">Total Mata Kuliah</div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-2">
              <div className="bg-green-50 p-3 rounded-lg">
                <Award className="w-6 h-6 text-green-600" />
              </div>
            </div>
            <div className="text-3xl font-bold text-gray-800">{totalCredits}</div>
            <div className="text-sm text-gray-600 mt-1 font-medium">Total SKS</div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-2">
              <div className="bg-purple-50 p-3 rounded-lg">
                <TrendingUp className="w-6 h-6 text-purple-600" />
              </div>
            </div>
            <div className="text-3xl font-bold text-gray-800">{avgProgress}%</div>
            <div className="text-sm text-gray-600 mt-1 font-medium">Progress Rata-rata</div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-2">
              <div className="bg-orange-50 p-3 rounded-lg">
                <AlertCircle className="w-6 h-6 text-orange-600" />
              </div>
            </div>
            <div className="text-3xl font-bold text-gray-800">{needsAttention}</div>
            <div className="text-sm text-gray-600 mt-1 font-medium">Perlu Perhatian</div>
          </div>
        </div>

        {/* Classes Grid */}
        {classes.length === 0 ? (
          <div className="bg-white rounded-xl shadow-md p-12 text-center">
            <BookOpen className="w-20 h-20 mx-auto mb-4 text-gray-300" />
            <h3 className="text-2xl font-semibold text-gray-800 mb-2">
              Belum Ada Mata Kuliah
            </h3>
            <p className="text-gray-600 max-w-md mx-auto">
              Anda belum terdaftar di mata kuliah manapun semester ini. Silakan hubungi admin untuk pendaftaran.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {classes.map((course) => (
              <div
                key={course.id}
                onClick={() => navigate(`/course/${course.id}`)}
                className="bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 cursor-pointer overflow-hidden group transform hover:-translate-y-1"
              >
                {/* Header with Gradient */}
                <div className={`bg-gradient-to-r ${course.color} p-6 text-white relative overflow-hidden`}>
                  <div className="absolute top-0 right-0 opacity-10">
                    <BookOpen className="w-32 h-32 transform rotate-12" />
                  </div>
                  <div className="relative z-10">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-3">
                          <span className="px-3 py-1 bg-white/20 backdrop-blur-sm rounded-full text-sm font-semibold">
                            {course.code}
                          </span>
                          <span className="px-3 py-1 bg-white/20 backdrop-blur-sm rounded-full text-sm font-semibold flex items-center">
                            <Award className="w-3 h-3 mr-1" />
                            {course.credits} SKS
                          </span>
                        </div>
                        <h3 className="text-2xl font-bold mb-2 group-hover:scale-105 transition-transform origin-left">
                          {course.name}
                        </h3>
                        <p className="text-sm text-white/90 flex items-center">
                          <GraduationCap className="w-4 h-4 mr-2" />
                          {course.instructor}
                        </p>
                      </div>
                      <div className="text-right ml-4">
                        <div className="text-3xl font-bold">{course.progress || 0}%</div>
                        <div className="text-xs text-white/80">Progress</div>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="bg-white/20 backdrop-blur-sm rounded-full h-2.5 overflow-hidden">
                      <div
                        className="bg-white h-full rounded-full transition-all duration-500 shadow-sm"
                        style={{ width: `${course.progress || 0}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Body */}
                <div className="p-6">
                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="flex items-start space-x-3">
                      <div className="bg-blue-50 p-2 rounded-lg flex-shrink-0">
                        <Calendar className="w-4 h-4 text-blue-600" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs text-gray-500 mb-1">Jadwal</p>
                        <p className="text-sm font-semibold text-gray-800 leading-tight">
                          {course.schedule}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start space-x-3">
                      <div className="bg-green-50 p-2 rounded-lg flex-shrink-0">
                        <MapPin className="w-4 h-4 text-green-600" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs text-gray-500 mb-1">Ruangan</p>
                        <p className="text-sm font-semibold text-gray-800 leading-tight">
                          {course.room}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                    <div className="flex items-center text-sm text-gray-600">
                      <Users className="w-4 h-4 mr-2 text-gray-400" />
                      <span className="font-medium">{course.enrolled}/{course.capacity}</span>
                      <span className="ml-1">Mahasiswa</span>
                    </div>
                    <button className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-semibold group">
                      <span>Buka Kelas</span>
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
