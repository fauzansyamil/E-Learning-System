import React, { useState, useEffect, useContext } from 'react';
import { useParams } from 'react-router-dom';
import api from '../services/api';
import Navbar from '../components/common/Navbar';
import { AuthContext } from '../context/AuthContext';
import {
  Award,
  TrendingUp,
  Calculator,
  Eye,
  EyeOff,
  RefreshCw,
  User,
  Target,
  BarChart3,
  CheckCircle,
  AlertCircle
} from 'lucide-react';

const GradebookEnhanced = () => {
  const { classId } = useParams();
  const { user } = useContext(AuthContext);
  const [loading, setLoading] = useState(true);
  const [gradeComponents, setGradeComponents] = useState([]);
  const [finalGrades, setFinalGrades] = useState([]);
  const [myGrade, setMyGrade] = useState(null);
  const [classInfo, setClassInfo] = useState(null);
  const [totalWeight, setTotalWeight] = useState(0);
  const [publishLoading, setPublishLoading] = useState(false);
  const [recalcLoading, setRecalcLoading] = useState(false);

  const isInstructor = user?.role === 'dosen' || user?.role === 'admin';

  useEffect(() => {
    fetchGradebookData();
  }, [classId]);

  const fetchGradebookData = async () => {
    try {
      setLoading(true);

      // Fetch grade components
      const componentsRes = await api.get(`/grades-new/components/class/${classId}`);
      const components = componentsRes.data.data || [];
      setGradeComponents(components);

      const total = components.reduce((sum, comp) => sum + parseFloat(comp.weight || 0), 0);
      setTotalWeight(total);

      // Fetch class info
      const classRes = await api.get(`/classes/${classId}`);
      setClassInfo(classRes.data);

      if (isInstructor) {
        // Fetch all student grades
        const gradesRes = await api.get(`/grades-new/final/class/${classId}`);
        setFinalGrades(gradesRes.data.data || []);
      } else {
        // Fetch student's own grade
        try {
          const myGradeRes = await api.get(`/grades-new/final/class/${classId}/my-grade`);
          setMyGrade(myGradeRes.data.data);
        } catch (error) {
          if (error.response?.status !== 404) {
            console.error('Error fetching grade:', error);
          }
        }
      }
    } catch (error) {
      console.error('Error fetching gradebook data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePublishGrades = async () => {
    try {
      setPublishLoading(true);
      await api.post('/grades-new/final/publish', { class_id: classId });
      alert('Grades published successfully!');
      fetchGradebookData();
    } catch (error) {
      console.error('Error publishing grades:', error);
      alert('Failed to publish grades: ' + (error.response?.data?.message || error.message));
    } finally {
      setPublishLoading(false);
    }
  };

  const handleRecalculate = async () => {
    try {
      setRecalcLoading(true);
      await api.post(`/grades-new/final/class/${classId}/recalculate`);
      alert('Grades recalculated successfully!');
      fetchGradebookData();
    } catch (error) {
      console.error('Error recalculating grades:', error);
      alert('Failed to recalculate grades: ' + (error.response?.data?.message || error.message));
    } finally {
      setRecalcLoading(false);
    }
  };

  const getGradeColor = (letterGrade) => {
    if (!letterGrade) return 'text-gray-500';
    if (letterGrade.startsWith('A')) return 'text-green-600';
    if (letterGrade.startsWith('B')) return 'text-blue-600';
    if (letterGrade.startsWith('C')) return 'text-yellow-600';
    if (letterGrade.startsWith('D')) return 'text-orange-600';
    return 'text-red-600';
  };

  const getGradeBackground = (letterGrade) => {
    if (!letterGrade) return 'bg-gray-100';
    if (letterGrade.startsWith('A')) return 'bg-green-100';
    if (letterGrade.startsWith('B')) return 'bg-blue-100';
    if (letterGrade.startsWith('C')) return 'bg-yellow-100';
    if (letterGrade.startsWith('D')) return 'bg-orange-100';
    return 'bg-red-100';
  };

  const getGPAColor = (gpa) => {
    if (gpa >= 3.5) return 'text-green-600';
    if (gpa >= 3.0) return 'text-blue-600';
    if (gpa >= 2.5) return 'text-yellow-600';
    if (gpa >= 2.0) return 'text-orange-600';
    return 'text-red-600';
  };

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading gradebook...</p>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white py-8">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center space-x-3 mb-2">
                  <Award className="w-8 h-8" />
                  <h1 className="text-3xl font-bold">Gradebook</h1>
                </div>
                <p className="text-purple-100">
                  {classInfo?.name || 'Course Grades & Assessment'}
                </p>
              </div>
              {isInstructor && (
                <div className="flex space-x-3">
                  <button
                    onClick={handleRecalculate}
                    disabled={recalcLoading}
                    className="flex items-center space-x-2 px-4 py-2 bg-white bg-opacity-20 hover:bg-opacity-30 rounded-lg transition-all disabled:opacity-50"
                  >
                    <RefreshCw className={`w-5 h-5 ${recalcLoading ? 'animate-spin' : ''}`} />
                    <span>Recalculate</span>
                  </button>
                  <button
                    onClick={handlePublishGrades}
                    disabled={publishLoading}
                    className="flex items-center space-x-2 px-4 py-2 bg-green-500 hover:bg-green-600 rounded-lg transition-all disabled:opacity-50"
                  >
                    <Eye className="w-5 h-5" />
                    <span>{publishLoading ? 'Publishing...' : 'Publish Grades'}</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Grade Components Overview */}
          <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900 flex items-center">
                <Calculator className="w-6 h-6 mr-2 text-purple-600" />
                Grade Components
              </h2>
              <div className={`px-4 py-2 rounded-lg ${totalWeight === 100 ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                <span className="font-semibold">Total Weight: {totalWeight}%</span>
                {totalWeight !== 100 && (
                  <span className="ml-2 text-sm">⚠️ Should be 100%</span>
                )}
              </div>
            </div>

            {gradeComponents.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <Target className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                <p className="text-lg">No grade components configured yet</p>
                {isInstructor && (
                  <p className="text-sm mt-2">Create grade components to start grading students</p>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {gradeComponents.map((component) => (
                  <div
                    key={component.id}
                    className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="font-semibold text-gray-900">{component.name}</h3>
                      <span className="px-2 py-1 bg-purple-100 text-purple-700 text-sm font-medium rounded">
                        {component.weight}%
                      </span>
                    </div>
                    {component.description && (
                      <p className="text-sm text-gray-600 mb-2">{component.description}</p>
                    )}
                    <div className="flex items-center text-sm text-gray-500">
                      <Target className="w-4 h-4 mr-1" />
                      Max Score: {component.max_score}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Student View - My Grade */}
          {!isInstructor && (
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-xl font-semibold text-gray-900 flex items-center mb-6">
                <BarChart3 className="w-6 h-6 mr-2 text-purple-600" />
                My Final Grade
              </h2>

              {!myGrade ? (
                <div className="text-center py-12">
                  <AlertCircle className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                  <p className="text-lg text-gray-600 mb-2">No grade available yet</p>
                  <p className="text-sm text-gray-500">
                    Your instructor hasn't published grades for this course yet
                  </p>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Grade Summary Card */}
                  <div className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-xl p-6 border border-purple-200">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      {/* Numeric Grade */}
                      <div className="text-center">
                        <p className="text-sm text-gray-600 mb-2">Numeric Grade</p>
                        <p className="text-4xl font-bold text-purple-600">
                          {myGrade.numeric_grade ? myGrade.numeric_grade.toFixed(2) : '-'}
                        </p>
                        <p className="text-sm text-gray-500 mt-1">out of 100</p>
                      </div>

                      {/* Letter Grade */}
                      <div className="text-center">
                        <p className="text-sm text-gray-600 mb-2">Letter Grade</p>
                        <div className={`inline-flex items-center justify-center w-20 h-20 rounded-full ${getGradeBackground(myGrade.letter_grade)}`}>
                          <p className={`text-3xl font-bold ${getGradeColor(myGrade.letter_grade)}`}>
                            {myGrade.letter_grade || '-'}
                          </p>
                        </div>
                      </div>

                      {/* GPA */}
                      <div className="text-center">
                        <p className="text-sm text-gray-600 mb-2">GPA Points</p>
                        <p className={`text-4xl font-bold ${getGPAColor(myGrade.gpa_points)}`}>
                          {myGrade.gpa_points ? myGrade.gpa_points.toFixed(2) : '-'}
                        </p>
                        <p className="text-sm text-gray-500 mt-1">out of 4.00</p>
                      </div>
                    </div>

                    {/* Status Badge */}
                    <div className="mt-4 flex items-center justify-center">
                      {myGrade.is_published ? (
                        <span className="inline-flex items-center px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm">
                          <CheckCircle className="w-4 h-4 mr-2" />
                          Published
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full text-sm">
                          <EyeOff className="w-4 h-4 mr-2" />
                          Unpublished
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Component Breakdown */}
                  {myGrade.components && myGrade.components.length > 0 && (
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Grade Breakdown</h3>
                      <div className="space-y-3">
                        {myGrade.components.map((comp, index) => (
                          <div key={index} className="border border-gray-200 rounded-lg p-4">
                            <div className="flex items-center justify-between mb-2">
                              <span className="font-medium text-gray-900">{comp.name}</span>
                              <span className="text-sm text-gray-500">{comp.weight}% weight</span>
                            </div>
                            <div className="flex items-center justify-between">
                              <div className="flex-1">
                                <div className="w-full bg-gray-200 rounded-full h-2">
                                  <div
                                    className="bg-purple-600 h-2 rounded-full transition-all"
                                    style={{ width: `${(comp.score / comp.max_score) * 100}%` }}
                                  ></div>
                                </div>
                              </div>
                              <span className="ml-4 text-sm font-semibold text-gray-700">
                                {comp.score}/{comp.max_score}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Instructor View - All Students */}
          {isInstructor && (
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-xl font-semibold text-gray-900 flex items-center mb-6">
                <User className="w-6 h-6 mr-2 text-purple-600" />
                Student Grades
              </h2>

              {finalGrades.length === 0 ? (
                <div className="text-center py-12">
                  <AlertCircle className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                  <p className="text-lg text-gray-600 mb-2">No grades calculated yet</p>
                  <p className="text-sm text-gray-500">
                    Grade students on components, then click "Recalculate" to generate final grades
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Student
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Student ID
                        </th>
                        <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Numeric Grade
                        </th>
                        <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Letter Grade
                        </th>
                        <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                          GPA
                        </th>
                        <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {finalGrades.map((grade) => (
                        <tr key={grade.student_id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="font-medium text-gray-900">{grade.student_name}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {grade.student_id}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-center">
                            <span className="text-lg font-semibold text-gray-900">
                              {grade.numeric_grade ? grade.numeric_grade.toFixed(2) : '-'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-center">
                            <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold ${getGradeBackground(grade.letter_grade)} ${getGradeColor(grade.letter_grade)}`}>
                              {grade.letter_grade || '-'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-center">
                            <span className={`text-lg font-semibold ${getGPAColor(grade.gpa_points)}`}>
                              {grade.gpa_points ? grade.gpa_points.toFixed(2) : '-'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-center">
                            {grade.is_published ? (
                              <span className="inline-flex items-center px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs">
                                <CheckCircle className="w-3 h-3 mr-1" />
                                Published
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-2 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs">
                                <EyeOff className="w-3 h-3 mr-1" />
                                Draft
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default GradebookEnhanced;
