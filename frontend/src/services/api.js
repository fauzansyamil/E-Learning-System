
// frontend/src/services/api.js
import axios from 'axios';

// Base URL from environment variable or default
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  },
  timeout: 10000 // 10 seconds timeout
});

// Request interceptor - Add auth token to all requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - Handle errors globally
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // Handle specific error cases
    if (error.response) {
      // Server responded with error status
      const { status, data } = error.response;

      switch (status) {
        case 401:
          // Unauthorized - clear token and redirect to login
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          window.location.href = '/login';
          break;

        case 403:
          // Forbidden - user doesn't have permission
          console.error('Access forbidden:', data.message);
          break;

        case 404:
          // Not found
          console.error('Resource not found:', data.message);
          break;

        case 500:
          // Server error
          console.error('Server error:', data.message);
          break;

        default:
          console.error('API Error:', data.message);
      }
    } else if (error.request) {
      // Request was made but no response received
      console.error('Network error: No response from server');
    } else {
      // Something else happened
      console.error('Error:', error.message);
    }

    return Promise.reject(error);
  }
);

// API methods

// Authentication
export const authAPI = {
  login: (credentials) => api.post('/auth/login', credentials),
  register: (userData) => api.post('/auth/register', userData),
  logout: () => api.post('/auth/logout'),
  getProfile: () => api.get('/auth/profile'),
  updateProfile: (data) => api.put('/auth/profile', data)
};

// Classes
export const classesAPI = {
  getAll: () => api.get('/classes'),
  getById: (id) => api.get(`/classes/${id}`),
  getMaterials: (classId) => api.get(`/classes/${classId}/materials`),
  getAnnouncements: (classId) => api.get(`/classes/${classId}/announcements`)
};

// Assignments
export const assignmentsAPI = {
  getAll: () => api.get('/assignments'),
  getById: (id) => api.get(`/assignments/${id}`),
  submit: (assignmentId, formData) => 
    api.post(`/assignments/${assignmentId}/submit`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    }),
  getSubmissions: (assignmentId) => api.get(`/assignments/${assignmentId}/submissions`)
};

// Grades
export const gradesAPI = {
  getAll: (params) => api.get('/grades', { params }),
  getByCourse: (courseId) => api.get(`/grades/course/${courseId}`),
  getGPA: () => api.get('/grades/gpa')
};

// Dashboard
export const dashboardAPI = {
  getStats: () => api.get('/dashboard'),
  getRecentActivities: () => api.get('/dashboard/activities'),
  getUpcomingAssignments: () => api.get('/dashboard/assignments')
};

// Discussions
export const discussionsAPI = {
  getAll: (classId) => api.get(`/discussions?classId=${classId}`),
  getById: (id) => api.get(`/discussions/${id}`),
  create: (data) => api.post('/discussions', data),
  reply: (discussionId, data) => api.post(`/discussions/${discussionId}/reply`, data)
};

// Notifications
export const notificationsAPI = {
  getAll: () => api.get('/notifications'),
  markAsRead: (id) => api.put(`/notifications/${id}/read`),
  markAllAsRead: () => api.put('/notifications/read-all')
};

// Schedule
export const scheduleAPI = {
  getWeekly: () => api.get('/schedule/weekly'),
  getByDate: (date) => api.get(`/schedule?date=${date}`)
};

// Users (for admin)
export const usersAPI = {
  getAll: (params) => api.get('/users', { params }),
  getById: (id) => api.get(`/users/${id}`),
  create: (data) => api.post('/users', data),
  update: (id, data) => api.put(`/users/${id}`, data),
  delete: (id) => api.delete(`/users/${id}`)
};

// Export default api instance for custom requests
export default api;