import React, { useState, useEffect, useRef, useCallback } from 'react';
import toast, { Toaster } from 'react-hot-toast';
import * as Tone from 'tone';
import {
    Timer,
    Play,
    Pause,
    SkipForward,
    Info,
    ChevronUp,
    ChevronDown,
    Zap,
    Mic,
    Hand,
    Shield,
    BookOpen,
    ArrowLeft,
    Users,
    User,
    X as XIcon,
    Speaker as SpeakerIcon,
    SendHorizonal,
    Bell, // --- MODIFICATION: Added Bell icon ---
} from 'lucide-react';

// --- TONE.JS SETUP ---
// Make sure to include Tone.js in your HTML file:
// <script src="https://cdnjs.cloudflare.com/ajax/libs/tone/14.7.77/Tone.js"></script>
const synth = new Tone.Synth().toDestination();

const playBell = (note = "C5", count = 1, interval = 0.2) => {
    if (window.Tone && synth) {
        const now = Tone.now();
        for (let i = 0; i < count; i++) {
            synth.triggerAttackRelease(note, "8n", now + i * interval);
        }
    }
};


// --- BROWSER API CHECK ---
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
const recognition = SpeechRecognition ? new SpeechRecognition() : null;
if (recognition) {
    recognition.continuous = true;
    recognition.interimResults = true;
}

// --- DATA & CONFIGURATION ---
const initialDebateSetup = {
    motion: "This House Would Abolish Private Schools",
    userRole: "Prime Minister",
    format: 'BP',
    formatDetails: {
        name: 'British Parliamentary (BP)',
        teams: '4 teams of 2 speakers each',
        structure: 'Opening Government, Opening Opposition, Closing Government, Closing Opposition',
        prepTime: '15 minute prep time',
        speakerOrder: [
            'Prime Minister',
            'Leader of Opposition',
            'Deputy Prime Minister',
            'Deputy Leader of Opposition',
            'Member of Government',
            'Member of Opposition',
            'Government Whip',
            'Opposition Whip',
        ],
        speechTime: '7-minute speeches',
        rules: [
            '4 teams of 2 speakers each: Opening Government, Opening Opposition, Closing Government, Closing Opposition.',
            '15 minutes prep time before the debate starts.',
            '7-minute speeches for all speakers.',
            'Points of Information (POIs) are allowed during the middle 5 minutes of each speech (protected time of 1 minute at start and end).',
            'Opening benches establish and build their case.',
            'Closing benches must extend the debate and provide new material.',
            'No new content is allowed in Whip speeches.',
            'All 4 teams are ranked 1st to 4th at the end.',
        ],
        speakerRolesDetailed: [
            { role: "Prime Minister", description: "Defines the motion, outlines the Government's case, and presents initial arguments." },
            { role: "Leader of Opposition", description: "Rebuts the Prime Minister, defines the Opposition's stance, and presents initial opposition arguments." },
            { role: "Member of Government", description: "Rebuts previous speakers, provides an extension to the Government's case, and differentiates from Opening Government." },
            { role: "Opposition Whip", description: "Summarizes the Government's case, rebuts the Opposition's arguments, and explains why Government should win. No new arguments allowed." },
        ],
    },
};


// --- HELPER FUNCTIONS ---
const getMinutesFromString = (timeString = "0 minutes") => {
    const match = timeString.match(/\d+/);
    return match ? parseInt(match[0], 10) : 0;
};

const safeDisplay = (content) => {
    if (typeof content === 'object' && content !== null) {
        try {
            return JSON.stringify(content);
        } catch (e) {
            return 'Invalid Object';
        }
    }
    return content;
};

