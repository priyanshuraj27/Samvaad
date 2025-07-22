import React, { useState, useEffect } from 'react';
import { useSearchParams, useParams } from 'react-router-dom';
import { Award, ChevronsRight, ArrowLeft, Scale, Presentation, BrainCircuit, UserCheck, Star, MessageSquareQuote, Clock, Users, Shield, Swords } from 'lucide-react';
import axiosInstance from '../utils/axiosinstance';

// --- UI COMPONENTS (Card, ScoreBar) ---
const Card = ({ children, className = '' }) => (
    <div className={`bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-2xl shadow-lg p-6 ${className}`}>
      {children}
    </div>
);

const ScoreBar = ({ label, score, maxScore = 100, color = 'cyan' }) => {
    const colorClasses = {
        cyan: 'from-cyan-500 to-blue-500',
        green: 'from-green-500 to-emerald-500',
        red: 'from-red-500 to-rose-500',
        blue: 'from-blue-500 to-indigo-500',
        orange: 'from-orange-500 to-amber-500',
    };
    return (
        <div>
            <div className="flex justify-between items-center mb-1 text-gray-300">
                <span className="font-medium">{label}</span>
                <span className={`text-lg font-bold text-${color}-400`}>{score}</span>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-2.5">
                <div className={`bg-gradient-to-r ${colorClasses[color]} h-2.5 rounded-full`} style={{ width: `${(score / maxScore) * 100}%` }}></div>
            </div>
        </div>
    );
};

// --- SCREENS ---

const AdjudicationResultsScreen = ({ data, onShowDetails, backUrl = "/dashboard" }) => {
  const { overallWinner, teamRankings, scorecard, chainOfThought } = data;
  const teamColors = { 'Government': 'blue', 'Opposition': 'red', 'Proposition': 'green' };

  return (
    <div className="min-h-screen bg-gray-900 text-white font-sans p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        <header className="relative text-center mb-8">
            <a href={backUrl} className="absolute left-0 top-1/2 -translate-y-1/2 inline-flex items-center px-4 py-2 font-bold text-white bg-gray-700 rounded-lg hover:bg-gray-600 transition-colors duration-300">
                <ArrowLeft className="mr-2" size={20} /> Back
            </a>
            <div>
                <h1 className="text-4xl sm:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-600">
                    AI Adjudication Results
                </h1>
            </div>
        </header>
        <main className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1 flex flex-col gap-6">
            <Card>
              <h2 className="text-2xl font-semibold mb-4 text-white flex items-center"><Award className="mr-3 text-yellow-400" />Overall Winner</h2>
              <div className="text-center py-6 bg-gray-700/50 rounded-lg"><p className="text-4xl font-bold text-yellow-400">{overallWinner}</p></div>
            </Card>
            <Card>
              <h2 className="text-2xl font-semibold mb-4 text-white">Team Rankings</h2>
              <ul className="space-y-3">
                {teamRankings && teamRankings.map(({ rank, team, score }) => (
                  <li key={rank} className={`flex items-center justify-between p-3 bg-gray-700/50 rounded-lg border-l-4 border-${teamColors[team] || 'cyan'}-500`}>
                    <span className="text-lg font-bold">{rank}. {team}</span>
                    <span className={`text-xl font-semibold text-cyan-400`}>{score}</span>
                  </li>
                ))}
              </ul>
            </Card>
            <Card>
              <h2 className="text-2xl font-semibold mb-4 text-white">Scorecard</h2>
              <div className="space-y-6">
                {scorecard && Object.entries(scorecard).map(([teamName, scores], index) => (
                    <div key={teamName}>
                        {index > 0 && <div className="border-t border-gray-700 my-4"></div>}
                        <h3 className={`text-xl font-bold mb-3 text-${scores.color || 'cyan'}-400`}>{teamName}</h3>
                        <div className="space-y-4">
                            <ScoreBar label="Matter" score={scores.matter} color={scores.color || 'cyan'} />
                            <ScoreBar label="Manner" score={scores.manner} color={scores.color || 'cyan'} />
                            <ScoreBar label="Method" score={scores.method} color={scores.color || 'cyan'} />
                        </div>
                    </div>
                ))}
              </div>
            </Card>
          </div>
          <div className="lg:col-span-2">
            <Card className="h-full flex flex-col">
              <h2 className="text-3xl font-bold mb-4 text-white flex items-center">
                <BrainCircuit className="mr-3 text-cyan-400" size={32} />
                {chainOfThought?.title || 'Chain of Thought Analysis'}
              </h2>
              <p className="text-gray-400 mb-6">The AI identifies key points of contention ("clashes"), weighs their importance, and determines which team more effectively argued their side.</p>
              <div className="space-y-4 flex-grow">
                {chainOfThought?.clashes?.map((clash, index) => (
                  <div key={clash.id || index} className="border border-gray-700 rounded-lg p-4 bg-gray-900/70 transform hover:scale-[1.02] transition-transform duration-300">
                    <div className="flex flex-col sm:flex-row justify-between sm:items-center mb-2">
                      <h3 className="text-xl font-semibold text-white">{clash.title}</h3>
                      <div className="flex items-center mt-2 sm:mt-0">
                        <span className="text-sm text-gray-400 mr-4">
                          Weight: {typeof clash.weight === 'number' ? `${Math.round(clash.weight * 100)}%` : clash.weight}
                        </span>
                        <span className={`px-3 py-1 text-sm font-bold rounded-full bg-${teamColors[clash.winner] || 'gray'}-500/20 text-${teamColors[clash.winner] || 'gray'}-400`}>
                          {clash.winner ? `Won by ${clash.winner}` : 'Unclear'}
                        </span>
                      </div>
                    </div>
                    <p className="text-gray-300">{clash.summary}</p>
                  </div>
                )) || (
                  <div className="text-center text-gray-400 py-8">
                    <p>Chain of thought analysis not available for this adjudication.</p>
                  </div>
                )}
              </div>
              <div className="mt-8 text-center">
                <button onClick={onShowDetails} className="inline-flex items-center px-8 py-3 font-bold text-lg text-white bg-gradient-to-r from-cyan-500 to-blue-600 rounded-lg hover:from-cyan-600 hover:to-blue-700 transition-all duration-300 transform hover:scale-105 shadow-lg">
                  View Detailed Feedback <ChevronsRight className="ml-2" />
                </button>
              </div>
            </Card>
          </div>
        </main>
      </div>
    </div>
  );
};

