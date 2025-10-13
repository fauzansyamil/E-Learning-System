// src/pages/Assignments.jsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { assignmentAPI } from '../services/api';
import Navbar from '../components/common/Navbar';

const Assignments = ({ onNavigate }) => {
  const { user } = useAuth();
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAssignments();
  }, []);

  const loadAssignments = async () => {
    try {
      // For demo, load assignments from class 1
      const response = await assignmentAPI.getAssignmentsByClass(1);
      setAssignments(response.data.data);
      setLoading(false);
    } catch (error) {
      console.error('Load assignments error:', error);
      setLoading(false);
    }
  };

  const getStatusColor = (deadline, submission) => {
    if (submission?.status === 'graded') return 'bg-green-100 text-green-800';
    if (submission) return 'bg-blue-100 text-blue-800';
    if (new Date(deadline) < new Date()) return 'bg-red-100 text-red-800';
    return 'bg-yellow-100 text-yellow-800';
  };

  const getStatusText = (deadline, submission) => {
    if (submission?.status === 'graded') return `✅ Dinilai (${submission.score})`;
    if (submission) return '📤 Sudah Dikumpulkan';
    if (new Date(deadline) < new Date()) return '⏰ Terlambat';
    return '⏳ Belum Dikumpulkan';
  };

  if (loading) {
    return (
      <div>
        <Navbar onNavigate={onNavigate} currentPage="assignments" />
        <div className="text-center py-20">Loading...</div>
      </div>
    );
  }

  return (
    <div>
      <Navbar onNavigate={onNavigate} currentPage="assignments" />
      <div className="max-w-7xl mx-auto p-6">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Daftar Tugas</h1>
            <p className="text-gray-600">Kelola pengumpulan tugas Anda</p>
          </div>
        </div>
        
        {assignments.length === 0 ? (
          <div className="text-center py-20">
            <span className="text-6xl">📝</span>
            <p className="text-gray-600 mt-4">Belum ada tugas tersedia</p>
          </div>
        ) : (
          <div className="space-y-4">
            {assignments.map(assignment => (
              <div key={assignment.id} className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="text-xl font-bold text-gray-800">{assignment.title}</h3>
                        <p className="text-sm text-gray-600 mt-1">Sistem Manajemen Basis Data</p>
                      </div>
                      <span className={`px-4 py-2 rounded-full text-sm font-medium ${getStatusColor(assignment.deadline, assignment.my_submission)}`}>
                        {getStatusText(assignment.deadline, assignment.my_submission)}
                      </span>
                    </div>
                    
                    {assignment.description && (
                      <p className="text-gray-700 mt-3">{assignment.description}</p>
                    )}
                    
                    <div className="mt-4 grid grid-cols-3 gap-4">
                      <div className="flex items-center space-x-2 text-sm text-gray-600">
                        <span>📅</span>
                        <div>
                          <p className="font-medium">Deadline</p>
                          <p>{new Date(assignment.deadline).toLocaleDateString('id-ID')}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2 text-sm text-gray-600">
                        <span>⭐</span>
                        <div>
                          <p className="font-medium">Nilai Maksimal</p>
                          <p>{assignment.max_score}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2 text-sm text-gray-600">
                        <span>📊</span>
                        <div>
                          <p className="font-medium">Pengumpulan</p>
                          <p>{assignment.submission_count || 0} mahasiswa</p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="mt-4 flex space-x-3">
                      <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 text-sm">
                        Lihat Detail
                      </button>
                      {user.role === 'mahasiswa' && !assignment.my_submission && new Date(assignment.deadline) > new Date() && (
                        <button className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 text-sm">
                          Kumpulkan Tugas
                        </button>
                      )}
                      {user.role === 'dosen' && (
                        <button className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 text-sm">
                          Lihat Pengumpulan ({assignment.submission_count || 0})
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Assignments;