// src/pages/Classes.jsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { classAPI } from '../services/api';
import Navbar from '../components/common/Navbar';

const Classes = ({ onNavigate }) => {
  const { user } = useAuth();
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);

  useEffect(() => {
    loadClasses();
  }, []);

  const loadClasses = async () => {
    try {
      const response = await classAPI.getAllClasses();
      setClasses(response.data.data);
      setLoading(false);
    } catch (error) {
      console.error('Load classes error:', error);
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div>
        <Navbar onNavigate={onNavigate} currentPage="classes" />
        <div className="text-center py-20">Loading...</div>
      </div>
    );
  }

  return (
    <div>
      <Navbar onNavigate={onNavigate} currentPage="classes" />
      <div className="max-w-7xl mx-auto p-6">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Daftar Kelas</h1>
            <p className="text-gray-600">Kelola dan lihat kelas Anda</p>
          </div>
          {(user.role === 'admin' || user.role === 'dosen') && (
            <button 
              onClick={() => setShowCreateModal(true)}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 flex items-center space-x-2"
            >
              <span>➕</span>
              <span>Tambah Kelas</span>
            </button>
          )}
        </div>
        
        {classes.length === 0 ? (
          <div className="text-center py-20">
            <span className="text-6xl">📚</span>
            <p className="text-gray-600 mt-4">Belum ada kelas tersedia</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {classes.map(cls => (
              <div key={cls.id} className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow">
                <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-6 text-white">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-sm opacity-90">{cls.code}</p>
                      <h3 className="text-xl font-bold mt-1">{cls.name}</h3>
                    </div>
                    <span className="bg-white bg-opacity-20 px-3 py-1 rounded-full text-xs">
                      {cls.semester} {cls.year}
                    </span>
                  </div>
                </div>
                
                <div className="p-6">
                  <div className="flex items-center space-x-2 text-sm text-gray-600 mb-4">
                    <span>👨‍🏫</span>
                    <span>{cls.instructor_name}</span>
                  </div>
                  
                  {cls.description && (
                    <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                      {cls.description}
                    </p>
                  )}
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2 text-sm text-gray-600">
                      <span>👥</span>
                      <span>{cls.student_count} Mahasiswa</span>
                    </div>
                    <button className="text-blue-600 hover:text-blue-700 font-medium text-sm">
                      Lihat Detail →
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      
      {/* Create Class Modal (placeholder) */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-8 max-w-md w-full">
            <h2 className="text-2xl font-bold mb-4">Buat Kelas Baru</h2>
            <p className="text-gray-600 mb-4">Fitur ini akan segera tersedia</p>
            <button 
              onClick={() => setShowCreateModal(false)}
              className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700"
            >
              Tutup
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Classes;