import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Mic, Repeat, ArrowLeft, Loader2, Lightbulb, CheckCircle, XCircle, Send } from 'lucide-react';
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
        recognition.onresult = (event) => onResult(event.results[0][0].transcript);
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
            } catch(e) { console.error("Could not start recognition:", e); }
        }
    }, [isListening]);

    return { isListening, startListening };
};

// --- Rebuttal Trainer Page Component ---
const RebuttalTrainer = () => {
    const [gameState, setGameState] = useState('setup'); // 'setup', 'generating', 'ready', 'listening', 'analyzing', 'feedback'
    const [topic, setTopic] = useState('');
    const [opponentArgument, setOpponentArgument] = useState('');
    const [userRebuttal, setUserRebuttal] = useState('');
    const [feedback, setFeedback] = useState(null);
    const navigate = useNavigate();

    const handleTopicSubmit = async (submittedTopic) => {
        if (!submittedTopic.trim()) {
            alert("Please provide a topic.");
            return;
        }
        setTopic(submittedTopic);
        setGameState('generating');
        const prompt = `Generate a single, concise, and debatable argument for a debate on the topic of "${submittedTopic}". The argument should be from a clear perspective (e.g., for or against) and presented as a single paragraph.`;
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
            const argument = result.candidates[0].content.parts[0].text;
            setOpponentArgument(argument);
            setGameState('ready');
        } catch (error) {
            console.error("Error generating argument:", error);
            setOpponentArgument("Failed to generate an argument. Please try again.");
            setGameState('setup');
        }
    };

    const handleRebuttalComplete = async (rebuttalText) => {
        setUserRebuttal(rebuttalText);
        setGameState('analyzing');
        const prompt = `As a debate coach, analyze the following user's rebuttal to an argument.
        Argument Presented: "${opponentArgument}"
        User's Rebuttal: "${rebuttalText}"
        Provide feedback in JSON format. The JSON must have keys: "clarity" (a score out of 10), "relevance" (a score out of 10), "persuasiveness" (a score out of 10), "constructiveFeedback" (a string with one key suggestion for improvement), and "positiveFeedback" (a string highlighting what the user did well).`;

        const payload = {
            contents: [{ role: "user", parts: [{ text: prompt }] }],
            generationConfig: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: "OBJECT",
                    properties: {
                        "clarity": { "type": "NUMBER" },
                        "relevance": { "type": "NUMBER" },
                        "persuasiveness": { "type": "NUMBER" },
                        "constructiveFeedback": { "type": "STRING" },
                        "positiveFeedback": { "type": "STRING" }
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
            setFeedback(analysisJson);
            setGameState('feedback');
        } catch (error) {
            console.error("Error generating feedback:", error);
            setFeedback({ error: "Could not generate feedback." });
            setGameState('feedback');
        }
    };

    const resetTrainer = () => {
        setGameState('setup');
        setTopic('');
        setOpponentArgument('');
        setUserRebuttal('');
        setFeedback(null);
    };

    const renderContent = () => {
        switch (gameState) {
            case 'setup': return <SetupView onTopicSubmit={handleTopicSubmit} />;
            case 'generating': return <LoadingView text="Generating Opponent's Argument..." />;
            case 'ready': return <TrainingView opponentArgument={opponentArgument} onStartListening={() => setGameState('listening')} />;
            case 'listening': return <ListeningView opponentArgument={opponentArgument} onRebuttalComplete={handleRebuttalComplete} />;
            case 'analyzing': return <LoadingView text="Analyzing Your Rebuttal..." />;
            case 'feedback': return <FeedbackView feedback={feedback} opponentArgument={opponentArgument} userRebuttal={userRebuttal} onTryAgain={resetTrainer} />;
            default: return null;
        }
    };

    return (
        <div className="min-h-screen bg-slate-900 text-slate-200 font-sans flex flex-col items-center justify-center p-4 overflow-hidden relative">
            <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-900 to-blue-900/50"></div>
            <button 
                onClick={() => navigate('/dashboard')} 
                className="absolute top-6 left-6 flex items-center gap-2 text-slate-400 hover:text-blue-400 transition-colors z-20"
            >
                <ArrowLeft size={16} />
                Back to Dashboard
            </button>
            <div className="w-full max-w-4xl z-10">
                {renderContent()}
            </div>
        </div>
    );
};

// --- Sub-Components ---

const SetupView = ({ onTopicSubmit }) => {
    const [localTopic, setLocalTopic] = useState('');
    const { isListening, startListening } = useSpeechRecognition((text) => setLocalTopic(text));

    const handleSubmit = (e) => {
        e.preventDefault();
        onTopicSubmit(localTopic);
    };

    return (
        <div className="text-center animate-fade-in">
            <h1 className="text-5xl font-bold text-white mb-2">Rebuttal Trainer</h1>
            <p className="text-blue-300 text-lg mb-10">Sharpen your counter-arguments against an AI opponent.</p>
            <form onSubmit={handleSubmit} className="bg-slate-800/50 border border-slate-700 rounded-2xl p-8 shadow-lg">
                <label htmlFor="topic-input" className="text-xl font-semibold text-white mb-4 block">Enter a topic to debate</label>
                <div className="relative">
                    <textarea
                        id="topic-input"
                        rows="3"
                        value={localTopic}
                        onChange={(e) => setLocalTopic(e.target.value)}
                        className="w-full bg-slate-900/70 border border-slate-600 rounded-lg p-4 pr-12 text-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-shadow resize-none"
                        placeholder="e.g., 'The role of AI in modern art' or 'Universal basic income'"
                    />
                    <button 
                        type="button"
                        onClick={startListening}
                        className={`absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-full transition-colors ${isListening ? 'bg-red-500 text-white animate-pulse' : 'bg-slate-700 hover:bg-blue-600 text-slate-300'}`}
                        title="Speak topic"
                    >
                        <Mic size={20} />
                    </button>
                </div>
                <button type="submit" className="mt-6 w-full text-lg font-semibold bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3 px-8 rounded-lg shadow-lg shadow-blue-500/20 hover:shadow-blue-500/40 transform hover:-translate-y-0.5 transition-all duration-300 flex items-center justify-center gap-3">
                    <Send /> Generate Argument
                </button>
            </form>
        </div>
    );
};

