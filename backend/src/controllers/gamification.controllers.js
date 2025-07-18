import { Gamification, LEVELS } from "../models/gamification.models.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";

// Get gamification info for the logged-in user
export const getGamification = asyncHandler(async (req, res) => {
  let gamification = await Gamification.findOne({ user: req.user._id });
  if (!gamification) {
    gamification = await Gamification.create({ user: req.user._id }); // xp defaults to 75
  }
  return res.status(200).json(new ApiResponse(200, "Gamification data fetched", gamification));
});

// Add XP to the logged-in user and update level/name accordingly
export const addXP = asyncHandler(async (req, res) => {
  const { xp } = req.body;
  if (typeof xp !== "number" || xp <= 0) {
    throw new ApiError(400, "XP must be a positive number");
  }
  let gamification = await Gamification.findOne({ user: req.user._id });
  if (!gamification) {
    // Create if not exists
    gamification = new Gamification({ user: req.user._id, xp: 0 });
  }
  gamification.xp += xp;
  await gamification.save();
  return res.status(200).json(new ApiResponse(200, "XP added", gamification));
});

// (Optional) Admin: Set XP for a user
export const setXP = asyncHandler(async (req, res) => {
  const { userId, xp } = req.body;
  if (!userId || typeof xp !== "number" || xp < 0) {
    throw new ApiError(400, "userId and valid xp are required");
  }
  let gamification = await Gamification.findOne({ user: userId });
  if (!gamification) {
    gamification = new Gamification({ user: userId, xp: 0 });
  }
  gamification.xp = xp;
  await gamification.save();
  return res.status(200).json(new ApiResponse(200, "XP set", gamification));
});

// Get all levels (for frontend display)
export const getLevels = asyncHandler(async (req, res) => {
  return res.status(200).json(new ApiResponse(200, "Levels fetched", LEVELS));
});
export const getLeaderboard = asyncHandler(async (req, res) => {
  const leaderboard = await Gamification.getTopLeaderboard();
  return res.status(200).json(new ApiResponse(200, "Leaderboard fetched", leaderboard));
});