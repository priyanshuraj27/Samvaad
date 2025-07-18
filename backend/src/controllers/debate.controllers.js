import { DebateSession } from "../models/debateSession.models.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Create a new debate session
const DEBATE_ROLES = {
  AP: [
    { role: "Prime Minister", team: "Government" },
    { role: "Deputy Prime Minister", team: "Government" },
    { role: "Government Whip", team: "Government" },
    { role: "Leader of Opposition", team: "Opposition" },
    { role: "Deputy Leader of Opposition", team: "Opposition" },
    { role: "Opposition Whip", team: "Opposition" },
    { role: "Opposition Reply", team: "Opposition" },
  ],
  WS: [
    { role: "First Speaker (Gov)", team: "Government" },
    { role: "Second Speaker (Gov)", team: "Government" },
    { role: "Third Speaker (Gov)", team: "Government" },
    { role: "First Speaker (Opp)", team: "Opposition" },
    { role: "Second Speaker (Opp)", team: "Opposition" },
    { role: "Third Speaker (Opp)", team: "Opposition" },
  ],
  BP: [
    { role: "Prime Minister", team: "Opening Government" },
    { role: "Deputy Prime Minister", team: "Opening Government" },
    { role: "Leader of Opposition", team: "Opening Opposition" },
    { role: "Deputy Leader of Opposition", team: "Opening Opposition" },
    { role: "Member of Government", team: "Closing Government" },
    { role: "Government Whip", team: "Closing Government" },
    { role: "Member of Opposition", team: "Closing Opposition" },
    { role: "Opposition Whip", team: "Closing Opposition" },
  ],
};

const createSession = asyncHandler(async (req, res) => {
  const { title, debateType, motion, userRole } = req.body;

  if (!title || !debateType || !motion || !userRole) {
    throw new ApiError(400, "title, debateType, motion, and userRole are required");
  }

  const roleMap = DEBATE_ROLES[debateType];
  if (!roleMap) throw new ApiError(400, "Unsupported debate format");

  const participants = roleMap.map(({ role, team }) => {
    if (role === userRole) {
      return {
        name: req.user.name || "You",
        isAI: false,
        role,
        team,
      };
    } else {
      return {
        name: role, // Role is directly the AI name
        isAI: true,
        role,
        team,
      };
    }
  });

  const session = await DebateSession.create({
    title,
    debateType,
    motion,
    user: req.user._id,
    userRole,
    participants,
  });

  // Changed: message and data placement
  return res
    .status(201)
    .json(new ApiResponse(201, "Debate session created", session));
});

// Get all sessions for the logged-in user
const getAllSessions = asyncHandler(async (req, res) => {
  const sessions = await DebateSession.find({ user: req.user._id }).sort({ createdAt: -1 });
  return res.status(200).json(new ApiResponse(200, "Sessions fetched", sessions));
});

// Get a specific session by ID
const getSessionById = asyncHandler(async (req, res) => {
  const session = await DebateSession.findById(req.params.id);
  if (!session) throw new ApiError(404, "Session not found");
  return res.status(200).json(new ApiResponse(200, "Session fetched", session));
});

// Update a session (e.g., add transcript, adjudication)
const updateSession = asyncHandler(async (req, res) => {
  const updated = await DebateSession.findByIdAndUpdate(req.params.id, req.body, { new: true });
  if (!updated) throw new ApiError(404, "Session not found");
  return res.status(200).json(new ApiResponse(200, "Session updated", updated));
});

// Delete a session
const deleteSession = asyncHandler(async (req, res) => {
  const deleted = await DebateSession.findByIdAndDelete(req.params.id);
  if (!deleted) throw new ApiError(404, "Session not found");
  return res.status(200).json(new ApiResponse(200, "Session deleted", {}));
});

const generateAISpeech = asyncHandler(async (req, res) => {
    // 1. Get sessionId from the body, in addition to speakerRole
    const { sessionId, speakerRole } = req.body;

    if (!sessionId || !speakerRole) {
        throw new ApiError(400, "sessionId and speakerRole are required");
    }

    // 2. Fetch the session to get the full context (motion and transcript)
    const session = await DebateSession.findById(sessionId);
    if (!session) {
        throw new ApiError(404, "Debate session not found");
    }

    // 3. Create a transcript history for the prompt
    const transcriptHistory = session.transcript
        .map(entry => `${entry.speaker}: ${entry.text}`)
        .join('\n\n'); // Use double newline for better separation

    // 4. Enhance the prompt with the debate history
    const prompt = `
You are an expert AI debater performing as "${speakerRole}" in a "${session.debateType}" debate.
The motion is: "${session.motion}"

Below is the transcript of the debate so far. Your task is to generate the next speech.
--- DEBATE HISTORY ---
${transcriptHistory}
--- END HISTORY ---

Instructions:
- Your response must be only the speech text for "${speakerRole}".
- Directly address and rebut arguments made by the opposing team from the transcript.
- Advance your own team's case with new analysis or evidence.
- Maintain a formal, persuasive, and structured parliamentary tone.
- The speech should be approximately 850-950 words.
`;

    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const aiSpeech = response.text();

    return res.status(200).json(new ApiResponse(200, "AI speech generated", { text: aiSpeech }));
});
const generatePOI = asyncHandler(async (req, res) => {
  const { targetSpeakerRole, currentSpeech, motion } = req.body;

  if (!targetSpeakerRole || !currentSpeech || !motion) {
    throw new ApiError(400, "Required fields: targetSpeakerRole, currentSpeech, motion");
  }

  const prompt = `
You are an AI debater listening to the speech of "${targetSpeakerRole}" in a parliamentary debate on the motion:
"${motion}".

The speaker just said:
"${currentSpeech}"

Generate a short and sharp Point of Information (POI) — a question or rebuttal that challenges the logic or assumptions of the argument. Keep it under 2 sentences. No explanation, just the POI itself.
`;

  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
  const result = await model.generateContent(prompt);
  const response = await result.response;
  const poi = response.text().trim();

  return res.status(200).json(new ApiResponse(200, "POI generated", { poi }));
});
export {
  createSession,
  getAllSessions,
  getSessionById,
  updateSession,
  deleteSession,
  generateAISpeech,
  generatePOI,
};