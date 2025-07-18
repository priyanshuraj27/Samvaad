import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom'; // <<< 1. IMPORTED
import axiosInstance from '../utils/axiosInstance';
import jsPDF from 'jspdf';

// --- SVG Icons ---
const UserIcon = ({ className }) => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>);
const MailIcon = ({ className }) => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><rect width="20" height="16" x="2" y="4" rx="2" /><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" /></svg>);
const LockIcon = ({ className }) => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>);
const AwardIcon = ({ className }) => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><circle cx="12" cy="8" r="7"></circle><polyline points="8.21 13.89 7 23 12 17 17 23 15.79 13.88"></polyline></svg>);
const ShieldCheckIcon = ({ className }) => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path><path d="m9 12 2 2 4-4"></path></svg>);
const BarChartIcon = ({ className }) => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><line x1="12" x2="12" y1="20" y2="10"></line><line x1="18" x2="18" y1="20" y2="4"></line><line x1="6" x2="6" y1="20" y2="16"></line></svg>);
const LogOutIcon = ({ className }) => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" x2="9" y1="12" y2="12"></line></svg>);
const DownloadIcon = ({ className }) => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" x2="12" y1="15" y2="3"></line></svg>);
const HistoryIcon = ({ className }) => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"></path><path d="M3 3v5h5"></path></svg>);
// <<< 2. ADDED CHEVRON ICON
const ChevronLeftIcon = ({ className }) => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="m15 18-6-6 6-6" /></svg>);


// --- Reusable Components ---
const Card = ({ children, className = '' }) => (
  <div className={`bg-gray-800/60 backdrop-blur-xl border border-gray-700/50 rounded-2xl shadow-2xl shadow-black/20 ${className}`}>
    {children}
  </div>
);

// ... StatCard component remains the same

