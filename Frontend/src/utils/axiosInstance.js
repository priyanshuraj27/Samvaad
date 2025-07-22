import axios from 'axios';

// Fix: Use string concatenation for environment variable and path
const apiBaseURL = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000') + '/api/v1';

const axiosInstance = axios.create({
  baseURL: apiBaseURL,
  withCredentials: true,
});

// Add request interceptor to handle FormData properly
axiosInstance.interceptors.request.use(
  (config) => {
    // Only set JSON content type if data is not FormData
    if (!(config.data instanceof FormData)) {
      config.headers['Content-Type'] = 'application/json';
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default axiosInstance;