import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../utils/axiosInstance';

const UserIcon = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"></path>
    <circle cx="12" cy="7" r="4"></circle>
  </svg>
);

const LockIcon = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
    <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
  </svg>
);

const EyeIcon = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
        <circle cx="12" cy="12" r="3" />
    </svg>
);

const EyeOffIcon = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" />
        <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" />
        <path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" />
        <line x1="2" x2="22" y1="2" y2="22" />
    </svg>
);


// --- Login Page Component ---
const LoginPage = () => {
  // State management for form inputs, loading, and error/success messages
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const navigate = useNavigate();

  // Handler for form submission
  const handleLogin = async (e) => {
    e.preventDefault(); // Prevent default form submission
    
    // Basic validation
    if (!username || !password) {
        setError('Please enter both username and password.');
        return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      // Making the POST request using the configured axios instance
      const response = await axiosInstance.post('/users/login', {
        username,
        password,
      });

      // Store JWT token if present
      if (response.data && response.data.accessToken) {
        localStorage.setItem('accessToken', response.data.accessToken);
      }

      // Handle success
      setSuccess('Login successful! Redirecting...');
      setTimeout(() => {
        navigate('/dashboard');
      }, 1000);

    } catch (err) {
      if (err.response) {
        setError(err.response.data.message || 'Invalid username or password.');
      } else if (err.request) {
        setError('Network error. Please check your connection.');
      } else {
        setError('An unexpected error occurred. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  // Handler for navigating to signup page
  const handleSignupRedirect = (e) => {
    e.preventDefault();
    navigate('/signup');
  };

  return (
    <div className="relative min-h-screen w-full bg-gray-900 text-white flex items-center justify-center p-4 overflow-hidden">
      {/* Animated background */}
      <div className="absolute top-0 left-0 w-full h-full z-0">
        <div className="absolute -top-1/4 -left-1/4 w-1/2 h-1/2 bg-cyan-500/30 rounded-full filter blur-3xl animate-blob"></div>
        <div className="absolute -bottom-1/4 -right-1/4 w-1/2 h-1/2 bg-blue-500/30 rounded-full filter blur-3xl animate-blob animation-delay-2000"></div>
         <div className="absolute -bottom-1/4 -left-1/4 w-1/2 h-1/2 bg-purple-500/30 rounded-full filter blur-3xl animate-blob animation-delay-4000"></div>
      </div>

      {/* Login Card */}
      <div className="relative z-10 w-full max-w-md">
        <div className="bg-gray-800/60 backdrop-blur-xl border border-gray-700/50 rounded-2xl shadow-2xl shadow-black/20">
          <div className="p-8 md:p-12">
            <div className="text-center mb-8">
              <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">
                Welcome Back
              </h1>
              <p className="text-gray-400 mt-2">Sign in to continue</p>
            </div>

            <form onSubmit={handleLogin} className="space-y-6">
              {/* Username Input */}
              <div className="relative">
                <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full bg-gray-900/50 border border-gray-700 rounded-lg py-3 pr-4 pl-12 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 transition-all duration-300"
                  disabled={loading}
                />
              </div>

              {/* Password Input */}
              <div className="relative">
                <LockIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-gray-900/50 border border-gray-700 rounded-lg py-3 pr-12 pl-12 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 transition-all duration-300"
                  disabled={loading}
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors">
                    {showPassword ? <EyeOffIcon className="w-5 h-5"/> : <EyeIcon className="w-5 h-5"/>}
                </button>
              </div>
              
              {/* Message Display Area */}
              {error && <p className="text-sm text-center text-red-400 bg-red-500/10 border border-red-500/20 rounded-md py-2 px-4">{error}</p>}
              {success && <p className="text-sm text-center text-green-400 bg-green-500/10 border border-green-500/20 rounded-md py-2 px-4">{success}</p>}

              {/* Submit Button */}
              <div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full inline-flex items-center justify-center px-8 py-3 font-bold text-lg text-white bg-gradient-to-r from-cyan-500 to-blue-600 rounded-lg hover:from-cyan-600 hover:to-blue-700 transition-all duration-300 transform hover:scale-105 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:scale-100"
                >
                  {loading ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Signing In...
                    </>
                  ) : (
                    'Sign In'
                  )}
                </button>
              </div>
            </form>
            
            <div className="text-center mt-8">
                <p className="text-sm text-gray-400">Don't have an account? <a href="#" onClick={handleSignupRedirect} className="font-medium text-cyan-400 hover:text-cyan-300">Sign Up</a></p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
export default LoginPage;
