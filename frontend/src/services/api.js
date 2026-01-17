import axios from 'axios';

const API_URL = 'http://localhost:5000/api';

// Create axios instance
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request interceptor to add token
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

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/';
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  sendOTP: (mobileNumber) => api.post('/auth/send-otp', { mobileNumber }),
  verifyOTP: (mobileNumber, otp) => api.post('/auth/verify-otp', { mobileNumber, otp }),
  logout: () => api.post('/auth/logout')
};

// User API
export const userAPI = {
  getMe: () => api.get('/users/me'),
  updateProfile: (data) => api.put('/users/me', data),
  searchUsers: (query) => api.get(`/users/search?query=${query}`),
  getUserById: (id) => api.get(`/users/${id}`)
};

// Chat API
export const chatAPI = {
  getChatHistory: (userId, page = 1) => api.get(`/chats/${userId}?page=${page}`),
  getUnreadCounts: () => api.get('/chats/unread'),
  markAsRead: (messageId) => api.put(`/chats/messages/${messageId}/read`)
};

// Group API
export const groupAPI = {
  createGroup: (data) => api.post('/groups', data),
  getUserGroups: () => api.get('/groups'),
  getGroupById: (id) => api.get(`/groups/${id}`),
  updateGroup: (id, data) => api.put(`/groups/${id}`, data),
  deleteGroup: (id) => api.delete(`/groups/${id}`),
  addMembers: (id, members) => api.post(`/groups/${id}/members`, { members }),
  removeMember: (groupId, userId) => api.delete(`/groups/${groupId}/members/${userId}`),
  leaveGroup: (id) => api.post(`/groups/${id}/leave`),
  getGroupMessages: (id, page = 1) => api.get(`/groups/${id}/messages?page=${page}`)
};

export default api;
