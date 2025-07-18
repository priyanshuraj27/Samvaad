import React from 'react';
import { BarChart3, Swords, Target, Activity, BrainCircuit, BookOpen, ChevronRight, User, Award, TrendingUp, Lightbulb, Flame } from 'lucide-react';
// const navigate = require('react-router-dom').useNavigate ? require('react-router-dom').useNavigate : () => {};
import { useNavigate } from 'react-router-dom';

// Mock user data - in a real app, this would come from state or props
const userData = {
    name: 'Alex',
    avatarUrl: 'https://placehold.co/100x100/7c3aed/ffffff?text=A',
    level: 12,
    xp: {
        current: 450,
        nextLevel: 1000,
    },
    stats: {
        winLossRatio: '12W / 5L',
        avgScore: 82.5,
        keyStrength: 'Rebuttal',
    },
    recentDebates: [
        {
            motion: 'This house believes that social media has done more harm than good.',
            outcome: 'Win',
            score: 88,
        },
        {
            motion: 'This house would abolish standardized testing in schools.',
            outcome: 'Loss',
            score: 79,
        }
    ],
    weeklyGoal: {
        current: 3,
        target: 5,
    },
    dailyStreak: 4,
    strategyTip: "When offering a POI, keep it under 15 seconds. Make it a sharp question or a direct contradiction, not a mini-speech."
};

const leaderboardData = [
    { rank: 1, name: 'Isabella', score: 91.2, avatarUrl: 'https://placehold.co/100x100/ec4899/ffffff?text=I' },
    { rank: 2, name: 'Alex', score: 88.7, avatarUrl: 'https://placehold.co/100x100/7c3aed/ffffff?text=A' },
    { rank: 3, name: 'Kenji', score: 85.4, avatarUrl: 'https://placehold.co/100x100/22d3ee/ffffff?text=K' },
];

// A reusable card component for the dark design
const InfoCard = ({ children, className = '' }) => (
    <div className={`bg-gray-800/50 backdrop-blur-sm p-6 rounded-2xl border border-gray-700/50 shadow-lg ${className}`}>
        {children}
    </div>
);

// A reusable shortcut link component for the dark design
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


