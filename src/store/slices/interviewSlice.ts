import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import type { Interview, Question, Answer, ChatMessage } from '../../types';

interface InterviewState {
  currentInterview: Interview | null;
  chatHistory: ChatMessage[];
  currentQuestion: Question | null;
  timeRemaining: number;
  timerStatus: 'running' | 'paused' | 'stopped' | 'completed';
  questions: Question[];
}

const initialState: InterviewState = {
  currentInterview: null,
  chatHistory: [],
  currentQuestion: null,
  timeRemaining: 0,
  timerStatus: 'stopped',
  questions: [],
};

const interviewSlice = createSlice({
  name: 'interview',
  initialState,
  reducers: {
    startInterview: (state, action: PayloadAction<Interview>) => {
      state.currentInterview = action.payload;
      state.chatHistory = [];
      state.timerStatus = 'running';
    },
    pauseInterview: (state) => {
      if (state.currentInterview) {
        state.currentInterview.isPaused = true;
        state.currentInterview.pausedAt = new Date();
        state.timerStatus = 'paused';
      }
    },
    resumeInterview: (state) => {
      if (state.currentInterview) {
        state.currentInterview.isPaused = false;
        state.currentInterview.pausedAt = undefined;
        state.timerStatus = 'running';
      }
    },
    endInterview: (state) => {
      if (state.currentInterview) {
        state.currentInterview.endTime = new Date();
        state.timerStatus = 'completed';
      }
    },
    setCurrentQuestion: (state, action: PayloadAction<Question>) => {
      state.currentQuestion = action.payload;
      state.timeRemaining = action.payload.timeLimit;
      state.timerStatus = 'running';
    },
    updateTimeRemaining: (state, action: PayloadAction<number>) => {
      state.timeRemaining = action.payload;
      if (state.timeRemaining <= 0) {
        state.timerStatus = 'completed';
      }
    },
    addAnswer: (state, action: PayloadAction<Answer>) => {
      if (state.currentInterview) {
        state.currentInterview.answers.push(action.payload);
      }
    },
    addChatMessage: (state, action: PayloadAction<ChatMessage>) => {
      state.chatHistory.push(action.payload);
    },
    setQuestions: (state, action: PayloadAction<Question[]>) => {
      state.questions = action.payload;
      if (state.currentInterview) {
        state.currentInterview.questions = action.payload;
      }
    },
    nextQuestion: (state) => {
      if (state.currentInterview) {
        state.currentInterview.currentQuestionIndex += 1;
      }
    },
    setTimerStatus: (state, action: PayloadAction<'running' | 'paused' | 'stopped' | 'completed'>) => {
      state.timerStatus = action.payload;
    },
    clearInterview: (state) => {
      state.currentInterview = null;
      state.chatHistory = [];
      state.currentQuestion = null;
      state.timeRemaining = 0;
      state.timerStatus = 'stopped';
      state.questions = [];
    },
    // New actions for batch workflow
    setAllQuestions: (state, action: PayloadAction<Question[]>) => {
      state.questions = action.payload;
      if (state.currentInterview) {
        state.currentInterview.questions = action.payload;
        // Set first question as current
        if (action.payload.length > 0) {
          state.currentQuestion = action.payload[0];
          state.timeRemaining = action.payload[0].timeLimit;
        }
      }
    },
    moveToNextQuestion: (state) => {
      if (state.currentInterview && state.questions.length > 0) {
        const nextIndex = state.currentInterview.currentQuestionIndex + 1;
        if (nextIndex < state.questions.length) {
          state.currentInterview.currentQuestionIndex = nextIndex;
          state.currentQuestion = state.questions[nextIndex];
          state.timeRemaining = state.questions[nextIndex].timeLimit;
          state.timerStatus = 'running';
        } else {
          // Interview completed
          state.currentQuestion = null;
          state.timeRemaining = 0;
          state.timerStatus = 'completed';
          state.currentInterview.endTime = new Date();
        }
      }
    },
    submitAnswerAndNext: (state, action: PayloadAction<Answer>) => {
      if (state.currentInterview) {
        // Add answer
        state.currentInterview.answers.push(action.payload);
        
        // Move to next question
        const nextIndex = state.currentInterview.currentQuestionIndex + 1;
        if (nextIndex < state.questions.length) {
          state.currentInterview.currentQuestionIndex = nextIndex;
          state.currentQuestion = state.questions[nextIndex];
          state.timeRemaining = state.questions[nextIndex].timeLimit;
          state.timerStatus = 'running';
        } else {
          // Interview completed
          state.currentQuestion = null;
          state.timeRemaining = 0;
          state.timerStatus = 'completed';
          state.currentInterview.endTime = new Date();
        }
      }
    },
  },
});

export const {
  startInterview,
  pauseInterview,
  resumeInterview,
  endInterview,
  setCurrentQuestion,
  updateTimeRemaining,
  addAnswer,
  addChatMessage,
  setQuestions,
  nextQuestion,
  setTimerStatus,
  clearInterview,
  setAllQuestions,
  moveToNextQuestion,
  submitAnswerAndNext,
} = interviewSlice.actions;

export default interviewSlice.reducer;