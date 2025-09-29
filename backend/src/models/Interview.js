import mongoose from 'mongoose';

const interviewSchema = new mongoose.Schema({
  // For traditional interviewer-based interviews
  interviewee: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  interviewer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  
  // For AI-powered interviews (new workflow)
  candidateName: {
    type: String
  },
  candidateEmail: {
    type: String
  },
  
  position: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['scheduled', 'in-progress', 'paused', 'completed', 'cancelled', 'terminated'],
    default: 'scheduled'
  },
  scheduledAt: {
    type: Date
  },
  startedAt: {
    type: Date
  },
  completedAt: {
    type: Date
  },
  duration: {
    type: Number, // in minutes
    default: 30
  },
  timeSpent: {
    type: Number, // actual time spent in minutes
    default: 0
  },
  
  // Current question tracking
  currentQuestionIndex: {
    type: Number,
    default: 0
  },
  
  resume: {
    filename: String,
    originalName: String,
    path: String,
    extractedText: String,
    uploadedAt: Date
  },
  
  questions: [{
    id: {
      type: Number,
      required: true
    },
    question: {
      type: String,
      required: true
    },
    difficulty: {
      type: String,
      enum: ['easy', 'medium', 'hard'],
      required: true
    },
    timeLimit: {
      type: Number, // in seconds
      required: true
    },
    category: {
      type: String,
      required: true
    },
    expectedKeywords: [{
      type: String
    }],
    generatedAt: {
      type: Date,
      default: Date.now
    }
  }],
  
  responses: [{
    questionId: {
      type: Number,
      required: true
    },
    questionIndex: {
      type: Number,
      required: true
    },
    question: {
      type: String,
      required: true
    },
    response: {
      type: String,
      required: true
    },
    timeUsed: {
      type: Number, // in seconds
      required: true
    },
    timeLimit: {
      type: Number, // in seconds
      required: true
    },
    score: {
      type: Number, // 0-100
      required: true
    },
    submittedAt: {
      type: Date,
      default: Date.now
    },
    aiAnalysis: {
      score: Number, // 1-10
      strengths: [String],
      improvements: [String],
      relevance: Number, // 1-10
      clarity: Number, // 1-10
      completeness: Number // 1-10
    }
  }],
  
  // Final assessment report
  finalReport: {
    candidate: {
      name: String,
      position: String,
      totalQuestions: Number,
      totalScore: Number,
      averageScore: Number,
      duration: Number
    },
    breakdown: {
      easy: {
        total: Number,
        count: Number,
        average: Number
      },
      medium: {
        total: Number,
        count: Number,
        average: Number
      },
      hard: {
        total: Number,
        count: Number,
        average: Number
      }
    },
    recommendation: String, // Strong Hire, Hire, Maybe, No Hire
    strengths: [String],
    improvements: [String],
    aiSummary: String,
    generatedAt: String
  },
  chatHistory: [{
    sender: {
      type: String,
      enum: ['ai', 'interviewee', 'interviewer']
    },
    message: String,
    timestamp: {
      type: Date,
      default: Date.now
    },
    type: {
      type: String,
      enum: ['question', 'response', 'feedback', 'system'],
      default: 'response'
    }
  }],
  overallAssessment: {
    totalScore: Number, // 1-100
    technicalScore: Number,
    behavioralScore: Number,
    communicationScore: Number,
    aiSummary: String,
    recommendations: [String],
    verdict: {
      type: String,
      enum: ['recommend', 'maybe', 'reject']
    }
  },
  notes: {
    interviewer: String,
    ai: String
  },
  
  // Violation tracking for AI interviews
  violations: [{
    type: {
      type: String,
      enum: ['fullscreen_exit', 'tab_change', 'window_blur']
    },
    timestamp: {
      type: Date,
      default: Date.now
    },
    questionNumber: Number,
    questionText: String
  }],
  terminationReason: String,
  questionsCompleted: Number,
  totalQuestions: Number,
  isTerminated: {
    type: Boolean,
    default: false
  },
  
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update timestamp on save
interviewSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

export default mongoose.model('Interview', interviewSchema);