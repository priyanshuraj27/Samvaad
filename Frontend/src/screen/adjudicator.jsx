import React, { useState, useEffect } from 'react';
import { Award, ChevronsRight, ArrowLeft, Scale, Presentation, BrainCircuit, UserCheck, Star, MessageSquareQuote, Clock, Users, Shield, Swords } from 'lucide-react';

// --- MOCK DATA STORE ---
// In a real application, this data would be fetched from a database using a debateId.
const mockDatabase = {
  AP: {
    formatName: 'Asian Parliamentary (AP)',
    overallWinner: 'Proposition',
    teamRankings: [
      { rank: 1, team: 'Proposition', score: 221.5 },
      { rank: 2, team: 'Opposition', score: 218.0 },
    ],
    scorecard: {
      proposition: { matter: 45, manner: 46, method: 44.5, total: 135.5, color: 'green' },
      opposition: { matter: 44, manner: 45, method: 43, total: 132, color: 'red' },
    },
    chainOfThought: { 
        title: "AI Adjudicator's Chain-of-Thought Verdict",
        clashes: [
            { id: 1, title: 'Economic Impact of Renewable Energy Subsidies', weight: 40, winner: 'Proposition', summary: 'Proposition successfully argued that long-term economic benefits and job creation outweigh the immediate fiscal costs. Their evidence on green tech market growth was more compelling and recent than Opposition\'s focus on traditional energy sector displacement.'},
            { id: 2, title: 'Social Equity and Access to Clean Energy', weight: 35, winner: 'Proposition', summary: 'While Opposition raised valid points about the regressive nature of some subsidies, Proposition\'s model for community-based solar initiatives provided a stronger, more forward-looking solution to the equity problem.'},
            { id: 3, title: 'Feasibility and Timescale of Transition', weight: 25, winner: 'Opposition', summary: 'Opposition effectively highlighted the logistical and infrastructural hurdles of a rapid transition. Their use of expert testimony on grid limitations was a key point that Proposition failed to adequately rebut.'},
        ]
    },
    detailedFeedback: {
      speakers: [
        { name: 'Alex (PM)', team: 'Proposition', scores: { matter: 46, manner: 47, method: 45, total: 138 }, roleFulfillment: 'Excellent. Clearly set up the debate, defined terms, and presented a strong, coherent case. The roadmap was clear and followed throughout.', rhetoricalAnalysis: 'Used powerful anaphora in the opening to build momentum. The "A future powered by..." repetition was highly effective.', timestampedComments: [{ time: '02:15', comment: 'Strong use of a statistical evidence from the IEA report to substantiate the primary claim.' },{ time: '06:45', comment: 'Effectively handled a Point of Information, turning it into an opportunity to reinforce their own case.' },] },
        { name: 'Ben (LO)', team: 'Opposition', scores: { matter: 45, manner: 46, method: 44, total: 135 }, roleFulfillment: 'Good. Directly clashed with the PM and established the core of the opposition\'s case. Could have been more explicit in outlining the team\'s split.', rhetoricalAnalysis: 'Relied on a strong, confident tone. The use of rhetorical questions was good, but could have been paired with more emotional appeals.', timestampedComments: [{ time: '09:30', comment: 'Excellent point on the unforeseen consequences of subsidy policies, but needed a specific real-world example.' },{ time: '14:00', comment: 'Well-structured rebuttal, but spent slightly too much time on the first point.' },] },
        { name: 'Chloe (DPM)', team: 'Proposition', scores: { matter: 45, manner: 45, method: 44, total: 134 }, roleFulfillment: 'Solid. Rebuilt the case well and introduced new material effectively. The integration of rebuttal and new points was seamless.', rhetoricalAnalysis: 'Great use of a personal anecdote to make the social equity argument more relatable and impactful.', timestampedComments: [{ time: '18:20', comment: 'The explanation of the community solar model was clear and persuasive.' },{ time: '22:50', comment: 'Could have been more aggressive in attacking the opposition\'s main plank on feasibility.' },] },
        { name: 'David (DLO)', team: 'Opposition', scores: { matter: 43, manner: 44, method: 42, total: 129 }, roleFulfillment: 'Fair. Offered good rebuttal but the new material felt disconnected from the leader\'s speech. Needed to better signpost their arguments.', rhetoricalAnalysis: 'Used a logical, step-by-step deconstruction of the proposition\'s main argument, which was effective but a bit dry.', timestampedComments: [{ time: '26:10', comment: 'Strongest point was on the grid infrastructure, well-supported by evidence.' },{ time: '30:05', comment: 'The conclusion felt rushed and did not fully summarize the opposition\'s case.' },] },
        { name: 'Eva (Gov. Whip)', team: 'Proposition', scores: { matter: 44, manner: 45, method: 43, total: 132 }, roleFulfillment: 'Effectively summarized key clashes and crystallized the debate for the government side.', rhetoricalAnalysis: 'Used strong, decisive language in the final minutes.', timestampedComments: [] },
        { name: 'Frank (Opp. Whip)', team: 'Opposition', scores: { matter: 43, manner: 44, method: 44, total: 131 }, roleFulfillment: 'Provided a good overview but could have been more strategic in identifying voting issues.', rhetoricalAnalysis: 'Passionate delivery, but structure could have been clearer.', timestampedComments: [] },
      ],
      replySpeeches: {
        proposition: { speaker: 'Alex (PM)', score: 45, summary: 'Effectively crystallized the main voting issues from the government\'s perspective, clearly contrasting with the opposition\'s world.' },
        opposition: { speaker: 'Ben (LO)', score: 44, summary: 'Provided a passionate summary but missed a key opportunity to frame the central clash around feasibility.' },
      },
      criteria: { /* ... */ }
    },
  },
  WS: {
    formatName: 'World Schools (WS)',
    overallWinner: 'Proposition',
    teamRankings: [
        { rank: 1, team: 'Proposition', score: 221.5 },
        { rank: 2, team: 'Opposition', score: 218.0 },
    ],
    scorecard: {
        proposition: { matter: 45, manner: 46, method: 44.5, total: 135.5, color: 'green' },
        opposition: { matter: 44, manner: 45, method: 43, total: 132, color: 'red' },
    },
    chainOfThought: { 
        title: "AI Adjudicator's Chain-of-Thought Verdict",
        clashes: [
            { id: 1, title: 'Economic Impact of Renewable Energy Subsidies', weight: 40, winner: 'Proposition', summary: 'Proposition successfully argued that long-term economic benefits and job creation outweigh the immediate fiscal costs. Their evidence on green tech market growth was more compelling and recent than Opposition\'s focus on traditional energy sector displacement.'},
            { id: 2, title: 'Social Equity and Access to Clean Energy', weight: 35, winner: 'Proposition', summary: 'While Opposition raised valid points about the regressive nature of some subsidies, Proposition\'s model for community-based solar initiatives provided a stronger, more forward-looking solution to the equity problem.'},
            { id: 3, title: 'Feasibility and Timescale of Transition', weight: 25, winner: 'Opposition', summary: 'Opposition effectively highlighted the logistical and infrastructural hurdles of a rapid transition. Their use of expert testimony on grid limitations was a key point that Proposition failed to adequately rebut.'},
        ]
    },
    detailedFeedback: {
        speakers: [
            { name: 'Alex (1st Prop)', team: 'Proposition', scores: { matter: 46, manner: 47, method: 45, total: 138 }, roleFulfillment: 'Excellent. Clearly set up the debate, defined terms, and presented a strong, coherent case. The roadmap was clear and followed throughout.', rhetoricalAnalysis: 'Used powerful anaphora in the opening to build momentum. The "A future powered by..." repetition was highly effective.', timestampedComments: [{ time: '02:15', comment: 'Strong use of a statistical evidence from the IEA report to substantiate the primary claim.' },{ time: '06:45', comment: 'Effectively handled a Point of Information, turning it into an opportunity to reinforce their own case.' },] },
            { name: 'Ben (1st Opp)', team: 'Opposition', scores: { matter: 45, manner: 46, method: 44, total: 135 }, roleFulfillment: 'Good. Directly clashed with the PM and established the core of the opposition\'s case. Could have been more explicit in outlining the team\'s split.', rhetoricalAnalysis: 'Relied on a strong, confident tone. The use of rhetorical questions was good, but could have been paired with more emotional appeals.', timestampedComments: [{ time: '09:30', comment: 'Excellent point on the unforeseen consequences of subsidy policies, but needed a specific real-world example.' },{ time: '14:00', comment: 'Well-structured rebuttal, but spent slightly too much time on the first point.' },] },
            { name: 'Chloe (2nd Prop)', team: 'Proposition', scores: { matter: 45, manner: 45, method: 44, total: 134 }, roleFulfillment: 'Solid. Rebuilt the case well and introduced new material effectively. The integration of rebuttal and new points was seamless.', rhetoricalAnalysis: 'Great use of a personal anecdote to make the social equity argument more relatable and impactful.', timestampedComments: [{ time: '18:20', comment: 'The explanation of the community solar model was clear and persuasive.' },{ time: '22:50', comment: 'Could have been more aggressive in attacking the opposition\'s main plank on feasibility.' },] },
            { name: 'David (2nd Opp)', team: 'Opposition', scores: { matter: 43, manner: 44, method: 42, total: 129 }, roleFulfillment: 'Fair. Offered good rebuttal but the new material felt disconnected from the leader\'s speech. Needed to better signpost their arguments.', rhetoricalAnalysis: 'Used a logical, step-by-step deconstruction of the proposition\'s main argument, which was effective but a bit dry.', timestampedComments: [{ time: '26:10', comment: 'Strongest point was on the grid infrastructure, well-supported by evidence.' },{ time: '30:05', comment: 'The conclusion felt rushed and did not fully summarize the opposition\'s case.' },] },
            { name: 'Eva (3rd Prop)', team: 'Proposition', scores: { matter: 44, manner: 45, method: 43, total: 132 }, roleFulfillment: 'Strong rebuttal and case extension. Successfully defended the proposition\'s core arguments against sustained attack.', rhetoricalAnalysis: 'Excellent use of humor to disarm an opponent\'s point.', timestampedComments: [] },
            { name: 'Frank (3rd Opp)', team: 'Opposition', scores: { matter: 43, manner: 44, method: 44, total: 131 }, roleFulfillment: 'Focused heavily on rebuttal, which was effective but left their own case underdeveloped.', rhetoricalAnalysis: 'Maintained a calm and composed demeanor under pressure.', timestampedComments: [] },
        ],
        replySpeeches: {
            proposition: { speaker: 'Chloe (2nd Prop)', score: 45, summary: 'A clear, concise, and persuasive summary of the debate from their side\'s perspective.' },
            opposition: { speaker: 'David (2nd Opp)', score: 44, summary: 'Good summary, but could have more directly addressed the "even if" scenarios proposed by the proposition.' },
        },
        criteria: { /* ... */ }
    }
  },
  BP: {
    formatName: 'British Parliamentary (BP)',
    overallWinner: 'Opening Government',
    teamRankings: [
      { rank: 1, team: 'Opening Government', score: 275.5 },
      { rank: 2, team: 'Closing Opposition', score: 272.0 },
      { rank: 3, team: 'Closing Government', score: 271.0 },
      { rank: 4, team: 'Opening Opposition', score: 270.0 },
    ],
    scorecard: {
      'Opening Government': { matter: 45, manner: 46, method: 44.5, total: 135.5, color: 'blue' },
      'Opening Opposition': { matter: 44, manner: 45, method: 43, total: 132, color: 'red' },
      'Closing Government': { matter: 44, manner: 45.5, method: 43.5, total: 133, color: 'cyan' },
      'Closing Opposition': { matter: 45, manner: 46, method: 44, total: 135, color: 'orange' },
    },
    chainOfThought: { /* ... */ },
    detailedFeedback: {
      speakers: [
        { name: 'Alex (PM)', team: 'Opening Government', scores: { matter: 46, manner: 47, method: 45, total: 138 }, roleFulfillment: 'Excellent. Clearly set up the debate, defined terms, and presented a strong, coherent case. The roadmap was clear and followed throughout.', rhetoricalAnalysis: 'Used powerful anaphora in the opening to build momentum. The "A future powered by..." repetition was highly effective.', timestampedComments: [{ time: '02:15', comment: 'Strong use of a statistical evidence from the IEA report to substantiate the primary claim.' },{ time: '06:45', comment: 'Effectively handled a Point of Information, turning it into an opportunity to reinforce their own case.' },] },
        { name: 'Ben (LO)', team: 'Opening Opposition', scores: { matter: 45, manner: 46, method: 44, total: 135 }, roleFulfillment: 'Good. Directly clashed with the PM and established the core of the opposition\'s case. Could have been more explicit in outlining the team\'s split.', rhetoricalAnalysis: 'Relied on a strong, confident tone. The use of rhetorical questions was good, but could have been paired with more emotional appeals.', timestampedComments: [{ time: '09:30', comment: 'Excellent point on the unforeseen consequences of subsidy policies, but needed a specific real-world example.' },{ time: '14:00', comment: 'Well-structured rebuttal, but spent slightly too much time on the first point.' },] },
        { name: 'Chloe (DPM)', team: 'Opening Government', scores: { matter: 45, manner: 45, method: 44, total: 134 }, roleFulfillment: 'Solid. Rebuilt the case well and introduced new material effectively. The integration of rebuttal and new points was seamless.', rhetoricalAnalysis: 'Great use of a personal anecdote to make the social equity argument more relatable and impactful.', timestampedComments: [{ time: '18:20', comment: 'The explanation of the community solar model was clear and persuasive.' },{ time: '22:50', comment: 'Could have been more aggressive in attacking the opposition\'s main plank on feasibility.' },] },
        { name: 'David (DLO)', team: 'Opening Opposition', scores: { matter: 43, manner: 44, method: 42, total: 129 }, roleFulfillment: 'Fair. Offered good rebuttal but the new material felt disconnected from the leader\'s speech. Needed to better signpost their arguments.', rhetoricalAnalysis: 'Used a logical, step-by-step deconstruction of the proposition\'s main argument, which was effective but a bit dry.', timestampedComments: [{ time: '26:10', comment: 'Strongest point was on the grid infrastructure, well-supported by evidence.' },{ time: '30:05', comment: 'The conclusion felt rushed and did not fully summarize the opposition\'s case.' },] },
        { name: 'Eva (Member for Gov)', team: 'Closing Government', scores: { matter: 44, manner: 45.5, method: 43.5, total: 133 }, roleFulfillment: 'Brought a crucial extension that shifted the focus of the back-half. Clearly differentiated from OG.', rhetoricalAnalysis: 'Used a powerful metaphor that was referenced by later speakers.', timestampedComments: [] },
        { name: 'Frank (Member for Opp)', team: 'Closing Opposition', scores: { matter: 45, manner: 46, method: 44, total: 135 }, roleFulfillment: 'Excellent engagement with the CG extension and summarized the entire opposition bench effectively.', rhetoricalAnalysis: 'Strong, authoritative tone.', timestampedComments: [] },
        { name: 'Grace (Gov Whip)', team: 'Closing Government', scores: { matter: 43, manner: 44, method: 43, total: 130 }, roleFulfillment: 'Good summary, but could have more clearly weighed the clashes between CG and CO.', rhetoricalAnalysis: 'Clear and structured delivery.', timestampedComments: [] },
        { name: 'Harry (Opp Whip)', team: 'Closing Opposition', scores: { matter: 44, manner: 45, method: 44, total: 133 }, roleFulfillment: 'Provided a comprehensive summary of the debate from a CO perspective, identifying key voting issues.', rhetoricalAnalysis: 'Passionate and persuasive closing.', timestampedComments: [] },
      ],
      criteria: { /* ... */ }
    },
  },
};

