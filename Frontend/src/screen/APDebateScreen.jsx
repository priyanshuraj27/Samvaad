import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Link, useNavigate, useParams, useBeforeUnload } from 'react-router-dom';
import toast, { Toaster } from 'react-hot-toast';
import axiosInstance from '../utils/axiosInstance';
import {
    Timer, Play, Pause, SkipForward, Info, Mic, Hand, Shield, BookOpen,
    ArrowLeft, User, X as XIcon, Speaker as SpeakerIcon, SendHorizonal, Check, X
} from 'lucide-react';
import jsPDF from "jspdf";

// --- TONE.JS and BROWSER API ---
const synth = window.Tone ? new window.Tone.Synth().toDestination() : null;
const playBell = (note = "C5", count = 1, interval = 0.2) => {
    if (window.Tone && synth && window.Tone.context.state === 'running') {
        const now = window.Tone.now();
        for (let i = 0; i < count; i++) {
            synth.triggerAttackRelease(note, "8n", now + i * interval);
        }
    }
};
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
const recognition = SpeechRecognition ? new SpeechRecognition() : null;
if (recognition) {
    recognition.continuous = true;
    recognition.interimResults = true;
}
const formatTime = (seconds) => `${Math.floor(seconds / 60).toString().padStart(2, '0')}:${(seconds % 60).toString().padStart(2, '0')}`;


// --- REUSABLE UI COMPONENTS ---
const TeamPanel = ({ teamName, speakers, currentSpeaker, userRole, teamColor, speakingAi }) => {
    const colorClasses = {
        'gov': 'border-blue-500/50',
        'opp': 'border-red-500/50',
    };
    const highlightClasses = {
        'gov': 'bg-blue-600/30 border-blue-400 shadow-blue-500/50 shadow-lg',
        'opp': 'bg-red-600/30 border-red-400 shadow-red-500/50 shadow-lg',
    };

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
                );
            })}
        </div>
    );
};

