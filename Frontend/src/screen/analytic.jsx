import React from 'react';
import { ArrowUpRight, Award, BookOpen, Shield, Swords, TrendingUp, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

// --- FAKE DATA FOR DEMONSTRATION ---
const fakeDebates = [
    {
        id: 1,
        motion: "This House would mandate that all foundational AI models be open-sourced.",
        role: "Leader of the Opposition",
        team: "Opening Opposition",
        result: "Win",
        score: 82,
        date: "2025-07-24",
    },
    {
        id: 2,
        motion: "This House believes that space exploration is a misallocation of resources.",
        role: "Prime Minister",
        team: "Opening Government",
        result: "Loss",
        score: 74,
        date: "2025-07-22",
    },
    {
        id: 3,
        motion: "This House supports a universal basic income.",
        role: "Government Whip",
        team: "Closing Government",
        result: "Win",
        score: 79,
        date: "2025-07-22",
    },
    {
        id: 4,
        motion: "This House regrets the rise of 'gig economy' platforms.",
        role: "Deputy Leader of the Opposition",
        team: "Closing Opposition",
        result: "Win",
        score: 85,
        date: "2025-07-21",
    },
    {
        id: 5,
        motion: "This House would abolish trial by jury.",
        role: "Member of Government",
        team: "Closing Government",
        result: "Loss",
        score: 71,
        date: "2025-07-21",
    },
];

// --- REUSABLE UI COMPONENTS ---
const StatCard = ({ title, value, icon, change, changeType }) => {
    const IconComponent = icon;
    const isPositive = changeType === 'positive';

    return (
        <div className="bg-gray-800/60 p-6 rounded-2xl border border-gray-700/80 shadow-lg flex flex-col justify-between">
            <div>
                <div className="flex items-center justify-between text-gray-400 mb-2">
                    <span className="text-sm font-medium">{title}</span>
                    <IconComponent className="w-6 h-6" />
                </div>
                <p className="text-3xl font-bold text-white">{value}</p>
            </div>
            {change && (
                <p className={`text-sm mt-4 flex items-center ${isPositive ? 'text-emerald-400' : 'text-red-400'}`}>
                    <ArrowUpRight className={`w-4 h-4 mr-1 ${!isPositive && 'rotate-90'}`} />
                    {change}
                </p>
            )}
        </div>
    );
};

// Simple CSS-based chart component
const SimpleChart = ({ data }) => {
    const maxScore = Math.max(...data.map(d => d.score));
    const minScore = Math.min(...data.map(d => d.score));
    const range = maxScore - minScore || 1;

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-end h-48 px-4">
                {data.map((debate, index) => {
                    const height = ((debate.score - minScore) / range) * 150 + 30;
                    return (
                        <div key={debate.id} className="flex flex-col items-center group">
                            <div className="relative">
                                <div 
                                    className="w-8 bg-gradient-to-t from-emerald-500 to-emerald-400 rounded-t transition-all duration-300 group-hover:from-emerald-400 group-hover:to-emerald-300"
                                    style={{ height: `${height}px` }}
                                />
                                <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                                    Score: {debate.score}
                                </div>
                            </div>
                            <div className="mt-2 text-xs text-gray-400 text-center">
                                Debate {debate.id}
                            </div>
                        </div>
                    );
                })}
            </div>
            <div className="flex justify-between text-xs text-gray-500 px-4">
                <span>Min: {minScore}</span>
                <span>Max: {maxScore}</span>
            </div>
        </div>
    );
};

const DebateAnalyticsPage = () => {
    const navigate = useNavigate();
    
    // --- DATA CALCULATIONS ---
    const totalDebates = fakeDebates.length;
    const wins = fakeDebates.filter(d => d.result === 'Win').length;
    const winRate = totalDebates > 0 ? Math.round((wins / totalDebates) * 100) : 0;
    const averageScore = totalDebates > 0 ? Math.round(fakeDebates.reduce((acc, d) => acc + d.score, 0) / totalDebates) : 0;
    
    // Prepare data for the chart, reversing for chronological order
    const chartData = [...fakeDebates].reverse();

    return (
        <div className="min-h-screen bg-gray-900 text-gray-100 font-sans p-4 sm:p-6 lg:p-8">
            <div className="max-w-7xl mx-auto">
                <header className="mb-8">
                    <div className="flex items-center gap-4 mb-4">
                        <button 
                            onClick={() => navigate('/dashboard')}
                            className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors duration-200 group"
                        >
                            <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform duration-200" />
                            <span className="text-sm font-medium">Back to Dashboard</span>
                        </button>
                    </div>
                    <h1 className="text-4xl font-bold text-white">Debate Analytics</h1>
                    <p className="text-gray-400 mt-1">Your performance overview for the last 5 debates.</p>
                </header>

                {/* --- STATS GRID --- */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    <StatCard title="Total Debates" value={totalDebates} icon={BookOpen} />
                    <StatCard title="Win Rate" value={`${winRate}%`} icon={Award} change={`${wins} Wins / ${totalDebates - wins} Losses`} changeType="positive" />
                    <StatCard title="Average Score" value={averageScore} icon={TrendingUp} change="+2 since last debate" changeType="positive" />
                    <StatCard title="Best Role" value="Opposition" icon={Shield} change="Based on avg. score" changeType="neutral" />
                </div>

                {/* --- MAIN CONTENT (CHART & TABLE) --- */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* --- PERFORMANCE CHART --- */}
                    <div className="lg:col-span-2 bg-gray-800/60 p-6 rounded-2xl border border-gray-700/80 shadow-lg">
                        <h2 className="text-xl font-semibold text-white mb-4">Performance Over Time</h2>
                        <SimpleChart data={chartData} />
                    </div>

                    {/* --- RECENT DEBATES LIST --- */}
                    <div className="lg:col-span-1 bg-gray-800/60 p-6 rounded-2xl border border-gray-700/80 shadow-lg flex flex-col">
                         <h2 className="text-xl font-semibold text-white mb-4">Recent Debates</h2>
                         <div className="flex-grow overflow-y-auto -mr-4 pr-4 space-y-4">
                            {fakeDebates.map(debate => (
                                <div key={debate.id} className="bg-gray-900/50 p-4 rounded-lg border border-gray-700 hover:border-emerald-500 transition-colors duration-300">
                                    <div className="flex justify-between items-start">
                                        <p className="font-semibold text-gray-200 text-sm w-3/4">{debate.motion}</p>
                                        <span className={`px-2 py-1 text-xs font-bold rounded-full ${debate.result === 'Win' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>
                                            {debate.result}
                                        </span>
                                    </div>
                                    <div className="mt-3 flex justify-between items-center text-sm text-gray-400">
                                        <span className={`font-medium flex items-center ${debate.team.includes('Government') ? 'text-blue-400' : 'text-red-400'}`}>
                                            {debate.team.includes('Government') ? <Shield className="w-4 h-4 mr-2"/> : <Swords className="w-4 h-4 mr-2"/>}
                                            {debate.role}
                                        </span>
                                        <span className="font-bold text-lg text-white">{debate.score}</span>
                                    </div>
                                </div>
                            ))}
                         </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
export default DebateAnalyticsPage;
