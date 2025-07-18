import mongoose from "mongoose";

const debateSessionSchema = new mongoose.Schema(
  {
    title: String,
    debateType: { type: String, enum: ["BP", "AP", "WS"], required: true },
    motion: String,
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    userRole: String,
    participants: [{ name: String, isAI: Boolean, role: String, team: String }],
    transcript: String, 
    adjudication: { type: mongoose.Schema.Types.ObjectId, ref: "Adjudication" },
  },
  { timestamps: true }
);

export const DebateSession = mongoose.model(
  "DebateSession",
  debateSessionSchema
);