// --- UI COMPONENTS (Card, ScoreBar) remain the same ---

const Card = ({ children, className = '' }) => (
    <div className={`bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-2xl shadow-lg p-6 ${className}`}>
      {children}
    </div>
);

const ScoreBar = ({ label, score, maxScore = 50, color = 'cyan' }) => {
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

const AdjudicationResultsScreen = ({ data, onShowDetails }) => {
  const { formatName, overallWinner, teamRankings, scorecard, chainOfThought } = data;
  const teamColors = { 'Proposition': 'green', 'Opposition': 'red', 'Opening Government': 'blue', 'Opening Opposition': 'red', 'Closing Government': 'cyan', 'Closing Opposition': 'orange' };

  return (
    <div className="min-h-screen bg-gray-900 text-white font-sans p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        <header className="relative text-center mb-8">
            <div>
                <h1 className="text-4xl sm:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-600">
                    AI Adjudication Results
                </h1>
                <p className="text-gray-400 mt-2 text-lg font-semibold">{formatName}</p>
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
                {teamRankings.map(({ rank, team, score }) => (
                  <li key={rank} className={`flex items-center justify-between p-3 bg-gray-700/50 rounded-lg border-l-4 border-${teamColors[team]}-500`}>
                    <span className="text-lg font-bold">{rank}. {team}</span>
                    <span className={`text-xl font-semibold text-cyan-400`}>{score.toFixed(1)}</span>
                  </li>
                ))}
              </ul>
            </Card>
            <Card>
              <h2 className="text-2xl font-semibold mb-4 text-white">Scorecard</h2>
              <div className="space-y-6">
                {Object.entries(scorecard).map(([teamName, scores], index) => (
                    <div key={teamName}>
                        {index > 0 && <div className="border-t border-gray-700 my-4"></div>}
                        <h3 className={`text-xl font-bold mb-3 text-${scores.color}-400`}>{teamName}</h3>
                        <div className="space-y-4">
                            <ScoreBar label="Matter" score={scores.matter} color={scores.color} />
                            <ScoreBar label="Manner" score={scores.manner} color={scores.color} />
                            <ScoreBar label="Method" score={scores.method} color={scores.color} />
                        </div>
                    </div>
                ))}
              </div>
            </Card>
          </div>
          <div className="lg:col-span-2">
            <Card className="h-full flex flex-col">
              <h2 className="text-3xl font-bold mb-4 text-white flex items-center"><BrainCircuit className="mr-3 text-cyan-400" size={32} />{chainOfThought.title}</h2>
              <p className="text-gray-400 mb-6">The AI identifies key points of contention ("clashes"), weighs their importance, and determines which team more effectively argued their side.</p>
              <div className="space-y-4 flex-grow">
                {chainOfThought.clashes.map(clash => (
                  <div key={clash.id} className="border border-gray-700 rounded-lg p-4 bg-gray-900/70 transform hover:scale-[1.02] transition-transform duration-300">
                    <div className="flex flex-col sm:flex-row justify-between sm:items-center mb-2">
                      <h3 className="text-xl font-semibold text-white">{clash.title}</h3>
                      <div className="flex items-center mt-2 sm:mt-0">
                        <span className="text-sm text-gray-400 mr-4">Weight: {clash.weight}%</span>
                        <span className={`px-3 py-1 text-sm font-bold rounded-full bg-${teamColors[clash.winner]}-500/20 text-${teamColors[clash.winner]}-400`}>Won by {clash.winner}</span>
                      </div>
                    </div>
                    <p className="text-gray-300">{clash.summary}</p>
                  </div>
                ))}
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

const DetailedAdjudicationFeedbackScreen = ({ data, onBack, formatName }) => {
    const { speakers, criteria, replySpeeches } = data;
    const teamColors = {'Proposition': 'green', 'Opposition': 'red', 'Opening Government': 'blue', 'Opening Opposition': 'red', 'Closing Government': 'cyan', 'Closing Opposition': 'orange'};
    const SpeakerCard = ({ speaker }) => (
        <div className="bg-gray-800/60 backdrop-blur-sm border border-gray-700 rounded-2xl shadow-lg p-6 space-y-4 transform hover:border-cyan-500 transition-all duration-300">
            <div className="flex justify-between items-start">
                <div>
                    <h3 className="text-2xl font-bold text-white">{speaker.name}</h3>
                    <p className={`font-semibold text-${teamColors[speaker.team]}-400`}>{speaker.team}</p>
                </div>
                <div className="text-right">
                    <p className="text-3xl font-bold text-cyan-400">{speaker.scores.total.toFixed(0)}</p>
                    <p className="text-sm text-gray-400">Total Score</p>
                </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-center">
                <div className="bg-gray-700/50 p-2 rounded-lg"><span className="font-medium text-gray-300">Matter:</span> <span className="font-bold text-white">{speaker.scores.matter}</span></div>
                <div className="bg-gray-700/50 p-2 rounded-lg"><span className="font-medium text-gray-300">Manner:</span> <span className="font-bold text-white">{speaker.scores.manner}</span></div>
                <div className="bg-gray-700/50 p-2 rounded-lg"><span className="font-medium text-gray-300">Method:</span> <span className="font-bold text-white">{speaker.scores.method}</span></div>
            </div>
            <div>
                <h4 className="font-semibold text-lg text-white mb-2 flex items-center"><UserCheck className="mr-2 text-cyan-400" />Role Fulfillment</h4>
                <p className="text-gray-300 bg-gray-900/50 p-3 rounded-md">{speaker.roleFulfillment}</p>
            </div>
             <div>
                <h4 className="font-semibold text-lg text-white mb-2 flex items-center"><MessageSquareQuote className="mr-2 text-cyan-400" />Rhetorical Analysis</h4>
                <p className="text-gray-300 bg-gray-900/50 p-3 rounded-md">{speaker.rhetoricalAnalysis}</p>
            </div>
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
        </div>
    );
    const ReplySpeechCard = ({ team, data }) => (
        <Card>
            <h3 className={`text-xl font-bold mb-3 flex items-center text-${team === 'Proposition' ? 'green' : 'red'}-400`}>
                {team === 'Proposition' ? <Shield className="mr-2"/> : <Swords className="mr-2"/>}
                {team} Reply Speech
            </h3>
            <div className="flex justify-between items-center mb-2 text-gray-400">
                <span>Speaker: <span className="font-semibold text-white">{data.speaker}</span></span>
                <span>Score: <span className="font-bold text-xl text-cyan-400">{data.score}/50</span></span>
            </div>
            <p className="text-gray-300 bg-gray-900/50 p-3 rounded-md">{data.summary}</p>
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
                        <p className="text-gray-400 mt-2 text-lg font-semibold">{formatName}</p>
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
                    <div className={`grid grid-cols-1 lg:grid-cols-2 gap-6`}>
                        {speakers.map(speaker => ( <SpeakerCard key={speaker.name} speaker={speaker} /> ))}
                    </div>
                </section>
            </div>
        </div>
    );
};


// --- MAIN APP CONTROLLER ---

const Adjudicator = () => {
  const [debateData, setDebateData] = useState(null);
  const [currentScreen, setCurrentScreen] = useState('results'); // 'results' or 'details'

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const formatFromUrl = urlParams.get('format');
    const validFormats = ['AP', 'WS', 'BP'];
    const finalFormat = validFormats.includes(formatFromUrl) ? formatFromUrl : 'WS';
    setDebateData(mockDatabase[finalFormat]);
  }, []);

  const handleShowDetails = () => setCurrentScreen('details');
  const handleBackToResults = () => setCurrentScreen('results');

  // Show a loading state until the data is loaded
  if (!debateData) {
      return (
          <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center justify-center">
              <BrainCircuit className="text-cyan-400 mb-6 animate-pulse" size={64} />
              <p className="text-xl text-gray-400">Loading Adjudication Results...</p>
          </div>
      );
  }

  switch (currentScreen) {
    case 'details':
      return <DetailedAdjudicationFeedbackScreen data={debateData.detailedFeedback} onBack={handleBackToResults} formatName={debateData.formatName} />;
    case 'results':
    default:
      return <AdjudicationResultsScreen data={debateData} onShowDetails={handleShowDetails} />;
  }
};

export default Adjudicator;
