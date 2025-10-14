// frontend/src/pages/CourseDetail.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Navbar from '../components/common/Navbar';
import api from '../services/api';

export default function CourseDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [course, setCourse] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [expandedWeek, setExpandedWeek] = useState(1);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCourseDetail();
  }, [id]);

  const fetchCourseDetail = async () => {
    try {
      const response = await api.get(`/classes/${id}`);
      setCourse(response.data);
    } catch (error) {
      console.error('Error fetching course:', error);
      // Fallback to dummy data
      setCourse(getDummyCourse());
    } finally {
      setLoading(false);
    }
  };

  const getDummyCourse = () => ({
    id: 1,
    code: 'TI-301',
    name: 'Pemrograman Web Lanjutan',
    instructor: 'Dr. Budi Santoso, M.Kom',
    semester: 'Genap 2024/2025',
    credits: 3,
    schedule: 'Senin, 13:00 - 15:30',
    room: 'Lab Komputer 3',
    description: 'Mata kuliah ini membahas konsep dan teknik pemrograman web modern menggunakan framework terkini seperti React, Node.js, dan database management.',
    enrolled: 42,
    capacity: 50,
    progress: 65,
    weeklyContent: [
      {
        week: 1,
        title: 'Pengenalan React & Setup Environment',
        materials: [
          { type: 'slide', name: 'Introduction to React.pdf', size: '2.3 MB', downloaded: true },
          { type: 'video', name: 'React Basics Tutorial', duration: '45:30', watched: true },
          { type: 'doc', name: 'Setup Guide.docx', size: '856 KB', downloaded: false }
        ],
        assignments: [
          { name: 'Setup Development Environment', deadline: '2025-10-20', submitted: true, score: 95 }
        ]
      },
      {
        week: 2,
        title: 'Components dan Props',
        materials: [
          { type: 'slide', name: 'React Components.pdf', size: '3.1 MB', downloaded: false },
          { type: 'video', name: 'Building Components', duration: '52:15', watched: false },
          { type: 'code', name: 'component-example.zip', size: '124 KB', downloaded: false }
        ],
        assignments: [
          { name: 'Build Simple Component', deadline: '2025-10-27', submitted: false, score: null }
        ]
      }
    ],
    announcements: [
      {
        id: 1,
        title: 'Perubahan Jadwal UTS',
        date: '2025-10-12',
        content: 'UTS akan dilaksanakan pada tanggal 15 November 2025. Materi sampai minggu ke-7.',
        important: true
      }
    ],
    discussions: [
      {
        id: 1,
        author: 'Ahmad Rizki',
        avatar: '👨‍💻',
        topic: 'Error saat install dependencies',
        message: 'Halo teman-teman, saya mengalami error "npm ERR!" saat install react. Ada yang bisa bantu?',
        replies: 3,
        date: '2 jam yang lalu',
        solved: true
      }
    ]
  });

  const getFileIcon = (type) => {
    const icons = { slide: '📊', video: '🎥', doc: '📄', code: '💻' };
    return icons[type] || '📎';
  };

  const getFileColor = (type) => {
    const colors = {
      slide: 'text-red-600 bg-red-50',
      video: 'text-purple-600 bg-purple-50',
      doc: 'text-blue-600 bg-blue-50',
      code: 'text-green-600 bg-green-50'
    };
    return colors[type] || 'text-gray-600 bg-gray-50';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar currentPage="classes" />
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="text-6xl mb-4">⏳</div>
            <p className="text-gray-600">Memuat detail mata kuliah...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar currentPage="classes" />
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="text-6xl mb-4">❌</div>
            <h3 className="text-xl font-semibold text-gray-800 mb-2">Mata Kuliah Tidak Ditemukan</h3>
            <button
              onClick={() => navigate('/classes')}
              className="mt-4 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Kembali ke Daftar Kelas
            </button>
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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <button
            onClick={() => navigate('/classes')}
            className="text-blue-200 hover:text-white text-sm mb-3 inline-block"
          >
            ← Kembali ke Daftar Kelas
          </button>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center space-x-3 mb-2">
                <span className="px-3 py-1 bg-white/20 rounded-full text-sm font-medium">
                  {course.code}
                </span>
                <span className="px-3 py-1 bg-white/20 rounded-full text-sm font-medium">
                  {course.credits} SKS
                </span>
              </div>
              <h1 className="text-3xl font-bold mb-2">{course.name}</h1>
              <div className="flex items-center space-x-6 text-blue-100">
                <div className="flex items-center space-x-2">
                  <span>👨‍🏫</span>
                  <span>{course.instructor}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span>📅</span>
                  <span>{course.schedule}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span>🏫</span>
                  <span>{course.room}</span>
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm text-blue-100 mb-2">Progress Anda</div>
              <div className="text-4xl font-bold">{course.progress}%</div>
            </div>
          </div>
          <div className="mt-6">
            <div className="bg-white/20 rounded-full h-2 overflow-hidden">
              <div
                className="bg-white h-full rounded-full transition-all duration-500"
                style={{ width: `${course.progress}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white border-b sticky top-0 z-10 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8">
            {[
              { id: 'overview', label: 'Overview', icon: '📋' },
              { id: 'materials', label: 'Materi', icon: '📚' },
              { id: 'assignments', label: 'Tugas', icon: '✏️' },
              { id: 'discussions', label: 'Diskusi', icon: '💬' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-4 px-2 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === tab.id
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <span className="mr-2">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2">
            {/* Overview Tab */}
            {activeTab === 'overview' && (
              <div className="space-y-6">
                <div className="bg-white rounded-xl shadow-sm p-6">
                  <h2 className="text-xl font-bold text-gray-800 mb-4">Deskripsi Mata Kuliah</h2>
                  <p className="text-gray-600 leading-relaxed mb-6">{course.description}</p>
                  <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                    <div>
                      <div className="text-sm text-gray-500 mb-1">Semester</div>
                      <div className="font-semibold text-gray-800">{course.semester}</div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-500 mb-1">Mahasiswa Terdaftar</div>
                      <div className="font-semibold text-gray-800">
                        {course.enrolled}/{course.capacity}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Announcements */}
                <div className="bg-white rounded-xl shadow-sm p-6">
                  <h2 className="text-xl font-bold text-gray-800 mb-4">📢 Pengumuman</h2>
                  <div className="space-y-4">
                    {course.announcements?.map((announcement) => (
                      <div
                        key={announcement.id}
                        className={`p-4 rounded-lg border-l-4 ${
                          announcement.important
                            ? 'bg-red-50 border-red-500'
                            : 'bg-blue-50 border-blue-500'
                        }`}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <h3 className="font-semibold text-gray-800">{announcement.title}</h3>
                          <span className="text-xs text-gray-500">{announcement.date}</span>
                        </div>
                        <p className="text-sm text-gray-600">{announcement.content}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Materials Tab */}
            {activeTab === 'materials' && (
              <div className="space-y-4">
                {course.weeklyContent?.map((week) => (
                  <div key={week.week} className="bg-white rounded-xl shadow-sm overflow-hidden">
                    <button
                      onClick={() => setExpandedWeek(expandedWeek === week.week ? null : week.week)}
                      className="w-full p-6 flex items-center justify-between hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                          <span className="text-xl font-bold text-blue-600">{week.week}</span>
                        </div>
                        <div className="text-left">
                          <h3 className="font-semibold text-gray-800">Minggu {week.week}</h3>
                          <p className="text-sm text-gray-600">{week.title}</p>
                        </div>
                      </div>
                      <span className="text-2xl text-gray-400">
                        {expandedWeek === week.week ? '▼' : '▶'}
                      </span>
                    </button>

                    {expandedWeek === week.week && (
                      <div className="border-t p-6 bg-gray-50">
                        <h4 className="font-semibold text-gray-800 mb-4">📚 Materi Pembelajaran</h4>
                        <div className="space-y-3">
                          {week.materials.map((material, idx) => (
                            <div
                              key={idx}
                              className="flex items-center justify-between p-4 bg-white rounded-lg border border-gray-200 hover:border-blue-300 transition-colors"
                            >
                              <div className="flex items-center space-x-3">
                                <div
                                  className={`w-10 h-10 rounded-lg flex items-center justify-center ${getFileColor(
                                    material.type
                                  )}`}
                                >
                                  <span className="text-xl">{getFileIcon(material.type)}</span>
                                </div>
                                <div>
                                  <div className="font-medium text-gray-800">{material.name}</div>
                                  <div className="text-sm text-gray-500">
                                    {material.size || material.duration || 'File'}
                                    {material.downloaded && (
                                      <span className="ml-2 text-green-600">✓ Downloaded</span>
                                    )}
                                    {material.watched && (
                                      <span className="ml-2 text-green-600">✓ Watched</span>
                                    )}
                                  </div>
                                </div>
                              </div>
                              <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm">
                                {material.type === 'video' ? 'Tonton' : 'Download'}
                              </button>
                            </div>
                          ))}
                        </div>

                        {week.assignments?.length > 0 && (
                          <>
                            <h4 className="font-semibold text-gray-800 mb-4 mt-6">✏️ Tugas</h4>
                            {week.assignments.map((assignment, idx) => (
                              <div key={idx} className="p-4 bg-white rounded-lg border border-gray-200">
                                <div className="flex items-center justify-between">
                                  <div>
                                    <div className="font-medium text-gray-800">{assignment.name}</div>
                                    <div className="text-sm text-gray-500">
                                      Deadline: {assignment.deadline}
                                    </div>
                                  </div>
                                  <div className="text-right">
                                    {assignment.submitted ? (
                                      <div>
                                        <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">
                                          ✓ Submitted
                                        </span>
                                        {assignment.score && (
                                          <div className="text-lg font-bold text-green-600 mt-1">
                                            {assignment.score}
                                          </div>
                                        )}
                                      </div>
                                    ) : (
                                      <button
                                        onClick={() => navigate('/assignments')}
                                        className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors text-sm"
                                      >
                                        Kerjakan
                                      </button>
                                    )}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Other tabs placeholders */}
            {(activeTab === 'assignments' || activeTab === 'discussions') && (
              <div className="bg-white rounded-xl shadow-sm p-12 text-center">
                <div className="text-6xl mb-4">
                  {activeTab === 'assignments' ? '✏️' : '💬'}
                </div>
                <h3 className="text-xl font-semibold text-gray-800 mb-2">
                  {activeTab === 'assignments' ? 'Halaman Tugas' : 'Forum Diskusi'}
                </h3>
                <p className="text-gray-600 mb-4">
                  Lihat {activeTab === 'assignments' ? 'tugas' : 'diskusi'} di halaman khusus
                </p>
                <button
                  onClick={() =>
                    navigate(activeTab === 'assignments' ? '/assignments' : '/discussions')
                  }
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                >
                  Buka Halaman →
                </button>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="font-semibold text-gray-800 mb-4">📊 Statistik Cepat</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Materi Selesai</span>
                  <span className="font-bold text-blue-600">5/12</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Tugas Dikumpulkan</span>
                  <span className="font-bold text-green-600">3/8</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Rata-rata Nilai</span>
                  <span className="font-bold text-purple-600">88.5</span>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-blue-600 to-blue-800 rounded-xl shadow-sm p-6 text-white">
              <h3 className="font-semibold mb-4">👨‍🏫 Hubungi Dosen</h3>
              <div className="space-y-3 text-sm">
                <div className="flex items-center space-x-2">
                  <span>📧</span>
                  <span>budi.santoso@utn.ac.id</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span>🕐</span>
                  <span>Office Hour: Selasa 14:00-16:00</span>
                </div>
              </div>
              <button className="w-full mt-4 px-4 py-2 bg-white text-blue-600 rounded-lg hover:bg-blue-50 transition-colors font-medium">
                Kirim Pesan
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}