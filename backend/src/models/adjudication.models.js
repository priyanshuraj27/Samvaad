import mongoose from 'mongoose';

const TimestampedCommentSchema = new mongoose.Schema({
  time: String,
  comment: String,
}, { _id: false });

const SpeakerSchema = new mongoose.Schema({
  name: String,
  team: String,
  scores: {
    matter: Number,
    manner: Number,
    method: Number,
    total: Number
  },
  roleFulfillment: String,
  rhetoricalAnalysis: String,
  timestampedComments: [TimestampedCommentSchema]
}, { _id: false });

const ReplySpeechSchema = new mongoose.Schema({
  speaker: String,
  score: Number,
  summary: String
}, { _id: false });

const ClashSchema = new mongoose.Schema({
  id: String,
  title: String,
  weight: Number,
  winner: String,
  summary: String
}, { _id: false });

const ScorecardSchema = new mongoose.Schema({
  matter: Number,
  manner: Number,
  method: Number,
  color: String
}, { _id: false });

const AdjudicationSchema = new mongoose.Schema({
  session: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'DebateSession',
    required: true
  },
  adjudicator: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  formatName: String,
  overallWinner: String,
  teamRankings: [{
    rank: Number,
    team: String,
    score: Number
  }],
  scorecard: mongoose.Schema.Types.Mixed,
  chainOfThought: {
    title: String,
    clashes: [ClashSchema]
  },
  detailedFeedback: {
    replySpeeches: {
      proposition: ReplySpeechSchema,
      opposition: ReplySpeechSchema
    },
    speakers: [SpeakerSchema]
  }
}, { timestamps: true });

export default mongoose.model('Adjudication', AdjudicationSchema);
