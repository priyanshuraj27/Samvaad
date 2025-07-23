import React, { useEffect, useState } from 'react';
import { BarChart3, Swords, Target, BrainCircuit, BookOpen, ChevronRight, Award, Flame, X, Gavel, Users, TrendingUp, User } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../utils/axiosInstance';

const LEVELS = [
    { level: 1, name: "Novice Debater", xpRequired: 0 }, { level: 2, name: "Rising Speaker", xpRequired: 100 },
    { level: 3, name: "Argument Apprentice", xpRequired: 250 }, { level: 4, name: "Reasoning Rookie", xpRequired: 400 },
    { level: 5, name: "Persuasion Prodigy", xpRequired: 600 }, { level: 6, name: "Logic Learner", xpRequired: 850 },
    { level: 7, name: "Contention Crafter", xpRequired: 1150 }, { level: 8, name: "Speech Specialist", xpRequired: 1500 },
    { level: 9, name: "Debate Enthusiast", xpRequired: 1900 }, { level: 10, name: "Rebuttal Ranger", xpRequired: 2350 },
    { level: 11, name: "Oratory Officer", xpRequired: 2850 }, { level: 12, name: "Argument Analyst", xpRequired: 3400 },
    { level: 13, name: "Logic Leader", xpRequired: 4000 }, { level: 14, name: "Contention Commander", xpRequired: 4650 },
    { level: 15, name: "Speech Strategist", xpRequired: 5350 }, { level: 16, name: "Debate Veteran", xpRequired: 6100 },
    { level: 17, name: "Oratory Expert", xpRequired: 6900 }, { level: 18, name: "Debate Master", xpRequired: 7750 },
    { level: 19, name: "Grandmaster Debater", xpRequired: 8650 }, { level: 20, name: "Legendary Orator", xpRequired: 9600 },
];

const InfoCard = ({ children, className = '', ...props }) => (
    <div 
        className={`bg-slate-800/70 backdrop-blur-xl p-6 rounded-2xl border border-slate-700/50 shadow-lg transition-all duration-300 hover:border-slate-600 ${className}`}
        {...props}
    >
        {children}
    </div>
);

const ShortcutCard = ({ icon, label, onClick }) => {
    const Icon = icon;
    return (
        <div 
            onClick={onClick}
            className="bg-slate-800/70 backdrop-blur-xl p-5 rounded-2xl border border-slate-700/50 shadow-lg flex flex-col items-center justify-center gap-3 text-center cursor-pointer group hover:bg-slate-700/50 transition-all duration-300 transform hover:-translate-y-1"
        >
            <div className="bg-slate-900/50 p-3 rounded-full border border-slate-700">
                <Icon className="w-6 h-6 text-teal-400 group-hover:text-teal-300 transition-colors" />
            </div>
            <span className="font-semibold text-sm text-slate-300 group-hover:text-white transition-colors">{label}</span>
        </div>
    );
};

