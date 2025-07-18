import React, { useState, useEffect } from 'react';
import {
    BookOpen,
    Users,
    Award,
    Settings,
    ChevronDown,
    PlusCircle,
    Type,
    List,
    Zap,
    Smile,
    Target,
    Info,
    XCircle,
    CheckCircle,
    ChevronRight,
    BrainCircuit
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../utils/axiosInstance'; // Add this import at the top

// --- DATA & CONFIGURATION ---
const debateFormats = {
    BP: {
        name: 'British Parliamentary (BP)',
        teams: '4 teams of 2 speakers each',
        structure: 'Opening Government, Opening Opposition, Closing Government, Closing Opposition',
        prepTime: '15 minute prep time',
        speakerOrder: [
            { role: 'Prime Minister', team: 'Opening Government' },
            { role: 'Leader of Opposition', team: 'Opening Opposition' },
            { role: 'Deputy Prime Minister', team: 'Opening Government' },
            { role: 'Deputy Leader of Oppostion', team: 'Opening Opposition' },
            { role: 'Member of Government', team: 'Closing Government' },
            { role: 'Member of Opposition', team: 'Closing Opposition' },
            { role: 'Government Whip', team: 'Closing Government' },
            { role: 'Opposition Whip', team: 'Closing Opposition' },
        ],
        speechTime: '7-minute speeches',
        rules: [
            'Opening benches provide a case and build on it.',
            'Closing benches try to undo opposing cases and make their own cases and prove their uniqueness.',
            'No new content allowed in whip speeches.',
            'All 4 teams ranked 1st -> 4th, giving 24 possible outcomes.',
            'Each position has specific roles and responsibilities.',
        ],
        roles: ['Prime Minister (PM)', 'Deputy Prime Minister (DPM)', 'Leader of Opposition (LO)', 'Deputy Leader of Opposition (DLO)', 'Member of Government (MG)', 'Government Whip (GW)', 'Member of Opposition (MO)', 'Opposition Whip (OW)'],
        totalSpeakers: 8,
        debatePath: '/bp-debate',
    },
    AP: {
        name: 'Asian Parliamentary (AP)',
        teams: 'Government vs Opposition',
        structure: '3 speakers per team',
        prepTime: '25 minute prep time',
        speakerOrder: [
            { role: 'Prime Minister', team: 'Government' },
            { role: 'Leader Of Opposition', team: 'Opposition' },
            { role: 'Deputy Prime Minister', team: 'Government' },
            { role: 'Deputy Leader of Opposition', team: 'Opposition' },
            { role: 'Government Whip', team: 'Government' },
            { role: 'Opposition Whip', team: 'Opposition' },
        ],
        speechTime: '7-minute speeches, with Points of Information allowed',
        rules: [
            'The first speakers on each side set the arguments and their bases.',
            'The second speakers extend on these arguments and rebuts opposing views.',
            'The third speaker defends their case and opposes the other case.',
            'No new content allowed in the whip speeches.',
            'Emphasis on substantive argumentation and case building.',
        ],
        speakerRolesDetailed: [
            { role: 'PM', description: 'characterises and establishes ideas, stakeholders and narratives that the government expects to be followed throughout the debate.' },
            { role: 'LO', description: 'lays out the necessary characterisation for side opp. Also challenges uncharitable characterisation on the government\'s part, if any.' },
            { role: 'DPM/DLO', description: 'argumentation, raises points that are in their favour.' },
            { role: 'Whips (both)', description: 'rebut the other side. If rebuttal is not possible then show why the clash is won by neither side. If that too is out of scope then show why the point the other side wins on is less significant than what your side wins on. Basically weighs and identifies the clashes based on factors such as scale, vulnerability of stakeholders, frequency of harm etc.' },
        ],
        roles: ['Prime Minister (PM)', 'Leader Of Opposition (LO)', 'Deputy Prime Minister (DPM)', 'Deputy Leader of Opposition (DLO)', 'Government Whip (GW)', 'Opposition Whip (OW)'],
        totalSpeakers: 6,
        debatePath: '/ap-debate',
    },
    WS: {
        name: 'World Schools (WS)',
        teams: '2 teams of 3 speakers each',
        structure: '3 speakers per team plus reply speeches',
        prepTime: 'Preparation time for some motions, impromptu for others',
        speakerOrder: [
            { role: 'First Proposition', team: 'Proposition' },
            { role: 'First Opposition', team: 'Opposition' },
            { role: 'Second Proposition', team: 'Proposition' },
            { role: 'Second Opposition', team: 'Opposition' },
            { role: 'Third Proposition', team: 'Proposition' },
            { role: 'Third Opposition', team: 'Opposition' },
            { role: 'Opposition Reply', team: 'Opposition' },
            { role: 'Proposition Reply', team: 'Proposition' },
        ],
        speechTime: '8-minute substantive speeches, 4-minute reply speeches',
        rules: [
            'Popular in school competitions.',
            'Each speaker has specific roles in building and rebutting cases.',
            'Reply speeches summarize the debate and weigh arguments, no new arguments allowed.',
        ],
        roles: ['First Proposition', 'First Opposition', 'Second Proposition', 'Second Opposition', 'Third Proposition', 'Third Opposition', 'Opposition Reply', 'Proposition Reply'],
        totalSpeakers: 8,
        debatePath: '/ws-debate',
    }
};

const skillLevels = ['Beginner', 'Intermediate', 'Advanced'];
const personalityOptions = ['Neutral', 'Aggressive', 'Calm', 'Analytical', 'Persuasive', 'Humorous'];
const benchmarkOptions = ['Focus on Rebuttals', 'Focus on Case Building', 'Focus on POIs', 'Focus on Summaries', 'Focus on POOs'];

// --- REUSABLE UI COMPONENTS ---
const SectionWrapper = ({ step, title, icon, children }) => {
    const Icon = icon;
    return (
        <div className="bg-gray-800/30 backdrop-blur-xl p-6 md:p-8 rounded-2xl border border-gray-700/50 shadow-2xl mb-8">
            <div className="flex items-center mb-6">
                <div className="bg-blue-600/20 text-blue-300 w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg border border-blue-500/50 mr-4">
                    {step}
                </div>
                <h2 className="text-2xl font-bold text-white flex items-center">
                    <Icon className="w-7 h-7 mr-3 text-blue-400" />
                    {title}
                </h2>
            </div>
            {children}
        </div>
    );
};

// --- MAIN DEBATE SCREEN COMPONENT ---
const DebateScreen = () => {
    const [selectedFormat, setSelectedFormat] = useState('BP');
    const [customMotion, setCustomMotion] = useState('');
    const [selectedMotion, setSelectedMotion] = useState('');
    const [userRole, setUserRole] = useState('');
    const [aiSkillLevels, setAiSkillLevels] = useState({});
    const [aiPersonalities, setAiPersonalities] = useState({});
    const [aiBenchmarks, setAiBenchmarks] = useState({});
    const [showMotionInput, setShowMotionInput] = useState(false);
    const [aiSettingsMode, setAiSettingsMode] = useState('default');
    const [showConfirmation, setShowConfirmation] = useState(false);

    const navigate = useNavigate();
    const currentFormatDetails = debateFormats[selectedFormat];
    const currentFormatRoles = currentFormatDetails?.roles || [];

    const aiRoles = currentFormatDetails.speakerOrder
        .filter(speaker => speaker.role !== userRole.split(' (')[0] && speaker.role !== userRole)
        .map(speaker => speaker.role);

    useEffect(() => {
        const initialSettings = {};
        aiRoles.forEach(role => {
            initialSettings[role] = {
                skill: skillLevels[0],
                personality: personalityOptions[0],
                benchmarks: [],
            };
        });
        setAiSkillLevels(Object.fromEntries(aiRoles.map(r => [r, initialSettings[r].skill])));
        if (aiSettingsMode === 'default') {
            setAiPersonalities(Object.fromEntries(aiRoles.map(r => [r, initialSettings[r].personality])));
            setAiBenchmarks(Object.fromEntries(aiRoles.map(r => [r, initialSettings[r].benchmarks])));
        }
    }, [selectedFormat, userRole, aiSettingsMode, aiRoles.length]);

    useEffect(() => {
        if (currentFormatRoles.length > 0) {
            if (!currentFormatRoles.includes(userRole) || !userRole) {
                setUserRole(currentFormatRoles[0]);
            }
        } else {
            setUserRole('');
        }
    }, [selectedFormat]);

    const handleAiSettingChange = (role, key, value) => {
        const setters = {
            skill: setAiSkillLevels,
            personality: setAiPersonalities,
            benchmarks: setAiBenchmarks,
        };
        const setter = setters[key];

        if (key === 'benchmarks') {
            setter(prev => {
                const current = prev[role] || [];
                return { ...prev, [role]: current.includes(value) ? current.filter(b => b !== value) : [...current, value] };
            });
        } else {
            setter(prev => ({ ...prev, [role]: value }));
        }
    };

    const handleStartDebate = () => setShowConfirmation(true);
    // Replace handleConfirmDebate with API call to create debate
    const handleConfirmDebate = async () => {
        const debatePath = debateFormats[selectedFormat].debatePath;
        try {
            // Extract full role name (before any " (")
            const userRoleFull = userRole.split(' (')[0];
            const payload = {
                // REQUIRED FIELDS
                title: selectedMotion || customMotion,
                debateType: selectedFormat,
                motion: selectedMotion || customMotion,
                userRole: userRoleFull, // Use only the full role name
                status: 'prep',
                // OPTIONAL/EXTRA FIELDS
                aiSkillLevels,
                aiPersonalities: aiSettingsMode === 'default' ? {} : aiPersonalities,
                aiBenchmarks: aiSettingsMode === 'default' ? {} : aiBenchmarks,
                formatDetails: currentFormatDetails,
            };
            // Call backend to create debate session
            const res = await axiosInstance.post('/debates', payload);
            const sessionId = res.data.data?._id;
            if (debatePath && sessionId) {
                navigate(`${debatePath}/${sessionId}`);
            }
        } catch (err) {
            alert('Failed to create debate session. Please try again.');
        }
        setShowConfirmation(false);
    };
    const handleCancelConfirmation = () => setShowConfirmation(false);

    return (
        <div className="min-h-screen bg-gray-900 text-gray-100 font-sans p-4 sm:p-6">
            <div className="bg-gradient-to-br from-gray-900 to-black rounded-2xl shadow-2xl p-6 sm:p-8 md:p-10 w-full max-w-6xl mx-auto border border-gray-700/50">
                <div className="text-center mb-10">
                    <h1 className="text-4xl md:text-5xl font-bold text-white tracking-tight">Debate Setup</h1>
                    <p className="text-gray-400 mt-2">Configure your debate and prepare for victory.</p>
                </div>

                {/* Step 1: Motion */}
                <SectionWrapper step="1" title="Select Your Motion" icon={BookOpen}>
                    <div className="flex flex-col md:flex-row items-center gap-4 mb-4">
                        <button className="w-full md:w-auto flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg shadow-md transition duration-300 flex items-center justify-center gap-2">
                            <List className="w-5 h-5" /> Browse Library
                        </button>
                        <span className="text-gray-500 font-medium">OR</span>
                        <button onClick={() => setShowMotionInput(!showMotionInput)} className="w-full md:w-auto flex-1 bg-gray-700 hover:bg-gray-600 text-white font-bold py-3 px-6 rounded-lg shadow-md transition duration-300 flex items-center justify-center gap-2">
                            <Type className="w-5 h-5" /> {showMotionInput ? 'Hide Custom Input' : 'Input Custom Motion'}
                        </button>
                    </div>
                    {showMotionInput && (
                        <textarea value={customMotion} onChange={(e) => { setCustomMotion(e.target.value); setSelectedMotion(''); }} placeholder="Enter your custom debate motion here..." rows="3" className="w-full p-3 mt-4 border border-gray-600 rounded-lg focus:ring-blue-500 focus:border-blue-500 transition bg-gray-900 text-gray-200 placeholder-gray-500 resize-y"></textarea>
                    )}
                </SectionWrapper>

                {/* Step 2: Format & Role */}
                <SectionWrapper step="2" title="Choose Format & Role" icon={Users}>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                        {Object.keys(debateFormats).map(key => (
                            <button key={key} onClick={() => setSelectedFormat(key)} className={`p-4 rounded-lg text-left transition-all duration-300 border-2 ${selectedFormat === key ? 'bg-blue-600/20 border-blue-500 shadow-lg' : 'bg-gray-800/50 border-gray-700 hover:border-gray-600'}`}>
                                <h3 className="font-bold text-lg text-white">{debateFormats[key].name}</h3>
                                <p className="text-sm text-gray-400">{debateFormats[key].teams}</p>
                            </button>
                        ))}
                    </div>
                    <div className="relative">
                        <label className="block text-sm font-medium text-gray-400 mb-2">Your Role</label>
                        <select value={userRole} onChange={(e) => setUserRole(e.target.value)} className="block w-full p-3 border border-gray-600 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 appearance-none bg-gray-900 text-gray-200 pr-10">
                            {currentFormatRoles.map(role => <option key={role} value={role}>{role}</option>)}
                        </select>
                        <ChevronDown className="w-5 h-5 pointer-events-none absolute inset-y-0 right-0 top-8 flex items-center px-3 text-gray-400" />
                    </div>
                </SectionWrapper>

                {/* Step 3: AI Settings */}
                <SectionWrapper step="3" title="Configure AI Opponents" icon={BrainCircuit}>
                    <div className="flex justify-center gap-2 mb-6 p-1 bg-gray-900/70 rounded-lg border border-gray-700 w-fit mx-auto">
                        <button onClick={() => setAiSettingsMode('default')} className={`px-4 py-2 rounded-md font-semibold text-sm transition ${aiSettingsMode === 'default' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:bg-gray-700/50'}`}>Default</button>
                        <button onClick={() => setAiSettingsMode('custom')} className={`px-4 py-2 rounded-md font-semibold text-sm transition ${aiSettingsMode === 'custom' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:bg-gray-700/50'}`}>Custom</button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {aiRoles.map(role => (
                            <div key={role} className="bg-gray-900/50 p-4 rounded-lg border border-gray-700">
                                <p className="font-bold text-white mb-3">{role}</p>
                                <div className="flex rounded-md border border-gray-600 overflow-hidden mb-3">
                                    {skillLevels.map(level => (
                                        <button key={level} onClick={() => handleAiSettingChange(role, 'skill', level)} className={`flex-1 py-1.5 text-center text-xs font-medium transition ${aiSkillLevels[role] === level ? 'bg-blue-600 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}`}>
                                            {level}
                                        </button>
                                    ))}
                                </div>
                                {aiSettingsMode === 'custom' && (
                                    <div className="relative">
                                        <select value={aiPersonalities[role] || ''} onChange={(e) => handleAiSettingChange(role, 'personality', e.target.value)} className="block w-full text-xs p-2 border border-gray-600 rounded-md focus:ring-blue-500 focus:border-blue-500 appearance-none bg-gray-800 text-gray-300 pr-8">
                                            {personalityOptions.map(p => <option key={p} value={p}>{p}</option>)}
                                        </select>
                                        <ChevronDown className="w-4 h-4 pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-500" />
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </SectionWrapper>

                {/* Step 4: Launch */}
                <div className="text-center mt-10">
                    <button onClick={handleStartDebate} className="px-12 py-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-extrabold text-xl rounded-lg shadow-lg transition transform hover:scale-105 flex items-center justify-center mx-auto gap-3">
                        <Zap className="w-7 h-7" /> Commence Debate
                    </button>
                </div>
            </div>

            {/* Confirmation Modal */}
            {showConfirmation && (
                <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                    <div className="bg-gray-800/80 backdrop-blur-xl rounded-2xl shadow-2xl p-8 w-full max-w-2xl border border-gray-700/50 animate-fade-in-up">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-3xl font-bold text-white">Confirm Setup</h2>
                            <button onClick={handleCancelConfirmation} className="text-gray-500 hover:text-white transition"><XCircle className="w-8 h-8" /></button>
                        </div>
                        <div className="space-y-3 text-gray-300 max-h-[60vh] overflow-y-auto pr-3">
                            <p><span className="font-semibold text-blue-300">Motion:</span> {selectedMotion || customMotion || 'N/A'}</p>
                            <p><span className="font-semibold text-blue-300">Format:</span> {currentFormatDetails.name}</p>
                            <p><span className="font-semibold text-blue-300">Your Role:</span> {userRole || 'N/A'}</p>
                            <div>
                                <h3 className="font-semibold text-blue-300 text-lg mb-1">AI Opponents:</h3>
                                <ul className="list-disc list-inside space-y-1 pl-2">
                                    {aiRoles.map(role => (
                                        <li key={role} className="text-sm">
                                            <span className="font-medium">{role}:</span> Skill - {aiSkillLevels[role]}
                                            {aiSettingsMode === 'custom' && `, Personality - ${aiPersonalities[role] || 'Neutral'}`}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                        <div className="flex justify-end gap-4 mt-8">
                            <button onClick={handleCancelConfirmation} className="px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white font-bold rounded-lg transition flex items-center gap-2"><XCircle className="w-5 h-5" /> Cancel</button>
                            <button onClick={handleConfirmDebate} className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-bold rounded-lg transition flex items-center gap-2"><CheckCircle className="w-5 h-5" /> Confirm & Start</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default DebateScreen;