const Dashboard = () => {
    const weeklyProgress = (userData.weeklyGoal.current / userData.weeklyGoal.target) * 100;
    const xpProgress = (userData.xp.current / userData.xp.nextLevel) * 100;

    const navigate = useNavigate();

    const handleBrowseMotions = (e) => {
        e.preventDefault();
        navigate('/browse-motions');
    };

    const handleStartDebate = (e) => {
        e.preventDefault();
        navigate('/debate');
    };

    return (
        <div className="bg-gray-900 text-white min-h-screen font-sans">
            <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
                
                {/* Header Section */}
                <header className="flex justify-between items-center mb-10">
                    <div>
                        <h1 className="text-3xl md:text-4xl font-bold text-gray-100">Dashboard</h1>
                        <p className="text-gray-400 mt-1">Welcome back, {userData.name}. Let's get started.</p>
                    </div>
                    <div className="flex items-center gap-6">
                        {/* XP/Level System */}
                        <div className="hidden sm:flex items-center gap-4">
                            <div className="relative">
                                <span className="bg-purple-600 w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg border-2 border-purple-400/50">
                                    {userData.level}
                                </span>
                                <span className="absolute -bottom-1 -right-2 bg-gray-800 px-1.5 py-0.5 rounded text-xs font-semibold border border-gray-600">
                                    LVL
                                </span>
                            </div>
                            <div>
                                <div className="w-32 bg-gray-700 rounded-full h-2.5">
                                    <div className="bg-gradient-to-r from-purple-500 to-indigo-500 h-2.5 rounded-full" style={{ width: `${xpProgress}%` }}></div>
                                </div>
                                <p className="text-xs text-gray-400 text-center mt-1">{userData.xp.current} / {userData.xp.nextLevel} XP</p>
                            </div>
                        </div>

                         <div className="flex items-center gap-2 text-orange-400">
                            <Flame className="w-6 h-6"/>
                            <span className="font-bold text-lg">{userData.dailyStreak} Day Streak</span>
                        </div>
                        <img src={userData.avatarUrl} alt="User Avatar" className="w-14 h-14 rounded-full border-2 border-purple-500" />
                    </div>
                </header>

                {/* Main Grid Layout */}
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
                                <p className="font-semibold text-white">{userData.weeklyGoal.current} / {userData.weeklyGoal.target}</p>
                            </div>
                            <div className="w-full bg-gray-700 rounded-full h-2.5">
                                <div className="bg-purple-600 h-2.5 rounded-full" style={{ width: `${weeklyProgress}%` }}></div>
                            </div>
                        </InfoCard>
                        
                        <InfoCard>
                            <h3 className="font-bold text-lg text-gray-200 mb-4 flex items-center gap-2"><Award className="w-5 h-5 text-amber-400"/> Weekly Leaderboard</h3>
                            <div className="space-y-3">
                                {leaderboardData.map((player) => (
                                    <div key={player.rank} className={`flex items-center p-3 rounded-lg transition-all ${player.name === userData.name ? 'bg-purple-900/50 border border-purple-700' : ''}`}>
                                        <span className="text-lg font-bold text-gray-400 w-8">{player.rank}</span>
                                        <img src={player.avatarUrl} alt={player.name} className="w-10 h-10 rounded-full mx-3" />
                                        <span className="font-semibold text-gray-200 flex-grow">{player.name}</span>
                                        <span className="font-bold text-lg text-purple-400">{player.score.toFixed(1)}</span>
                                    </div>
                                ))}
                            </div>
                        </InfoCard>
                    </div>
                    {/* Add a hidden router navigation handler for Browse Motions shortcut */}
                    <div className="hidden">
                        {/* This is just to ensure useNavigate is used and not tree-shaken */}
                        {typeof useNavigate === 'function' && null}
                    </div>
                    {/* Right Column */}
                    <div className="space-y-6">
                        <InfoCard>
                            <h3 className="font-bold text-lg text-gray-200 mb-4 flex items-center gap-2"><BarChart3 className="w-5 h-5 text-purple-400"/> Performance Snapshot</h3>
                            <div className="space-y-4">
                                <div className="flex justify-between items-baseline">
                                    <span className="text-gray-400">Win/Loss Ratio</span>
                                    <span className="font-bold text-2xl text-white">{userData.stats.winLossRatio}</span>
                                </div>
                                <div className="flex justify-between items-baseline">
                                    <span className="text-gray-400">Average Score</span>
                                    <span className="font-bold text-2xl text-white">{userData.stats.avgScore}</span>
                                </div>
                                <div className="flex justify-between items-baseline">
                                    <span className="text-gray-400">Key Strength</span>
                                    <span className="font-bold text-xl text-purple-300 bg-purple-900/50 px-3 py-1 rounded-lg">{userData.stats.keyStrength}</span>
                                </div>
                            </div>
                        </InfoCard>

                        <InfoCard>
                             <h3 className="font-bold text-lg text-gray-200 mb-4">Recent Activity</h3>
                             <div className="space-y-4">
                                {userData.recentDebates.map((debate, index) => (
                                    <div key={index} className="flex justify-between items-center group cursor-pointer p-3 -m-3 rounded-lg hover:bg-gray-700/50">
                                        <div>
                                            <p className="font-semibold text-gray-300">{debate.motion}</p>
                                            <p className="text-sm text-gray-400">
                                                Outcome: <span className={`font-bold ${debate.outcome === 'Win' ? 'text-green-400' : 'text-red-400'}`}>{debate.outcome}</span> | Score: <span className="font-bold text-purple-400">{debate.score}</span>
                                            </p>
                                        </div>
                                        <ChevronRight className="w-5 h-5 text-gray-500 group-hover:text-purple-400 transition-colors" />
                                    </div>
                                ))}
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
        </div>
    );
};

export default Dashboard;