// --- REUSABLE UI COMPONENTS ---
const TeamPanel = ({ teamName, speakers, currentSpeaker, userRole, teamColor, speakingAi }) => {
    const colorClasses = {
        'gov': 'border-blue-500/50',
        'opp': 'border-red-500/50',
    };
    const highlightClasses = {
        'gov': 'bg-blue-600/30 border-blue-400 shadow-blue-500/50 shadow-lg',
        'opp': 'bg-red-600/30 border-red-400 shadow-red-500/50 shadow-lg',
    }

    return (
        <div className={`bg-gray-800/50 rounded-2xl border ${colorClasses[teamColor]} p-4 flex flex-col gap-3`}>
            <h3 className="text-center font-bold text-lg text-white">{teamName}</h3>
            {speakers.map((speaker, index) => {
                const isCurrentUser = speaker.role === userRole;
                const isCurrentSpeaker = speaker.role === currentSpeaker?.role;
                const isSpeakingAi = speakingAi === speaker.role;

                return (
                    <div key={index} className={`p-3 rounded-lg border-2 transition-all duration-300 ${isCurrentSpeaker ? highlightClasses[teamColor] : 'bg-gray-900/50 border-transparent'}`}>
                        <div className="flex items-center justify-between">
                           <span className="font-semibold text-gray-200">{speaker.role}</span>
                            <div className="flex items-center gap-2">
                                {isSpeakingAi && <SpeakerIcon className="w-5 h-5 text-yellow-300 animate-pulse" />}
                                {isCurrentUser && <User className="w-5 h-5 text-emerald-400" />}
                            </div>
                        </div>
                    </div>
                )
            })}
        </div>
    )
}


