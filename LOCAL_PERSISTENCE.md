# Local Data Persistence Implementation

This application now uses **complete local data persistence** - all data stays in the browser using Redux Persist and localStorage. No backend server is required for data storage.

## Architecture Overview

### Data Storage
- **Redux Store**: Manages application state with Redux Toolkit
- **Redux Persist**: Automatically persists Redux state to localStorage
- **LocalStorage**: Browser storage for all candidate data, interview sessions, chat history, etc.

### Data Flow
```
User Actions → Redux Actions → Redux Store → Redux Persist → LocalStorage
                     ↑                                          ↓
            Components ← UI Updates ← State Updates ← Rehydration
```

## Key Features Implemented Locally

### 1. Resume Parsing & Storage
- **File Processing**: PDF/DOCX parsing using pdfjs-dist and mammoth
- **Text Extraction**: Resume content stored as text in localStorage
- **Metadata Storage**: File info, parsing results, extracted contact details

### 2. AI Interview Generation
- **Question Generation**: Simulated AI creates questions based on resume content
- **Contextual Questions**: Questions customized by detected technologies/skills
- **Difficulty Levels**: Easy, Medium, Hard question categorization

### 3. Interview Session Management
- **Real-time Chat**: Local chat interface with simulated AI responses
- **Timer Management**: Question timers with pause/resume functionality
- **Session Persistence**: Interview state maintained across browser sessions

### 4. Scoring & Evaluation
- **Local Algorithm**: JavaScript-based scoring system
- **Answer Analysis**: Simple keyword matching and length analysis
- **Feedback Generation**: Automated feedback based on response quality

### 5. Candidate Dashboard
- **Data Management**: Complete CRUD operations for candidates
- **Interview History**: Session tracking and status management
- **Progress Tracking**: Visual indicators for interview completion

## Data Structures

### Candidate Object
```typescript
interface Candidate {
  id: string;
  name: string;
  email: string;
  phone: string;
  position?: string;
  resumeText?: string;
  resumeFile?: File;
  resumeData?: any;
  score?: number;
  summary?: string;
  status: 'pending' | 'uploading' | 'interviewing' | 'completed' | 'paused' | 'terminated';
  createdAt: Date;
  startedAt: Date;
  completedAt?: Date;
  finalScore?: number;
  finalReport?: any;
  responses?: any[];
  questions?: any[];
  violations?: any[];
}
```

### Interview Session
```typescript
interface Interview {
  id: string;
  candidateId: string;
  questions: Question[];
  answers: Answer[];
  currentQuestionIndex: number;
  startTime?: Date;
  endTime?: Date;
  isPaused: boolean;
  pausedAt?: Date;
  totalScore?: number;
  finalSummary?: string;
}
```

## Local Services

### LocalDataService
- `parseResume(file: File)`: Extract text from PDF/DOCX files
- `generateQuestions(resumeText: string)`: Create interview questions
- `generateChatResponse(message: string, context)`: Simulate AI chat
- `scoreAnswer(answer: Answer, question: Question)`: Score responses
- `generateInterviewSummary(interview: Interview)`: Create final report

### Redux Store Structure
```
store/
├── candidatesSlice.ts    # Candidate data management
├── interviewSlice.ts     # Interview session state
└── appSlice.ts          # UI state and preferences
```

## Benefits of Local Persistence

### ✅ Advantages
- **No Server Required**: Zero backend infrastructure needed
- **Instant Performance**: No network latency for data operations
- **Privacy**: All data stays in user's browser
- **Offline Capable**: Works without internet connection
- **Development Speed**: No database setup or API development

### ⚠️ Considerations
- **Data Portability**: Data tied to specific browser/device
- **Storage Limits**: Browser localStorage size restrictions
- **No Multi-device Sync**: Data doesn't sync across devices
- **Data Loss Risk**: Clearing browser data removes all information

## Usage Examples

### Adding a New Candidate
```javascript
const candidate = {
  name: "John Doe",
  email: "john@example.com",
  phone: "+1234567890",
  resumeText: "extracted resume text...",
  status: "pending"
};

dispatch(addCandidate(candidate));
// Automatically persisted to localStorage via Redux Persist
```

### Starting an Interview Session
```javascript
const questions = await localDataService.generateQuestions(candidate.resumeText);
const interview = {
  candidateId: candidate.id,
  questions,
  answers: [],
  startTime: new Date(),
  isPaused: false
};

dispatch(startInterview(interview));
```

### Generating AI Response
```javascript
const response = await localDataService.generateChatResponse(
  userMessage,
  {
    candidate,
    currentQuestion,
    chatHistory
  }
);
```

## Development Setup

1. All dependencies already installed
2. Redux Persist configured in `src/store/index.ts`
3. PersistGate wrapper in `src/main.tsx`
4. LocalDataService available at `src/services/localDataService.ts`

## Testing Local Persistence

1. Add candidate data through the UI
2. Refresh the browser - data should persist
3. Clear localStorage to reset all data
4. Open Developer Tools → Application → Local Storage to view stored data

## Future Enhancements

- IndexedDB for larger data storage
- Export/Import functionality for data portability
- Local file system API for resume storage
- WebAssembly for advanced AI features
- Service Worker for offline functionality