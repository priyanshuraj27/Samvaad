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
  Zap, // Icon for 'Start Debate'
  Smile, // Icon for Personality
  Target, // Icon for Benchmarks
  Info, // Icon for Format Details
  XCircle, // Icon for close button
  CheckCircle, // Icon for confirm button
} from 'lucide-react'; // Icons for visual appeal

// Import useNavigate from react-router-dom
import { useNavigate } from 'react-router-dom';

// Define debate formats and their associated roles and details
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
    roles: [ // These are the roles the user can pick for themselves
      'Prime Minister (PM)',
      'Deputy Prime Minister (DPM)',
      'Leader of Opposition (LO)',
      'Deputy Leader of Opposition (DLO)',
      'Member of Government (MG)',
      'Government Whip (GW)',
      'Member of Opposition (MO)',
      'Opposition Whip (OW)',
    ],
    totalSpeakers: 8,
    debatePath: '/bp-debate', // Path for BP debate screen
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
    roles: [ // These are the roles the user can pick for themselves
      'Prime Minister (PM)',
      'Leader Of Opposition (LO)',
      'Deputy Prime Minister (DPM)',
      'Deputy Leader of Opposition (DLO)',
      'Government Whip (GW)',
      'Opposition Whip (OW)',
    ],
    totalSpeakers: 6,
    debatePath: '/ap-debate', // Path for AP debate screen
  },
  WS: { // World Schools
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
    speechTime: '8-minute substantive speeches, 4-minute reply speeches', // Standard WS times
    rules: [
      'Popular in school competitions.',
      'Each speaker has specific roles in building and rebutting cases.',
      'Reply speeches summarize the debate and weigh arguments, no new arguments allowed.',
    ],
    roles: [ // These are the roles the user can pick for themselves
      'First Proposition',
      'First Opposition',
      'Second Proposition',
      'Second Opposition',
      'Third Proposition',
      'Third Opposition',
      'Opposition Reply',
      'Proposition Reply',
    ],
    totalSpeakers: 8,
    debatePath: '/ws-debate', // Path for WS debate screen
  }
};

// Skill levels for AI opponents
const skillLevels = ['Beginner', 'Intermediate', 'Advanced'];

// Personality options for AI opponents
const personalityOptions = ['Neutral', 'Aggressive', 'Calm', 'Analytical', 'Persuasive', 'Humorous'];

// Benchmark options for AI opponents
const benchmarkOptions = ['Focus on Rebuttals', 'Focus on Case Building', 'Focus on POIs', 'Focus on Summaries', 'Focus on POOs'];

