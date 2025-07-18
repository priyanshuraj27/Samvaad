import express from "express";
import {
  getGamification,
  addXP,
  setXP,
  getLevels,
} from "../controllers/gamification.controllers.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const gamificationRouter = express.Router();

gamificationRouter.get("/", verifyJWT, getGamification);
gamificationRouter.post("/add-xp", verifyJWT, addXP);
gamificationRouter.post("/set-xp", verifyJWT, setXP);
gamificationRouter.get("/levels", getLevels);

export default gamificationRouter;