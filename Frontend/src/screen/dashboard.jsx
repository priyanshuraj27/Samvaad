import React, { useEffect, useState } from 'react';
import { BarChart3, Swords, Target, Activity, BrainCircuit, BookOpen, ChevronRight, User, Award, TrendingUp, Lightbulb, Flame, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../utils/axiosInstance';

// --- DATA CONSTANTS ---
const LEVELS = [
    { level: 1, name: "Novice Debater", xpRequired: 0 },
    { level: 2, name: "Rising Speaker", xpRequired: 100 },
    { level: 3, name: "Argument Apprentice", xpRequired: 250 },
    { level: 4, name: "Reasoning Rookie", xpRequired: 400 },
    { level: 5, name: "Persuasion Prodigy", xpRequired: 600 },
    { level: 6, name: "Logic Learner", xpRequired: 850 },
    { level: 7, name: "Contention Crafter", xpRequired: 1150 },
    { level: 8, name: "Speech Specialist", xpRequired: 1500 },
    { level: 9, name: "Debate Enthusiast", xpRequired: 1900 },
    { level: 10, name: "Rebuttal Ranger", xpRequired: 2350 },
    { level: 11, name: "Oratory Officer", xpRequired: 2850 },
    { level: 12, name: "Argument Analyst", xpRequired: 3400 },
    { level: 13, name: "Logic Leader", xpRequired: 4000 },
    { level: 14, name: "Contention Commander", xpRequired: 4650 },
    { level: 15, name: "Speech Strategist", xpRequired: 5350 },
    { level: 16, name: "Debate Veteran", xpRequired: 6100 },
    { level: 17, name: "Oratory Expert", xpRequired: 6900 },
    { level: 18, name: "Debate Master", xpRequired: 7750 },
    { level: 19, name: "Grandmaster Debater", xpRequired: 8650 },
    { level: 20, name: "Legendary Orator", xpRequired: 9600 },
];

// --- REUSABLE COMPONENTS ---
const InfoCard = ({ children, className = '' }) => (
    <div className={`bg-gray-800/50 backdrop-blur-sm p-6 rounded-2xl border border-gray-700/50 shadow-lg ${className}`}>
        {children}
    </div>
);

const ShortcutLink = ({ icon, label }) => {
    const Icon = icon;
    return (
        <a href="#" className="flex items-center justify-between p-4 bg-gray-900/50 rounded-xl hover:bg-gray-700/70 border border-gray-700/50 transition-colors duration-200 group">
            <div className="flex items-center gap-4">
                <Icon className="w-6 h-6 text-purple-400" />
                <span className="font-semibold text-gray-300">{label}</span>
            </div>
            <ChevronRight className="w-5 h-5 text-gray-500 group-hover:text-purple-400 transition-colors" />
        </a>
    );
};

// --- NEW MODAL COMPONENT ---
const LevelsModal = ({ isOpen, onClose, levels, currentLevel }) => {
    if (!isOpen) return null;

    return (
        <div 
            className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50"
            onClick={onClose}
        >
            <div 
                className="bg-gray-800 border border-purple-700/50 rounded-2xl shadow-2xl w-full max-w-md m-4 max-h-[80vh] flex flex-col"
                onClick={e => e.stopPropagation()} // Prevent closing when clicking inside modal
            >
                <div className="flex justify-between items-center p-4 border-b border-gray-700">
                    <h2 className="text-xl font-bold text-white flex items-center gap-2">
                        <Award className="text-purple-400" />
                        Debate Ranks
                    </h2>
                    <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-700">
                        <X className="w-6 h-6 text-gray-400" />
                    </button>
                </div>
                <div className="p-4 space-y-2 overflow-y-auto">
                    {levels.map(level => (
                        <div
                            key={level.level}
                            className={`p-3 rounded-lg border-2 transition-all ${
                                level.level === currentLevel
                                    ? 'bg-purple-900/50 border-purple-500 scale-105'
                                    : 'bg-gray-900/50 border-transparent'
                            }`}
                        >
                            <div className="flex justify-between items-center">
                                <div className="flex items-center gap-4">
                                    <span className={`flex items-center justify-center w-10 h-10 rounded-full font-bold text-lg ${
                                        level.level === currentLevel ? 'bg-purple-600 text-white' : 'bg-gray-700 text-gray-300'
                                    }`}>
                                        {level.level}
                                    </span>
                                    <span className={`font-semibold ${level.level === currentLevel ? 'text-white' : 'text-gray-300'}`}>
                                        {level.name}
                                    </span>
                                </div>
                                <span className="text-sm text-gray-400 font-mono">
                                    {level.xpRequired.toLocaleString()} XP
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

const Dashboard = () => {
    const [userData, setUserData] = useState(null);
    const [gamification, setGamification] = useState(null);
    const [leaderboard, setLeaderboard] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [debates, setDebates] = useState([]);
    const [isLevelsModalOpen, setIsLevelsModalOpen] = useState(false); // <<< NEW state for modal
    const navigate = useNavigate();

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [userRes, gamRes, leaderboardRes, debatesRes] = await Promise.all([
                    axiosInstance.get('/users/current-user'),
                    axiosInstance.get('/gamification'),
                    axiosInstance.get('/gamification/leaderboard'),
                    axiosInstance.get('/debates'),
                ]);
                setUserData(userRes.data.data);
                setGamification(gamRes.data.data);
                setLeaderboard(leaderboardRes.data.data || []);
                setDebates(debatesRes.data.data || []);
            } catch (err) {
                setError('Failed to load dashboard data.');
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    if (loading) {
        return <div className="min-h-screen bg-gray-900 flex items-center justify-center text-white">Loading Dashboard...</div>;
    }
    if (error) {
        return <div className="min-h-screen bg-gray-900 flex items-center justify-center text-red-400">{error}</div>;
    }

    // Gamification data
    const currentLevel = gamification?.level || 1;
    const xp = gamification?.xp || 0;
    const currentLevelData = LEVELS.find(l => l.level === currentLevel) || LEVELS[0];
    const nextLevelData = LEVELS.find(l => l.level === currentLevel + 1);
    const xpMin = currentLevelData.xpRequired;
    const xpForNext = nextLevelData ? nextLevelData.xpRequired : xpMin + 1000;
    const xpProgress = ((xp - xpMin) / (xpForNext - xpMin)) * 100;

    // Mock data (as in original code)
    const weeklyGoal = userData?.weeklyGoal || { current: 0, target: 5 };
    const weeklyProgress = (weeklyGoal.target > 0) ? (weeklyGoal.current / weeklyGoal.target) * 100 : 0;
    const dailyStreak = userData?.dailyStreak || 1;
    const recentDebates = debates.slice(0, 2);

    const handleBrowseMotions = (e) => {
        e.preventDefault();
        navigate('/browse-motions');
    };

    const handleStartDebate = (e) => {
        e.preventDefault();
        navigate('/debate');
    };

    const getInitial = () => {
        if (userData?.fullName && userData.fullName.length > 0) return userData.fullName[0].toUpperCase();
        if (userData?.username && userData.username.length > 0) return userData.username[0].toUpperCase();
        return 'U';
    };

    const handleProfileClick = () => {
        navigate('/profile');
    };

    return (
        <div className="bg-gray-900 text-white min-h-screen font-sans">
            <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
                {/* Header Section */}
                <header className="flex justify-between items-center mb-10">
                    <div>
                        <h1 className="text-3xl md:text-4xl font-bold text-gray-100">Dashboard</h1>
                        <p className="text-gray-400 mt-1">Welcome back, {userData?.fullName || userData?.name || 'User'}. Let's get started.</p>
                    </div>
                    <div className="flex items-center gap-6">
                        {/* XP/Level System (NOW CLICKABLE) */}
                        <div
                            className="hidden sm:flex items-center gap-4 cursor-pointer"
                            onClick={() => setIsLevelsModalOpen(true)}
                            title="View All Levels"
                        >
                            <div className="relative">
                                <span className="bg-purple-600 w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg border-2 border-purple-400/50">
                                    {currentLevel}
                                </span>
                                <span className="absolute -bottom-1 -right-2 bg-gray-800 px-1.5 py-0.5 rounded text-xs font-semibold border border-gray-600">
                                    LVL
                                </span>
                            </div>
                            <div>
                                <div className="w-32 bg-gray-700 rounded-full h-2.5">
                                    <div className="bg-gradient-to-r from-purple-500 to-indigo-500 h-2.5 rounded-full" style={{ width: `${xpProgress}%` }}></div>
                                </div>
                                <p className="text-xs text-gray-400 text-center mt-1">{xp} XP</p>
                            </div>
                        </div>
                        {/* Daily Streak */}
                        <div className="flex items-center gap-2 text-orange-400">
                            <Flame className="w-6 h-6"/>
                            <span className="font-bold text-lg">{dailyStreak} Day Streak</span>
                        </div>
                        {/* Avatar */}
                        <div
                            className="w-14 h-14 rounded-full border-2 border-purple-500 bg-purple-700 flex items-center justify-center cursor-pointer select-none text-2xl font-bold text-white"
                            onClick={handleProfileClick}
                            title="Go to Profile"
                        >
                            {getInitial()}
                        </div>
                    </div>
                </header>

                {/* --- REST OF THE DASHBOARD (UNCHANGED) --- */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
                    {/* Left Column */}
                    <div className="lg:col-span-2 space-y-6">
                       <InfoCard className="bg-gradient-to-br from-gray-800/50 to-gray-900/30">
                           <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
                               <div>
                                   <h2 className="text-xl font-bold text-white">Ready for a new challenge?</h2>
                                   <p className="text-gray-400 mt-1">Jump into a new debate and put your skills to the test.</p>
                               </div>
                               <button
                                   className="w-full sm:w-auto text-lg font-semibold bg-gradient-to-r from-purple-600 to-indigo-600 text-white py-3 px-8 rounded-xl shadow-lg shadow-purple-500/20 hover:shadow-purple-500/40 transform hover:-translate-y-0.5 transition-all duration-300 flex items-center justify-center gap-3"
                                   onClick={handleStartDebate}
                               >
                                   <Swords className="w-6 h-6" />
                                   Start New Debate
                               </button>
                           </div>
                       </InfoCard>
                       <InfoCard>
                           <h3 className="font-bold text-lg text-gray-200 mb-4">Weekly Goal</h3>
                           <div className="flex items-center justify-between mb-2 text-sm text-gray-400">
                               <p>Debates Completed</p>
                               <p className="font-semibold text-white">{weeklyGoal.current} / {weeklyGoal.target}</p>
                           </div>
                           <div className="w-full bg-gray-700 rounded-full h-2.5">
                               <div className="bg-purple-600 h-2.5 rounded-full" style={{ width: `${weeklyProgress}%` }}></div>
                           </div>
                       </InfoCard>
                       <InfoCard>
                           <h3 className="font-bold text-lg text-gray-200 mb-4 flex items-center gap-2"><Award className="w-5 h-5 text-amber-400"/> Weekly Leaderboard</h3>
                           <div className="space-y-3">
                               {leaderboard.length > 0 ? leaderboard.map((player, idx) => (
                                   <div key={player.user?._id || idx} className={`flex items-center p-3 rounded-lg transition-all ${player.user?.fullName === userData?.fullName ? 'bg-purple-900/50 border border-purple-700' : ''}`}>
                                       <span className="text-lg font-bold text-gray-400 w-8">{idx + 1}</span>
                                       <div className="w-10 h-10 rounded-full bg-purple-700 flex items-center justify-center mx-3 text-lg font-bold text-white border-2 border-purple-400 select-none">
                                          {(player.user?.fullName && player.user.fullName[0].toUpperCase()) || (player.user?.username && player.user.username[0].toUpperCase()) || 'U'}
                                       </div>
                                       <span className="font-semibold text-gray-200 flex-grow">{player.user?.fullName || player.user?.username || 'User'}</span>
                                       <span className="font-bold text-lg text-purple-400">{player.xp}</span>
                                   </div>
                               )) : <p className="text-gray-400">No leaderboard data found.</p>}
                           </div>
                       </InfoCard>
                    </div>
                    {/* Right Column */}
                    <div className="space-y-6">
                       <InfoCard>
                           <h3 className="font-bold text-lg text-gray-200 mb-4 flex items-center gap-2"><BarChart3 className="w-5 h-5 text-purple-400"/> Performance Snapshot</h3>
                           <div className="space-y-4">
                               <div className="flex justify-between items-baseline">
                                   <span className="text-gray-400">Win/Loss Ratio</span>
                                   <span className="font-bold text-2xl text-white">{userData?.stats?.winLossRatio || '-'}</span>
                               </div>
                               <div className="flex justify-between items-baseline">
                                   <span className="text-gray-400">Average Score</span>
                                   <span className="font-bold text-2xl text-white">{userData?.stats?.avgScore ?? '-'}</span>
                               </div>
                               <div className="flex justify-between items-baseline">
                                   <span className="text-gray-400">Key Strength</span>
                                   <span className="font-bold text-xl text-purple-300 bg-purple-900/50 px-3 py-1 rounded-lg">{userData?.stats?.keyStrength || '-'}</span>
                               </div>
                           </div>
                       </InfoCard>
                       <InfoCard>
                            <h3 className="font-bold text-lg text-gray-200 mb-4">Recent Activity</h3>
                            <div className="space-y-4">
                                {recentDebates.length > 0 ? recentDebates.map((debate, index) => (
                                    <div key={index} className="flex justify-between items-center group cursor-pointer p-3 -m-3 rounded-lg hover:bg-gray-700/50">
                                        <div>
                                            <p className="font-semibold text-gray-300">{debate.motion}</p>
                                            <p className="text-sm text-gray-400">
                                                Type: <span className="font-bold text-cyan-400">{debate.debateType}</span>
                                                {debate.score !== undefined && <> | Score: <span className="font-bold text-purple-400">{debate.score}</span></>}
                                            </p>
                                        </div>
                                        <ChevronRight className="w-5 h-5 text-gray-500 group-hover:text-purple-400 transition-colors" />
                                    </div>
                                )) : <p className="text-gray-400">No recent debates found.</p>}
                            </div>
                       </InfoCard>
                       <div className="space-y-3">
                           <ShortcutLink icon={Target} label="Practice Rebuttals" />
                           <ShortcutLink icon={BrainCircuit} label="View Full Analytics" />
                           <div onClick={handleBrowseMotions}>
                               <ShortcutLink icon={BookOpen} label="Browse Motions" />
                           </div>
                       </div>
                    </div>
                </div>
            </div>

            {/* --- RENDER THE MODAL --- */}
            <LevelsModal
                isOpen={isLevelsModalOpen}
                onClose={() => setIsLevelsModalOpen(false)}
                levels={LEVELS}
                currentLevel={currentLevel}
            />
        </div>
    );
};

export default Dashboard;