const DetailedAdjudicationFeedbackScreen = ({ data, onBack }) => {
    const { speakers, replySpeeches } = data || {};
    const teamColors = {'Government': 'blue', 'Opposition': 'red', 'Proposition': 'green'};
    
    const SpeakerCard = ({ speaker }) => (
        <div className="bg-gray-800/60 backdrop-blur-sm border border-gray-700 rounded-2xl shadow-lg p-6 space-y-4 transform hover:border-cyan-500 transition-all duration-300">
            <div className="flex justify-between items-start">
                <div>
                    <h3 className="text-2xl font-bold text-white">{speaker.name}</h3>
                    <p className={`font-semibold text-${teamColors[speaker.team] || 'cyan'}-400`}>{speaker.team}</p>
                </div>
                <div className="text-right">
                    <p className="text-3xl font-bold text-cyan-400">{speaker.scores?.total || 'N/A'}</p>
                    <p className="text-sm text-gray-400">Total Score</p>
                </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-center">
                <div className="bg-gray-700/50 p-2 rounded-lg"><span className="font-medium text-gray-300">Matter:</span> <span className="font-bold text-white">{speaker.scores?.matter || 'N/A'}</span></div>
                <div className="bg-gray-700/50 p-2 rounded-lg"><span className="font-medium text-gray-300">Manner:</span> <span className="font-bold text-white">{speaker.scores?.manner || 'N/A'}</span></div>
                <div className="bg-gray-700/50 p-2 rounded-lg"><span className="font-medium text-gray-300">Method:</span> <span className="font-bold text-white">{speaker.scores?.method || 'N/A'}</span></div>
            </div>
            {speaker.roleFulfillment && (
                <div>
                    <h4 className="font-semibold text-lg text-white mb-2 flex items-center"><UserCheck className="mr-2 text-cyan-400" />Role Fulfillment</h4>
                    <p className="text-gray-300 bg-gray-900/50 p-3 rounded-md">{speaker.roleFulfillment}</p>
                </div>
            )}
            {speaker.rhetoricalAnalysis && (
                <div>
                    <h4 className="font-semibold text-lg text-white mb-2 flex items-center"><MessageSquareQuote className="mr-2 text-cyan-400" />Rhetorical Analysis</h4>
                    <p className="text-gray-300 bg-gray-900/50 p-3 rounded-md">{speaker.rhetoricalAnalysis}</p>
                </div>
            )}
            {speaker.timestampedComments && speaker.timestampedComments.length > 0 && (
                <div>
                    <h4 className="font-semibold text-lg text-white mb-2 flex items-center"><Clock className="mr-2 text-cyan-400" />Timestamped Comments</h4>
                    <ul className="space-y-2">
                        {speaker.timestampedComments.map((item, index) => (
                            <li key={index} className="flex items-start text-gray-300">
                                <span className="bg-cyan-500/20 text-cyan-400 font-mono text-xs px-2 py-1 rounded-md mr-3">{item.time}</span>
                                <span>{item.comment}</span>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
    
    const ReplySpeechCard = ({ team, data }) => (
        <Card>
            <h3 className={`text-xl font-bold mb-3 flex items-center text-${team === 'Proposition' ? 'green' : 'red'}-400`}>
                {team === 'Proposition' ? <Shield className="mr-2"/> : <Swords className="mr-2"/>}
                {team} Reply Speech
            </h3>
            <div className="flex justify-between items-center mb-2 text-gray-400">
                <span>Speaker: <span className="font-semibold text-white">{data?.speaker || 'N/A'}</span></span>
                <span>Score: <span className="font-bold text-xl text-cyan-400">{data?.score || 'N/A'}</span></span>
            </div>
            <p className="text-gray-300 bg-gray-900/50 p-3 rounded-md">{data?.summary || 'No summary available'}</p>
        </Card>
    );
    
    return (
        <div className="min-h-screen bg-gray-900 text-white font-sans p-4 sm:p-6 lg:p-8">
            <div className="max-w-7xl mx-auto">
                <header className="relative text-center mb-8">
                    <button onClick={onBack} className="absolute left-0 top-1/2 -translate-y-1/2 inline-flex items-center px-4 py-2 font-bold text-white bg-gray-700 rounded-lg hover:bg-gray-600 transition-colors duration-300">
                        <ArrowLeft className="mr-2" size={20} /> Back
                    </button>
                    <div>
                        <h1 className="text-4xl sm:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-600">
                            Detailed Feedback
                        </h1>
                    </div>
                </header>
                {replySpeeches && (
                     <section className="mb-10">
                        <h2 className="text-2xl font-bold text-white mb-4">Reply Speeches</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <ReplySpeechCard team="Proposition" data={replySpeeches.proposition} />
                            <ReplySpeechCard team="Opposition" data={replySpeeches.opposition} />
                        </div>
                    </section>
                )}
                <section>
                    <h2 className="text-2xl font-bold text-white mb-4">Speaker-by-Speaker Analysis</h2>
                    {speakers && speakers.length > 0 ? (
                        <div className={`grid grid-cols-1 lg:grid-cols-2 gap-6`}>
                            {speakers.map((speaker, index) => ( 
                                <SpeakerCard key={speaker.name || index} speaker={speaker} /> 
                            ))}
                        </div>
                    ) : (
                        <div className="text-center text-gray-400 py-8">
                            <p>No detailed speaker feedback available for this adjudication.</p>
                        </div>
                    )}
                </section>
            </div>
        </div>
    );
};

// --- MAIN APP CONTROLLER ---

const Adjudicator = () => {
  const [debateData, setDebateData] = useState(null);
  const [currentScreen, setCurrentScreen] = useState('results');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Handle both URL params and search params
  const [searchParams] = useSearchParams();
  const params = useParams();
  
  const sessionId = searchParams.get('sessionId');
  const adjudicationId = params.id;

  useEffect(() => {
    const fetchAdjudication = async () => {
      try {
        setLoading(true);
        setError(null);
        
        let response;
        
        if (sessionId) {
          // Session-based adjudication (existing flow)
          response = await axiosInstance.post('/adjudications/', {
            sessionId
          });
        } else if (adjudicationId) {
          // Direct adjudication by ID (uploaded file flow)
          response = await axiosInstance.get(`/adjudications/${adjudicationId}`);
        } else {
          throw new Error('No session ID or adjudication ID provided');
        }
        
        setDebateData(response.data.data);
      } catch (err) {
        console.error('Error fetching adjudication:', err);
        setError(err.response?.data?.message || 'Failed to load adjudication data');
        setDebateData(null);
      } finally {
        setLoading(false);
      }
    };

    if (sessionId || adjudicationId) {
      fetchAdjudication();
    } else {
      setLoading(false);
      setError('No adjudication identifier provided');
    }
  }, [sessionId, adjudicationId]);

  const handleShowDetails = () => setCurrentScreen('details');
  const handleBackToResults = () => setCurrentScreen('results');

  // Determine back URL based on the source
  const backUrl = sessionId ? "/dashboard" : "/custom-adjudicator";

  if (loading) {
      return (
          <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center justify-center">
              <BrainCircuit className="text-cyan-400 mb-6 animate-pulse" size={64} />
              <p className="text-xl text-gray-400">Loading Adjudication Results...</p>
          </div>
      );
  }

  if (error) {
      return (
          <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center justify-center">
              <div className="text-center max-w-md">
                  <div className="bg-red-900/50 border border-red-700 text-red-300 px-6 py-8 rounded-lg mb-6">
                      <h1 className="text-2xl font-bold mb-2">Error Loading Adjudication</h1>
                      <p>{error}</p>
                  </div>
                  <a href={backUrl} className="inline-flex items-center px-4 py-2 font-bold text-white bg-gray-700 rounded-lg hover:bg-gray-600 transition-colors duration-300">
                      <ArrowLeft className="mr-2" size={20} /> Go Back
                  </a>
              </div>
          </div>
      );
  }

  if (!debateData) {
      return (
          <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center justify-center">
              <div className="text-center max-w-md">
                  <h1 className="text-2xl font-bold mb-4">Adjudication Not Found</h1>
                  <p className="text-gray-400 mb-6">The requested adjudication could not be found.</p>
                  <a href={backUrl} className="inline-flex items-center px-4 py-2 font-bold text-white bg-gray-700 rounded-lg hover:bg-gray-600 transition-colors duration-300">
                      <ArrowLeft className="mr-2" size={20} /> Go Back
                  </a>
              </div>
          </div>
      );
  }

  switch (currentScreen) {
    case 'details':
      return <DetailedAdjudicationFeedbackScreen data={debateData.detailedFeedback} onBack={handleBackToResults} />;
    case 'results':
    default:
      return <AdjudicationResultsScreen data={debateData} onShowDetails={handleShowDetails} backUrl={backUrl} />;
  }
};

export default Adjudicator;
