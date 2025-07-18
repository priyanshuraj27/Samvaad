import mongoose from "mongoose";

const LEVELS = [
  { level: 1, name: "Novice Debater", xpRequired: 0 },
  { level: 2, name: "Rising Speaker", xpRequired: 100 },
  { level: 3, name: "Argument Apprentice", xpRequired: 250 },
  { level: 4, name: "Reasoning Rookie", xpRequired: 400 },
  { level: 5, name: "Persuasion Prodigy", xpRequired: 600 },
  { level: 6, name: "Logic Learner", xpRequired: 850 },
  { level: 7, name: "Contention Crafter", xpRequired: 1150 },
  { level: 8, name: "Speech Specialist", xpRequired: 1500 },
  { level: 9, name: "Debate Enthusiast", xpRequired: 1900 },
  { level: 10, name: "Rebuttal Ranger", xpRequired: 2350 },
  { level: 11, name: "Oratory Officer", xpRequired: 2850 },
  { level: 12, name: "Argument Analyst", xpRequired: 3400 },
  { level: 13, name: "Logic Leader", xpRequired: 4000 },
  { level: 14, name: "Contention Commander", xpRequired: 4650 },
  { level: 15, name: "Speech Strategist", xpRequired: 5350 },
  { level: 16, name: "Debate Veteran", xpRequired: 6100 },
  { level: 17, name: "Oratory Expert", xpRequired: 6900 },
  { level: 18, name: "Debate Master", xpRequired: 7750 },
  { level: 19, name: "Grandmaster Debater", xpRequired: 8650 },
  { level: 20, name: "Legendary Orator", xpRequired: 9600 },
];

const gamificationSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, unique: true },
    xp: { type: Number, default: 75 }, 
    level: { type: Number, default: 1, min: 1, max: 20 },
    name: { type: String, default: LEVELS[0].name },
  },
  { timestamps: true }
);

// Static method to get level info by XP
gamificationSchema.statics.getLevelInfo = function (xp) {
  let current = LEVELS[0];
  for (const lvl of LEVELS) {
    if (xp >= lvl.xpRequired) current = lvl;
    else break;
  }
  return current;
};

// Pre-save hook to update level and name based on XP
gamificationSchema.pre("save", function (next) {
  const levelInfo = this.constructor.getLevelInfo(this.xp);
  this.level = levelInfo.level;
  this.name = levelInfo.name;
  next();
});

export const Gamification = mongoose.model("Gamification", gamificationSchema);
export { LEVELS };