const LevelsModal = ({ isOpen, onClose, levels, currentLevel }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50" onClick={onClose}>
            <div 
                className="bg-slate-800 border border-teal-500/30 rounded-2xl shadow-2xl w-full max-w-md m-4 max-h-[80vh] flex flex-col"
                onClick={e => e.stopPropagation()}
            >
                <div className="flex justify-between items-center p-4 border-b border-slate-700">
                    <h2 className="text-xl font-bold text-white flex items-center gap-3">
                        <Award className="text-teal-400" />Debate Ranks
                    </h2>
                    <button onClick={onClose} className="p-1 rounded-full hover:bg-slate-700 transition-colors">
                        <X className="w-6 h-6 text-slate-400" />
                    </button>
                </div>
                <div className="p-4 space-y-2 overflow-y-auto">
                    {levels.map(level => (
                        <div
                            key={level.level}
                            className={`p-3 rounded-lg border-2 transition-all ${
                                level.level === currentLevel
                                    ? 'bg-teal-900/50 border-teal-500 scale-105'
                                    : 'bg-slate-900/50 border-transparent'
                            }`}
                        >
                            <div className="flex justify-between items-center">
                                <div className="flex items-center gap-4">
                                    <span className={`flex items-center justify-center w-10 h-10 rounded-full font-bold text-lg ${
                                        level.level === currentLevel ? 'bg-teal-600 text-white' : 'bg-slate-700 text-slate-300'
                                    }`}>{level.level}</span>
                                    <span className={`font-semibold ${level.level === currentLevel ? 'text-white' : 'text-slate-300'}`}>{level.name}</span>
                                </div>
                                <span className="text-sm text-slate-400 font-mono">{level.xpRequired.toLocaleString()} XP</span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

const Dashboard = () => {
    // --- STATE AND DATA FETCHING (Unchanged) ---
    const [userData, setUserData] = useState(null);
    const [gamification, setGamification] = useState(null);
    const [leaderboard, setLeaderboard] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [debates, setDebates] = useState([]);
    const [isLevelsModalOpen, setIsLevelsModalOpen] = useState(false);
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

    if (loading) return <div className="min-h-screen bg-slate-900 flex items-center justify-center text-white">Loading Dashboard...</div>;
    if (error) return <div className="min-h-screen bg-slate-900 flex items-center justify-center text-red-400">{error}</div>;

    const currentLevel = gamification?.level || 1;
    const xp = gamification?.xp || 0;
    const currentLevelData = LEVELS.find(l => l.level === currentLevel) || LEVELS[0];
    const nextLevelData = LEVELS.find(l => l.level === currentLevel + 1);
    const xpMin = currentLevelData.xpRequired;
    const xpForNext = nextLevelData ? nextLevelData.xpRequired : xpMin + 1000;
    const xpProgress = xpForNext > xpMin ? ((xp - xpMin) / (xpForNext - xpMin)) * 100 : 100;
    const recentDebates = debates.slice(0, 3);

    const handleNavigation = (path) => (e) => {
        if (e) e.preventDefault();
        navigate(path);
    };

    return (
        <div className="bg-slate-900 text-slate-200 min-h-screen font-sans">
            <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
                
                {/* --- HEADER --- */}
                <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-10 gap-4">
                    <div>
                        <h1 className="text-3xl md:text-4xl font-bold text-white">Dashboard</h1>
                        <p className="text-slate-400 mt-1">Welcome back, {userData?.fullName || userData?.name || 'User'}.</p>
                    </div>
                    <InfoCard 
                        className="w-full sm:w-auto flex items-center gap-4 cursor-pointer"
                        onClick={() => navigate('/profile')}
                        title="View Profile"
                    >
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-teal-500 to-cyan-600 flex items-center justify-center text-2xl font-bold text-white">
                           {(userData?.fullName && userData.fullName[0].toUpperCase()) || 'U'}
                        </div>
                        <div>
                            <p className="font-bold text-white">{currentLevelData.name}</p>
                            <p className="text-sm text-slate-400">Level {currentLevel}</p>
                        </div>
                        <ChevronRight className="w-5 h-5 text-slate-500 ml-auto" />
                    </InfoCard>
                </header>

                {/* --- MAIN GRID --- */}
                <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 lg:gap-8">
                    
                    {/* --- LEFT (MAIN) COLUMN --- */}
                    <div className="lg:col-span-3 space-y-6">
                        <InfoCard className="bg-gradient-to-br from-teal-900/50 via-slate-800/50 to-slate-800/50 !p-8">
                            <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
                                <div>
                                    <h2 className="text-2xl font-bold text-white">Ready for a new challenge?</h2>
                                    <p className="text-slate-400 mt-1">Jump into a new debate and put your skills to the test.</p>
                                </div>
                                <button
                                    className="w-full sm:w-auto text-lg font-semibold bg-gradient-to-r from-teal-500 to-cyan-500 text-white py-3 px-8 rounded-xl shadow-lg shadow-teal-500/20 hover:shadow-teal-500/40 transform hover:-translate-y-0.5 transition-all duration-300 flex items-center justify-center gap-3"
                                    onClick={handleNavigation('/debate')}
                                >
                                    <Swords className="w-6 h-6" />
                                    Start Debate
                                </button>
                            </div>
                        </InfoCard>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <InfoCard>
                                <h3 className="font-bold text-lg text-slate-200 mb-4 flex items-center gap-2"><Flame className="text-orange-400" /> Daily Streak</h3>
                                <p className="text-5xl font-bold text-white">{userData?.dailyStreak || 1} <span className="text-2xl font-medium text-slate-400">days</span></p>
                                <p className="text-sm text-slate-500 mt-2">Keep it going for more XP!</p>
                            </InfoCard>
                            <InfoCard>
                                <h3 className="font-bold text-lg text-slate-200 mb-4 flex items-center gap-2"><TrendingUp className="text-green-400" /> XP Progress</h3>
                                <div className="flex justify-between items-end mb-1">
                                    <span className="font-bold text-2xl text-white">{xp.toLocaleString()} <span className="text-lg font-medium text-slate-400">XP</span></span>
                                    <span className="text-sm text-slate-400">Next: {nextLevelData?.xpRequired.toLocaleString() || 'Max'}</span>
                                </div>
                                <div className="w-full bg-slate-700 rounded-full h-2.5">
                                    <div className="bg-gradient-to-r from-teal-500 to-green-500 h-2.5 rounded-full" style={{ width: `${xpProgress}%` }}></div>
                                </div>
                            </InfoCard>
                        </div>
                        
                        <InfoCard>
                            <h3 className="font-bold text-lg text-slate-200 mb-4 flex items-center gap-2"><Award className="text-amber-400"/> Weekly Leaderboard</h3>
                            <div className="space-y-3">
                                {leaderboard.length > 0 ? leaderboard.slice(0, 3).map((player, idx) => (
                                    <div key={player.user?._id || idx} className={`flex items-center p-3 rounded-lg transition-all ${player.user?.fullName === userData?.fullName ? 'bg-teal-900/40' : 'bg-slate-900/40'}`}>
                                        <span className="text-lg font-bold text-slate-400 w-8">{idx + 1}</span>
                                        <span className="font-semibold text-slate-200 flex-grow">{player.user?.fullName || player.user?.username || 'User'}</span>
                                        <span className="font-bold text-lg text-teal-400">{player.xp.toLocaleString()} XP</span>
                                    </div>
                                )) : <p className="text-slate-400">No leaderboard data found.</p>}
                            </div>
                        </InfoCard>
                    </div>

                    {/* --- RIGHT (SIDEBAR) COLUMN --- */}
                    <div className="lg:col-span-2 space-y-6">
                        <InfoCard>
                            <h3 className="font-bold text-lg text-slate-200 mb-4">Quick Actions</h3>
                            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-2 gap-4">
                               <ShortcutCard icon={Gavel} label="Adjudicate" onClick={handleNavigation('/custom-adjudicator')} />
                               <ShortcutCard icon={Users} label="1v1 Debate" onClick={handleNavigation('/debate/1v1')} />
                               <ShortcutCard icon={Target} label="Practice Rebuttal" onClick={handleNavigation('/practice/rebuttals')} />
                               <ShortcutCard icon={BarChart3} label="Analytics" onClick={handleNavigation('/analytics')} />
                               <ShortcutCard icon={BookOpen} label="Motions" onClick={handleNavigation('/browse-motions')} />
                               <ShortcutCard icon={Award} label="Ranks" onClick={() => setIsLevelsModalOpen(true)} />
                            </div>
                        </InfoCard>

                        <InfoCard>
                            <h3 className="font-bold text-lg text-slate-200 mb-4">Recent Activity</h3>
                            <div className="space-y-2">
                                {recentDebates.length > 0 ? recentDebates.map((debate, index) => (
                                    <div key={debate._id || index} className="flex justify-between items-center group cursor-pointer p-3 -m-3 rounded-lg hover:bg-slate-700/50" onClick={handleNavigation(`/debate/${debate._id}`)}>
                                        <div>
                                            <p className="font-semibold text-slate-300 truncate pr-4">{debate.motion}</p>
                                            <p className="text-sm text-slate-400">
                                                {debate.debateType}
                                                {debate.score !== undefined && ` • ${debate.score} pts`}
                                            </p>
                                        </div>
                                        <ChevronRight className="w-5 h-5 text-slate-500 group-hover:text-teal-400 transition-colors flex-shrink-0" />
                                    </div>
                                )) : <p className="text-slate-400">No recent debates found.</p>}
                            </div>
                        </InfoCard>
                    </div>
                </div>
            </div>

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
