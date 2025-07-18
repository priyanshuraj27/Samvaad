import express from "express";
import {
  createSession,
  getAllSessions,
  getSessionById,
  updateSession,
  deleteSession,
  generateAISpeech,
  generatePOI,
} from "../controllers/debate.controllers.js";

import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.post("/", verifyJWT, createSession);
router.get("/", verifyJWT, getAllSessions);
router.get("/:id", verifyJWT, getSessionById);
router.put("/:id", verifyJWT, updateSession);
router.delete("/:id", verifyJWT, deleteSession);
router.post("/generate-poi", verifyJWT, generatePOI);
router.post("/generate-speech", verifyJWT, generateAISpeech);

export default router;