// --- BPDebateScreen Component ---
const BPDebateScreen = () => {
    const debateSetup = initialDebateSetup;

    const [speakerOrder, setSpeakerOrder] = useState([]);
    const [currentSpeakerIndex, setCurrentSpeakerIndex] = useState(-1);
    const [isPrepTime, setIsPrepTime] = useState(true);
    const [timer, setTimer] = useState(0);
    const [isActive, setIsActive] = useState(false);
    const timerRef = useRef(null);
    const [speechDuration, setSpeechDuration] = useState(0);
    const protectedTimeDuration = 60;

    const [transcript, setTranscript] = useState([]);
    const [isRulesModalOpen, setIsRulesModalOpen] = useState(false);

    // Voice and Text Input state
    const [isListening, setIsListening] = useState(false);
    const [finalTranscript, setFinalTranscript] = useState('');
    const [interimTranscript, setInterimTranscript] = useState('');
    const [speakingAi, setSpeakingAi] = useState(null);
    const [manualInputText, setManualInputText] = useState('');
    
    // Refs to prevent race conditions and unwanted side effects
    const hasProcessedTranscript = useRef(false);
    const isNavigatingNext = useRef(false);
    const transcriptEndRef = useRef(null);

    const addTranscriptEntry = useCallback((speaker, text, type = 'speech') => {
        const now = new Date();
        const timestamp = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        setTranscript((prev) => [...prev, { speaker, text, timestamp, type }]);
    }, []);

    // Effect to scroll the transcript into view, unless navigating
    useEffect(() => {
        if (isNavigatingNext.current) {
            isNavigatingNext.current = false;
        } else {
            transcriptEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }
    }, [transcript]);

    // Initialize debate setup
    useEffect(() => {
        const formatDetails = debateSetup.formatDetails;
        const parsedSpeakerOrder = formatDetails.speakerOrder.map(roleString => {
            let team = '';
            if (['Prime Minister', 'Deputy Prime Minister'].includes(roleString)) team = 'Opening Government';
            else if (['Leader of Opposition', 'Deputy Leader of Opposition'].includes(roleString)) team = 'Opening Opposition';
            else if (['Member of Government', 'Government Whip'].includes(roleString)) team = 'Closing Government';
            else if (['Member of Opposition', 'Opposition Whip'].includes(roleString)) team = 'Closing Opposition';
            return { role: roleString, team: team };
        });
        setSpeakerOrder(parsedSpeakerOrder);

        const prepMinutes = getMinutesFromString(formatDetails.prepTime);
        const speechMinutes = getMinutesFromString(formatDetails.speechTime);
        setTimer(prepMinutes * 60);
        setSpeechDuration(speechMinutes * 60);

        addTranscriptEntry('Moderator', `The BP debate motion is: "${safeDisplay(debateSetup.motion)}".`, 'info');
        
        if (!recognition) {
            toast.error("Your browser does not support Speech Recognition. Please use Chrome or Edge.", { duration: 5000 });
        }

        return () => clearInterval(timerRef.current);
    }, [debateSetup, addTranscriptEntry]);

    const handleDebateConcluded = useCallback(() => {
        addTranscriptEntry('Moderator', 'The debate has concluded. All speeches are complete.', 'info');
        setCurrentSpeakerIndex(-1);
        toast.success("Debate Concluded!");
    }, [addTranscriptEntry]);

    const speak = useCallback((text, speaker) => {
        if ('speechSynthesis' in window) {
            const utterance = new SpeechSynthesisUtterance(text);
            utterance.onstart = () => setSpeakingAi(speaker);
            utterance.onend = () => setSpeakingAi(null);
            window.speechSynthesis.speak(utterance);
        } else {
            toast.error("Your browser does not support Text-to-Speech.");
        }
    }, []);

    const stopListening = useCallback(() => {
        if (recognition) {
            recognition.stop();
        }
    }, []);

    const handleNextSpeaker = useCallback((isFirstSpeaker = false) => {
        if (window.speechSynthesis.speaking) {
            window.speechSynthesis.cancel();
            setSpeakingAi(null);
        }

        if (isListening) {
            hasProcessedTranscript.current = true;
            stopListening();
        }

        clearInterval(timerRef.current);
        isNavigatingNext.current = true;

        if (isPrepTime) {
            toast.success("Prep time is over! The debate begins.", { icon: '🚀' });
            addTranscriptEntry('Moderator', 'Preparation time has ended. The debate begins.');
            setIsPrepTime(false);
        }

        const nextIndex = isFirstSpeaker ? 0 : currentSpeakerIndex + 1;

        if (nextIndex < speakerOrder.length) {
            setCurrentSpeakerIndex(nextIndex);
            setTimer(speechDuration);
            setIsActive(true);
            const nextSpeaker = speakerOrder[nextIndex];
            toast.success(`Next up: ${safeDisplay(nextSpeaker?.role)}!`, { icon: '➡️' });
            if (nextSpeaker?.role !== debateSetup.userRole) {
                const aiSpeech = `(Simulated AI Speech for ${safeDisplay(nextSpeaker?.role)})`;
                addTranscriptEntry(safeDisplay(nextSpeaker?.role), aiSpeech, 'speech');
                speak(aiSpeech, nextSpeaker.role);
            }
        } else {
            handleDebateConcluded();
        }
    }, [isPrepTime, currentSpeakerIndex, speakerOrder, speechDuration, debateSetup.userRole, addTranscriptEntry, speak, handleDebateConcluded, isListening, stopListening]);

    // Timer logic and Sound Effects
    useEffect(() => {
        if (isActive && timer > 0) {
            timerRef.current = setInterval(() => setTimer(t => t - 1), 1000);
        } else if (timer === 0 && isActive) {
            clearInterval(timerRef.current);
            setIsActive(false);
            
            if (!isPrepTime) {
                playBell("C6", 2); // Double bell for end of speech
                toast('Speech time is over!', { icon: '🔔' });
                addTranscriptEntry(speakerOrder[currentSpeakerIndex]?.role || 'Speaker', 'Speech time has concluded.', 'info');
            }
            handleNextSpeaker(isPrepTime);
        }
        return () => clearInterval(timerRef.current);
    }, [isActive, timer, isPrepTime, currentSpeakerIndex, speakerOrder, addTranscriptEntry, handleNextSpeaker]);

    // --- MODIFICATION: New useEffect for timed bell sounds ---
    useEffect(() => {
        if (isActive && !isPrepTime) {
            // Bell at the end of the first minute (e.g., 6:00 for a 7-min speech)
            if (timer === speechDuration - protectedTimeDuration) {
                playBell("C5");
                toast.success("Protected time is over. POIs are now open.", { icon: '👋' });
            }
            // Bell at the start of the last minute (e.g., 1:00 for a 7-min speech)
            if (timer === protectedTimeDuration) {
                playBell("C5");
                toast.error("Protected time has begun. No more POIs.", { icon: '🛡️' });
            }
        }
    }, [timer, isActive, isPrepTime, speechDuration, protectedTimeDuration]);
    
    // Speech recognition logic
    useEffect(() => {
        if (!recognition) return;

        recognition.onresult = (event) => {
            let interim = '';
            let final = '';
            for (let i = event.resultIndex; i < event.results.length; ++i) {
                if (event.results[i].isFinal) {
                    final += event.results[i][0].transcript;
                } else {
                    interim += event.results[i][0].transcript;
                }
            }
            setInterimTranscript(interim);
            if (final) {
                setFinalTranscript(prev => prev + final.trim() + ' ');
            }
        };

        recognition.onerror = (event) => {
            toast.error(`Speech recognition error: ${event.error}`);
            console.error('Speech recognition error', event);
            setIsListening(false);
        };

        recognition.onspeechend = () => {
            stopListening();
        };

        recognition.onend = () => {
            setIsListening(false);
            
            if (!hasProcessedTranscript.current) {
                hasProcessedTranscript.current = true;

                setFinalTranscript((currentFinalTranscript) => {
                    if (currentFinalTranscript.trim()) {
                        addTranscriptEntry(debateSetup.userRole, currentFinalTranscript.trim(), 'speech');
                        toast.success("Your speech has been added automatically!");
                    }
                    return '';
                });
            }
            setInterimTranscript('');
        };

    }, [addTranscriptEntry, debateSetup.userRole, stopListening]);

    const startListening = () => {
        if (recognition && !isListening) {
             // --- MODIFICATION: Start Tone.js AudioContext on user interaction ---
            if (Tone.context.state !== 'running') {
                Tone.context.resume();
            }
            hasProcessedTranscript.current = false;
            setFinalTranscript('');
            setInterimTranscript('');
            recognition.start();
            setIsListening(true);
            toast.success("Listening... pause when you're done.", { icon: '🎤' });
        }
    };

    const handleManualSubmit = () => {
        if (manualInputText.trim()) {
            addTranscriptEntry(debateSetup.userRole, manualInputText.trim(), 'speech');
            toast.success("Your entry has been added!");
            setManualInputText('');
        } else {
            toast.error("Please type something before submitting.");
        }
    };
    
    const isInProtectedTime = useCallback(() => {
        if (isPrepTime || !isActive) return true;
        const elapsedSpeechTime = speechDuration - timer;
        return elapsedSpeechTime < protectedTimeDuration || timer < protectedTimeDuration;
    }, [isPrepTime, isActive, timer, speechDuration, protectedTimeDuration]);

    const toggleTimer = () => setIsActive(!isActive);
    const formatTime = (seconds) => `${Math.floor(seconds / 60).toString().padStart(2, '0')}:${(seconds % 60).toString().padStart(2, '0')}`;

    const currentSpeaker = speakerOrder[currentSpeakerIndex];
    const userIsCurrentSpeaker = currentSpeaker?.role === debateSetup.userRole;

    return (
        <div className="min-h-screen bg-gray-900 text-gray-100 flex flex-col font-sans overflow-hidden">
            <Toaster position="top-center" reverseOrder={false} />

            <header className="flex-shrink-0 bg-gray-800/50 backdrop-blur-lg border-b border-gray-700/50 p-4 flex justify-between items-center">
                <a href="#" className="flex items-center gap-2 text-gray-300 hover:text-white transition">
                    <ArrowLeft className="w-5 h-5" />
                    Back to Setup
                </a>
                <div className="text-center">
                    <h2 className="text-sm text-gray-400">Motion</h2>
                    <p className="font-semibold text-white truncate max-w-md">{safeDisplay(debateSetup.motion)}</p>
                </div>
                <button onClick={() => setIsRulesModalOpen(true)} className="flex items-center gap-2 text-gray-300 hover:text-white transition">
                    <Info className="w-5 h-5" />
                    Debate Rules
                </button>
            </header>

            <main className="flex-grow grid grid-cols-1 lg:grid-cols-4 gap-6 p-6">
                <div className="lg:col-span-1 flex flex-col gap-6">
                    <TeamPanel teamName="Opening Government" speakers={speakerOrder.filter(s => s.team === 'Opening Government')} currentSpeaker={currentSpeaker} userRole={debateSetup.userRole} teamColor="gov" speakingAi={speakingAi} />
                    <TeamPanel teamName="Closing Government" speakers={speakerOrder.filter(s => s.team === 'Closing Government')} currentSpeaker={currentSpeaker} userRole={debateSetup.userRole} teamColor="gov" speakingAi={speakingAi} />
                </div>

                <div className="lg:col-span-2 flex flex-col gap-6">
                    <div className="bg-gray-800/30 backdrop-blur-xl p-6 rounded-2xl border border-gray-700/50 shadow-2xl flex flex-col items-center justify-center text-center">
                        <p className="text-gray-400 text-sm">{isPrepTime ? 'Debate Phase' : 'Current Speaker'}</p>
                        <p className="text-3xl font-bold text-white my-2">{isPrepTime ? 'Preparation' : currentSpeaker?.role || 'Debate Concluded'}</p>
                        <p className="text-5xl font-mono font-bold text-emerald-400">{formatTime(timer)}</p>
                    </div>

                    <div className="bg-gray-800/30 backdrop-blur-xl p-4 rounded-2xl border border-gray-700/50 shadow-2xl">
                        <div className="flex items-center justify-center gap-4 mb-4">
                            <button onClick={toggleTimer} className="p-3 bg-blue-600 hover:bg-blue-700 rounded-full text-white shadow-lg" title={isActive ? 'Pause' : 'Play'}>{isActive ? <Pause /> : <Play />}</button>
                            <button onClick={() => handleNextSpeaker()} className="p-4 bg-green-600 hover:bg-green-700 rounded-full text-white shadow-lg" title="Next Speaker"><SkipForward /></button>
                        </div>
                        
                        {userIsCurrentSpeaker && !isPrepTime && (
                             <div className="my-4 space-y-4">
                                <div className="text-center">
                                    <button onClick={isListening ? stopListening : startListening} className={`px-6 py-4 rounded-full font-bold text-white transition-all duration-300 flex items-center gap-3 mx-auto ${isListening ? 'bg-red-600 hover:bg-red-700 animate-pulse' : 'bg-emerald-600 hover:bg-emerald-700'}`}>
                                        <Mic className="w-6 h-6" />
                                        {isListening ? 'Stop Speaking' : 'Start Speaking'}
                                    </button>
                                    <p className="text-gray-400 text-sm mt-3 h-5">{interimTranscript || (isListening ? 'Listening...' : 'Click to start speaking')}</p>
                                </div>
                                
                                <div className="flex items-center gap-2 text-gray-500">
                                    <hr className="flex-grow border-gray-600" />
                                    <span className="font-bold text-xs">OR</span>
                                    <hr className="flex-grow border-gray-600" />
                                </div>

                                <div className="flex flex-col gap-2">
                                     <textarea
                                        value={manualInputText}
                                        onChange={(e) => setManualInputText(e.target.value)}
                                        placeholder="Or type your speech here and submit..."
                                        rows="4"
                                        className="w-full bg-gray-900/70 border border-gray-600 rounded-lg p-3 text-gray-200 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition"
                                        disabled={isListening}
                                     />
                                     <button 
                                        onClick={handleManualSubmit} 
                                        className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                        disabled={isListening}
                                     >
                                        <SendHorizonal className="w-5 h-5"/>
                                        Submit Text
                                     </button>
                                </div>
                            </div>
                        )}
                        
                        <div className="flex items-center justify-between border-t border-gray-700 pt-4">
                            <div className="flex items-center gap-2">
                               {isInProtectedTime() && !isPrepTime && (
                                   <div className="flex items-center gap-2 text-red-400 bg-red-900/50 px-3 py-1.5 rounded-lg border border-red-700/50">
                                      <Shield className="w-5 h-5"/>
                                      <span className="text-sm font-bold">Protected Time</span>
                                   </div>
                               )}
                            </div>
                           <button className="p-3 bg-gray-700 hover:bg-gray-600 rounded-full text-white disabled:opacity-50 disabled:cursor-not-allowed" title="Offer POI" disabled={userIsCurrentSpeaker || isPrepTime || !isInProtectedTime()}><Hand /></button>
                        </div>
                    </div>

                    <div className="bg-gray-800/30 backdrop-blur-xl rounded-2xl border border-gray-700/50 shadow-2xl flex-grow flex flex-col p-6">
                        <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2"><BookOpen className="w-6 h-6 text-emerald-400"/>Transcript</h3>
                        <div className="flex-grow overflow-y-auto pr-2 space-y-4">
                            {transcript.map((entry, index) => (
                                <div key={index} className={`flex flex-col p-3 rounded-lg ${entry.type === 'info' ? 'bg-gray-700/50' : 'bg-gray-900/50'}`}>
                                    <div className="flex justify-between items-center mb-1">
                                        <p className={`font-bold text-sm ${entry.speaker === debateSetup.userRole ? 'text-emerald-300' : 'text-blue-300'}`}>{safeDisplay(entry.speaker)}</p>
                                        <p className="text-xs text-gray-500">{entry.timestamp}</p>
                                    </div>
                                    <p className="text-gray-200 whitespace-pre-wrap">{safeDisplay(entry.text)}</p>
                                </div>
                            ))}
                            <div ref={transcriptEndRef} />
                        </div>
                    </div>
                </div>
                
                <div className="lg:col-span-1 flex flex-col gap-6">
                    <TeamPanel teamName="Opening Opposition" speakers={speakerOrder.filter(s => s.team === 'Opening Opposition')} currentSpeaker={currentSpeaker} userRole={debateSetup.userRole} teamColor="opp" speakingAi={speakingAi} />
                    <TeamPanel teamName="Closing Opposition" speakers={speakerOrder.filter(s => s.team === 'Closing Opposition')} currentSpeaker={currentSpeaker} userRole={debateSetup.userRole} teamColor="opp" speakingAi={speakingAi} />
                </div>
            </main>

            {isRulesModalOpen && (
                <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-gray-800 rounded-2xl shadow-2xl max-w-2xl w-full border border-gray-700 animate-fade-in-up flex flex-col" style={{maxHeight: '90vh'}}>
                        <header className="p-6 flex justify-between items-center border-b border-gray-700">
                            <h2 className="text-2xl font-bold text-white flex items-center gap-3"><Info className="w-7 h-7 text-blue-400"/>Debate Rules & Roles</h2>
                            <button onClick={() => setIsRulesModalOpen(false)} className="text-gray-500 hover:text-white transition-colors"><XIcon className="w-7 h-7"/></button>
                        </header>
                        <div className="p-6 overflow-y-auto">
                            <h3 className="font-bold text-xl text-emerald-300 mb-3">BP Rules</h3>
                            <ul className="list-disc list-inside space-y-2 text-gray-300 mb-6">
                                {debateSetup.formatDetails?.rules?.map((rule, index) => (
                                    <li key={index} className="text-base">{safeDisplay(rule)}</li>
                                ))}
                            </ul>
                            <h3 className="font-bold text-xl text-emerald-300 mb-3">Speaker Roles</h3>
                            <div className="space-y-4">
                                {debateSetup.formatDetails?.speakerRolesDetailed?.map((roleDetail, index) => (
                                     <div key={index}>
                                         <p className="font-semibold text-blue-300">{safeDisplay(roleDetail.role)}</p>
                                         <p className="text-gray-400 text-sm">{safeDisplay(roleDetail.description)}</p>
                                     </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default BPDebateScreen;
