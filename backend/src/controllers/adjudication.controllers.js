// adjudication.controllers.js

import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import Adjudication from '../models/adjudication.models.js';
import { DebateSession } from '../models/debateSession.models.js';
import { User } from '../models/user.models.js';
import { GoogleGenerativeAI } from '@google/generative-ai';
import fs from 'fs';
import path from 'path';

// Validate API key on startup
if (!process.env.GEMINI_API_KEY) {
  console.error('GEMINI_API_KEY environment variable is not set');
  throw new Error('GEMINI_API_KEY is required');
}

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

// Helper function to extract text from PDF
const extractTextFromPDF = async (filePath) => {
  try {
    // Dynamic import for pdf-parse
    const { default: pdfParse } = await import('pdf-parse');
    
    // Check if file exists
    if (!fs.existsSync(filePath)) {
      throw new Error('PDF file not found');
    }
    
    const dataBuffer = fs.readFileSync(filePath);
    
    // Validate that it's actually a PDF
    if (dataBuffer.length === 0) {
      throw new Error('PDF file is empty');
    }
    
    const data = await pdfParse(dataBuffer);
    
    if (!data.text || data.text.trim().length === 0) {
      throw new Error('No readable text found in PDF');
    }
    
    return data.text;
  } catch (error) {
    console.error('PDF extraction error:', error);
    throw new ApiError(500, `Failed to extract text from PDF: ${error.message}. Please ensure the PDF contains readable text.`);
  }
};

// Helper function to read text file
const readTextFile = (filePath) => {
  try {
    // Check if file exists
    if (!fs.existsSync(filePath)) {
      throw new Error('Text file not found');
    }
    
    const content = fs.readFileSync(filePath, 'utf8');
    
    if (!content || content.trim().length === 0) {
      throw new Error('Text file is empty');
    }
    
    return content;
  } catch (error) {
    console.error('Text file reading error:', error);
    throw new ApiError(500, `Failed to read text file: ${error.message}`);
  }
};

// Helper function to clean up uploaded file
const cleanupFile = (filePath) => {
  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      console.log(`Cleaned up file: ${filePath}`);
    }
  } catch (error) {
    console.error('Failed to cleanup file:', error);
  }
};

// Helper function to determine file type
const getFileType = (filename) => {
  const ext = path.extname(filename).toLowerCase();
  if (ext === '.pdf') return 'application/pdf';
  if (ext === '.txt') return 'text/plain';
  return null;
};

// Helper function to validate file
const validateFile = (file) => {
  const allowedTypes = ['application/pdf', 'text/plain'];
  const maxSize = 10 * 1024 * 1024; // 10MB
  
  if (!file) {
    throw new ApiError(400, 'No file uploaded');
  }
  
  const fileType = getFileType(file.originalname);
  if (!fileType || !allowedTypes.includes(fileType)) {
    throw new ApiError(400, 'Invalid file type. Only PDF and TXT files are allowed.');
  }
  
  if (file.size > maxSize) {
    throw new ApiError(400, 'File size too large. Maximum size is 10MB.');
  }
  
  return fileType;
};

