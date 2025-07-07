import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useLocation, Link, useNavigate } from 'react-router-dom';
import toast, { Toaster } from 'react-hot-toast';
import {
  Timer,
  Play,
  Pause,
  SkipForward,
  Info,
  ChevronUp,
  ChevronDown,
  MessageSquare,
  RotateCcw,
  Zap,
  Mic,
  Speaker,
  Hand,
  Check,
  X,
  BookOpen,
} from 'lucide-react';

// Helper to get minutes from a string like "7 minutes"
const getMinutesFromString = (timeString) => {
  const match = timeString.match(/\d+/);
  return match ? parseInt(match[0], 10) : 0;
};

// Helper to safely display content that *might* be an object and needs stringifying, or is already a string
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

// --- WSDebateScreen Component ---
const WSDebateScreen = () => {
  const location = useLocation();
  const navigate = useNavigate();
  // Default World Schools format if not provided via location.state
  const initialDebateSetup = location.state || {
    motion: "This House Believes That Economic Sanctions Are an Effective Tool for Promoting Democracy.", // Default motion for WS
    userRole: "Proposition 1", // Default user role
    formatDetails: {
      name: "World Schools",
      prepTime: "30 minutes", // Common for prepared motions
      speechTime: "8 minutes", // For main speeches
      replySpeechTime: "4 minutes", // For reply speeches
      speakerOrder: [
        "Proposition 1",
        "Opposition 1",
        "Proposition 2",
        "Opposition 2",
        "Proposition 3",
        "Opposition 3",
        "Opposition Reply",
        "Proposition Reply",
      ],
      rules: [
        "3 speakers per team plus reply speeches.",
        "Main speeches are 8 minutes, reply speeches are 4 minutes.",
        "Preparation time for some motions (e.g., 30 minutes), impromptu for others (not simulated for impromptu prep).",
        "Points of Information (POIs) are allowed during the middle 6 minutes of main speeches (protected time of 1 minute at start and end).",
        "POIs are NOT allowed during reply speeches.",
        "Speakers must present arguments, rebut opposing points, and build their team's case.",
        "Reply speeches summarize and weigh the debate, and cannot introduce new arguments.",
      ],
      speakerRolesDetailed: [
        { role: "Proposition 1", description: "Defines the motion, outlines the Proposition's case, and presents initial arguments." },
        { role: "Opposition 1", description: "Rebuts Proposition 1, defines the Opposition's stance, and presents initial opposition arguments." },
        { role: "Proposition 2", description: "Rebuts Opposition 1, reinforces the Proposition's case, and introduces new arguments." },
        { role: "Opposition 2", description: "Rebuts Proposition 2, reinforces the Opposition's case, and introduces new opposition arguments." },
        { role: "Proposition 3", description: "Rebuts Opposition 2, reinforces the Proposition's case, and introduces new arguments. Must also summarize." },
        { role: "Opposition 3", description: "Rebuts Proposition 3, reinforces the Opposition's case, and introduces new opposition arguments. Must also summarize." },
        { role: "Opposition Reply", description: "Summarizes the Opposition's case and explains why Opposition should win. No new arguments allowed. Delivered by O1 or O2." },
        { role: "Proposition Reply", description: "Summarizes the Proposition's case and explains why Proposition should win. No new arguments allowed. Delivered by P1 or P2." },
      ],
    },
  };

  const [debateSetup, setDebateSetup] = useState(initialDebateSetup);

  const [currentMotion, setCurrentMotion] = useState('');
  const [userRole, setUserRole] = useState('');

  const [speakerOrder, setSpeakerOrder] = useState([]);
  const [currentSpeakerIndex, setCurrentSpeakerIndex] = useState(0);
  const [isPrepTime, setIsPrepTime] = useState(true);
  const [timer, setTimer] = useState(0);
  const [isActive, setIsActive] = useState(false);
  const timerRef = useRef(null);
  const [mainSpeechDuration, setMainSpeechDuration] = useState(0); // For 8-min speeches
  const [replySpeechDuration, setReplySpeechDuration] = useState(0); // For 4-min speeches
  const protectedTimeDuration = 60; // 1 minute at the start and end of main speeches

  const [showRules, setShowRules] = useState(false);
  const [showRoles, setShowRoles] = useState(false);

  const [userPoiAvailability, setUserPoiAvailability] = useState(false);
  const [aiPoiOfferActive, setAiPoiOfferActive] = useState(false);
  const [aiOfferingPoiRole, setAiOfferingPoiRole] = useState(null);

  // State for transcript and user input
  const [transcript, setTranscript] = useState([]);
  const [userSpeechInput, setUserSpeechInput] = useState('');
  const transcriptEndRef = useRef(null); // Ref for auto-scrolling transcript

  // Helper to add entries to the transcript
  const addTranscriptEntry = useCallback((speaker, text, type = 'speech') => {
    const now = new Date();
    const timestamp = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    setTranscript((prev) => [...prev, { speaker, text, timestamp, type }]);
  }, []);

  useEffect(() => {
    if (transcriptEndRef.current) {
      transcriptEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [transcript]);


  useEffect(() => {
    if (debateSetup) {
      console.log("Debate Setup Received in WS Debate Screen:", debateSetup);
      setCurrentMotion(debateSetup.motion);
      setUserRole(debateSetup.userRole);

      const format = debateSetup.formatDetails;
      const parsedSpeakerOrder = format.speakerOrder.map(roleString => {
        let team = '';
        if (roleString.includes('Proposition')) {
          team = 'Proposition Team';
        } else if (roleString.includes('Opposition')) {
          team = 'Opposition Team';
        }
        return { role: roleString, team: team };
      });
      setSpeakerOrder(parsedSpeakerOrder);
      console.log("Parsed Speaker Order:", parsedSpeakerOrder);

      const prepMinutes = getMinutesFromString(debateSetup.formatDetails.prepTime);
      const mainSpeechMinutes = getMinutesFromString(debateSetup.formatDetails.speechTime);
      const replySpeechMinutes = getMinutesFromString(debateSetup.formatDetails.replySpeechTime);

      setTimer(prepMinutes * 60);
      setMainSpeechDuration(mainSpeechMinutes * 60);
      setReplySpeechDuration(replySpeechMinutes * 60);

      setAiPoiOfferActive(false);
      setAiOfferingPoiRole(null);
      setUserPoiAvailability(false);

      // Initialize transcript with motion
      addTranscriptEntry('Moderator', `The motion for today's World Schools debate is: "${safeDisplay(debateSetup.motion)}".`, 'info');

    } else {
      console.warn("No debate setup found for WS Debate Screen. Using default setup.");
      // If no setup is passed, the initialDebateSetup will be used.
      // No redirect needed as we have a default.
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [debateSetup, addTranscriptEntry]);


  useEffect(() => {
    if (!debateSetup || (timer === 0 && !isActive && !isPrepTime && currentSpeakerIndex === 0 && speakerOrder.length > 0)) {
      return;
    }

    const isReplySpeech = currentSpeakerIndex >= 6; // Opposition Reply (index 6), Proposition Reply (index 7)
    const currentSpeechDuration = isReplySpeech ? replySpeechDuration : mainSpeechDuration;

    if (isActive && timer > 0) {
      timerRef.current = setInterval(() => {
        setTimer((prevTime) => prevTime - 1);
      }, 1000);
    } else if (timer === 0 && isActive) {
      clearInterval(timerRef.current);
      setIsActive(false);
      setAiPoiOfferActive(false);
      setAiOfferingPoiRole(null);

      if (isPrepTime) {
        toast.success("Prep time is over! The debate is about to begin.", {
          duration: 4000,
          position: 'top-center',
          icon: '🚀',
        });
        addTranscriptEntry('Moderator', 'Preparation time has ended. The debate is about to begin.');
        setIsPrepTime(false);
        setTimer(mainSpeechDuration); // Start with main speech duration
        if (speakerOrder.length > 0) {
          setIsActive(true);
          // Add AI's initial speech if it's their turn
          const currentSpeaker = speakerOrder[currentSpeakerIndex];
          const userRoleBase = userRole.split(' (')[0];
          if (currentSpeaker && currentSpeaker.role !== userRoleBase) {
            addTranscriptEntry(safeDisplay(currentSpeaker.role), `(Simulated AI Speech) Good morning, Madam/Mr. Speaker, fellow debaters. I stand here as the ${safeDisplay(currentSpeaker.role)} to begin our case.`, 'speech');
          }
        }
        setUserPoiAvailability(false);
      } else {
        toast('Speech time is over!', {
          icon: '🔔',
          duration: 3000,
          position: 'top-right',
        });
        addTranscriptEntry(currentSpeaker?.role || 'Speaker', 'Speech time has concluded.', 'info');

        if (currentSpeakerIndex === speakerOrder.length - 1) {
          handleDebateConcluded();
        }
      }
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [isActive, timer, isPrepTime, mainSpeechDuration, replySpeechDuration, currentSpeakerIndex, speakerOrder.length, debateSetup, addTranscriptEntry, userRole, speakerOrder]);


  const isInProtectedTime = useCallback(() => {
    if (isPrepTime || !isActive || !debateSetup) return false;

    const isReplySpeechCurrent = currentSpeakerIndex >= 6; // Reply speeches start from index 6
    if (isReplySpeechCurrent) return true; // POIs are not allowed during reply speeches

    const initialSpeechDuration = mainSpeechDuration; // POI protected time only applies to main speeches
    const remainingTime = timer;
    const elapsedSpeechTime = initialSpeechDuration - timer;

    return (
      elapsedSpeechTime < protectedTimeDuration ||
      remainingTime <= protectedTimeDuration
    );
  }, [isPrepTime, isActive, timer, protectedTimeDuration, mainSpeechDuration, currentSpeakerIndex, debateSetup]);


  useEffect(() => {
    if (!debateSetup) return;

    const currentSpeaker = speakerOrder[currentSpeakerIndex];
    const userRoleBase = userRole.split(' (')[0];
    const userIsCurrentSpeaker = currentSpeaker && (currentSpeaker.role === userRoleBase);

    // AI only offers POI if the user is currently speaking AND user has allowed POIs AND it's not protected time
    if (isActive && !isPrepTime && userIsCurrentSpeaker && userPoiAvailability && !aiPoiOfferActive && !isInProtectedTime()) {
      const offerChance = Math.random();
      if (offerChance < 0.03) { // 3% chance for AI to offer a POI every second
        const aiOpponents = speakerOrder.filter(s => s.team !== currentSpeaker.team && s.role !== userRoleBase);
        if (aiOpponents.length > 0) {
          const randomAi = aiOpponents[Math.floor(Math.random() * aiOpponents.length)];
          setAiOfferingPoiRole(randomAi.role);
          setAiPoiOfferActive(true);
          toast.info(`${safeDisplay(randomAi.role)} is offering a POI!`, {
            duration: 5000,
            position: 'top-center',
            icon: '✋',
          });
          addTranscriptEntry(safeDisplay(randomAi.role), 'Offering a Point of Information!', 'poi-offer');
        }
      }
    }
  }, [isActive, isPrepTime, currentSpeakerIndex, userRole, speakerOrder, userPoiAvailability, aiPoiOfferActive, isInProtectedTime, debateSetup, addTranscriptEntry]);


  const toggleTimer = () => {
    if (!debateSetup || (timer === 0 && !isActive && speakerOrder.length === 0 && !isPrepTime)) return;

    setIsActive(!isActive);
    if (!isActive) {
      toast.success('Timer Started!', {
        position: 'bottom-center',
        duration: 1000,
      });
      if (!isPrepTime) { // If it's speech time and timer starts, add a transcript entry
        addTranscriptEntry(currentSpeaker?.role || 'Speaker', 'Speech resumed.', 'info');
      } else {
        addTranscriptEntry('Moderator', 'Preparation timer started.', 'info');
      }
    } else {
      toast('Timer Paused.', {
        icon: '⏸️',
        position: 'bottom-center',
        duration: 1000,
      });
      if (!isPrepTime) { // If it's speech time and timer pauses, add a transcript entry
        addTranscriptEntry(currentSpeaker?.role || 'Speaker', 'Speech paused.', 'info');
      } else {
        addTranscriptEntry('Moderator', 'Preparation timer paused.', 'info');
      }
    }
  };

  const resetTimer = () => {
    clearInterval(timerRef.current);
    timerRef.current = null;
    setIsActive(false);
    setAiPoiOfferActive(false); // Reset POI offer state
    setAiOfferingPoiRole(null); // Reset POI offer state

    if (debateSetup) {
      if (isPrepTime) {
        setTimer(getMinutesFromString(debateSetup.formatDetails.prepTime) * 60);
        toast('Prep time timer reset!', {
          icon: '🔄',
          position: 'bottom-center',
          duration: 1500,
        });
        addTranscriptEntry('Moderator', 'Preparation timer reset.', 'info');
      } else {
        const isReplySpeechCurrent = currentSpeakerIndex >= 6;
        setTimer(isReplySpeechCurrent ? replySpeechDuration : mainSpeechDuration);
        toast('Speech timer reset!', {
          icon: '🔄',
          position: 'bottom-center',
          duration: 1500,
        });
        addTranscriptEntry(currentSpeaker?.role || 'Speaker', 'Speech timer reset.', 'info');
      }
    } else {
      setTimer(0);
      toast.error('Cannot reset timer: Debate setup not loaded.', {
        position: 'bottom-center',
        duration: 2000,
      });
    }
  };


  const handleNextSpeaker = () => {
    clearInterval(timerRef.current);
    timerRef.current = null;
    setIsActive(false);
    setAiPoiOfferActive(false); // Reset POI offer state
    setAiOfferingPoiRole(null); // Reset POI offer state
    setUserPoiAvailability(false); // Reset user POI availability
    setUserSpeechInput(''); // Clear user speech input

    if (isPrepTime) {
      toast.success("Prep time skipped! Starting first speech.", {
        duration: 3000,
        position: 'top-center',
        icon: '⏩',
      });
      addTranscriptEntry('Moderator', 'Preparation time skipped. Moving to first speech.', 'info');
      setIsPrepTime(false);
      setCurrentSpeakerIndex(0);
      setTimer(mainSpeechDuration); // Start with main speech duration
      setIsActive(true); // Start timer for the first speaker
      const nextSpeaker = speakerOrder[0];
      const userRoleBase = userRole.split(' (')[0];
      if (nextSpeaker && nextSpeaker.role !== userRoleBase) {
        addTranscriptEntry(safeDisplay(nextSpeaker.role), `(Simulated AI Speech) Good morning, Madam/Mr. Speaker, fellow debaters. I stand here as the ${safeDisplay(nextSpeaker.role)} to begin our case.`, 'speech');
      }
    } else if (currentSpeakerIndex < speakerOrder.length - 1) {
      addTranscriptEntry('Moderator', `${currentSpeaker?.role}'s speech concluded.`, 'info');
      setCurrentSpeakerIndex(prevIndex => prevIndex + 1);

      const nextSpeakerIndex = currentSpeakerIndex + 1;
      const isNextSpeakerReply = nextSpeakerIndex >= 6; // Reply speeches start from index 6
      setTimer(isNextSpeakerReply ? replySpeechDuration : mainSpeechDuration);
      setIsActive(true); // Start timer for the next speaker

      toast.success(`Next up: ${safeDisplay(speakerOrder[nextSpeakerIndex]?.role)}!`, {
        icon: '➡️',
        duration: 2000,
        position: 'top-right',
      });
      const nextSpeaker = speakerOrder[nextSpeakerIndex];
      const userRoleBase = userRole.split(' (')[0];

      if (nextSpeaker && nextSpeaker.role !== userRoleBase) {
        if (isNextSpeakerReply) {
          addTranscriptEntry(safeDisplay(nextSpeaker.role), `(Simulated AI Speech) Thank you. As the ${safeDisplay(nextSpeaker.role)}, I will now summarize our case and explain why we should win.`, 'speech');
        } else {
          addTranscriptEntry(safeDisplay(nextSpeaker.role), `(Simulated AI Speech) Thank you. As the ${safeDisplay(nextSpeaker.role)}, I will now continue our case and rebut the opposition.`, 'speech');
        }
      }
    } else {
      handleDebateConcluded();
    }
  };

  const handleDebateConcluded = () => {
    addTranscriptEntry('Moderator', 'The debate has concluded. All speeches are complete.', 'info');
    toast.custom((t) => (
      <div
        className={`${
          t.visible ? 'animate-enter' : 'animate-leave'
        } max-w-md w-full bg-white shadow-lg rounded-lg pointer-events-auto flex ring-1 ring-black ring-opacity-5`}
      >
        <div className="flex-1 w-0 p-4">
          <div className="flex items-start">
            <div className="flex-shrink-0 pt-0.5">
              <Zap className="h-6 w-6 text-green-500" />
            </div>
            <div className="ml-3 flex-1">
              <p className="text-lg font-medium text-gray-900">
                Debate Concluded!
              </p>
              <p className="mt-1 text-sm text-gray-500">
                All speeches completed. You can now go back to the setup screen.
              </p>
            </div>
          </div>
        </div>
        <div className="flex border-l border-gray-200">
          <button
            onClick={() => {
              toast.dismiss(t.id);
            }}
            className="w-full border border-transparent rounded-none rounded-r-lg p-4 flex items-center justify-center text-sm font-medium text-indigo-600 hover:text-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            Close
          </button>
        </div>
      </div>
    ), { duration: Infinity });
  };

  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const currentSpeaker = speakerOrder[currentSpeakerIndex];
  // Ensure userRole is correctly parsed for comparison (e.g., "Proposition 1")
  const userRoleBase = userRole.split(' (')[0];
  const userIsCurrentSpeaker = currentSpeaker && (currentSpeaker.role === userRoleBase);

  console.log("Current Speaker (before render):", currentSpeaker);

  const handleUserOfferPoi = () => {
    if (!currentSpeaker || !isActive || isInProtectedTime()) return; // Prevent offering if not active or in protected time
    toast.info("You offered a POI!", {
      duration: 2000,
      position: 'bottom-center',
      icon: '🙋',
    });
    addTranscriptEntry(userRoleBase, 'Offering a Point of Information!', 'poi-offer');

    // Simulate AI response to user's POI offer
    setTimeout(() => {
      const aiAccepts = Math.random() < 0.5; // 50% chance AI accepts
      if (aiAccepts) {
        toast.success(`${safeDisplay(currentSpeaker.role)} accepts your POI! (Simulated response: 'Yes, on that point...')`, {
          duration: 4000,
          position: 'bottom-center',
          icon: '✅',
        });
        addTranscriptEntry(safeDisplay(currentSpeaker.role), 'Yes, on that point...', 'poi-response');
        addTranscriptEntry(userRoleBase, '(Simulated: User delivers POI)', 'poi-delivery');
        addTranscriptEntry(safeDisplay(currentSpeaker.role), '(Simulated: AI responds to POI)', 'poi-response');
      } else {
        toast.error(`${safeDisplay(currentSpeaker.role)} declines your POI. (Simulated response: 'No thank you.')`, {
          duration: 3000,
          position: 'bottom-center',
          icon: '❌',
        });
        addTranscriptEntry(safeDisplay(currentSpeaker.role), 'No thank you.', 'poi-response');
      }
    }, 1500);
  };

  const handleAiPoiResponse = (accepted) => {
    setAiPoiOfferActive(false);
    setAiOfferingPoiRole(null);
    if (accepted) {
      toast.success("You accepted the POI! (Simulated AI point: 'Don't you agree that X is problematic?')", {
        duration: 5000,
        position: 'top-center',
        icon: '🤔',
      });
      addTranscriptEntry(userRoleBase, 'I accept the Point of Information.', 'poi-response');
      addTranscriptEntry(safeDisplay(aiOfferingPoiRole), "Don't you agree that X is problematic?", 'poi-delivery');
      addTranscriptEntry(userRoleBase, '(Simulated: User responds to POI)', 'poi-response');
    } else {
      toast.error("You declined the POI.", {
        duration: 3000,
        position: 'top-center',
        icon: '🙅',
      });
      addTranscriptEntry(userRoleBase, 'I decline the Point of Information.', 'poi-response');
    }
  };

  const handleUserSpeechSubmit = () => {
    if (userSpeechInput.trim() === '') {
      toast.error("Please enter some text for your speech.", { position: 'bottom-center' });
      return;
    }
    addTranscriptEntry(userRoleBase, userSpeechInput, 'speech');
    setUserSpeechInput('');
    toast.success("Your speech has been added to the transcript!", { position: 'bottom-center' });
  };


  // Render loading state if debateSetup is not available yet
  if (!debateSetup) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center justify-center p-4">
        <h1 className="text-4xl text-amber-400">Loading World Schools Debate...</h1>
        <p className="mt-4 text-gray-300">Setting up your debate environment.</p>
        <Link to="/" className="mt-6 px-6 py-3 bg-blue-600 rounded-md hover:bg-blue-700 text-white font-semibold shadow-lg transition duration-300">
          Go to Setup Screen
        </Link>
      </div>
    );
  }

  const isReplySpeechCurrentSpeaker = currentSpeakerIndex >= 6; // Indices for Opposition Reply (6) and Proposition Reply (7)

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-950 text-gray-100 flex flex-col lg:flex-row items-stretch font-inter">
      <Toaster />

      {/* Left Pane: Debate Info & Controls */}
      <div className="lg:w-2/5 p-6 sm:p-8 bg-gray-800 border-r border-gray-700 shadow-xl flex flex-col justify-between">
        <div>
          <h1 className="text-4xl sm:text-5xl font-extrabold text-white mb-6 text-center lg:text-left">
            <span className="text-emerald-400">WS</span> Debate Live
          </h1>

          <div className="mb-8 p-4 bg-gray-900 rounded-lg border border-gray-700 shadow-md">
            <h2 className="text-xl font-semibold text-gray-200 mb-2 flex items-center">
              <Info className="w-5 h-5 mr-2 text-blue-400" /> Current Motion
            </h2>
            <p className="text-lg text-amber-200 font-medium">{safeDisplay(currentMotion)}</p>
          </div>

          <div className="mb-8 p-4 bg-gray-900 rounded-lg border border-gray-700 shadow-md">
            <h2 className="text-xl font-semibold text-gray-200 mb-2 flex items-center">
              <Timer className="w-5 h-5 mr-2 text-purple-400" /> Debate Phase
            </h2>
            <p className="text-2xl font-bold text-white text-center mb-4">
              {isPrepTime ? 'Preparation Time' : isReplySpeechCurrentSpeaker ? 'Reply Speech Time' : 'Main Speech Time'}
            </p>
            <div className="text-6xl font-mono font-bold text-center text-teal-400">
              {formatTime(timer)}
            </div>
            <div className="flex justify-center gap-4 mt-6">
              <button
                onClick={toggleTimer}
                className="p-3 bg-blue-600 hover:bg-blue-700 rounded-full shadow-lg transition duration-200 text-white"
                title={isActive ? 'Pause Timer' : 'Start Timer'}
              >
                {isActive ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6" />}
              </button>
              <button
                onClick={resetTimer}
                className="p-3 bg-red-600 hover:bg-red-700 rounded-full shadow-lg transition duration-200 text-white"
                title="Reset Timer"
              >
                <RotateCcw className="w-6 h-6" />
              </button>
              {/* Next Speaker button always available */}
              <button
                onClick={handleNextSpeaker}
                className="p-3 bg-green-600 hover:bg-green-700 rounded-full shadow-lg transition duration-200 text-white"
                title={isPrepTime ? 'Skip Prep & Start Debate' : 'Next Speaker'}
              >
                <SkipForward className="w-6 h-6" />
              </button>
            </div>
          </div>

          {/* POI Management Section */}
          <div className="mb-8 p-4 bg-gray-900 rounded-lg border border-gray-700 shadow-md">
            <h2 className="text-xl font-semibold text-gray-200 mb-3 flex items-center">
              <MessageSquare className="w-5 h-5 mr-2 text-orange-400" /> Points of Information
            </h2>
            {isPrepTime || !currentSpeaker ? (
              // Case 1: During prep time or no speaker yet
              <p className="text-gray-400 italic">POIs are not available during prep time or before debate starts.</p>
            ) : isReplySpeechCurrentSpeaker ? (
              // Case 2: During reply speeches, POIs are not allowed
              <p className="text-gray-400 italic">POIs are not allowed during reply speeches.</p>
            ) : userIsCurrentSpeaker ? (
              // Case 3: User is speaking (controls POI availability)
              <>
                <div className="flex items-center justify-between">
                  <span className="text-lg text-gray-300">Allow POIs:</span>
                  <button
                    onClick={() => {
                      setUserPoiAvailability(!userPoiAvailability);
                      if (!userPoiAvailability) {
                        toast.info("You are now accepting POIs.", { position: 'bottom-center' });
                      } else {
                        toast("You are no longer accepting POIs.", { icon: '🚫', position: 'bottom-center' });
                      }
                    }}
                    // Disable if timer is paused OR if it's in protected time
                    disabled={!isActive || isInProtectedTime()}
                    className={`px-4 py-2 rounded-md font-semibold transition duration-200 ${
                      userPoiAvailability ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'
                    } ${(!isActive || isInProtectedTime()) ? 'opacity-50 cursor-not-allowed' : ''} text-white`}
                  >
                    {userPoiAvailability ? 'Active' : 'Inactive'}
                  </button>
                </div>
                {/* Conditionally show messages ONLY if it's speech time and timer is active */}
                {!isActive && !isPrepTime && (
                  <p className="text-sm text-gray-400 mt-2">POIs can only be toggled when the timer is active.</p>
                )}
                {isInProtectedTime() && isActive && !isPrepTime && (
                  <p className="text-sm text-red-300 mt-2">POIs are disabled during protected time.</p>
                )}

                {aiPoiOfferActive && (
                  <div className="mt-4 p-3 bg-blue-800 rounded-md flex flex-col items-center">
                    <p className="text-amber-200 text-lg font-semibold mb-2">{safeDisplay(aiOfferingPoiRole)} is offering a POI!</p>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleAiPoiResponse(true)}
                        className="px-4 py-2 bg-green-500 rounded-md hover:bg-green-600 text-white flex items-center"
                      >
                        <Check className="w-5 h-5 mr-1" /> Accept
                      </button>
                      <button
                        onClick={() => handleAiPoiResponse(false)}
                        className="px-4 py-2 bg-red-500 rounded-md hover:bg-red-600 text-white flex items-center"
                      >
                        <X className="w-5 h-5 mr-1" /> Decline
                      </button>
                    </div>
                  </div>
                )}
              </>
            ) : (
              // Case 4: AI is speaking (user can offer POI)
              <>
                <div className="flex items-center justify-between">
                  <span className="text-lg text-gray-300">Offer POI:</span>
                  <button
                    onClick={handleUserOfferPoi}
                    // Disable if timer is paused OR if it's in protected time
                    disabled={!isActive || isInProtectedTime()}
                    className={`px-4 py-2 rounded-md font-semibold transition duration-200 ${
                      (!isActive || isInProtectedTime()) ? 'bg-gray-600 opacity-50 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'
                    } text-white flex items-center`}
                  >
                    <Hand className="w-5 h-5 mr-2" /> Offer POI
                  </button>
                </div>
                {/* Conditionally show messages ONLY if it's speech time and timer is active */}
                {!isActive && !isPrepTime && (
                  <p className="text-sm text-gray-400 mt-2">Cannot offer POI when the timer is paused.</p>
                )}
                {isInProtectedTime() && isActive && !isPrepTime && (
                  <p className="text-sm text-red-300 mt-2">Cannot offer POI during protected time.</p>
                )}
                <p className="text-sm text-gray-400 mt-2">
                  (Simulated: AI will decide to accept or decline your POI.)
                </p>
              </>
            )}
          </div>

          {/* User Speech Input Section */}
          {userIsCurrentSpeaker && !isPrepTime && (
            <div className="mb-8 p-4 bg-gray-900 rounded-lg border border-gray-700 shadow-md">
              <h2 className="text-xl font-semibold text-gray-200 mb-3 flex items-center">
                <Mic className="w-5 h-5 mr-2 text-green-400" /> Your Speech
              </h2>
              <textarea
                className="w-full p-3 bg-gray-700 text-gray-100 rounded-md border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-y min-h-[80px]"
                placeholder="Type your speech here..."
                value={userSpeechInput}
                onChange={(e) => setUserSpeechInput(e.target.value)}
                disabled={!isActive} // Disable input if timer is not active
              ></textarea>
              <button
                onClick={handleUserSpeechSubmit}
                className={`mt-3 w-full px-4 py-2 rounded-md font-semibold transition duration-200 text-white flex items-center justify-center ${
                  !isActive || userSpeechInput.trim() === '' ? 'bg-gray-600 opacity-50 cursor-not-allowed' : 'bg-purple-600 hover:bg-purple-700'
                }`}
                disabled={!isActive || userSpeechInput.trim() === ''}
              >
                <BookOpen className="w-5 h-5 mr-2" /> Add to Transcript
              </button>
              {!isActive && (
                <p className="text-sm text-gray-400 mt-2">Start the timer to add your speech.</p>
              )}
            </div>
          )}

          {/* Debate Transcript Section */}
          <div className="mb-8 p-6 bg-gray-900 rounded-lg border border-gray-700 shadow-md flex-grow flex flex-col">
            <h3 className="text-2xl font-semibold text-gray-200 mb-4 flex items-center">
              <BookOpen className="w-6 h-6 mr-2 text-indigo-400" /> Debate Transcript
            </h3>
            <div className="flex-grow overflow-y-auto pr-2" style={{ maxHeight: '400px' }}>
              {transcript.length === 0 ? (
                <p className="text-gray-400 italic">Transcript will appear here as the debate progresses.</p>
              ) : (
                <div className="space-y-4">
                  {transcript.map((entry, index) => (
                    <div key={index} className={`p-3 rounded-lg ${
                      entry.type === 'user' ? 'bg-blue-900' :
                      entry.type === 'ai' ? 'bg-purple-900' :
                      entry.type === 'poi-offer' ? 'bg-orange-900' :
                      entry.type === 'poi-response' ? 'bg-teal-900' :
                      entry.type === 'poi-delivery' ? 'bg-yellow-900' :
                      'bg-gray-700'
                    }`}>
                      <p className="text-sm text-gray-400 mb-1">{entry.timestamp}</p>
                      <p className="font-semibold text-lg text-white">
                        <span className={`${
                          entry.speaker === userRoleBase ? 'text-emerald-300' :
                          entry.speaker === 'Moderator' ? 'text-red-300' :
                          'text-blue-300'
                        }`}>{safeDisplay(entry.speaker)}:</span> {safeDisplay(entry.text)}
                      </p>
                    </div>
                  ))}
                  <div ref={transcriptEndRef} />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Back to Setup Button */}
        <Link to="/" className="mt-8 block w-full text-center px-6 py-3 bg-indigo-700 rounded-md hover:bg-indigo-800 text-white font-semibold shadow-md transition duration-300">
          Back to Setup Screen
        </Link>
      </div>

      {/* Right Pane: Debate Details & Speaker Flow */}
      <div className="lg:w-3/5 p-6 sm:p-8 bg-gray-900 flex flex-col">
        <h2 className="text-3xl sm:text-4xl font-extrabold text-white mb-6 text-center">
          Debate Flow & Information
        </h2>

        {/* Current Speaker Section */}
        <div className="mb-8 p-6 bg-gray-800 rounded-lg border border-gray-600 shadow-lg text-center flex flex-col items-center">
          <h3 className="text-2xl font-bold text-gray-200 mb-3">Current Speaker</h3>
          {currentSpeaker ? (
            <>
              {userIsCurrentSpeaker ? (
                <Mic className="w-16 h-16 text-emerald-400 mb-4 animate-bounce" />
              ) : (
                <Speaker className="w-16 h-16 text-blue-400 mb-4 animate-pulse" />
              )}
              <p className="text-4xl font-extrabold text-yellow-400 mb-2">
                {safeDisplay(currentSpeaker.role)}
              </p>
              <p className="text-xl text-gray-300">
                ({safeDisplay(currentSpeaker.team)})
              </p>
              {userIsCurrentSpeaker && (
                <p className="mt-3 text-lg font-semibold text-green-300 animate-pulse">
                  It's your turn!
                </p>
              )}
            </>
          ) : (
            <p className="text-xl text-gray-400">Waiting for debate to start...</p>
          )}
        </div>

        {/* Speaker Order */}
        <div className="mb-8 p-6 bg-gray-800 rounded-lg border border-gray-600 shadow-lg">
          <h3 className="text-2xl font-semibold text-gray-200 mb-4">Speaker Order:</h3>
          <ol className="space-y-2 text-lg">
            {speakerOrder.map((speaker, index) => {
              return (
                <li
                  key={index}
                  className={`
                    p-3 rounded-md flex items-center justify-between ${
                      index === currentSpeakerIndex
                      ? 'bg-emerald-700 text-white font-bold shadow-md transform scale-105 transition-all duration-300'
                      : 'bg-gray-700 text-gray-300'
                    }
                  `}
                >
                  <span>
                    {index + 1}. {safeDisplay(speaker.role)}
                    ({safeDisplay(speaker.team)})
                  </span>
                  {index === currentSpeakerIndex && (
                    <Zap className="w-5 h-5 text-yellow-300 animate-bounce" />
                  )}
                </li>
              );
            })}
          </ol>
        </div>


        {/* Rules Section */}
        <div className="mb-8 p-6 bg-gray-800 rounded-lg border border-gray-600 shadow-lg">
          <button
            onClick={() => setShowRules(!showRules)}
            className="w-full flex justify-between items-center text-xl font-semibold text-gray-200 hover:text-white transition-colors duration-200 pb-4 border-b border-gray-700"
          >
            WS Debate Rules
            {showRules ? <ChevronUp className="w-6 h-6" /> : <ChevronDown className="w-6 h-6" />}
          </button>
          {showRules && (
            <ul className="list-disc list-inside space-y-2 text-gray-300 mt-4">
              {debateSetup.formatDetails?.rules?.map((rule, index) => (
                <li key={index} className="text-base">{safeDisplay(rule)}</li>
              ))}
            </ul>
          )}
        </div>

        {/* Detailed Speaker Roles Section */}
        <div className="mb-8 p-6 bg-gray-800 rounded-lg border border-gray-600 shadow-lg">
          <button
            onClick={() => setShowRoles(!showRoles)}
            className="w-full flex justify-between items-center text-xl font-semibold text-gray-200 hover:text-white transition-colors duration-200 pb-4 border-b border-gray-700"
          >
            Detailed Speaker Roles
            {showRoles ? <ChevronUp className="w-6 h-6" /> : <ChevronDown className="w-6 h-6" />}
          </button>
          {showRoles && (
            <ul className="list-disc list-inside space-y-3 text-gray-300 mt-4">
              {debateSetup.formatDetails?.speakerRolesDetailed?.map((roleDetail, index) => (
                <li key={index} className="text-base">
                  <span className="font-semibold text-blue-300">{safeDisplay(roleDetail.role)}:</span> {safeDisplay(roleDetail.description)}
                </li>
              ))}
            </ul>
          )}
        </div>

      </div>
    </div>
  );
};

export default WSDebateScreen;
