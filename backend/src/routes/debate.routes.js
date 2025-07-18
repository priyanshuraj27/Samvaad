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

const debateRouter = express.Router();

debateRouter.post("/", verifyJWT, createSession);
debateRouter.get("/", verifyJWT, getAllSessions);
debateRouter.get("/:id", verifyJWT, getSessionById);
debateRouter.put("/:id", verifyJWT, updateSession);
debateRouter.delete("/:id", verifyJWT, deleteSession);
debateRouter.post("/generate-poi", verifyJWT, generatePOI);
debateRouter.post("/generate-speech", verifyJWT, generateAISpeech);

export default debateRouter;