// --- Main Profile Page Component ---
const ProfilePage = () => {
  const [user, setUser] = useState(null);
  const [gamification, setGamification] = useState(null);
  const [levels, setLevels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('profile');
  const navigate = useNavigate(); // <<< 3. INITIALIZED NAVIGATE

  // ... useEffect and other functions remain the same
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [userRes, gamRes, levelsRes] = await Promise.all([
          axiosInstance.get('/users/current-user'),
          axiosInstance.get('/gamification'),
          axiosInstance.get('/gamification/levels'),
        ]);
        setUser(userRes.data.data);
        setGamification(gamRes.data.data);
        setLevels(levelsRes.data.data);
      } catch (err) {
        setError('Failed to fetch profile or gamification data.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleLogout = async () => {
    try {
      await axiosInstance.post('/users/logout');
      window.location.href = '/login';
    } catch (err) {
      console.error("Logout failed", err);
      alert("Logout failed. Please try again.");
    }
  };


  if (loading) {
    return <div className="min-h-screen bg-gray-900 flex items-center justify-center text-white">Loading Profile...</div>;
  }

  if (error) {
    return <div className="min-h-screen bg-gray-900 flex items-center justify-center text-red-400">{error}</div>;
  }

  // Find next level info for progress bar
  const currentLevel = gamification?.level || 1;
  const currentXP = gamification?.xp || 0;
  const currentLevelObj = levels.find(lvl => lvl.level === currentLevel) || { xpRequired: 0 };
  const nextLevelObj = levels.find(lvl => lvl.level === currentLevel + 1);
  const xpMin = currentLevelObj.xpRequired;
  const xpMax = nextLevelObj ? nextLevelObj.xpRequired : xpMin + 1000;
  const progress = xpMax > xpMin ? ((currentXP - xpMin) / (xpMax - xpMin)) * 100 : 0;

  return (
    <div className="min-h-screen w-full bg-gray-900 text-white font-sans p-4 sm:p-6 lg:p-8">
      <div className="absolute top-0 left-0 w-full h-full z-0 overflow-hidden">
        <div className="absolute -top-1/4 -left-1/4 w-1/2 h-1/2 bg-cyan-500/30 rounded-full filter blur-3xl animate-blob"></div>
        <div className="absolute -bottom-1/4 -right-1/4 w-1/2 h-1/2 bg-blue-500/30 rounded-full filter blur-3xl animate-blob animation-delay-2000"></div>
      </div>

      <main className="relative z-10 max-w-7xl mx-auto">
        {/* --- 3. ADDED BACK BUTTON --- */}
        <button
          onClick={() => navigate('/dashboard')}
          className="flex items-center gap-2 text-cyan-400 hover:text-cyan-300 transition-colors mb-6 font-semibold"
        >
          <ChevronLeftIcon className="w-5 h-5" />
          Back to Dashboard
        </button>
        {/* --- END BACK BUTTON --- */}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column */}
            <div className="lg:col-span-1 flex flex-col gap-8">
              <Card className="p-6 text-center">
                <img src={user?.avatar || `https://placehold.co/128x128/1F2937/FFFFFF?text=${user?.username ? user.username[0].toUpperCase() : 'U'}`} alt="Avatar" className="w-32 h-32 rounded-full mx-auto border-4 border-cyan-500 shadow-lg" />
                <h1 className="mt-4 text-3xl font-bold text-white">{user?.fullName}</h1>
                <p className="text-cyan-400">@{user?.username}</p>
                <p className="text-gray-400 text-sm mt-1">{user?.email}</p>
              </Card>
              <Card className="p-6">
                <h2 className="text-2xl font-bold text-white mb-4">Your Rank</h2>
                <div className="flex justify-between items-center mb-6">
                  <p className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">{gamification?.name || "Novice Debater"}</p>
                  <div className="text-center">
                    <p className="text-sm text-gray-400">Level</p>
                    <p className="text-2xl font-bold text-white">{gamification?.level || 1}</p>
                  </div>
                </div>
                <p className="text-gray-400 text-right text-sm">
                  XP: {currentXP.toLocaleString()} / {xpMax.toLocaleString()}
                </p>
                <div className="w-full bg-gray-700 rounded-full h-2.5 mb-6 mt-1">
                  <div className="bg-gradient-to-r from-cyan-500 to-blue-500 h-2.5 rounded-full" style={{ width: `${progress}%` }}></div>
                </div>
              </Card>
            </div>

            {/* Right Column */}
            <div className="lg:col-span-2">
              <Card className="p-6 sm:p-8 h-full flex flex-col">
                <div className="flex border-b border-gray-700 mb-6">
                  <button onClick={() => setActiveTab('profile')} className={`flex items-center gap-2 px-4 py-2 text-lg font-semibold transition-colors ${activeTab === 'profile' ? 'text-cyan-400 border-b-2 border-cyan-400' : 'text-gray-400 hover:text-white'}`}><UserIcon className="w-5 h-5"/>Profile</button>
                  <button onClick={() => setActiveTab('password')} className={`flex items-center gap-2 px-4 py-2 text-lg font-semibold transition-colors ${activeTab === 'password' ? 'text-cyan-400 border-b-2 border-cyan-400' : 'text-gray-400 hover:text-white'}`}><LockIcon className="w-5 h-5"/>Password</button>
                  <button onClick={() => setActiveTab('debates')} className={`flex items-center gap-2 px-4 py-2 text-lg font-semibold transition-colors ${activeTab === 'debates' ? 'text-cyan-400 border-b-2 border-cyan-400' : 'text-gray-400 hover:text-white'}`}><HistoryIcon className="w-5 h-5"/>Past Debates</button>
                </div>

                <div className="flex-grow">
                  {activeTab === 'profile' && <UpdateDetailsForm user={user} />}
                  {activeTab === 'password' && <ChangePasswordForm />}
                  {activeTab === 'debates' && <PastDebatesList />}
                </div>
                
                <div className="border-t border-gray-700 mt-8 pt-6">
                  <button onClick={handleLogout} className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 font-semibold text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg hover:bg-red-500/20 transition-colors">
                    <LogOutIcon className="w-5 h-5" />
                    Logout
                  </button>
                </div>
              </Card>
            </div>
        </div>
      </main>
    </div>
  );
};


// --- Form Components (unchanged, omitted for brevity) ---
// ... UpdateDetailsForm
// ... ChangePasswordForm
// ... PastDebatesList