// Enhanced error handling for AI requests
const makeAIRequest = async (prompt, transcriptText, retries = 3) => {
  const model = genAI.getGenerativeModel({ 
    model: 'gemini-2.0-flash',
    generationConfig: {
      temperature: 0.7,
      maxOutputTokens: 8192,
    }
  });

  const cleanMarkdownJson = (text) => {
    const cleaned = text
      .replace(/^```json\s*/i, '')
      .replace(/^```\s*/i, '')
      .replace(/```$/, '')
      .trim();
    return cleaned;
  };

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      console.log(`AI Request attempt ${attempt}/${retries}`);
      
      // Add timeout to the request
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Request timeout after 60 seconds')), 60000);
      });

      const requestPromise = (async () => {
        const chat = model.startChat({
          history: [],
        });
        
        await chat.sendMessage(prompt);
        const result = await chat.sendMessage(transcriptText);
        return result.response.text().trim();
      })();

      const rawText = await Promise.race([requestPromise, timeoutPromise]);

      try {
        const jsonResponse = JSON.parse(cleanMarkdownJson(rawText));
        console.log(`AI Request successful on attempt ${attempt}`);
        return jsonResponse;
      } catch (parseErr) {
        console.error(`JSON Parse error on attempt ${attempt}:`, parseErr);
        console.error("AI returned invalid JSON:\n", rawText.substring(0, 500));
        
        if (attempt === retries) {
          throw new ApiError(500, `AI response was not valid JSON after ${retries} attempts: ${rawText.substring(0, 200)}...`);
        }
        continue;
      }

    } catch (error) {
      console.error(`AI Request error on attempt ${attempt}:`, error);
      
      // Check for specific error types
      if (error.message?.includes('API key')) {
        throw new ApiError(500, 'Invalid or missing API key. Please check your GEMINI_API_KEY configuration.');
      }
      
      if (error.message?.includes('quota') || error.message?.includes('rate limit')) {
        throw new ApiError(429, 'API rate limit exceeded. Please try again later.');
      }
      
      if (error.message?.includes('timeout')) {
        console.log(`Request timed out on attempt ${attempt}`);
        if (attempt === retries) {
          throw new ApiError(504, 'AI service is taking too long to respond. Please try again later.');
        }
        // Wait before retrying on timeout
        await new Promise(resolve => setTimeout(resolve, 2000 * attempt));
        continue;
      }
      
      if (error.message?.includes('fetch failed') || error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
        console.log(`Network error on attempt ${attempt}:`, error.message);
        if (attempt === retries) {
          throw new ApiError(503, 'Unable to connect to AI service. Please check your internet connection and try again.');
        }
        // Wait before retrying on network error
        await new Promise(resolve => setTimeout(resolve, 3000 * attempt));
        continue;
      }
      
      // For other errors, don't retry
      if (attempt === retries) {
        throw new ApiError(500, `AI service error: ${error.message}`);
      }
    }
  }
};

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

  if (!transcriptText.trim()) {
    throw new ApiError(400, 'Debate session has no transcript data');
  }

  console.log('Starting AI adjudication for session:', sessionId);
  console.log('Transcript length:', transcriptText.length, 'characters');

  try {
    const part1 = await makeAIRequest(PROMPT_1, transcriptText);
    const part2 = await makeAIRequest(PROMPT_2, transcriptText);
    const part3 = await makeAIRequest(PROMPT_3, transcriptText);

    const adjudication = await Adjudication.create({
      session: session._id,
      adjudicator,
      formatName,
      ...part1,
      ...part2,
      ...part3,
    });

    console.log('Adjudication created successfully for session:', sessionId);

    return res
      .status(201)
      .json(new ApiResponse(201, "Adjudication created", adjudication));

  } catch (error) {
    console.error('Error in createAdjudication:', error);
    throw error;
  }
});

export const createAdjudicationFromUpload = asyncHandler(async (req, res) => {
  console.log('=== Upload Request Debug Info ===');
  console.log('Body:', req.body);
  console.log('File:', req.file);
  console.log('Files:', req.files);
  console.log('Headers:', req.headers);
  console.log('Content-Type:', req.get('Content-Type'));
  console.log('================================');

  const { formatName, motion, teams } = req.body;
  
  // More detailed file validation
  if (!req.file) {
    console.log('No file found in request');
    throw new ApiError(400, 'No file uploaded. Please ensure you selected a file and it is properly attached to the "transcript" field.');
  }
  
  // Validate file
  const fileType = validateFile(req.file);
  
  if (!formatName) {
    throw new ApiError(400, 'Format name is required');
  }

  const adjudicator = req.user._id;
  let transcriptText = '';
  const filePath = req.file.path;

  try {
    console.log(`Processing ${fileType} file: ${filePath}`);
    console.log(`File size: ${req.file.size} bytes`);
    
    // Extract text based on file type
    if (fileType === 'application/pdf') {
      transcriptText = await extractTextFromPDF(filePath);
    } else if (fileType === 'text/plain') {
      transcriptText = readTextFile(filePath);
    }

    console.log(`Extracted text length: ${transcriptText.length} characters`);

    if (!transcriptText.trim()) {
      throw new ApiError(400, 'The uploaded file appears to be empty or contains no readable text');
    }

    console.log('Starting AI adjudication process for uploaded file...');
    
    const part1 = await makeAIRequest(PROMPT_1, transcriptText);
    const part2 = await makeAIRequest(PROMPT_2, transcriptText);
    const part3 = await makeAIRequest(PROMPT_3, transcriptText);

    const adjudication = await Adjudication.create({
      session: null,
      adjudicator,
      formatName,
      motion: motion || 'Motion not specified',
      teams: teams ? JSON.parse(teams) : undefined,
      transcriptSource: 'upload',
      originalFileName: req.file.originalname,
      ...part1,
      ...part2,
      ...part3,
    });

    console.log('Adjudication created successfully for uploaded file');

    return res
      .status(201)
      .json(new ApiResponse(201, "Adjudication created from uploaded transcript", adjudication));

  } catch (error) {
    console.error('Error in createAdjudicationFromUpload:', error);
    throw error;
  } finally {
    cleanupFile(filePath);
  }
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
