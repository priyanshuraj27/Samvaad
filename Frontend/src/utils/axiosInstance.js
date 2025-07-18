import axios from 'axios';

// Fix: Use string concatenation for environment variable and path
const apiBaseURL = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000') + '/api/v1';

const axiosInstance = axios.create({
  baseURL: apiBaseURL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

export default axiosInstance;