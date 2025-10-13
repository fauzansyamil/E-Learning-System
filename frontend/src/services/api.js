// src/services/api.js
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

console.log('🌐 API URL:', API_URL); // Debug log

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    console.log('📤 API Request:', config.method.toUpperCase(), config.url); // Debug
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    console.error('📤 Request Error:', error); // Debug
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => {
    console.log('📥 API Response:', response.status, response.data); // Debug
    return response;
  },
  (error) => {
    console.error('📥 Response Error:', error.response || error); // Debug
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/';
    }
    return Promise.reject(error);
  }
);

export const authAPI = {
  login: (credentials) => {
    console.log('🔐 authAPI.login called with:', credentials); // Debug
    return api.post('/auth/login', credentials);
  },
  register: (userData) => api.post('/auth/register', userData),
  getCurrentUser: () => api.get('/auth/me'),
  logout: () => api.post('/auth/logout'),
};

// Export other API functions...
export const classAPI = {
  getAllClasses: () => api.get('/classes'),
  getClassById: (id) => api.get(`/classes/${id}`),
  // ... other methods
};

export const notificationAPI = {
  getNotifications: () => api.get('/notifications'),
  markAsRead: (id) => api.put(`/notifications/${id}/read`),
  markAllAsRead: () => api.put('/notifications/read-all'),
};

export const assignmentAPI = {
  getAssignmentsByClass: (classId) => api.get(`/assignments/class/${classId}`),
  getAssignmentById: (id) => api.get(`/assignments/${id}`),
  createAssignment: (data) => api.post('/assignments', data),
  submitAssignment: (assignmentId, data) => 
    api.post(`/assignments/${assignmentId}/submit`, data),
  gradeSubmission: (submissionId, data) => 
    api.post(`/assignments/submissions/${submissionId}/grade`, data),
};

export const dashboardAPI = {
  getStats: () => api.get('/dashboard/stats'),
  getRecentActivities: () => api.get('/dashboard/recent-activities'),
};

export const materialAPI = {
  getMaterialsByClass: (classId) => api.get(`/materials/class/${classId}`),
  getMaterialById: (id) => api.get(`/materials/${id}`),
  createMaterial: (data) => api.post('/materials', data),
  updateMaterial: (id, data) => api.put(`/materials/${id}`, data),
  deleteMaterial: (id) => api.delete(`/materials/${id}`),
};

export const discussionAPI = {
  getDiscussionsByClass: (classId) => api.get(`/discussions/class/${classId}`),
  getDiscussionById: (id) => api.get(`/discussions/${id}`),
  createDiscussion: (data) => api.post('/discussions', data),
  replyToDiscussion: (discussionId, content) => 
    api.post(`/discussions/${discussionId}/reply`, { content }),
};

export default api;