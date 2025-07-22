import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Mic, MicOff, BrainCircuit, Bot, User, Award, ShieldCheck, Swords, TrendingUp, Sparkles, X, RotateCw, Loader2, BookOpen, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

// --- Custom Hook for Speech Recognition ---
const useSpeechRecognition = (onResult) => {
    const [isListening, setIsListening] = useState(false);
    const recognitionRef = useRef(null);

    useEffect(() => {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognition) {
            console.error("Speech Recognition API not supported in this browser.");
            return;
        }

        const recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = false;
        recognition.lang = 'en-US';

        recognition.onresult = (event) => {
            const transcript = event.results[0][0].transcript;
            onResult(transcript);
        };

        recognition.onstart = () => setIsListening(true);
        recognition.onend = () => setIsListening(false);
        recognition.onerror = (event) => {
            console.error("Speech recognition error:", event.error);
            setIsListening(false);
        };
        
        recognitionRef.current = recognition;

    }, [onResult]);

    const startListening = useCallback(() => {
        if (recognitionRef.current && !isListening) {
            try {
                recognitionRef.current.start();
            } catch(e) {
                console.error("Could not start recognition:", e);
            }
        }
    }, [isListening]);

    const stopListening = useCallback(() => {
        if (recognitionRef.current && isListening) {
            recognitionRef.current.stop();
        }
    }, [isListening]);

    return { isListening, startListening, stopListening };
};

