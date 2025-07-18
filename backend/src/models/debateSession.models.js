import mongoose from "mongoose";

const transcriptEntrySchema = new mongoose.Schema(
  {
    speaker: String,
    text: String,
    type: String,
    timestamp: String,
  },
  { _id: false }
);

const debateSessionSchema = new mongoose.Schema(
  {
    title: String,
    debateType: { type: String, enum: ["BP", "AP", "WS"], required: true },
    motion: String,
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    userRole: String,
    participants: [{ name: String, isAI: Boolean, role: String, team: String }],
    transcript: { type: [transcriptEntrySchema], default: [] },
    adjudication: { type: mongoose.Schema.Types.ObjectId, ref: "Adjudication" },
    status: { type: String, enum: ["prep", "ongoing", "completed"], default: "prep" }, // <-- added status field
  },
  { timestamps: true }
);

export const DebateSession = mongoose.model(
  "DebateSession",
  debateSessionSchema
);
