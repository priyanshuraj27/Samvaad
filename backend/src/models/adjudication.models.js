import mongoose from 'mongoose';

const adjudicationSchema = new mongoose.Schema({
  session: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'DebateSession',
    required: false
  },
  adjudicator: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  formatName: {
    type: String,
    required: true
  },
  motion: {
    type: String,
    required: false
  },
  teams: {
    type: mongoose.Schema.Types.Mixed,
    required: false
  },
  transcriptSource: {
    type: String,
    enum: ['session', 'upload'],
    default: 'session'
  },
  originalFileName: {
    type: String,
    required: false
  },
  overallWinner: {
    type: String,
    required: true
  },
  teamRankings: [{
    rank: { type: Number, required: true },
    team: { type: String, required: true },
    score: { type: Number, required: true }
  }],
  scorecard: {
    type: mongoose.Schema.Types.Mixed,
    required: true
  },
  chainOfThought: {
    title: String,
    clashes: [{
      id: String,
      title: String,
      weight: Number,
      winner: String,
      summary: String
    }]
  },
  detailedFeedback: {
    replySpeeches: {
      proposition: {
        speaker: String,
        score: Number,
        summary: String
      },
      opposition: {
        speaker: String,
        score: Number,
        summary: String
      }
    },
    speakers: [{
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
      timestampedComments: [{
        time: String,
        comment: String
      }]
    }]
  }
}, {
  timestamps: true
});

const Adjudication = mongoose.model('Adjudication', adjudicationSchema);
export default Adjudication;
