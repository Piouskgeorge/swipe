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
} = interviewSlice.actions;

export default interviewSlice.reducer;