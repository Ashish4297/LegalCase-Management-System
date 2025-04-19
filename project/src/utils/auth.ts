import axios from 'axios';

const API_URL = '/api';

// Add token to all requests
axios.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    console.log('Request:', {
      url: config.url,
      method: config.method,
      headers: config.headers,
      data: config.data
    });
    return config;
  },
  (error) => {
    console.error('Request error:', error);
    return Promise.reject(error);
  }
);

// Handle token expiration
axios.interceptors.response.use(
  (response) => {
    console.log('Response:', {
      status: response.status,
      data: response.data
    });
    return response;
  },
  (error) => {
    console.error('Response error:', {
      status: error.response?.status,
      data: error.response?.data,
      message: error.message
    });

    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const login = async (email: string, password: string) => {
  try {
    console.log('Login attempt:', { email });
    const response = await axios.post(`${API_URL}/auth/login`, { email, password });
    
    if (response.data.token) {
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
      console.log('Login successful:', response.data.user);
    }
    return response.data;
  } catch (error: any) {
    console.error('Login error:', {
      message: error.response?.data?.message || error.message,
      status: error.response?.status
    });
    throw error;
  }
};

export const register = async (userData: {
  name: string;
  email: string;
  password: string;
  role: string;
  phone: string;
}) => {
  try {
    console.log('Registration attempt:', { ...userData, password: '[REDACTED]' });
    const response = await axios.post(`${API_URL}/auth/register`, userData);
    
    if (response.data.token) {
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
      console.log('Registration successful:', response.data.user);
    }
    return response.data;
  } catch (error: any) {
    console.error('Registration error:', {
      message: error.response?.data?.message || error.message,
      status: error.response?.status
    });
    throw error;
  }
};

export const logout = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  window.location.href = '/login';
};

export const getCurrentUser = () => {
  const userStr = localStorage.getItem('user');
  if (userStr) {
    return JSON.parse(userStr);
  }
  return null;
};

export const isAuthenticated = () => {
  return !!localStorage.getItem('token');
};

export const verifyToken = async () => {
  try {
    const response = await axios.get(`${API_URL}/auth/verify`);
    return response.data.valid;
  } catch (error) {
    console.error('Token verification error:', error);
    return false;
  }
};