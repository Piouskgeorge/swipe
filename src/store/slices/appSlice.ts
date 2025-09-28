import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';

interface AppState {
  activeTab: 'ai-interview' | 'interviewee' | 'interviewer';
  isLoading: boolean;
  error: string | null;
  showWelcomeBackModal: boolean;
  resumedCandidateId: string | null;
}

const initialState: AppState = {
  activeTab: 'ai-interview',
  isLoading: false,
  error: null,
  showWelcomeBackModal: false,
  resumedCandidateId: null,
};

const appSlice = createSlice({
  name: 'app',
  initialState,
  reducers: {
    setActiveTab: (state, action: PayloadAction<'ai-interview' | 'interviewee' | 'interviewer'>) => {
      state.activeTab = action.payload;
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
    showWelcomeBack: (state, action: PayloadAction<string>) => {
      state.showWelcomeBackModal = true;
      state.resumedCandidateId = action.payload;
    },
    hideWelcomeBack: (state) => {
      state.showWelcomeBackModal = false;
      state.resumedCandidateId = null;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
});

export const {
  setActiveTab,
  setLoading,
  setError,
  showWelcomeBack,
  hideWelcomeBack,
  clearError,
} = appSlice.actions;

export default appSlice.reducer;