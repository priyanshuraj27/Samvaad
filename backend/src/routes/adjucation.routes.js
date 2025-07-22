// adjudication.routes.js

import express from "express";
import {
  createAdjudication,
  createAdjudicationFromUpload,
  getAllAdjudications,
  getAdjudicationById,
  updateAdjudication,
  deleteAdjudication,
} from "../controllers/adjudication.controllers.js";

import { verifyJWT } from "../middlewares/auth.middleware.js";
import { upload } from "../middlewares/multer.middleware.js";

const adjudicationRouter = express.Router();

adjudicationRouter.post("/", verifyJWT, createAdjudication);
adjudicationRouter.post("/upload", verifyJWT, upload.single('transcript'), createAdjudicationFromUpload);
adjudicationRouter.get("/", verifyJWT, getAllAdjudications);
adjudicationRouter.get("/:id", verifyJWT, getAdjudicationById);
adjudicationRouter.put("/:id", verifyJWT, updateAdjudication);
adjudicationRouter.delete("/:id", verifyJWT, deleteAdjudication);

export default adjudicationRouter;
