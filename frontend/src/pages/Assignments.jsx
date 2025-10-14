// frontend/src/pages/Assignments.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/common/Navbar';
import api from '../services/api';

export default function Assignments() {
  const [assignments, setAssignments] = useState([]);
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterCourse, setFilterCourse] = useState('all');
  const [selectedAssignment, setSelectedAssignment] = useState(null);
  const [uploadedFile, setUploadedFile] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchAssignments();
  }, []);

  const fetchAssignments = async () => {
    try {
      const response = await api.get('/assignments');
      setAssignments(response.data);
    } catch (error) {
      console.error('Error fetching assignments:', error);
      // Fallback to dummy data
      setAssignments(getDummyAssignments());
    } finally {
      setLoading(false);
    }
  };

  const getDummyAssignments = () => [
    {
      id: 1,
      title: 'Setup Development Environment',
      course: 'Pemrograman Web Lanjutan',
      courseCode: 'TI-301',
      description: 'Install Node.js, VS Code, dan setup project React pertama Anda.',
      deadline: '2025-10-20T23:59:00',
      points: 100,
      status: 'graded',
      submitted: true,
      submittedDate: '2025-10-18T14:30:00',
      score: 95,
      feedback: 'Excellent work! Setup lengkap dan dokumentasi sangat baik.',
      type: 'individual',
      attachments: ['setup-guide.pdf']
    },
    {
      id: 2,
      title: 'Build Simple Component',
      course: 'Pemrograman Web Lanjutan',
      courseCode: 'TI-301',
      description: 'Buat 3 komponen React sederhana: Card, Button, dan Input.',
      deadline: '2025-10-27T23:59:00',
      points: 150,
      status: 'pending',
      submitted: false,
      type: 'individual',
      attachments: ['component-requirements.pdf']
    }
  ];

  const courses = [...new Set(assignments.map((a) => a.course))];

  const filteredAssignments = assignments.filter((assignment) => {
    const statusMatch = filterStatus === 'all' || assignment.status === filterStatus;
    const courseMatch = filterCourse === 'all' || assignment.course === filterCourse;
    return statusMatch && courseMatch;
  });

  const getStatusBadge = (status, submitted) => {
    if (status === 'graded') {
      return (
        <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
          ✓ Dinilai
        </span>
      );
    } else if (submitted) {
      return (
        <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
          ⏳ Menunggu
        </span>
      );
    } else {
      return (
        <span className="px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-xs font-medium">
          ⚠️ Belum
        </span>
      );
    }
  };

  const getDaysRemaining = (deadline) => {
    const now = new Date();
    const deadlineDate = new Date(deadline);
    const diff = deadlineDate - now;
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));

    if (days < 0) return { text: 'Terlambat', color: 'text-red-600' };
    if (days === 0) return { text: 'Hari ini', color: 'text-red-600' };
    if (days === 1) return { text: '1 hari lagi', color: 'text-orange-600' };
    if (days <= 3) return { text: `${days} hari lagi`, color: 'text-orange-600' };
    return { text: `${days} hari lagi`, color: 'text-gray-600' };
  };

  const formatDate = (dateString) => {
    const options = {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    };
    return new Date(dateString).toLocaleDateString('id-ID', options);
  };

  const stats = {
    total: assignments.length,
    pending: assignments.filter((a) => !a.submitted).length,
    submitted: assignments.filter((a) => a.submitted && !a.score).length,
    graded: assignments.filter((a) => a.score !== null).length,
    avgScore:
      Math.round(
        assignments.filter((a) => a.score).reduce((acc, a) => acc + a.score, 0) /
          assignments.filter((a) => a.score).length
      ) || 0
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setUploadedFile(file);
    }
  };

  const handleSubmitAssignment = async () => {
    if (!uploadedFile || !selectedAssignment) return;

    try {
      const formData = new FormData();
      formData.append('file', uploadedFile);
      formData.append('assignmentId', selectedAssignment.id);

      await api.post('/assignments/submit', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      alert('Tugas berhasil dikumpulkan!');
      setUploadedFile(null);
      fetchAssignments();
    } catch (error) {
      console.error('Error submitting assignment:', error);
      alert('Gagal mengumpulkan tugas');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar currentPage="assignments" />
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="text-6xl mb-4">⏳</div>
            <p className="text-gray-600">Memuat tugas...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar currentPage="assignments" />

      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-purple-800 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <h1 className="text-3xl font-bold mb-2">✏️ Tugas & Assignment</h1>
          <p className="text-purple-100">Kelola semua tugas kuliah Anda di satu tempat</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-6 mb-8">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div className="bg-white rounded-xl shadow-sm p-4">
            <div className="text-2xl font-bold text-gray-800">{stats.total}</div>
            <div className="text-sm text-gray-600">Total Tugas</div>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-4">
            <div className="text-2xl font-bold text-orange-600">{stats.pending}</div>
            <div className="text-sm text-gray-600">Belum Dikerjakan</div>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-4">
            <div className="text-2xl font-bold text-blue-600">{stats.submitted}</div>
            <div className="text-sm text-gray-600">Menunggu Nilai</div>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-4">
            <div className="text-2xl font-bold text-green-600">{stats.graded}</div>
            <div className="text-sm text-gray-600">Sudah Dinilai</div>
          </div>
          <div className="bg-gradient-to-br from-purple-600 to-purple-700 rounded-xl shadow-sm p-4 text-white">
            <div className="text-2xl font-bold">{stats.avgScore}</div>
            <div className="text-sm text-purple-100">Rata-rata Nilai</div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Filters */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="all">Semua Status</option>
                    <option value="pending">Belum Dikerjakan</option>
                    <option value="submitted">Sudah Dikumpulkan</option>
                    <option value="graded">Sudah Dinilai</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Mata Kuliah
                  </label>
                  <select
                    value={filterCourse}
                    onChange={(e) => setFilterCourse(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="all">Semua Mata Kuliah</option>
                    {courses.map((course) => (
                      <option key={course} value={course}>
                        {course}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Assignment List */}
            {filteredAssignments.length === 0 ? (
              <div className="bg-white rounded-xl shadow-sm p-12 text-center">
                <div className="text-6xl mb-4">📭</div>
                <h3 className="text-xl font-semibold text-gray-800 mb-2">Tidak Ada Tugas</h3>
                <p className="text-gray-600">Tidak ada tugas yang sesuai dengan filter</p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredAssignments.map((assignment) => {
                  const daysRemaining = getDaysRemaining(assignment.deadline);
                  return (
                    <div
                      key={assignment.id}
                      className="bg-white rounded-xl shadow-sm hover:shadow-md transition-all cursor-pointer overflow-hidden"
                      onClick={() => setSelectedAssignment(assignment)}
                    >
                      <div className="p-6">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-2">
                              <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded text-xs font-medium">
                                {assignment.courseCode}
                              </span>
                              <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs font-medium">
                                {assignment.type === 'group' ? '👥 Kelompok' : '👤 Individual'}
                              </span>
                              {getStatusBadge(assignment.status, assignment.submitted)}
                            </div>
                            <h3 className="text-lg font-bold text-gray-800 mb-1">
                              {assignment.title}
                            </h3>
                            <p className="text-sm text-gray-600 mb-2">{assignment.course}</p>
                            <p className="text-sm text-gray-500 line-clamp-2">
                              {assignment.description}
                            </p>
                          </div>
                          {assignment.score !== null && (
                            <div className="ml-4 text-right">
                              <div className="text-3xl font-bold text-green-600">
                                {assignment.score}
                              </div>
                              <div className="text-xs text-gray-500">/ {assignment.points}</div>
                            </div>
                          )}
                        </div>

                        <div className="flex items-center justify-between pt-4 border-t">
                          <div className="flex items-center space-x-4 text-sm">
                            <div className="flex items-center space-x-1">
                              <span>📅</span>
                              <span className="text-gray-600">
                                {formatDate(assignment.deadline)}
                              </span>
                            </div>
                            <div className={`font-medium ${daysRemaining.color}`}>
                              {daysRemaining.text}
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <span className="text-sm text-gray-600">
                              💯 {assignment.points} poin
                            </span>
                            {assignment.attachments?.length > 0 && (
                              <span className="text-sm text-gray-600">
                                📎 {assignment.attachments.length}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {selectedAssignment ? (
              <div className="bg-white rounded-xl shadow-sm p-6">
                <h3 className="font-bold text-gray-800 mb-4">📋 Detail Tugas</h3>

                <div className="space-y-4">
                  <div>
                    <div className="text-sm text-gray-500 mb-1">Judul</div>
                    <div className="font-semibold text-gray-800">{selectedAssignment.title}</div>
                  </div>

                  <div>
                    <div className="text-sm text-gray-500 mb-1">Deskripsi</div>
                    <div className="text-sm text-gray-700 leading-relaxed">
                      {selectedAssignment.description}
                    </div>
                  </div>

                  {selectedAssignment.attachments?.length > 0 && (
                    <div>
                      <div className="text-sm text-gray-500 mb-2">📎 File Lampiran</div>
                      {selectedAssignment.attachments.map((file, idx) => (
                        <button
                          key={idx}
                          className="w-full text-left px-3 py-2 bg-gray-50 hover:bg-gray-100 rounded-lg text-sm text-blue-600 mb-1"
                        >
                          📄 {file}
                        </button>
                      ))}
                    </div>
                  )}

                  {selectedAssignment.submitted ? (
                    <div className="pt-4 border-t">
                      <div className="text-sm text-gray-500 mb-1">Status Pengumpulan</div>
                      <div className="p-3 bg-green-50 rounded-lg">
                        <div className="text-sm font-medium text-green-700 mb-1">
                          ✓ Sudah Dikumpulkan
                        </div>
                        <div className="text-xs text-green-600">
                          {formatDate(selectedAssignment.submittedDate)}
                        </div>
                      </div>

                      {selectedAssignment.score !== null && (
                        <div className="mt-3">
                          <div className="text-sm text-gray-500 mb-2">Nilai & Feedback</div>
                          <div className="p-3 bg-blue-50 rounded-lg">
                            <div className="text-2xl font-bold text-blue-600 mb-2">
                              {selectedAssignment.score} / {selectedAssignment.points}
                            </div>
                            {selectedAssignment.feedback && (
                              <div className="text-sm text-gray-700">
                                {selectedAssignment.feedback}
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="pt-4 border-t">
                      <div className="text-sm text-gray-500 mb-2">Upload Pengumpulan</div>
                      <label className="block">
                        <input type="file" onChange={handleFileUpload} className="hidden" />
                        <div className="px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg text-center hover:border-purple-500 cursor-pointer transition-colors">
                          {uploadedFile ? (
                            <div className="text-sm text-green-600">✓ {uploadedFile.name}</div>
                          ) : (
                            <div className="text-sm text-gray-600">📁 Pilih File</div>
                          )}
                        </div>
                      </label>
                      <button
                        disabled={!uploadedFile}
                        onClick={handleSubmitAssignment}
                        className="w-full mt-3 px-4 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors font-medium"
                      >
                        Kumpulkan Tugas
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-xl shadow-sm p-8 text-center">
                <div className="text-4xl mb-3">👆</div>
                <p className="text-sm text-gray-600">Pilih tugas untuk melihat detail</p>
              </div>
            )}

            {/* Quick Tips */}
            <div className="bg-gradient-to-br from-purple-600 to-purple-700 rounded-xl shadow-sm p-6 text-white">
              <h3 className="font-bold mb-3">💡 Tips</h3>
              <ul className="text-sm space-y-2 text-purple-100">
                <li>• Kumpulkan tugas minimal 1 hari sebelum deadline</li>
                <li>• Pastikan format file sesuai requirements</li>
                <li>• Simpan salinan file sebelum upload</li>
                <li>• Hubungi dosen jika ada masalah</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}