const LoadingView = ({ text }) => (
    <div className="text-center animate-fade-in flex flex-col items-center justify-center gap-4">
        <Loader2 className="w-16 h-16 text-blue-400 animate-spin" />
        <p className="text-2xl font-bold text-white">{text}</p>
    </div>
);

const TrainingView = ({ opponentArgument, onStartListening }) => (
    <div className="animate-fade-in text-center">
        <h2 className="text-2xl font-bold text-slate-300 mb-4">Opponent's Argument</h2>
        <div className="p-6 bg-slate-800/50 border border-slate-700 rounded-2xl mb-8 shadow-lg">
            <p className="text-lg text-white leading-relaxed">{opponentArgument}</p>
        </div>
        <button onClick={onStartListening} className="bg-blue-600 text-white font-bold text-2xl py-4 px-10 rounded-lg hover:bg-blue-500 transition-all duration-300 flex items-center gap-3 mx-auto shadow-lg shadow-blue-500/30">
            <Mic size={28} /> Start Rebuttal (60s)
        </button>
    </div>
);

const ListeningView = ({ opponentArgument, onRebuttalComplete }) => {
    const [timeLeft, setTimeLeft] = useState(60);
    const timerRef = useRef(null);
    const rebuttalTextRef = useRef('');

    const handleSpeechResult = (text) => {
        rebuttalTextRef.current += text + ' ';
    };

    const { isListening, startListening } = useSpeechRecognition(handleSpeechResult);

    useEffect(() => {
        startListening();
        timerRef.current = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
        return () => clearInterval(timerRef.current);
    }, [startListening]);

    useEffect(() => {
        if (timeLeft <= 0) {
            clearInterval(timerRef.current);
            onRebuttalComplete(rebuttalTextRef.current);
        }
    }, [timeLeft, onRebuttalComplete]);

    return (
        <div className="animate-fade-in flex flex-col items-center">
            <p className="text-center text-lg text-slate-400 mb-8 max-w-2xl">{opponentArgument}</p>
            <div className="relative w-48 h-48 flex items-center justify-center">
                <div className="absolute inset-0 border-8 border-slate-700 rounded-full"></div>
                <div 
                    className="absolute inset-0 border-8 border-blue-500 rounded-full"
                    style={{ clipPath: `inset(0 ${100 - (timeLeft / 60) * 100}% 0 0)` , transition: 'clip-path 1s linear'}}
                ></div>
                <div className="relative z-10 flex flex-col items-center">
                    <span className="text-5xl font-bold text-white">{timeLeft}</span>
                    <p className="text-blue-300">Seconds Left</p>
                </div>
            </div>
            <p className="mt-6 text-xl text-white font-semibold flex items-center gap-2">
                <Mic className="text-red-500 animate-pulse" />
                Recording...
            </p>
        </div>
    );
};

const FeedbackView = ({ feedback, onTryAgain }) => {
    const ScoreIndicator = ({ label, score }) => (
        <div>
            <div className="flex justify-between items-baseline mb-1">
                <p className="font-semibold text-slate-300">{label}</p>
                <p className="font-bold text-white">{score}/10</p>
            </div>
            <div className="w-full bg-slate-700 rounded-full h-2.5">
                <div className="bg-gradient-to-r from-blue-500 to-indigo-500 h-2.5 rounded-full" style={{ width: `${score * 10}%` }}></div>
            </div>
        </div>
    );

    return (
        <div className="animate-fade-in space-y-6">
            <h1 className="text-4xl font-bold text-center text-white">Rebuttal Analysis</h1>
            {feedback.error ? <p className="text-red-400 text-center">{feedback.error}</p> :
                <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-8 shadow-lg space-y-8">
                    <div className="grid md:grid-cols-3 gap-8">
                        <ScoreIndicator label="Clarity" score={feedback.clarity} />
                        <ScoreIndicator label="Relevance" score={feedback.relevance} />
                        <ScoreIndicator label="Persuasiveness" score={feedback.persuasiveness} />
                    </div>
                    <div className="grid md:grid-cols-2 gap-6">
                        <div className="p-6 bg-slate-900/50 rounded-lg">
                            <h3 className="font-bold text-xl text-green-400 mb-3 flex items-center gap-2"><CheckCircle />Strengths</h3>
                            <p className="text-slate-300">{feedback.positiveFeedback}</p>
                        </div>
                        <div className="p-6 bg-slate-900/50 rounded-lg">
                            <h3 className="font-bold text-xl text-yellow-400 mb-3 flex items-center gap-2"><Lightbulb />Improvements</h3>
                            <p className="text-slate-300">{feedback.constructiveFeedback}</p>
                        </div>
                    </div>
                </div>
            }
            <div className="text-center">
                <button onClick={onTryAgain} className="bg-blue-600 text-white font-bold text-xl py-3 px-8 rounded-lg hover:bg-blue-500 transition-all duration-300 flex items-center gap-3 mx-auto shadow-lg shadow-blue-500/30">
                    <Repeat /> Try Another Round
                </button>
            </div>
        </div>
    );
};

export default RebuttalTrainer;