// Main App component
const DebateScreen = () => {
  const [selectedFormat, setSelectedFormat] = useState('BP'); // Default to BP
  const [customMotion, setCustomMotion] = useState('');
  const [selectedMotion, setSelectedMotion] = useState(''); // For pre-generated or custom motion
  const [userRole, setUserRole] = useState('');
  // States to store settings, now keyed by AI role string instead of index
  const [aiSkillLevels, setAiSkillLevels] = useState({});
  const [aiPersonalities, setAiPersonalities] = useState({});
  const [aiBenchmarks, setAiBenchmarks] = useState({});
  const [showMotionInput, setShowMotionInput] = useState(false); // Toggle for custom motion input
  const [aiSettingsMode, setAiSettingsMode] = useState('default'); // 'default' or 'custom'
  const [showConfirmation, setShowConfirmation] = useState(false); // State for confirmation screen

  const navigate = useNavigate(); // Initialize useNavigate hook

  // Get roles based on selected format
  const currentFormatDetails = debateFormats[selectedFormat];
  const currentFormatRoles = currentFormatDetails?.roles || [];

  // Determine which roles will be filled by AI
  const aiRoles = currentFormatDetails.speakerOrder
    .filter(speaker => speaker.role !== userRole.split(' (')[0] && speaker.role !== userRole) // Remove user's selected role
    .map(speaker => speaker.role); // Get just the role name

  // Initialize AI settings when format, user role, or AI settings mode changes
  useEffect(() => {
    const initialAiSkills = {};
    const initialAiPersonalities = {};
    const initialAiBenchmarks = {};

    aiRoles.forEach(role => {
      initialAiSkills[role] = skillLevels[0]; // Default to Beginner for skill
      // Always initialize to neutral/empty, will be overwritten if custom mode is active
      initialAiPersonalities[role] = personalityOptions[0];
      initialAiBenchmarks[role] = [];
    });

    setAiSkillLevels(initialAiSkills);
    // Only reset personalities and benchmarks to default if mode is 'default'
    if (aiSettingsMode === 'default') {
      setAiPersonalities(initialAiPersonalities);
      setAiBenchmarks(initialAiBenchmarks);
    }
  }, [selectedFormat, userRole, aiRoles.length, aiSettingsMode]); // Depend on aiSettingsMode to re-initialize defaults

  // Effect to set a default user role when the format changes or component mounts
  useEffect(() => {
    if (currentFormatRoles.length > 0) {
      // If the current userRole is not valid for the new format, reset it
      if (!currentFormatRoles.includes(userRole)) {
        setUserRole(currentFormatRoles[0]); // Set to the first role in the new format
      } else if (!userRole) { // If no role is selected initially
        setUserRole(currentFormatRoles[0]);
      }
    } else {
      setUserRole(''); // Clear role if no roles available for format
    }
  }, [selectedFormat, currentFormatRoles, userRole]); // Add userRole to dependencies to prevent infinite loop on first render

  // Function to handle AI skill level changes for a specific AI role
  const handleAiSkillChange = (role, level) => {
    setAiSkillLevels(prev => ({ ...prev, [role]: level }));
  };

  // Function to handle AI personality changes for a specific AI role
  const handleAiPersonalityChange = (role, personality) => {
    setAiPersonalities(prev => ({ ...prev, [role]: personality }));
  };

  // Function to handle AI benchmark changes for a specific AI role (checkboxes)
  const handleAiBenchmarkChange = (role, benchmark) => {
    setAiBenchmarks(prev => {
      const currentBenchmarks = prev[role] || [];
      if (currentBenchmarks.includes(benchmark)) {
        // Remove benchmark if already present
        return { ...prev, [role]: currentBenchmarks.filter(b => b !== benchmark) };
      } else {
        // Add benchmark if not present
        return { ...prev, [role]: [...currentBenchmarks, benchmark] };
      }
    });
  };

  const handleStartDebate = () => {
    // Show the confirmation screen
    setShowConfirmation(true);
  };

  const handleConfirmDebate = () => {
    const debatePath = debateFormats[selectedFormat].debatePath;
    if (debatePath) {
      // Pass state via location state if needed for the next screen
      navigate(debatePath, {
        state: {
          format: selectedFormat,
          motion: selectedMotion || customMotion,
          userRole,
          aiSkillLevels,
          aiPersonalities: aiSettingsMode === 'default' ? {} : aiPersonalities,
          aiBenchmarks: aiSettingsMode === 'default' ? {} : aiBenchmarks,
          rules: currentFormatDetails.rules,
          speakerOrder: currentFormatDetails.speakerOrder,
          formatDetails: currentFormatDetails, // Passing full format details for convenience
        }
      });
    } else {
      console.error('Debate path not defined for selected format:', selectedFormat);
      alert('Error: Debate path not configured for this format.');
    }
    setShowConfirmation(false); // Hide confirmation after navigating
  };

  const handleCancelConfirmation = () => {
    setShowConfirmation(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-800 to-gray-950 text-gray-100 flex items-center justify-center p-4 font-inter">
      <div className="bg-gray-900 rounded-lg shadow-xl p-6 sm:p-8 md:p-12 w-full max-w-5xl border border-gray-700">
        <h1 className="text-4xl sm:text-5xl font-extrabold text-white mb-8 sm:mb-10 text-center tracking-wide">
          <span className="text-amber-300">Debate</span> <span className="text-gray-200">Setup</span>
        </h1>

        {/* Motion Selection */}
        <section className="mb-8 p-5 sm:p-7 bg-gray-800 rounded-lg border border-gray-700 shadow-md">
          <h2 className="text-2xl sm:text-3xl font-semibold text-gray-200 mb-4 sm:mb-5 flex items-center">
            <BookOpen className="w-6 h-6 sm:w-7 sm:h-7 mr-3 sm:mr-4 text-amber-400" />
            Motion Selection
          </h2>
          <div className="flex flex-col md:flex-row items-center gap-4 sm:gap-5 mb-4 sm:mb-5">
            <button
              onClick={() => { /* Logic to generate motions */ setSelectedMotion(''); setCustomMotion(''); setShowMotionInput(false); }}
              className="flex-grow md:flex-grow-0 px-6 sm:px-8 py-3 sm:py-4 bg-blue-700 hover:bg-blue-800 text-white font-bold rounded-md shadow-md transition duration-300 ease-in-out transform hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-75 flex items-center justify-center text-base sm:text-lg"
            >
              <List className="w-5 h-5 sm:w-6 sm:h-6 mr-2 sm:mr-3" /> Generate Motions
            </button>
            <span className="text-gray-400 font-medium text-base sm:text-lg">OR</span>
            <button
              onClick={() => setShowMotionInput(!showMotionInput)}
              className="flex-grow md:flex-grow-0 px-6 sm:px-8 py-3 sm:py-4 bg-green-700 hover:bg-green-800 text-white font-bold rounded-md shadow-md transition duration-300 ease-in-out transform hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-opacity-75 flex items-center justify-center text-base sm:text-lg"
            >
              <Type className="w-5 h-5 sm:w-6 sm:h-6 mr-2 sm:mr-3" /> {showMotionInput ? 'Hide Custom Input' : 'Input Custom Motion'}
            </button>
          </div>

          {showMotionInput && (
            <textarea
              value={customMotion}
              onChange={(e) => { setCustomMotion(e.target.value); setSelectedMotion(''); }}
              placeholder="Enter your custom debate motion here..."
              rows="4"
              className="w-full p-3 sm:p-4 border border-gray-600 rounded-md focus:ring-amber-500 focus:border-amber-500 transition duration-200 bg-gray-900 text-gray-200 placeholder-gray-500 resize-y text-base sm:text-lg"
            ></textarea>
          )}

          {selectedMotion && (
            <p className="mt-4 sm:mt-5 p-3 sm:p-4 bg-gray-700 text-amber-200 rounded-md border border-amber-600 text-base sm:text-lg">
              Selected Motion: <span className="font-semibold">{selectedMotion}</span>
            </p>
          )}
          {!selectedMotion && !customMotion && !showMotionInput && (
            <p className="mt-4 sm:mt-5 text-gray-400 text-sm sm:text-md">No motion selected. Please generate or input one.</p>
          )}
        </section>

        {/* Format Selection */}
        <section className="mb-8 p-5 sm:p-7 bg-gray-800 rounded-lg border border-gray-700 shadow-md">
          <h2 className="text-2xl sm:text-3xl font-semibold text-gray-200 mb-4 sm:mb-5 flex items-center">
            <Users className="w-6 h-6 sm:w-7 sm:h-7 mr-3 sm:mr-4 text-emerald-400" />
            Debate Format
          </h2>
          <div className="flex flex-wrap gap-3 sm:gap-4 justify-center">
            {Object.keys(debateFormats).map((key) => (
              <button
                key={key}
                onClick={() => setSelectedFormat(key)}
                className={`
                  px-6 sm:px-8 py-3 sm:py-4 rounded-md font-bold text-base sm:text-lg transition duration-300 ease-in-out transform hover:-translate-y-0.5
                  ${selectedFormat === key
                    ? 'bg-emerald-700 text-white shadow-lg ring-2 ring-emerald-500'
                    : 'bg-gray-900 text-gray-300 border border-gray-600 hover:bg-gray-700 hover:text-white'
                  }
                  focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-opacity-75
                `}
              >
                {debateFormats[key].name}
              </button>
            ))}
          </div>
        </section>

        {/* Debate Format Details */}
        {selectedFormat && (
          <section className="mb-8 p-5 sm:p-7 bg-gray-800 rounded-lg border border-gray-700 shadow-md">
            <h2 className="text-2xl sm:text-3xl font-semibold text-gray-200 mb-4 sm:mb-5 flex items-center">
              <Info className="w-6 h-6 sm:w-7 sm:h-7 mr-3 sm:mr-4 text-sky-400" />
              {currentFormatDetails.name} Details
            </h2>
            <div className="space-y-4 text-gray-300">
              <p><span className="font-semibold text-sky-300">Teams:</span> {currentFormatDetails.teams}</p>
              <p><span className="font-semibold text-sky-300">Structure:</span> {currentFormatDetails.structure}</p>
              <p><span className="font-semibold text-sky-300">Prep Time:</span> {currentFormatDetails.prepTime}</p>
              <p><span className="font-semibold text-sky-300">Speech Time:</span> {currentFormatDetails.speechTime}</p>

              <div>
                <h3 className="font-semibold text-sky-300 mt-4 mb-2">Speaker Order:</h3>
                <ol className="list-decimal list-inside space-y-1">
                  {currentFormatDetails.speakerOrder.map((speaker, index) => (
                    <li key={index} className="text-gray-300">
                      <span className="font-medium">{speaker.role}</span> ({speaker.team})
                    </li>
                  ))}
                </ol>
              </div>

              <div>
                <h3 className="font-semibold text-sky-300 mt-4 mb-2">Rules:</h3>
                <ul className="list-disc list-inside space-y-1">
                  {currentFormatDetails.rules.map((rule, index) => (
                    <li key={index} className="text-gray-300">{rule}</li>
                  ))}
                </ul>
              </div>

              {currentFormatDetails.speakerRolesDetailed && (
                <div>
                  <h3 className="font-semibold text-sky-300 mt-4 mb-2">Detailed Speaker Roles:</h3>
                  <ul className="list-disc list-inside space-y-2">
                    {currentFormatDetails.speakerRolesDetailed.map((roleDetail, index) => (
                      <li key={index} className="text-gray-300">
                        <span className="font-medium">{roleDetail.role}:</span> {roleDetail.description}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </section>
        )}

        {/* User Role Selection */}
        <section className="mb-8 p-5 sm:p-7 bg-gray-800 rounded-lg border border-gray-700 shadow-md">
          <h2 className="text-2xl sm:text-3xl font-semibold text-gray-200 mb-4 sm:mb-5 flex items-center">
            <Award className="w-6 h-6 sm:w-7 sm:h-7 mr-3 sm:mr-4 text-red-400" />
            Your Role
          </h2>
          <div className="relative">
            <select
              value={userRole}
              onChange={(e) => setUserRole(e.target.value)}
              className="block w-full p-3 sm:p-4 border border-gray-600 rounded-md shadow-sm focus:ring-red-500 focus:border-red-500 appearance-none bg-gray-900 text-gray-200 pr-10 sm:pr-12 text-base sm:text-lg"
            >
              <option value="" disabled>Select your role</option>
              {currentFormatRoles.map((role) => (
                <option key={role} value={role}>
                  {role}
                </option>
              ))}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 sm:px-4 text-gray-400">
              <ChevronDown className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
          </div>
        </section>

        {/* AI Opponent Skill Level Selection */}
        <section className="mb-8 p-5 sm:p-7 bg-gray-800 rounded-lg border border-gray-700 shadow-md">
          <h2 className="text-2xl sm:text-3xl font-semibold text-gray-200 mb-4 sm:mb-5 flex items-center">
            <Settings className="w-6 h-6 sm:w-7 sm:h-7 mr-3 sm:mr-4 text-orange-400" />
            AI Opponent Skill Levels
          </h2>

          {/* AI Settings Mode Toggle */}
          <div className="flex justify-center gap-4 mb-6">
            <button
              onClick={() => setAiSettingsMode('default')}
              className={`
                px-6 py-3 rounded-md font-bold text-base transition duration-300 ease-in-out transform hover:-translate-y-0.5
                ${aiSettingsMode === 'default'
                  ? 'bg-orange-700 text-white shadow-lg ring-2 ring-orange-500'
                  : 'bg-gray-900 text-gray-300 border border-gray-600 hover:bg-gray-700 hover:text-white'
                }
                focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-opacity-50
              `}
            >
              Default AI Settings
            </button>
            <button
              onClick={() => setAiSettingsMode('custom')}
              className={`
                px-6 py-3 rounded-md font-bold text-base transition duration-300 ease-in-out transform hover:-translate-y-0.5
                ${aiSettingsMode === 'custom'
                  ? 'bg-orange-700 text-white shadow-lg ring-2 ring-orange-500'
                  : 'bg-gray-900 text-gray-300 border border-gray-600 hover:bg-gray-700 hover:text-white'
                }
                focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-opacity-50
              `}
            >
              Customize AI Settings
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {aiRoles.map((role) => (
              <div key={role} className="flex flex-col bg-gray-900 p-4 sm:p-5 rounded-md border border-gray-700 shadow-sm">
                <label htmlFor={`ai-skill-${role}`} className="block text-sm sm:text-md font-medium text-gray-300 mb-2 sm:mb-3">
                  AI {role}
                </label>
                <div className="flex rounded-md border border-gray-600 overflow-hidden">
                  {skillLevels.map((level) => (
                    <button
                      key={level}
                      onClick={() => handleAiSkillChange(role, level)}
                      className={`
                        flex-1 py-2 text-center text-xs sm:text-sm font-medium transition duration-200
                        ${aiSkillLevels[role] === level
                          ? 'bg-orange-600 text-white shadow-inner'
                          : 'bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white'
                        }
                        first:rounded-l-md last:rounded-r-md
                        focus:outline-none focus:ring-2 focus:ring-orange-400 focus:ring-opacity-75
                      `}
                    >
                      {level}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Optional Settings - Conditionally Rendered */}
        {aiSettingsMode === 'custom' && (
          <section className="mb-8 p-5 sm:p-7 bg-gray-800 rounded-lg border border-gray-700 shadow-md">
            <h2 className="text-2xl sm:text-3xl font-semibold text-gray-200 mb-4 sm:mb-5 flex items-center">
              <PlusCircle className="w-6 h-6 sm:w-7 sm:h-7 mr-3 sm:mr-4 text-gray-400" />
              Optional Settings
            </h2>

            {/* AI Personality Selection */}
            <div className="mb-6 sm:mb-8 p-4 sm:p-6 bg-gray-900 rounded-md border border-gray-700 shadow-sm">
              <h3 className="text-xl sm:text-2xl font-semibold text-gray-200 mb-3 sm:mb-4 flex items-center">
                <Smile className="w-5 h-5 sm:w-6 sm:h-6 mr-2 sm:mr-3 text-yellow-400" /> AI Personality Selection
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                {aiRoles.map((role) => (
                  <div key={`personality-${role}`} className="flex flex-col">
                    <label htmlFor={`ai-personality-${role}`} className="block text-sm sm:text-md font-medium text-gray-300 mb-2 sm:mb-3">
                      AI {role} Personality
                    </label>
                    <div className="relative">
                      <select
                        id={`ai-personality-${role}`}
                        value={aiPersonalities[role] || personalityOptions[0]}
                        onChange={(e) => handleAiPersonalityChange(role, e.target.value)}
                        className="block w-full p-3 border border-gray-600 rounded-md shadow-sm focus:ring-yellow-500 focus:border-yellow-500 appearance-none bg-gray-800 text-gray-200 pr-10 sm:pr-12 text-sm sm:text-md"
                      >
                        {personalityOptions.map((personality) => (
                          <option key={personality} value={personality}>
                            {personality}
                          </option>
                        ))}
                      </select>
                      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 sm:px-4 text-gray-400">
                        <ChevronDown className="w-5 h-5 sm:w-6 sm:h-6" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Specific AI Benchmarks */}
            <div className="p-4 sm:p-6 bg-gray-900 rounded-md border border-gray-700 shadow-sm">
              <h3 className="text-xl sm:text-2xl font-semibold text-gray-200 mb-3 sm:mb-4 flex items-center">
                <Target className="w-5 h-5 sm:w-6 sm:h-6 mr-2 sm:mr-3 text-cyan-400" /> Specific AI Benchmarks
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                {aiRoles.map((role) => (
                  <div key={`benchmark-${role}`} className="flex flex-col">
                    <p className="block text-sm sm:text-md font-medium text-gray-300 mb-2 sm:mb-3">
                      AI {role} Benchmarks:
                    </p>
                    <div className="space-y-2">
                      {benchmarkOptions.map((benchmark) => (
                        <label key={benchmark} className="flex items-center text-gray-300 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={(aiBenchmarks[role] || []).includes(benchmark)}
                            onChange={() => handleAiBenchmarkChange(role, benchmark)}
                            className="form-checkbox h-4 w-4 sm:h-5 sm:w-5 text-cyan-500 bg-gray-700 border-gray-600 rounded focus:ring-cyan-500 transition duration-150 ease-in-out"
                          />
                          <span className="ml-2 sm:ml-3 text-sm sm:text-md">{benchmark}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Start Debate Button */}
        <div className="text-center mt-10 sm:mt-12">
          <button
            onClick={handleStartDebate}
            className="px-8 sm:px-12 py-4 sm:py-5 bg-gradient-to-br from-amber-600 to-yellow-700 hover:from-amber-700 hover:to-yellow-800 text-white font-extrabold text-xl sm:text-2xl rounded-md shadow-lg transition duration-300 ease-in-out transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-amber-500 focus:ring-opacity-75 flex items-center justify-center mx-auto"
          >
            <Zap className="w-6 h-6 sm:w-8 sm:h-8 mr-3 sm:mr-4" /> Commence Debate
          </button>
        </div>
      </div>

      {/* Confirmation Modal */}
      {showConfirmation && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-50">
          <div className="bg-gray-900 rounded-lg shadow-xl p-6 sm:p-8 md:p-10 w-full max-w-2xl border border-gray-700 animate-fade-in-up">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-3xl font-bold text-white">Confirm Debate Setup</h2>
              <button
                onClick={handleCancelConfirmation}
                className="text-gray-400 hover:text-gray-200 transition duration-200"
              >
                <XCircle className="w-8 h-8" />
              </button>
            </div>

            <div className="space-y-4 text-gray-300 mb-8 max-h-96 overflow-y-auto pr-2 custom-scrollbar">
              <p className="text-lg"><span className="font-semibold text-amber-300">Motion:</span> {selectedMotion || customMotion || 'To be generated at the time of debate'}</p>
              <p className="text-lg"><span className="font-semibold text-emerald-300">Format:</span> {currentFormatDetails.name}</p>
              <p className="text-lg"><span className="font-semibold text-red-300">Your Role:</span> {userRole || 'Not selected'}</p>

              <div>
                <h3 className="font-semibold text-orange-300 text-xl mb-2">AI Opponent Settings:</h3>
                <ul className="list-disc list-inside space-y-1">
                  {aiRoles.map(role => (
                    <li key={role} className="text-md">
                      <span className="font-medium">{role}:</span> Skill - {aiSkillLevels[role]}{' '}
                      {aiSettingsMode === 'custom' && (
                        <>
                          , Personality - {aiPersonalities[role] || 'Neutral'}{' '}
                          {aiBenchmarks[role] && aiBenchmarks[role].length > 0 && (
                            <>, Benchmarks: {aiBenchmarks[role].join(', ')}</>
                          )}
                        </>
                      )}
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <h3 className="font-semibold text-sky-300 text-xl mt-4 mb-2">Debate Rules:</h3>
                <ul className="list-disc list-inside space-y-1">
                  {currentFormatDetails.rules.map((rule, index) => (
                    <li key={index} className="text-md">{rule}</li>
                  ))}
                </ul>
              </div>
              {currentFormatDetails.speakerRolesDetailed && (
                <div>
                  <h3 className="font-semibold text-sky-300 mt-4 mb-2">Detailed Speaker Roles:</h3>
                  <ul className="list-disc list-inside space-y-2">
                    {currentFormatDetails.speakerRolesDetailed.map((roleDetail, index) => (
                      <li key={index} className="text-gray-300">
                        <span className="font-medium">{roleDetail.role}:</span> {roleDetail.description}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-4 mt-6">
              <button
                onClick={handleCancelConfirmation}
                className="px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white font-bold rounded-md transition duration-300 ease-in-out flex items-center"
              >
                <XCircle className="w-5 h-5 mr-2" /> Cancel
              </button>
              <button
                onClick={handleConfirmDebate}
                className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-bold rounded-md transition duration-300 ease-in-out flex items-center"
              >
                <CheckCircle className="w-5 h-5 mr-2" /> Confirm and Start
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DebateScreen;