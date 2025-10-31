// frontend/src/pages/Modules.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  BookOpen,
  FileText,
  Video,
  File,
  Link as LinkIcon,
  Download,
  ChevronRight,
  Clock,
  CheckCircle,
  Lock
} from 'lucide-react';
import Navbar from '../components/common/Navbar';
import api from '../services/api';

export default function Modules() {
  const { classId } = useParams();
  const navigate = useNavigate();
  const [modules, setModules] = useState([]);
  const [selectedModule, setSelectedModule] = useState(null);
  const [classInfo, setClassInfo] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (classId) {
      fetchModules();
      fetchClassInfo();
    }
  }, [classId]);

  const fetchModules = async () => {
    setLoading(true);
    try {
      const response = await api.get(`/modules/class/${classId}`);
      setModules(response.data.data || []);
      if (response.data.data?.length > 0) {
        setSelectedModule(response.data.data[0]);
      }
    } catch (error) {
      console.error('Error fetching modules:', error);
      alert('Failed to fetch modules: ' + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  const fetchClassInfo = async () => {
    try {
      const response = await api.get(`/classes/${classId}`);
      setClassInfo(response.data.data);
    } catch (error) {
      console.error('Error fetching class info:', error);
    }
  };

  const getResourceIcon = (fileType) => {
    switch (fileType) {
      case 'pdf':
        return <FileText className="w-5 h-5 text-red-500" />;
      case 'video':
        return <Video className="w-5 h-5 text-purple-500" />;
      case 'link':
        return <LinkIcon className="w-5 h-5 text-blue-500" />;
      default:
        return <File className="w-5 h-5 text-gray-500" />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="flex items-center justify-center h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading modules...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <button
            onClick={() => navigate(`/course/${classId}`)}
            className="text-blue-100 hover:text-white mb-4 flex items-center gap-2"
          >
            ← Back to Course
          </button>
          <div className="flex items-center gap-3 mb-2">
            <BookOpen className="w-8 h-8" />
            <h1 className="text-3xl font-bold">Course Modules</h1>
          </div>
          {classInfo && (
            <p className="text-blue-100">
              {classInfo.code} - {classInfo.name}
            </p>
          )}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {modules.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-12 text-center">
            <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              No Modules Yet
            </h3>
            <p className="text-gray-600">
              Course modules will appear here once the instructor publishes them.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Module List Sidebar */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-lg shadow-sm overflow-hidden sticky top-4">
                <div className="p-4 bg-blue-50 border-b border-blue-100">
                  <h2 className="font-semibold text-gray-900">All Modules</h2>
                  <p className="text-sm text-gray-600">{modules.length} modules</p>
                </div>
                <div className="divide-y divide-gray-200 max-h-[calc(100vh-250px)] overflow-y-auto">
                  {modules.map((module, index) => (
                    <button
                      key={module.id}
                      onClick={() => setSelectedModule(module)}
                      className={`w-full text-left p-4 hover:bg-gray-50 transition-colors ${
                        selectedModule?.id === module.id ? 'bg-blue-50 border-l-4 border-blue-600' : ''
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                          module.is_published ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'
                        }`}>
                          {module.is_published ? (
                            <CheckCircle className="w-5 h-5" />
                          ) : (
                            <Lock className="w-5 h-5" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-xs text-gray-500 mb-1">Module {index + 1}</div>
                          <div className="font-medium text-gray-900 mb-1 line-clamp-2">
                            {module.title}
                          </div>
                          {module.duration_minutes && (
                            <div className="flex items-center gap-1 text-xs text-gray-500">
                              <Clock className="w-3 h-3" />
                              {module.duration_minutes} min
                            </div>
                          )}
                          {module.resource_count > 0 && (
                            <div className="text-xs text-blue-600 mt-1">
                              {module.resource_count} resource{module.resource_count > 1 ? 's' : ''}
                            </div>
                          )}
                        </div>
                        {selectedModule?.id === module.id && (
                          <ChevronRight className="w-5 h-5 text-blue-600 flex-shrink-0" />
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Module Content */}
            <div className="lg:col-span-2">
              {selectedModule ? (
                <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                  {/* Module Header */}
                  <div className="p-6 border-b border-gray-200">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                            selectedModule.is_published
                              ? 'bg-green-100 text-green-700'
                              : 'bg-gray-100 text-gray-600'
                          }`}>
                            {selectedModule.is_published ? 'Published' : 'Draft'}
                          </span>
                          {selectedModule.duration_minutes && (
                            <span className="flex items-center gap-1 text-sm text-gray-600">
                              <Clock className="w-4 h-4" />
                              {selectedModule.duration_minutes} minutes
                            </span>
                          )}
                        </div>
                        <h2 className="text-2xl font-bold text-gray-900 mb-2">
                          {selectedModule.title}
                        </h2>
                        {selectedModule.description && (
                          <p className="text-gray-600">{selectedModule.description}</p>
                        )}
                      </div>
                    </div>

                    {selectedModule.author && (
                      <div className="text-sm text-gray-500">
                        Created by <span className="font-medium">{selectedModule.author}</span>
                      </div>
                    )}
                  </div>

                  {/* Module Content */}
                  <div className="p-6">
                    {selectedModule.content && (
                      <div
                        className="prose max-w-none mb-6"
                        dangerouslySetInnerHTML={{ __html: selectedModule.content }}
                      />
                    )}

                    {/* Resources */}
                    {selectedModule.resources && selectedModule.resources.length > 0 && (
                      <div className="mt-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                          <File className="w-5 h-5" />
                          Resources
                        </h3>
                        <div className="space-y-2">
                          {selectedModule.resources.map((resource) => (
                            <a
                              key={resource.id}
                              href={`/uploads/${resource.file_url}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-all group"
                            >
                              {getResourceIcon(resource.file_type)}
                              <div className="flex-1">
                                <div className="font-medium text-gray-900 group-hover:text-blue-600">
                                  {resource.title}
                                </div>
                                {resource.file_size && (
                                  <div className="text-xs text-gray-500">
                                    {(resource.file_size / 1024 / 1024).toFixed(2)} MB
                                  </div>
                                )}
                              </div>
                              <Download className="w-5 h-5 text-gray-400 group-hover:text-blue-600" />
                            </a>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="bg-white rounded-lg shadow-sm p-12 text-center">
                  <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-600">Select a module to view its content</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
