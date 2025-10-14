// frontend/src/pages/Gradebook.jsx
import React, { useState, useEffect } from 'react';
import Navbar from '../components/common/Navbar';
import api from '../services/api';

export default function Gradebook() {
  const [selectedSemester, setSelectedSemester] = useState('current');
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchGrades();
  }, [selectedSemester]);

  const fetchGrades = async () => {
    try {
      const response = await api.get(`/grades?semester=${selectedSemester}`);
      setCourses(response.data);
    } catch (error) {
      console.error('Error fetching grades:', error);
      // Fallback to dummy data
      setCourses(getDummyCourses());
    } finally {
      setLoading(false);
    }
  };

  const getDummyCourses = () => [
    {
      id: 1,
      code: 'TI-301',
      name: 'Pemrograman Web Lanjutan',
      credits: 3,
      instructor: 'Dr. Budi Santoso',
      grades: {
        assignments: [
          { name: 'Setup Environment', score: 95, max: 100, weight: 10 },
          { name: 'Build Components', score: null, max: 150, weight: 15 }
        ],
        quiz: [
          { name: 'Quiz 1: React Basics', score: 85, max: 100, weight: 10 },
          { name: 'Quiz 2: Hooks', score: null, max: 100, weight: 10 }
        ],
        midterm: { score: null, max: 100, weight: 20 },
        finalProject: { score: null, max: 100, weight: 20 }
      },
      currentScore: 85.5,
      letterGrade: 'A',
      attendance: 95
    },
    {
      id: 2,
      code: 'TI-202',
      name: 'Struktur Data',
      credits: 3,
      instructor: 'Prof. Dr. Siti Rahmawati',
      grades: {
        assignments: [
          { name: 'Sorting Analysis', score: 88, max: 100, weight: 15 },
          { name: 'BST Implementation', score: null, max: 150, weight: 15 }
        ],
        quiz: [
          { name: 'Quiz 1: Array & Linked List', score: 90, max: 100, weight: 10 },
          { name: 'Quiz 2: Tree & Graph', score: 85, max: 100, weight: 10 }
        ],
        midterm: { score: 82, max: 100, weight: 25 },
        finalProject: { score: null, max: 100, weight: 25 }
      },
      currentScore: 86.75,
      letterGrade: 'A',
      attendance: 100
    }
  ];

  const semesters = [
    { id: 'current', name: 'Semester Genap 2024/2025 (Aktif)' },
    { id: 'prev1', name: 'Semester Ganjil 2024/2025' },
    { id: 'prev2', name: 'Semester Genap 2023/2024' }
  ];

  const getLetterGrade = (score) => {
    if (score >= 85) return { grade: 'A', color: 'text-green-600', bg: 'bg-green-50' };
    if (score >= 80) return { grade: 'A-', color: 'text-green-500', bg: 'bg-green-50' };
    if (score >= 75) return { grade: 'B+', color: 'text-blue-600', bg: 'bg-blue-50' };
    if (score >= 70) return { grade: 'B', color: 'text-blue-500', bg: 'bg-blue-50' };
    if (score >= 65) return { grade: 'B-', color: 'text-blue-400', bg: 'bg-blue-50' };
    return { grade: 'C', color: 'text-yellow-600', bg: 'bg-yellow-50' };
  };

  const calculateGPA = () => {
    const gradePoints = { A: 4.0, 'A-': 3.7, 'B+': 3.3, B: 3.0, 'B-': 2.7, C: 2.0 };
    const totalCredits = courses.reduce((sum, course) => sum + course.credits, 0);
    const totalPoints = courses.reduce((sum, course) => {
      return sum + (gradePoints[course.letterGrade] || 0) * course.credits;
    }, 0);
    return (totalPoints / totalCredits).toFixed(2);
  };

  const calculateTotalScore = (course) => {
    let total = 0;
    let maxPossible = 0;

    course.grades.assignments.forEach((item) => {
      if (item.score !== null) {
        total += (item.score / item.max) * item.weight;
      }
      maxPossible += item.weight;
    });

    course.grades.quiz.forEach((item) => {
      if (item.score !== null) {
        total += (item.score / item.max) * item.weight;
      }
      maxPossible += item.weight;
    });

    if (course.grades.midterm.score !== null) {
      total += (course.grades.midterm.score / course.grades.midterm.max) * course.grades.midterm.weight;
      maxPossible += course.grades.midterm.weight;
    }

    if (course.grades.finalProject.score !== null) {
      total +=
        (course.grades.finalProject.score / course.grades.finalProject.max) *
        course.grades.finalProject.weight;
      maxPossible += course.grades.finalProject.weight;
    }

    return { current: total.toFixed(1), maxPossible };
  };

  const stats = {
    totalCourses: courses.length,
    averageScore: (courses.reduce((sum, c) => sum + c.currentScore, 0) / courses.length).toFixed(1),
    gpa: calculateGPA()
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar currentPage="grades" />
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="text-6xl mb-4">⏳</div>
            <p className="text-gray-600">Memuat nilai...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar currentPage="grades" />

      {/* Header */}
      <div className="bg-gradient-to-r from-green-600 to-emerald-700 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <h1 className="text-3xl font-bold mb-2">📊 Gradebook & Nilai</h1>
          <p className="text-green-100">Pantau perkembangan akademik Anda</p>
        </div>
      </div>

      {/* GPA & Stats Cards */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-6 mb-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-gradient-to-br from-green-600 to-emerald-700 rounded-xl shadow-lg p-6 text-white">
            <div className="text-sm text-green-100 mb-1">IPK / GPA</div>
            <div className="text-4xl font-bold mb-1">{stats.gpa}</div>
            <div className="text-xs text-green-100">dari 4.00</div>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="text-2xl font-bold text-gray-800">{stats.averageScore}</div>
            <div className="text-sm text-gray-600">Rata-rata Nilai</div>
            <div className="mt-2 flex items-center space-x-1">
              {[...Array(5)].map((_, i) => (
                <div
                  key={i}
                  className={`h-1.5 flex-1 rounded-full ${
                    i < 4 ? 'bg-green-400' : 'bg-gray-200'
                  }`}
                />
              ))}
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="text-2xl font-bold text-blue-600">{stats.totalCourses}</div>
            <div className="text-sm text-gray-600">Mata Kuliah</div>
            <div className="text-xs text-gray-500 mt-2">Semester ini</div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Semester Filter */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Pilih Semester
              </label>
              <select
                value={selectedSemester}
                onChange={(e) => setSelectedSemester(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                {semesters.map((semester) => (
                  <option key={semester.id} value={semester.id}>
                    {semester.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Course List with Grades */}
            <div className="space-y-4">
              {courses.map((course) => {
                const letterGrade = getLetterGrade(course.currentScore);
                const scores = calculateTotalScore(course);

                return (
                  <div
                    key={course.id}
                    className="bg-white rounded-xl shadow-sm hover:shadow-md transition-all overflow-hidden"
                  >
                    <div
                      className="p-6 cursor-pointer"
                      onClick={() =>
                        setSelectedCourse(selectedCourse?.id === course.id ? null : course)
                      }
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">
                              {course.code}
                            </span>
                            <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm">
                              {course.credits} SKS
                            </span>
                          </div>
                          <h3 className="text-lg font-bold text-gray-800 mb-1">{course.name}</h3>
                          <p className="text-sm text-gray-600">👨‍🏫 {course.instructor}</p>
                        </div>
                        <div className="text-right ml-4">
                          <div className={`text-4xl font-bold ${letterGrade.color}`}>
                            {letterGrade.grade}
                          </div>
                          <div className="text-lg font-semibold text-gray-600">
                            {course.currentScore}
                          </div>
                        </div>
                      </div>

                      {/* Progress Bar */}
                      <div className="mb-3">
                        <div className="flex items-center justify-between text-sm mb-2">
                          <span className="text-gray-600">Progress</span>
                          <span className="font-medium text-gray-800">
                            {scores.current}% / {scores.maxPossible}%
                          </span>
                        </div>
                        <div className="bg-gray-200 rounded-full h-2 overflow-hidden">
                          <div
                            className="bg-green-500 h-full rounded-full transition-all"
                            style={{ width: `${(scores.current / scores.maxPossible) * 100}%` }}
                          />
                        </div>
                      </div>

                      {/* Quick Stats */}
                      <div className="flex items-center justify-between pt-3 border-t">
                        <div className="flex items-center space-x-4 text-sm">
                          <div className="flex items-center space-x-1">
                            <span>📋</span>
                            <span className="text-gray-600">
                              {course.grades.assignments.filter((a) => a.score !== null).length}/
                              {course.grades.assignments.length} Tugas
                            </span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <span>📝</span>
                            <span className="text-gray-600">
                              {course.grades.quiz.filter((q) => q.score !== null).length}/
                              {course.grades.quiz.length} Quiz
                            </span>
                          </div>
                        </div>
                        <div className="text-sm text-gray-600">
                          📊 Kehadiran: {course.attendance}%
                        </div>
                      </div>
                    </div>

                    {/* Expanded Detail */}
                    {selectedCourse?.id === course.id && (
                      <div className="border-t bg-gray-50 p-6">
                        <h4 className="font-bold text-gray-800 mb-4">Detail Penilaian</h4>

                        {/* Assignments */}
                        {course.grades.assignments.length > 0 && (
                          <div className="mb-6">
                            <div className="text-sm font-semibold text-gray-700 mb-3">
                              ✏️ Tugas (
                              {course.grades.assignments.reduce((sum, a) => sum + a.weight, 0)}%)
                            </div>
                            <div className="space-y-2">
                              {course.grades.assignments.map((item, idx) => (
                                <div
                                  key={idx}
                                  className="flex items-center justify-between p-3 bg-white rounded-lg border"
                                >
                                  <span className="text-sm text-gray-700">{item.name}</span>
                                  <div className="flex items-center space-x-3">
                                    <span className="text-xs text-gray-500">{item.weight}%</span>
                                    {item.score !== null ? (
                                      <span className="font-semibold text-green-600">
                                        {item.score}/{item.max}
                                      </span>
                                    ) : (
                                      <span className="text-sm text-gray-400">Belum dinilai</span>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Quiz */}
                        {course.grades.quiz.length > 0 && (
                          <div className="mb-6">
                            <div className="text-sm font-semibold text-gray-700 mb-3">
                              📝 Quiz ({course.grades.quiz.reduce((sum, q) => sum + q.weight, 0)}
                              %)
                            </div>
                            <div className="space-y-2">
                              {course.grades.quiz.map((item, idx) => (
                                <div
                                  key={idx}
                                  className="flex items-center justify-between p-3 bg-white rounded-lg border"
                                >
                                  <span className="text-sm text-gray-700">{item.name}</span>
                                  <div className="flex items-center space-x-3">
                                    <span className="text-xs text-gray-500">{item.weight}%</span>
                                    {item.score !== null ? (
                                      <span className="font-semibold text-green-600">
                                        {item.score}/{item.max}
                                      </span>
                                    ) : (
                                      <span className="text-sm text-gray-400">Belum dinilai</span>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Midterm */}
                        <div className="mb-6">
                          <div className="text-sm font-semibold text-gray-700 mb-3">
                            📚 UTS ({course.grades.midterm.weight}%)
                          </div>
                          <div className="p-3 bg-white rounded-lg border">
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-gray-700">Ujian Tengah Semester</span>
                              {course.grades.midterm.score !== null ? (
                                <span className="font-semibold text-green-600">
                                  {course.grades.midterm.score}/{course.grades.midterm.max}
                                </span>
                              ) : (
                                <span className="text-sm text-gray-400">Belum dilaksanakan</span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Final Project */}
                        <div>
                          <div className="text-sm font-semibold text-gray-700 mb-3">
                            🎯 Proyek Akhir ({course.grades.finalProject.weight}%)
                          </div>
                          <div className="p-3 bg-white rounded-lg border">
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-gray-700">Final Project / UAS</span>
                              {course.grades.finalProject.score !== null ? (
                                <span className="font-semibold text-green-600">
                                  {course.grades.finalProject.score}/{course.grades.finalProject.max}
                                </span>
                              ) : (
                                <span className="text-sm text-gray-400">Belum dinilai</span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Grade Distribution */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="font-bold text-gray-800 mb-4">📈 Distribusi Nilai</h3>
              <div className="space-y-3">
                {courses.map((course) => {
                  const letterGrade = getLetterGrade(course.currentScore);
                  return (
                    <div key={course.id} className="flex items-center space-x-3">
                      <div
                        className={`w-12 h-12 ${letterGrade.bg} rounded-lg flex items-center justify-center flex-shrink-0`}
                      >
                        <span className={`font-bold ${letterGrade.color}`}>
                          {letterGrade.grade}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-gray-800 truncate">
                          {course.name}
                        </div>
                        <div className="text-xs text-gray-500">{course.currentScore}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Performance Summary */}
            <div className="bg-gradient-to-br from-green-600 to-emerald-700 rounded-xl shadow-sm p-6 text-white">
              <h3 className="font-bold mb-4">🎓 Ringkasan Performa</h3>
              <div className="space-y-3 text-sm">
                <div className="flex items-center justify-between pb-2 border-b border-white/20">
                  <span className="text-green-100">IPK Semester Ini</span>
                  <span className="font-bold text-lg">{stats.gpa}</span>
                </div>
                <div className="flex items-center justify-between pb-2 border-b border-white/20">
                  <span className="text-green-100">Nilai Tertinggi</span>
                  <span className="font-bold">
                    {Math.max(...courses.map((c) => c.currentScore)).toFixed(1)}
                  </span>
                </div>
                <div className="flex items-center justify-between pb-2 border-b border-white/20">
                  <span className="text-green-100">Nilai Terendah</span>
                  <span className="font-bold">
                    {Math.min(...courses.map((c) => c.currentScore)).toFixed(1)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-green-100">SKS Diambil</span>
                  <span className="font-bold">
                    {courses.reduce((sum, c) => sum + c.credits, 0)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}