// --- Main Debate Page Component ---
const OneVOneDebate = () => {
    const [debateState, setDebateState] = useState('setup'); // 'setup', 'debating', 'analyzing', 'finished'
    const [transcript, setTranscript] = useState([]);
    const [currentSpeaker, setCurrentSpeaker] = useState('user'); // 'user', 'ai'
    const [analysis, setAnalysis] = useState(null);
    const [motion, setMotion] = useState("");
    const [userSide, setUserSide] = useState(null); // 'Government', 'Opposition'
    const [isAwaitingAI, setIsAwaitingAI] = useState(false);
    const synthRef = useRef(window.speechSynthesis);
    const transcriptEndRef = useRef(null);
    const navigate = useNavigate();

    const scrollToBottom = () => {
        transcriptEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(scrollToBottom, [transcript]);

    const handleSpeechResult = (text) => {
        if (text) {
            const newEntry = { speaker: 'user', text };
            setTranscript(prev => [...prev, newEntry]);
            setCurrentSpeaker('ai');
            generateAIResponse([...transcript, newEntry]);
        }
    };

    const { isListening, startListening, stopListening } = useSpeechRecognition(handleSpeechResult);

    const speak = (text) => {
        if (!text) return;
        synthRef.current.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        const voices = synthRef.current.getVoices();
        let selectedVoice = voices.find(v => v.name.includes('Google') && v.lang.startsWith('en'));
        if (!selectedVoice) selectedVoice = voices.find(v => v.lang.startsWith('en'));
        utterance.voice = selectedVoice;
        utterance.pitch = 1;
        utterance.rate = 1;
        utterance.onstart = () => setCurrentSpeaker('ai');
        utterance.onend = () => setCurrentSpeaker('user');
        synthRef.current.speak(utterance);
    };

    const generateAIResponse = async (currentTranscript) => {
        setIsAwaitingAI(true);
        const aiSide = userSide === 'Government' ? 'Opposition' : 'Government';
        const prompt = `You are the ${aiSide} in a debate on the motion: "${motion}". The user is the ${userSide}. Here is the debate transcript so far: ${JSON.stringify(currentTranscript.slice(-4))}. Provide a concise, compelling, and direct counter-argument to the user's last point. Your response should be a single paragraph.`;
        
        try {
            let chatHistory = [{ role: "user", parts: [{ text: prompt }] }];
            const payload = { contents: chatHistory };
            const apiKey = ""; // Leave empty
            const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;
            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            const result = await response.json();
            const aiText = result.candidates[0].content.parts[0].text;
            
            setTranscript(prev => [...prev, { speaker: 'ai', text: aiText }]);
            speak(aiText);
        } catch (error) {
            console.error("Error generating AI response:", error);
            const errorMessage = "I encountered an error and can't respond right now.";
            setTranscript(prev => [...prev, { speaker: 'ai', text: errorMessage }]);
            speak(errorMessage);
        } finally {
            setIsAwaitingAI(false);
        }
    };

    const handleFinishDebate = async () => {
        setDebateState('analyzing');
        synthRef.current.cancel();
        
        const prompt = `You are a world-class debate coach. Analyze the following debate transcript on the motion: "${motion}". The user was the ${userSide}. Provide a detailed analysis in JSON format. The JSON must have keys: "keyStrengths" (an array of 2-3 strings), "areasForImprovement" (an array of 2-3 strings), "bestArgument" (a string summarizing the user's strongest point), and "overallFeedback" (a concise paragraph).`;
        
        const payload = {
            contents: [{ role: "user", parts: [{ text: `${prompt}\n\nTranscript:\n${JSON.stringify(transcript)}` }] }],
            generationConfig: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: "OBJECT",
                    properties: {
                        "keyStrengths": { "type": "ARRAY", "items": { "type": "STRING" } },
                        "areasForImprovement": { "type": "ARRAY", "items": { "type": "STRING" } },
                        "bestArgument": { "type": "STRING" },
                        "overallFeedback": { "type": "STRING" }
                    }
                }
            }
        };

        try {
            const apiKey = ""; // Leave empty
            const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;
            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            const result = await response.json();
            const analysisJson = JSON.parse(result.candidates[0].content.parts[0].text);
            setAnalysis(analysisJson);
            setDebateState('finished');
        } catch (error) {
            console.error("Error generating analysis:", error);
            setAnalysis({ error: "Could not generate analysis." });
            setDebateState('finished');
        }
    };
    
    const handleStartDebate = (side) => {
        if (!motion.trim()) {
            alert("Please enter a motion before starting the debate.");
            return;
        }
        setUserSide(side);
        setDebateState('debating');
        setTranscript([{ speaker: 'system', text: `Debate started. You are the ${side}.` }]);
        setCurrentSpeaker('user');
    };

    const resetDebate = () => {
        setDebateState('setup');
        setTranscript([]);
        setAnalysis(null);
        setUserSide(null);
        setCurrentSpeaker('user');
        setIsAwaitingAI(false);
    };

    const handleBrowseMotions = () => {
        navigate('/browse-motions');
    };

    const renderContent = () => {
        switch (debateState) {
            case 'setup':
                return <SetupView 
                            motion={motion} 
                            setMotion={setMotion} 
                            onStart={handleStartDebate} 
                            onBrowse={handleBrowseMotions} 
                        />;
            case 'debating':
            case 'analyzing':
                return <DebateView 
                            motion={motion} 
                            transcript={transcript}
                            transcriptEndRef={transcriptEndRef}
                            isListening={isListening}
                            isAwaitingAI={isAwaitingAI}
                            currentSpeaker={currentSpeaker}
                            onMicPress={startListening}
                            onFinishDebate={handleFinishDebate}
                            isAnalyzing={debateState === 'analyzing'}
                        />;
            case 'finished':
                return <AnalysisView analysis={analysis} onReset={resetDebate} />;
            default:
                return null;
        }
    };

    return (
        <div className="min-h-screen bg-slate-900 text-white font-sans flex flex-col items-center justify-center p-4 relative">
            <button 
                onClick={() => navigate('/dashboard')} 
                className="absolute top-6 left-6 flex items-center gap-2 text-slate-400 hover:text-teal-400 transition-colors z-20"
            >
                <ArrowLeft size={16} />
                Back to Dashboard
            </button>
            {renderContent()}
        </div>
    );
};

// --- Sub-Components for different states ---

