# Connect AI - Interview Assistant

A **fully local** React-based AI-powered interview assistant that handles technical interviews with intelligent assessment capabilities. All data persists locally in the browser - no backend server required!

## 🚀 Key Highlights

- **100% Local Data Storage**: Everything stored in browser using Redux Persist + localStorage
- **No Backend Required**: Complete frontend-only solution
- **Offline Capable**: Works without internet connection after initial load
- **Privacy First**: All candidate data stays in your browser
- **AI Simulation**: Local algorithms simulate intelligent interview behavior

## Features

### 🎯 Interviewee Experience
- **Resume Upload**: Upload PDF or DOCX resumes with automatic parsing
- **Smart Data Extraction**: Automatically extracts name, email, and phone from resumes
- **Missing Information Collection**: Chatbot prompts for any missing required information
- **Timed Interview Flow**: 6 dynamically generated questions with difficulty-based timers
  - Easy questions: 5 minutes (300s)
  - Medium questions: 7.5 minutes (450s)  
  - Hard questions: 9 minutes (540s)
- **Real-time Chat Interface**: Interactive conversation flow with simulated AI interviewer
- **Progress Tracking**: Visual progress indicator and timer countdown
- **Auto-submission**: Automatic answer submission when time expires
- **Resume Continuation**: Welcome back modal for incomplete interviews

### 📊 Interviewer Dashboard
- **Candidate Management**: View all candidates with scores and status
- **Detailed Candidate Profiles**: Complete interview history, answers, and AI assessments
- **Search and Filter**: Find candidates by name, email, or status
- **Sort Options**: Sort by score, name, or interview date
- **Chat History**: Full conversation logs for each candidate
- **AI-Generated Summaries**: Comprehensive performance analysis and recommendations
- **Local Scoring**: JavaScript-based answer evaluation and feedback

### 🔧 Technical Features
- **Redux Persist**: Automatic state persistence across browser sessions
- **Resume Parser**: Local PDF/DOCX processing with pdfjs-dist & mammoth
- **AI-Powered Intelligence**: Google Gemini AI integration with local fallbacks
  - Smart question generation based on resume content and position
  - Intelligent answer scoring and feedback
  - Comprehensive interview summaries and recommendations
  - Natural conversational flow during interviews
- **Real-time State Management**: Synchronized data between tabs
- **Responsive Design**: Works seamlessly on desktop and mobile devices
- **File Type Support**: PDF and DOCX resume parsing capabilities

## Technology Stack

- **Frontend**: React 18 with TypeScript
- **Build Tool**: Vite for fast development and building
- **State Management**: Redux Toolkit with Redux Persist
- **UI Framework**: Ant Design for modern, accessible components
- **PDF Processing**: PDF.js for PDF parsing
- **DOCX Processing**: Mammoth.js for Word document parsing
- **Icons**: Ant Design Icons + Lucide React
- **Styling**: CSS3 with responsive design patterns

## Getting Started

### Prerequisites
- Node.js 16+ 
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd swipe
```

2. Install dependencies:
```bash
npm install
```

3. **Set up AI Features (Optional)**:
   - Get a free API key from [Google AI Studio](https://makersuite.google.com/app/apikey)
   - Create a `.env` file in the root directory:
   ```bash
   VITE_GEMINI_API_KEY=your_api_key_here
   ```
   - The app works with local fallback AI if no key is provided

4. Start the development server:
```bash
npm run dev
```

5. Open your browser and navigate to `http://localhost:5173`

### Building for Production

```bash
npm run build
```

### Running the Production Build

```bash
npm run preview
```

## Interview Flow

1. **Resume Upload**: Candidate uploads PDF/DOCX resume
2. **Data Extraction**: System extracts personal information
3. **Information Completion**: Chatbot collects missing details
4. **Interview Start**: 6 questions generated (2 easy, 2 medium, 2 hard)
5. **Timed Responses**: Each question has a difficulty-based time limit
6. **Auto-progression**: System moves to next question automatically
7. **Final Assessment**: AI calculates score and generates summary
8. **Dashboard Update**: Results appear in interviewer dashboard

## Data Persistence

All data is stored locally in the browser using Redux Persist and Local Storage. Sessions automatically resume if interrupted.
