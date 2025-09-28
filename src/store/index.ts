import { configureStore } from '@reduxjs/toolkit';
import { persistStore, persistReducer } from 'redux-persist';
import storage from 'redux-persist/lib/storage';
import { combineReducers } from '@reduxjs/toolkit';
import candidatesSlice from './slices/candidatesSlice';
import interviewSlice from './slices/interviewSlice';
import appSlice from './slices/appSlice';

const persistConfig = {
  key: 'root',
  storage,
  whitelist: ['candidates', 'interview', 'app'], // persist these reducers
};

const rootReducer = combineReducers({
  candidates: candidatesSlice,
  interview: interviewSlice,
  app: appSlice,
});

const persistedReducer = persistReducer(persistConfig, rootReducer);

export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [
          'persist/PERSIST', 
          'persist/REHYDRATE',
          'candidates/addCandidate',
          'candidates/updateCandidate'
        ],
        ignoredPaths: [
          'candidates.candidates',
          'interview.currentInterview',
          'candidates.candidates.createdAt',
          'candidates.candidates.interviewStartedAt', 
          'candidates.candidates.interviewCompletedAt',
          'candidates.candidates.startedAt'
        ],
        ignoredActionsPaths: [
          'payload.createdAt', 
          'payload.startedAt', 
          'payload.completedAt', 
          'payload.interviewStartedAt',
          'payload.interviewCompletedAt',
          'payload.updates.createdAt',
          'payload.updates.startedAt',
          'payload.updates.completedAt',
          'payload.updates.interviewStartedAt',
          'payload.updates.interviewCompletedAt',
          'payload.timestamp'
        ],
      },
    }),
});

export const persistor = persistStore(store);

export type RootState = ReturnType<typeof rootReducer>;
export type AppDispatch = typeof store.dispatch;