const SetupView = ({ motion, setMotion, onStart, onBrowse }) => (
    <div className="w-full max-w-2xl text-center animate-fade-in">
        <h1 className="text-3xl md:text-4xl font-bold mb-6">Set the Motion</h1>
        
        <div className="mb-6">
            <label htmlFor="motion-input" className="block text-lg font-bold text-teal-400 mb-2">Enter your own motion</label>
            <textarea
                id="motion-input"
                rows="3"
                className="w-full bg-slate-800/50 border border-slate-700 rounded-2xl p-4 text-lg text-white focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-shadow"
                value={motion}
                onChange={(e) => setMotion(e.target.value)}
                placeholder="e.g., This house would..."
            />
        </div>

        <div className="flex items-center my-6">
            <div className="flex-grow border-t border-slate-700"></div>
            <span className="flex-shrink mx-4 text-slate-400">OR</span>
            <div className="flex-grow border-t border-slate-700"></div>
        </div>

        <div className="mb-8">
            <button onClick={onBrowse} className="w-full text-lg font-semibold bg-slate-700/50 hover:bg-slate-700 text-white py-4 px-8 rounded-xl border border-slate-600 transform hover:-translate-y-1 transition-all duration-300 flex items-center justify-center gap-3">
                <BookOpen /> Browse Motion Library
            </button>
        </div>

        <h2 className="text-xl font-bold text-slate-300 mb-4">Choose Your Side</h2>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button onClick={() => onStart('Government')} className="flex-1 text-lg font-semibold bg-gradient-to-r from-teal-500 to-cyan-500 text-white py-4 px-8 rounded-xl shadow-lg shadow-teal-500/20 hover:shadow-teal-500/40 transform hover:-translate-y-1 transition-all duration-300 flex items-center justify-center gap-3">
                <ShieldCheck /> Government
            </button>
            <button onClick={() => onStart('Opposition')} className="flex-1 text-lg font-semibold bg-gradient-to-r from-purple-600 to-indigo-600 text-white py-4 px-8 rounded-xl shadow-lg shadow-purple-500/20 hover:shadow-purple-500/40 transform hover:-translate-y-1 transition-all duration-300 flex items-center justify-center gap-3">
                <Swords /> Opposition
            </button>
        </div>
    </div>
);

const DebateView = ({ motion, transcript, transcriptEndRef, isListening, isAwaitingAI, currentSpeaker, onMicPress, onFinishDebate, isAnalyzing }) => (
    <div className="w-full max-w-4xl h-[90vh] flex flex-col animate-fade-in">
        <div className="text-center mb-4 p-4 bg-slate-800/50 rounded-2xl border border-slate-700">
            <p className="text-sm text-teal-400">Motion</p>
            <h2 className="text-lg font-semibold">{motion}</h2>
        </div>

        <div className="flex-grow bg-slate-800/50 rounded-2xl border border-slate-700 p-4 overflow-y-auto mb-4 custom-scrollbar">
            {transcript.map((item, index) => (
                <div key={index} className={`flex items-start gap-3 my-4 animate-fade-in-up ${item.speaker === 'user' ? 'justify-end' : 'justify-start'}`}>
                    {item.speaker === 'ai' && <div className="w-10 h-10 rounded-full bg-purple-500 flex items-center justify-center flex-shrink-0"><Bot /></div>}
                    <div className={`max-w-md p-3 rounded-2xl ${item.speaker === 'user' ? 'bg-teal-600 rounded-br-none' : 'bg-slate-700 rounded-bl-none'}`}>
                        <p className="text-white">{item.text}</p>
                    </div>
                    {item.speaker === 'user' && <div className="w-10 h-10 rounded-full bg-teal-500 flex items-center justify-center flex-shrink-0"><User /></div>}
                </div>
            ))}
            <div ref={transcriptEndRef} />
        </div>

        <div className="flex-shrink-0 flex flex-col items-center justify-center gap-4">
             <div className="relative w-28 h-28 flex items-center justify-center">
                {currentSpeaker === 'ai' && <div className="absolute inset-0 bg-purple-500 rounded-full animate-ping"></div>}
                {isListening && <div className="absolute inset-0 bg-teal-500 rounded-full animate-ping"></div>}
                <button 
                    onClick={onMicPress} 
                    disabled={isListening || isAwaitingAI || currentSpeaker === 'ai'}
                    className={`w-24 h-24 rounded-full flex items-center justify-center transition-all duration-300 z-10
                        ${isListening ? 'bg-red-500' : 'bg-teal-500'}
                        disabled:bg-slate-600 disabled:cursor-not-allowed
                    `}
                >
                    {isListening ? <MicOff size={40} /> : <Mic size={40} />}
                </button>
            </div>
            <p className="h-6 text-sm text-slate-400">
                {isListening ? "Listening..." : isAwaitingAI ? "AI is thinking..." : currentSpeaker === 'user' ? "Your turn to speak" : "AI is speaking"}
            </p>
            <button 
                onClick={onFinishDebate} 
                disabled={isAnalyzing}
                className="bg-red-600/80 hover:bg-red-600 disabled:bg-red-900/50 disabled:cursor-wait text-white font-bold py-2 px-6 rounded-lg transition-colors flex items-center gap-2"
            >
                {isAnalyzing ? <><Loader2 className="animate-spin" />Analyzing...</> : 'Finish Debate'}
            </button>
        </div>
    </div>
);

