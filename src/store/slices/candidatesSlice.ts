import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import type { Candidate } from '../../types';

interface CandidatesState {
  candidates: Candidate[];
  selectedCandidate: Candidate | null;
}

const initialState: CandidatesState = {
  candidates: [],
  selectedCandidate: null,
};

const candidatesSlice = createSlice({
  name: 'candidates',
  initialState,
  reducers: {
    addCandidate: (state, action: PayloadAction<Candidate>) => {
      state.candidates.push(action.payload);
    },
    updateCandidate: (state, action: PayloadAction<{ id: string; updates: Partial<Candidate> }>) => {
      const { id, updates } = action.payload;
      const candidateIndex = state.candidates.findIndex(c => c.id === id);
      if (candidateIndex !== -1) {
        state.candidates[candidateIndex] = { ...state.candidates[candidateIndex], ...updates };
      }
    },
    setSelectedCandidate: (state, action: PayloadAction<Candidate | null>) => {
      state.selectedCandidate = action.payload;
    },
    deleteCandidate: (state, action: PayloadAction<string>) => {
      state.candidates = state.candidates.filter(c => c.id !== action.payload);
    },
    setCandidateScore: (state, action: PayloadAction<{ id: string; score: number; summary: string }>) => {
      const { id, score, summary } = action.payload;
      const candidateIndex = state.candidates.findIndex(c => c.id === id);
      if (candidateIndex !== -1) {
        state.candidates[candidateIndex].score = score;
        state.candidates[candidateIndex].summary = summary;
        state.candidates[candidateIndex].status = 'completed';
        state.candidates[candidateIndex].completedAt = new Date();
      }
    },
  },
});

export const {
  addCandidate,
  updateCandidate,
  setSelectedCandidate,
  deleteCandidate,
  setCandidateScore,
} = candidatesSlice.actions;

export default candidatesSlice.reducer;