// --- (The rest of your components: UpdateDetailsForm, ChangePasswordForm, PastDebatesList) remain unchanged ---
const UpdateDetailsForm = ({ user }) => {
    const [fullName, setFullName] = useState(user?.fullName || '');
    const [email, setEmail] = useState(user?.email || '');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage({ type: '', text: '' });
        try {
            await axiosInstance.patch('/users/update-account', { fullName, email });
            setMessage({ type: 'success', text: 'Profile updated successfully!' });
        } catch (err) {
            setMessage({ type: 'error', text: err.response?.data?.message || 'Failed to update profile.' });
        } finally { setLoading(false); }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <h3 className="text-xl font-bold text-white">Account Details</h3>
            <div>
                <label className="block mb-2 text-sm font-medium text-gray-300">Full Name</label>
                <div className="relative"><UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" /><input type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} className="w-full bg-gray-900/50 border border-gray-700 rounded-lg py-3 pr-4 pl-12 text-white" /></div>
            </div>
            <div>
                <label className="block mb-2 text-sm font-medium text-gray-300">Email Address</label>
                <div className="relative"><MailIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" /><input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full bg-gray-900/50 border border-gray-700 rounded-lg py-3 pr-4 pl-12 text-white" /></div>
            </div>
            {message.text && <p className={`text-sm text-center rounded-md p-2 ${message.type === 'success' ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>{message.text}</p>}
            <button type="submit" disabled={loading} className="w-full sm:w-auto px-8 py-3 font-bold text-white bg-gradient-to-r from-cyan-500 to-blue-600 rounded-lg hover:from-cyan-600 hover:to-blue-700 transition-all duration-300 transform hover:scale-105 shadow-lg disabled:opacity-50">{loading ? 'Saving...' : 'Save Changes'}</button>
        </form>
    );
};

const ChangePasswordForm = () => {
    const [oldPassword, setOldPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage({ type: '', text: '' });
        try {
            await axiosInstance.post('/users/change-password', { oldPassword, newPassword });
            setMessage({ type: 'success', text: 'Password changed successfully!' });
            setOldPassword('');
            setNewPassword('');
        } catch (err) {
            setMessage({ type: 'error', text: err.response?.data?.message || 'Failed to change password.' });
        } finally { setLoading(false); }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <h3 className="text-xl font-bold text-white">Change Password</h3>
            <div>
                <label className="block mb-2 text-sm font-medium text-gray-300">Old Password</label>
                <div className="relative"><LockIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" /><input type="password" value={oldPassword} onChange={(e) => setOldPassword(e.target.value)} className="w-full bg-gray-900/50 border border-gray-700 rounded-lg py-3 pr-4 pl-12 text-white" /></div>
            </div>
            <div>
                <label className="block mb-2 text-sm font-medium text-gray-300">New Password</label>
                <div className="relative"><ShieldCheckIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" /><input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="w-full bg-gray-900/50 border border-gray-700 rounded-lg py-3 pr-4 pl-12 text-white" /></div>
            </div>
            {message.text && <p className={`text-sm text-center rounded-md p-2 ${message.type === 'success' ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>{message.text}</p>}
            <button type="submit" disabled={loading} className="w-full sm:w-auto px-8 py-3 font-bold text-white bg-gradient-to-r from-cyan-500 to-blue-600 rounded-lg hover:from-cyan-600 hover:to-blue-700 transition-all duration-300 transform hover:scale-105 shadow-lg disabled:opacity-50">{loading ? 'Updating...' : 'Update Password'}</button>
        </form>
    );
};

const PastDebatesList = () => {
    const [debates, setDebates] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchDebates = async () => {
            try {
                const response = await axiosInstance.get('/debates');
                setDebates(response.data.data);
            } catch (err) {
                setError('Failed to fetch debate history.');
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchDebates();
    }, []);

    const handleDownload = (transcript, motion) => {
        const doc = new jsPDF();
        const safeMotion = motion.replace(/[^a-z0-9]/gi, '_').toLowerCase().substring(0, 30);
        doc.setProperties({ title: `Transcript: ${motion}` });
        doc.setFont("helvetica", "bold");
        doc.setFontSize(16);
        doc.text(`Debate Transcript`, 105, 20, { align: 'center' });
        doc.setFontSize(12);
        const motionLines = doc.splitTextToSize(`Motion: ${motion}`, 180);
        doc.text(motionLines, 105, 30, { align: 'center' });
        doc.setFont("times", "normal");
        doc.setFontSize(12);
        const transcriptLines = doc.splitTextToSize(transcript, 180);
        doc.text(transcriptLines, 15, 50);
        doc.save(`transcript_${safeMotion}.pdf`);
    };

    if (loading) return <p className="text-center text-gray-400">Loading debate history...</p>;
    if (error) return <p className="text-center text-red-400">{error}</p>;
    if (debates.length === 0) return <p className="text-center text-gray-400">No past debates found.</p>;

    return (
        <div className="space-y-4">
            {debates.map((debate, index) => (
                <div key={index} className="bg-gray-900/50 p-4 rounded-lg border border-gray-700">
                    <h4 className="font-bold text-white">{debate.motion}</h4>
                    <div className="flex justify-between items-center mt-2 text-sm text-gray-400">
                        <span>Format: <span className="font-semibold text-gray-300">{debate.debateType}</span></span>
                        <span>Role: <span className="font-semibold text-gray-300">{debate.userRole}</span></span>
                    </div>
                    <button 
                        onClick={() => handleDownload(debate.transcript, debate.motion)}
                        className="mt-4 w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2 text-sm font-semibold text-cyan-400 bg-cyan-500/10 rounded-md hover:bg-cyan-500/20 transition-colors"
                    >
                        <DownloadIcon className="w-4 h-4" />
                        Download Transcript
                    </button>
                </div>
            ))}
        </div>
    );
};


export default ProfilePage;