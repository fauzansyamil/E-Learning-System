// frontend/src/pages/Classes.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/common/Navbar';
import api from '../services/api';

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
      color: 'from-blue-500 to-blue-700'
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
      color: 'from-green-500 to-green-700'
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
      color: 'from-purple-500 to-purple-700'
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
      color: 'from-orange-500 to-orange-700'
    }
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar currentPage="classes" />
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="text-6xl mb-4">⏳</div>
            <p className="text-gray-600">Memuat mata kuliah...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar currentPage="classes" />

      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <h1 className="text-4xl font-bold mb-3">📚 Mata Kuliah</h1>
          <p className="text-blue-100 text-lg">
            Semester Genap 2024/2025 • {classes.length} Mata Kuliah
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Summary */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="text-3xl font-bold text-blue-600">{classes.length}</div>
            <div className="text-sm text-gray-600 mt-1">Total Mata Kuliah</div>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="text-3xl font-bold text-green-600">
              {classes.reduce((sum, c) => sum + c.credits, 0)}
            </div>
            <div className="text-sm text-gray-600 mt-1">Total SKS</div>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="text-3xl font-bold text-purple-600">
              {Math.round(classes.reduce((sum, c) => sum + c.progress, 0) / classes.length)}%
            </div>
            <div className="text-sm text-gray-600 mt-1">Progress Rata-rata</div>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="text-3xl font-bold text-orange-600">
              {classes.filter(c => c.progress < 60).length}
            </div>
            <div className="text-sm text-gray-600 mt-1">Perlu Perhatian</div>
          </div>
        </div>

        {/* Classes Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {classes.map((course) => (
            <div
              key={course.id}
              onClick={() => navigate(`/course/${course.id}`)}
              className="bg-white rounded-xl shadow-md hover:shadow-xl transition-all cursor-pointer overflow-hidden group"
            >
              {/* Header with Gradient */}
              <div className={`bg-gradient-to-r ${course.color} p-6 text-white`}>
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <span className="px-3 py-1 bg-white/20 rounded-full text-sm font-medium">
                        {course.code}
                      </span>
                      <span className="px-3 py-1 bg-white/20 rounded-full text-sm font-medium">
                        {course.credits} SKS
                      </span>
                    </div>
                    <h3 className="text-2xl font-bold mb-2 group-hover:scale-105 transition-transform">
                      {course.name}
                    </h3>
                    <p className="text-sm text-white/90">👨‍🏫 {course.instructor}</p>
                  </div>
                  <div className="text-right">
                    <div className="text-3xl font-bold">{course.progress}%</div>
                    <div className="text-xs text-white/80">Progress</div>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="bg-white/20 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-white h-full rounded-full transition-all duration-500"
                    style={{ width: `${course.progress}%` }}
                  />
                </div>
              </div>

              {/* Body */}
              <div className="p-6">
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Jadwal</p>
                    <p className="text-sm font-medium text-gray-800">
                      📅 {course.schedule}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Ruangan</p>
                    <p className="text-sm font-medium text-gray-800">
                      🏫 {course.room}
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-4 border-t">
                  <div className="text-sm text-gray-600">
                    👥 {course.enrolled}/{course.capacity} Mahasiswa
                  </div>
                  <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium">
                    Buka Kelas →
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Empty State */}
        {classes.length === 0 && (
          <div className="bg-white rounded-xl shadow-sm p-12 text-center">
            <div className="text-6xl mb-4">📭</div>
            <h3 className="text-xl font-semibold text-gray-800 mb-2">
              Belum Ada Mata Kuliah
            </h3>
            <p className="text-gray-600">
              Anda belum terdaftar di mata kuliah manapun semester ini.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}