const RulesModal = ({ isOpen, onClose, formatDetails }) => {
    // Assuming formatDetails is fetched with the session
    const rules = formatDetails?.rules || ['No rules available.'];
    const speakerRoles = formatDetails?.speakerRolesDetailed || [];

    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-gray-800 rounded-2xl shadow-2xl max-w-2xl w-full border border-gray-700 animate-fade-in-up flex flex-col" style={{ maxHeight: '90vh' }}>
                <header className="p-6 flex justify-between items-center border-b border-gray-700">
                    <h2 className="text-2xl font-bold text-white flex items-center gap-3"><Info className="w-7 h-7 text-blue-400" />Debate Rules & Roles</h2>
                    <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors"><XIcon className="w-7 h-7" /></button>
                </header>
                <div className="p-6 overflow-y-auto">
                    <h3 className="font-bold text-xl text-emerald-300 mb-3">Rules</h3>
                    <ul className="list-disc list-inside space-y-2 text-gray-300 mb-6">
                        {rules.map((rule, index) => (
                            <li key={index} className="text-base">{rule}</li>
                        ))}
                    </ul>
                    <h3 className="font-bold text-xl text-emerald-300 mb-3">Speaker Roles</h3>
                    <div className="space-y-4">
                        {speakerRoles.map((roleDetail, index) => (
                            <div key={index}>
                                <p className="font-semibold text-blue-300">{roleDetail.role}</p>
                                <p className="text-gray-400 text-sm">{roleDetail.description}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};


// --- Main Debate Screen Component ---
const APDebateScreen = () => {
    const { sessionId } = useParams();
    const navigate = useNavigate();

    // Core Debate State
    const [debateSession, setDebateSession] = useState(null);
    const [currentSpeakerIndex, setCurrentSpeakerIndex] = useState(-1);
    const [transcript, setTranscript] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isError, setIsError] = useState(false);

    // Timer State & UI State
    const [timer, setTimer] = useState(0);
    const [isActive, setIsActive] = useState(false);
    const [isRulesModalOpen, setIsRulesModalOpen] = useState(false);
    const [isListening, setIsListening] = useState(false);
    const [interimTranscript, setInterimTranscript] = useState('');
    const [manualInputText, setManualInputText] = useState('');
    const [speakingAi, setSpeakingAi] = useState(null);
    const [aiPoiOffer, setAiPoiOffer] = useState(null);
    const [aiSpeechUtterance, setAiSpeechUtterance] = useState(null);
    const [aiTyping, setAiTyping] = useState({ active: false, text: '', fullText: '', speaker: null, index: -1 });
    const [showSummary, setShowSummary] = useState(false);
    const [isFinishing, setIsFinishing] = useState(false);
    const [isMuted, setIsMuted] = useState(false);

    const timerRef = useRef(null);
    const transcriptEndRef = useRef(null);
    const finalTranscriptRef = useRef('');

    const persistDebateState = useCallback(async (updatedState) => {
        try {
            await axiosInstance.put(`/debates/${sessionId}`, updatedState);
        } catch (error) {
            toast.error("Failed to save debate progress.");
        }
    }, [sessionId]);

    const addTranscriptEntry = useCallback(async (entryData) => {
        setTranscript(prevTranscript => {
            const updatedTranscript = [...prevTranscript, entryData];
            persistDebateState({ transcript: updatedTranscript });
            return updatedTranscript;
        });
    }, [persistDebateState]);

    const updateLastTranscriptEntry = useCallback(async (entryData) => {
        setTranscript(prevTranscript => {
            const updatedTranscript = [...prevTranscript];
            if (updatedTranscript.length > 0) {
                updatedTranscript[updatedTranscript.length - 1] = entryData;
            }
            persistDebateState({ transcript: updatedTranscript });
            return updatedTranscript;
        });
    }, [persistDebateState]);

    useEffect(() => {
        if (!sessionId) {
            toast.error("No debate session specified.");
            navigate('/debate');
            return;
        }
        const fetchSession = async () => {
            try {
                const response = await axiosInstance.get(`/debates/${sessionId}`);
                const session = response.data.data;
                setDebateSession(session);
                setTranscript(session.transcript || []);
                setCurrentSpeakerIndex(session.currentSpeakerIndex ?? -1);
                // This info should ideally come from backend config based on debateType
                const speechMinutes = 7;
                const prepMinutes = 15;
                setTimer(session.status === 'prep' ? prepMinutes * 60 : speechMinutes * 60);
            } catch (error) {
                toast.error("Could not load debate session.");
                setIsError(true);
            } finally {
                setIsLoading(false);
            }
        };
        fetchSession();
    }, [sessionId, navigate]);

    // Remove auto-scroll on every transcript update
    // useEffect(() => {
    //     transcriptEndRef.current?.scrollIntoView({ behavior: "smooth" });
    // }, [transcript]);

    // Optional: Scroll only when a new message is added and user is already near the bottom
    // useEffect(() => {
    //     const container = transcriptEndRef.current?.parentElement;
    //     if (!container) return;
    //     const isNearBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 100;
    //     if (isNearBottom) {
    //         transcriptEndRef.current.scrollIntoView({ behavior: "smooth" });
    //     }
    // }, [transcript]);

    // --- Cleanup on unmount or navigation ---
    useEffect(() => {
        return () => {
            if (window.speechSynthesis.speaking) window.speechSynthesis.cancel();
            if (recognition && isListening) recognition.stop();
        };
    }, [isListening]);

    // Optional: Also stop on browser reload
    useBeforeUnload(() => {
        if (window.speechSynthesis.speaking) window.speechSynthesis.cancel();
        if (recognition && isListening) recognition.stop();
    });

    // --- AI Speech Typing Effect ---
    useEffect(() => {
        let typingTimeout;
        if (aiTyping.active && isActive) {
            if (aiTyping.text.length < aiTyping.fullText.length) {
                typingTimeout = setTimeout(() => {
                    setAiTyping(prev => ({
                        ...prev,
                        text: prev.fullText.slice(0, prev.text.length + 1)
                    }));
                    // Update transcript entry as it types
                    setTranscript(prev => {
                        const updated = [...prev];
                        if (aiTyping.index >= 0) {
                            updated[aiTyping.index] = {
                                ...updated[aiTyping.index],
                                text: aiTyping.fullText.slice(0, aiTyping.text.length + 1)
                            };
                        }
                        return updated;
                    });
                }, 30); // Typing speed (ms)
            } else {
                setAiTyping({ active: false, text: '', fullText: '', speaker: null, index: -1 });
            }
        }
        return () => clearTimeout(typingTimeout);
    }, [aiTyping, isActive]);

    // --- Pause/Play/Mute AI Speech and Typing ---
    useEffect(() => {
        if (aiSpeechUtterance) {
            if (isMuted && window.speechSynthesis.speaking) {
                window.speechSynthesis.cancel();
            } else if (!isActive && window.speechSynthesis.speaking) {
                window.speechSynthesis.pause();
            } else if (isActive && window.speechSynthesis.paused && !isMuted) {
                window.speechSynthesis.resume();
            }
        }
    }, [isActive, aiSpeechUtterance, isMuted]);

    // --- Modified AI Speech Generation ---
    const generateAndSpeakAiSpeech = useCallback(async (speakerRole) => {
        setIsMuted(false); // Reset mute on new AI speech
        const thinkingEntry = { speaker: speakerRole, text: "Thinking...", type: 'info', timestamp: new Date().toISOString() };
        await addTranscriptEntry(thinkingEntry);

        try {
            const response = await axiosInstance.post('/debates/generate-speech', { sessionId, speakerRole });
            const { text: aiSpeech } = response.data.data;

            // Add empty entry for typing effect
            setTranscript(prev => {
                const updated = [...prev];
                updated[updated.length - 1] = { speaker: speakerRole, text: '', type: 'speech', timestamp: new Date().toISOString() };
                return updated;
            });
            setAiTyping({
                active: true,
                text: '',
                fullText: aiSpeech,
                speaker: speakerRole,
                index: transcript.length // last entry
            });

            // Speak the generated text
            if ('speechSynthesis' in window) {
                const utterance = new SpeechSynthesisUtterance(aiSpeech);
                utterance.onstart = () => setSpeakingAi(speakerRole);
                utterance.onend = () => {
                    setSpeakingAi(null);
                    setAiSpeechUtterance(null);
                };
                setAiSpeechUtterance(utterance);
                if (isActive && !isMuted) window.speechSynthesis.speak(utterance);
            }
        } catch (error) {
            toast.error(`AI failed to generate speech for ${speakerRole}.`);
            const errorEntry = { speaker: speakerRole, text: "(AI Error: Could not generate speech)", type: 'info', timestamp: new Date().toISOString() };
            await updateLastTranscriptEntry(errorEntry);
        }
    }, [sessionId, addTranscriptEntry, updateLastTranscriptEntry, transcript.length, isActive, isMuted]);

    const handleNextSpeaker = useCallback(async () => {
        if (window.speechSynthesis.speaking) window.speechSynthesis.cancel();
        if (isListening) recognition.stop();
        clearInterval(timerRef.current);

        const nextIndex = currentSpeakerIndex + 1;
        const speechDuration = 7 * 60; // Should be based on format

        if (debateSession && nextIndex < debateSession.participants.length) {
            const nextSpeaker = debateSession.participants[nextIndex];
            setCurrentSpeakerIndex(nextIndex);
            setTimer(speechDuration);
            setIsActive(true);
            await persistDebateState({ currentSpeakerIndex: nextIndex, status: 'ongoing' });
            toast.success(`Next up: ${nextSpeaker.role}!`);
            if (nextSpeaker.isAI) {
                await generateAndSpeakAiSpeech(nextSpeaker.role);
            }
        } else {
            setCurrentSpeakerIndex(-1);
            setIsActive(false);
            await persistDebateState({ status: 'completed' });
            await addTranscriptEntry({ speaker: 'Moderator', text: 'The debate has concluded.', type: 'info', timestamp: new Date().toISOString() });
            toast.success("Debate Concluded!");
        }
    }, [currentSpeakerIndex, debateSession, isListening, generateAndSpeakAiSpeech, persistDebateState, addTranscriptEntry]);

    useEffect(() => {
        if (isActive && timer > 0) {
            timerRef.current = setInterval(() => setTimer(t => t - 1), 1000);
        } else if (timer === 0 && isActive) {
            clearInterval(timerRef.current);
            setIsActive(false);
            playBell("C6", 2);
            toast('Speech time is over!', { icon: '🔔' });
            handleNextSpeaker();
        }
        return () => clearInterval(timerRef.current);
    }, [timer, isActive, handleNextSpeaker]);

    useEffect(() => {
        if (!recognition) return;
        recognition.onresult = (event) => {
            let interim = '';
            for (let i = event.resultIndex; i < event.results.length; ++i) {
                if (event.results[i].isFinal) {
                    finalTranscriptRef.current += event.results[i][0].transcript.trim() + ' ';
                } else {
                    interim += event.results[i][0].transcript;
                }
            }
            setInterimTranscript(interim);
        };
        recognition.onend = () => {
            setIsListening(false);
            if (finalTranscriptRef.current.trim() && debateSession) {
                const entry = { speaker: debateSession.userRole, text: finalTranscriptRef.current.trim(), type: 'speech', timestamp: new Date().toISOString() };
                addTranscriptEntry(entry);
                toast.success("Your speech was added!");
            }
            finalTranscriptRef.current = '';
        };
    }, [debateSession, addTranscriptEntry]);

    const startListening = () => {
        if (recognition && !isListening) {
            if (window.Tone && window.Tone.context.state !== 'running') {
                window.Tone.context.resume();
            }
            finalTranscriptRef.current = '';
            setInterimTranscript('');
            recognition.start();
            setIsListening(true);
            toast.success("Listening... Stop when you're done.", { icon: '🎤' });
        }
    };

    const stopListening = () => {
        if (recognition && isListening) {
            recognition.stop();
        }
    };

    const handleManualSubmit = () => {
        if (manualInputText.trim() && debateSession) {
            const entry = { speaker: debateSession.userRole, text: manualInputText.trim(), type: 'speech', timestamp: new Date().toISOString() };
            addTranscriptEntry(entry);
            setManualInputText('');
        }
    };
    const handleMute = () => {
        setIsMuted(true);
        if (window.speechSynthesis.speaking) {
            window.speechSynthesis.cancel();
        }
    };
    // --- Download Transcript as PDF ---
    const handleDownloadTranscript = () => {
        const doc = new jsPDF();
        doc.setFontSize(16);
        doc.text("Debate Transcript", 10, 15);
        doc.setFontSize(12);
        let y = 25;
        transcript.forEach((entry, idx) => {
            const time = new Date(entry.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            const speakerLine = `${entry.speaker} [${time}]:`;
            doc.text(speakerLine, 10, y);
            y += 7;
            const lines = doc.splitTextToSize(entry.text, 180);
            lines.forEach(line => {
                doc.text(line, 15, y);
                y += 6;
            });
            y += 2;
            if (y > 270 && idx < transcript.length - 1) {
                doc.addPage();
                y = 15;
            }
        });
        doc.save("debate_transcript.pdf");
    };

    // --- Finish Debate Handler ---
    const handleFinishDebate = async () => {
        setIsFinishing(true);
        await persistDebateState({ status: 'completed' });
        setShowSummary(true);
        setIsFinishing(false);
    };

    // --- Go to Adjudicator ---
    const handleGoToAdjudicator = () => {
        navigate(`/adjudicator?sessionId=${sessionId}`);
    };

    // --- Generate Debate Summary ---
    const getDebateSummary = () => {
        if (!transcript.length) return "No debate transcript available.";
        let summary = "";
        const speakers = {};
        transcript.forEach(entry => {
            if (!speakers[entry.speaker]) speakers[entry.speaker] = [];
            speakers[entry.speaker].push(entry.text);
        });
        Object.entries(speakers).forEach(([speaker, texts]) => {
            summary += `${speaker}:\n${texts.join("\n")}\n\n`;
        });
        return summary.trim();
    };

    if (isLoading) return <div className="min-h-screen bg-gray-900 flex items-center justify-center text-white">Loading Debate...</div>;
    if (isError || !debateSession) return <div className="min-h-screen bg-gray-900 flex items-center justify-center text-red-400">Failed to load debate.</div>;
    
    // --- Summary Modal ---
    if (showSummary) {
        return (
            <div className="min-h-screen bg-gray-900 flex flex-col items-center justify-center text-gray-100 font-sans">
                <div className="bg-gray-800/90 rounded-2xl shadow-2xl max-w-2xl w-full border border-gray-700 p-8 flex flex-col items-center">
                    <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-3">
                        <BookOpen className="w-7 h-7 text-emerald-400" /> Debate Summary
                    </h2>
                    <pre className="bg-gray-900/70 rounded-lg p-4 text-gray-200 text-sm w-full max-h-96 overflow-y-auto whitespace-pre-wrap mb-6">{getDebateSummary()}</pre>
                    <div className="flex flex-col sm:flex-row gap-4 w-full justify-center">
                        <button
                            onClick={handleDownloadTranscript}
                            className="flex items-center gap-2 px-5 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors"
                        >
                            <DownloadIcon className="w-5 h-5" /> Download Transcript (PDF)
                        </button>
                        <button
                            onClick={handleGoToAdjudicator}
                            className="flex items-center gap-2 px-5 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg transition-colors"
                        >
                            <Check className="w-5 h-5" /> Finish Debate & Go to Adjudicator
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    const currentSpeaker = debateSession.participants[currentSpeakerIndex];
    const userIsCurrentSpeaker = currentSpeaker && !currentSpeaker.isAI;

    return (
        <div className="min-h-screen bg-gray-900 text-gray-100 flex flex-col font-sans">
            <Toaster position="top-center" />
            <header className="flex-shrink-0 bg-gray-800/50 backdrop-blur-lg border-b border-gray-700/50 p-4 flex justify-between items-center">
                <Link to="/debate" className="flex items-center gap-2 text-gray-300 hover:text-white transition">
                    <ArrowLeft className="w-5 h-5" />
                    Back to Setup
                </Link>
                <div className="text-center">
                    <h2 className="text-sm text-gray-400">Motion</h2>
                    <p className="font-semibold text-white truncate max-w-md">{debateSession.motion}</p>
                </div>
                <button onClick={() => setIsRulesModalOpen(true)} className="flex items-center gap-2 text-gray-300 hover:text-white transition">
                    <Info className="w-5 h-5" />
                    Debate Rules
                </button>
            </header>

            <main className="flex-grow grid grid-cols-1 lg:grid-cols-4 gap-6 p-6">
                <div className="lg:col-span-1">
                    <TeamPanel teamName="Government" speakers={debateSession.participants.filter(p => p.team.includes('Government'))} {...{ currentSpeaker, userRole: debateSession.userRole, teamColor: 'gov', speakingAi }} />
                </div>

                <div className="lg:col-span-2 flex flex-col gap-6">
                    <div className="bg-gray-800/30 backdrop-blur-xl p-6 rounded-2xl border border-gray-700/50 shadow-2xl flex flex-col items-center justify-center text-center">
                        <p className="text-gray-400 text-sm">{currentSpeakerIndex === -1 ? 'Debate Phase' : 'Current Speaker'}</p>
                        <p className="text-3xl font-bold text-white my-2">{currentSpeaker?.role || (debateSession.status === 'prep' ? 'Preparation' : 'Debate Concluded')}</p>
                        <p className="text-5xl font-mono font-bold text-emerald-400">{formatTime(timer)}</p>
                    </div>

                    <div className="bg-gray-800/30 backdrop-blur-xl p-4 rounded-2xl border border-gray-700/50 shadow-2xl">
                        <div className="flex items-center justify-center gap-4 mb-4">
                            <button onClick={() => setIsActive(!isActive)} className="p-3 bg-blue-600 hover:bg-blue-700 rounded-full text-white shadow-lg" title={isActive ? 'Pause' : 'Play'}>{isActive ? <Pause /> : <Play />}</button>
                            <button onClick={handleNextSpeaker} className="p-4 bg-green-600 hover:bg-green-700 rounded-full text-white shadow-lg" title="Next Speaker"><SkipForward /></button>
                            {speakingAi && aiSpeechUtterance && window.speechSynthesis.speaking && !isMuted && (
                                <button
                                    onClick={handleMute}
                                    className="p-3 bg-red-600 hover:bg-red-700 rounded-full text-white shadow-lg"
                                    title="Mute AI Speech"
                                >
                                    <XIcon className="w-5 h-5" />
                                </button>
                            )}
                        </div>
                        
                        {userIsCurrentSpeaker && (
                            <div className="my-4 space-y-4">
                                <div className="text-center">
                                    <button onClick={isListening ? stopListening : startListening} className={`px-6 py-4 rounded-full font-bold text-white transition-all duration-300 flex items-center gap-3 mx-auto ${isListening ? 'bg-red-600 hover:bg-red-700 animate-pulse' : 'bg-emerald-600 hover:bg-emerald-700'}`}>
                                        <Mic className="w-6 h-6" />
                                        {isListening ? 'Stop Speaking' : 'Start Speaking'}
                                    </button>
                                    <p className="text-gray-400 text-sm mt-3 h-5">{interimTranscript || (isListening ? 'Listening...' : 'Click to start speaking')}</p>
                                </div>
                                <div className="flex items-center gap-2 text-gray-500"><hr className="flex-grow border-gray-600" /><span className="font-bold text-xs">OR</span><hr className="flex-grow border-gray-600" /></div>
                                <div className="flex flex-col gap-2">
                                    <textarea value={manualInputText} onChange={(e) => setManualInputText(e.target.value)} placeholder="Or type your speech here and submit..." rows="4" className="w-full bg-gray-900/70 border border-gray-600 rounded-lg p-3 text-gray-200 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition" disabled={isListening} />
                                    <button onClick={handleManualSubmit} className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed" disabled={isListening}><SendHorizonal className="w-5 h-5"/>Submit Text</button>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="bg-gray-800/30 backdrop-blur-xl rounded-2xl border border-gray-700/50 shadow-2xl flex-grow flex flex-col p-6">
                        <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2"><BookOpen className="w-6 h-6 text-emerald-400"/>Transcript</h3>
                        <div className="flex-grow overflow-y-auto pr-2 space-y-4">
                            {transcript.map((entry, index) => (
                                <div key={index} className={`flex flex-col p-3 rounded-lg ${entry.type === 'info' ? 'bg-gray-700/50' : 'bg-gray-900/50'}`}>
                                    <div className="flex justify-between items-center mb-1">
                                        <p className={`font-bold text-sm ${entry.speaker === debateSession.userRole ? 'text-emerald-300' : 'text-blue-300'}`}>{entry.speaker}</p>
                                        <p className="text-xs text-gray-500">{new Date(entry.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                                    </div>
                                    <p className="text-gray-200 whitespace-pre-wrap">{entry.text}</p>
                                </div>
                            ))}
                            <div ref={transcriptEndRef} />
                        </div>
                        <div className="flex justify-end mt-6">
                            <button
                                onClick={handleFinishDebate}
                                disabled={isFinishing}
                                className="flex items-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg transition-colors disabled:opacity-60"
                            >
                                <Check className="w-5 h-5" />
                                {isFinishing ? "Finishing..." : "Finish Debate"}
                            </button>
                        </div>
                    </div>
                </div>
                
                <div className="lg:col-span-1">
                    <TeamPanel teamName="Opposition" speakers={debateSession.participants.filter(p => p.team.includes('Opposition'))} {...{ currentSpeaker, userRole: debateSession.userRole, teamColor: 'opp', speakingAi }} />
                </div>
            </main>
            <RulesModal isOpen={isRulesModalOpen} onClose={() => setIsRulesModalOpen(false)} formatDetails={debateSession.formatDetails} />
        </div>
    );
};

// Add this icon at the top with your other imports
function DownloadIcon(props) {
    return (
        <svg {...props} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 10l5 5m0 0l5-5m-5 5V4" />
        </svg>
    );
}

export default APDebateScreen;