const AnalysisView = ({ analysis, onReset }) => (
    <div className="w-full max-w-4xl animate-fade-in">
        <h1 className="text-4xl font-bold text-center mb-6 flex items-center justify-center gap-3"><BrainCircuit className="text-teal-400" />Debate Analysis</h1>
        {analysis.error ? <p className="text-red-400 text-center">{analysis.error}</p> :
            <div className="space-y-6">
                <div className="p-6 bg-slate-800/50 rounded-2xl border border-slate-700">
                    <h2 className="text-xl font-bold text-slate-200 mb-3 flex items-center gap-2"><Sparkles className="text-amber-400" />Overall Feedback</h2>
                    <p className="text-slate-300">{analysis.overallFeedback}</p>
                </div>
                <div className="grid md:grid-cols-2 gap-6">
                    <div className="p-6 bg-slate-800/50 rounded-2xl border border-slate-700">
                        <h2 className="text-xl font-bold text-slate-200 mb-3 flex items-center gap-2"><TrendingUp className="text-green-400" />Key Strengths</h2>
                        <ul className="list-disc list-inside space-y-2 text-slate-300">
                            {analysis.keyStrengths?.map((item, i) => <li key={i}>{item}</li>)}
                        </ul>
                    </div>
                    <div className="p-6 bg-slate-800/50 rounded-2xl border border-slate-700">
                        <h2 className="text-xl font-bold text-slate-200 mb-3 flex items-center gap-2"><Award className="text-teal-400" />Best Argument</h2>
                        <p className="text-slate-300 italic">"{analysis.bestArgument}"</p>
                    </div>
                </div>
                 <div className="p-6 bg-slate-800/50 rounded-2xl border border-slate-700">
                    <h2 className="text-xl font-bold text-slate-200 mb-3 flex items-center gap-2"><X className="text-red-400" />Areas for Improvement</h2>
                    <ul className="list-disc list-inside space-y-2 text-slate-300">
                        {analysis.areasForImprovement?.map((item, i) => <li key={i}>{item}</li>)}
                    </ul>
                </div>
            </div>
        }
        <div className="text-center mt-8">
            <button onClick={onReset} className="text-lg font-semibold bg-gradient-to-r from-teal-500 to-cyan-500 text-white py-3 px-8 rounded-xl shadow-lg shadow-teal-500/20 hover:shadow-teal-500/40 transform hover:-translate-y-1 transition-all duration-300 flex items-center justify-center gap-3 mx-auto">
                <RotateCw /> Debate Again
            </button>
        </div>
    </div>
);

export default OneVOneDebate;
