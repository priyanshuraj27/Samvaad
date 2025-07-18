import mongoose from 'mongoose';

const adjudicationSchema = new mongoose.Schema({
  debate: { type: mongoose.Schema.Types.ObjectId, ref: 'DebateSession' },
  scorecard: {
    gov: Number,
    opp: Number,
    explanation: String,
    rankings: [String] 
  },
  chainOfThought: {
    clashes: [
      {
        title: String,
        importance: Number,
        winner: String,
        reasoning: String
      }
    ],
    summary: String
  },
  fullTextExplanation: String
}, { timestamps: true });

export const Adjudication = mongoose.model('Adjudication', adjudicationSchema);