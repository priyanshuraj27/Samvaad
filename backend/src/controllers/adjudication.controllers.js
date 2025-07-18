// adjudication.controllers.js

import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import Adjudication from '../models/adjudication.models.js';
import { DebateSession } from '../models/debateSession.models.js';
import { User } from '../models/user.models.js';
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const PROMPT_1 = `You are an adjudicator for a formal parliamentary debate (Asian/BP/World Schools format).
Given the full transcript of the debate, generate ONLY this partial adjudication JSON structure:
{
  "overallWinner": string,
  "teamRankings": [ { "rank": number, "team": string, "score": number } ],
  "scorecard": {
    [teamName: string]: {
      "matter": number,
      "manner": number,
      "method": number,
      "color": string
    }
  }
}
⚠️ Only return valid JSON. Do NOT include any commentary or markdown (like \`\`\`). Invalid JSON will break the application.`;

const PROMPT_2 = `Now generate the chain of thought analysis in the following format also give winner it should not be unclear:
{
  "chainOfThought": {
    "title": string,
    "clashes": [
      {
        "id": string,
        "title": string,
        "weight": number,
        "winner": string,
        "summary": string
      }
    ]
  }
}
⚠️ Only return valid JSON. Do NOT include any commentary or markdown (like \`\`\`).`;

const PROMPT_3 = `Now generate detailed feedback in the following structure:
{
  "detailedFeedback": {
    "replySpeeches": {
      "proposition": { "speaker": string, "score": number, "summary": string },
      "opposition": { "speaker": string, "score": number, "summary": string }
    },
    "speakers": [
      {
        "name": string,
        "team": string,
        "scores": {
          "matter": number,
          "manner": number,
          "method": number,
          "total": number
        },
        "roleFulfillment": string,
        "rhetoricalAnalysis": string,
        "timestampedComments": [ { "time": string, "comment": string } ]
      }
    ]
  }
}
⚠️ Only return valid JSON. No markdown, explanation, or commentary.`;

export const createAdjudication = asyncHandler(async (req, res) => {
  const { sessionId } = req.body;
  const session = await DebateSession.findById(sessionId);
  if (!session) throw new ApiError(404, 'Debate session not found');

  const adjudicator = req.user._id;
  const transcript = session.transcript || [];
  const formatName = session.format;

  // Convert transcript array to a readable string for the AI
  const transcriptText = transcript.map(
    entry => `[${entry.speaker}] (${entry.type} @ ${entry.timestamp}): ${entry.text}`
  ).join('\n');

  const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

  const cleanMarkdownJson = (text) => {
    const cleaned = text
      .replace(/^```json\s*/i, '')
      .replace(/^```\s*/i, '')
      .replace(/```$/, '')
      .trim();
    return cleaned;
  };

  const getJson = async (prompt) => {
    const chat = model.startChat({
      history: [],
      generationConfig: { temperature: 0.7 },
    });
    await chat.sendMessage(prompt);
    const result = await chat.sendMessage(transcriptText); 
    const rawText = result.response.text().trim();

    try {
      return JSON.parse(cleanMarkdownJson(rawText));
    } catch (err) {
      console.error("AI returned invalid JSON:\n", rawText);
      throw new ApiError(500, `AI response was not valid JSON: ${rawText}`);
    }
  };

  const part1 = await getJson(PROMPT_1);
  const part2 = await getJson(PROMPT_2);
  const part3 = await getJson(PROMPT_3);

  const adjudication = await Adjudication.create({
    session: session._id,
    adjudicator,
    formatName,
    ...part1,
    ...part2,
    ...part3,
  });

  return res
    .status(201)
    .json(new ApiResponse(201, "Adjudication created", adjudication));
});

export const getAllAdjudications = asyncHandler(async (req, res) => {
  const adjudications = await Adjudication.find()
    .populate('session')
    .populate('adjudicator');
  return res.status(200).json(new ApiResponse(200, "Adjudications fetched", adjudications));
});

export const getAdjudicationById = asyncHandler(async (req, res) => {
  const adjudication = await Adjudication.findById(req.params.id)
    .populate('session')
    .populate('adjudicator');
  if (!adjudication) throw new ApiError(404, 'Adjudication not found');
  return res.status(200).json(new ApiResponse(200, "Adjudication fetched", adjudication));
});

export const updateAdjudication = asyncHandler(async (req, res) => {
  const updated = await Adjudication.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
  });
  if (!updated) throw new ApiError(404, 'Adjudication not found');
  return res.status(200).json(new ApiResponse(200, "Adjudication updated", updated));
});

export const deleteAdjudication = asyncHandler(async (req, res) => {
  const deleted = await Adjudication.findByIdAndDelete(req.params.id);
  if (!deleted) throw new ApiError(404, 'Adjudication not found');
  return res.status(200).json(new ApiResponse(200, "Adjudication deleted", null));
});
