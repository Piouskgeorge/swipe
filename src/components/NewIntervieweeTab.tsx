import React, { useState, useEffect, useRef } from 'react';
import { Upload, Clock, MessageCircle, CheckCircle } from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';
import type { RootState } from '../store';
import {
  setAllQuestions,
  startInterview as startInterviewAction,
  submitAnswerAndNext,
  pauseInterview,
  resumeInterview,
  endInterview,
  updateTimeRemaining,
  setTimerStatus,
  addChatMessage
} from '../store/slices/interviewSlice';
import { addCandidate, updateCandidate } from '../store/slices/candidatesSlice';
import aiService from '../services/aiService';
import type { Answer, Question, BatchScoringResult } from '../types';

interface Message {
  id: string;
  type: 'user' | 'bot' | 'system';
  content: string;
  timestamp: Date;
  isQuestion?: boolean;
  questionData?: Question;
}

interface CandidateInfo {
  name: string;
  email: string;
  phone: string;
  position: string;
  resumeText?: string;
  extractedData?: any;
}

// Generate unique IDs
const generateUniqueId = (prefix = '') => {
  return `${prefix}${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

const NewIntervieweeTab: React.FC = () => {
  const dispatch = useDispatch();
  const { 
    currentInterview, 
    currentQuestion, 
    timeRemaining, 
    timerStatus, 
    questions 
  } = useSelector((state: RootState) => state.interview);

  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      type: 'bot',
      content: "👋 Welcome to Connect AI Interview Assistant! I'm here to conduct your technical interview. Let's start by uploading your resume.",
      timestamp: new Date()
    }
  ]);
  

  const [candidateInfo, setCandidateInfo] = useState<CandidateInfo>({
    name: '',
    email: '',
    phone: '',
    position: ''
  });
  
  const [interviewState, setInterviewState] = useState<
    'resume_upload' | 'generating_questions' | 'interview_ready' | 
    'interview_active' | 'interview_completed' | 'showing_results'
  >('resume_upload');
  
  const [currentAnswer, setCurrentAnswer] = useState('');
  const [candidateId, setCandidateId] = useState<string>('');
  const [allAnswers, setAllAnswers] = useState<Answer[]>([]);
  const [finalResults, setFinalResults] = useState<BatchScoringResult | null>(null);
  const [isGeneratingQuestions, setIsGeneratingQuestions] = useState(false);
  const [isScoringAnswers, setIsScoringAnswers] = useState(false);
  
  const chatEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const timerRef = useRef<number | null>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleTimeOut = () => {
    if (!currentQuestion || !currentInterview) return;
    
    const answerData: Answer = {
      questionId: currentQuestion.id,
      answer: currentAnswer.trim() || 'No answer provided (time out)',
      timeSpent: currentQuestion.timeLimit,
      timestamp: new Date()
    };
    
    setAllAnswers(prev => [...prev, answerData]);
    dispatch(submitAnswerAndNext(answerData));
    
    addMessage("⏰ Time's up! Moving to the next question...", 'system');
    setCurrentAnswer('');
    
    if ((currentInterview.currentQuestionIndex + 1) >= questions.length) {
      completeInterview([...allAnswers, answerData]);
    } else {
      setTimeout(() => {
        askCurrentQuestion();
      }, 1500);
    }
  };

  const completeInterview = async (finalAnswers: Answer[]) => {
    setInterviewState('interview_completed');
    dispatch(endInterview());
    
    addMessage("🎉 **Interview Completed!**\n\nThank you for completing all 6 questions! I'm now analyzing your responses and preparing your detailed feedback. This may take a moment...", 'system');
    
    setIsScoringAnswers(true);
    
    try {
      // Prepare questions and answers for batch scoring
      const questionsAndAnswers = questions.map((question, index) => ({
        question,
        answer: finalAnswers[index] || {
          questionId: question.id,
          answer: 'No answer provided',
          timeSpent: question.timeLimit,
          timestamp: new Date()
        }
      }));
      
      // Get comprehensive scoring from AI
      const scoringResult = await aiService.scoreAllAnswers(questionsAndAnswers);
      setFinalResults(scoringResult);
      
      // Update candidate with final results
      if (candidateId) {
        dispatch(updateCandidate({
          id: candidateId,
          updates: {
            status: 'completed',
            completedAt: new Date(),
            finalScore: scoringResult.overallScore,
            finalReport: scoringResult,
            responses: finalAnswers
          }
        }));
      }
      
      setIsScoringAnswers(false);
      setInterviewState('showing_results');
      
      showFinalResults(scoringResult);
      
    } catch (error) {
      console.error('Scoring failed:', error);
      setIsScoringAnswers(false);
      addMessage("❌ I encountered an issue while analyzing your responses. However, your interview has been completed and recorded.");
    }
  };

  const showFinalResults = (results: BatchScoringResult) => {
    const resultMessage = `🏆 **Interview Results**

**Overall Score: ${results.overallScore}/100**
**Recommendation: ${results.recommendation}**

**Detailed Analysis:**
${results.overallFeedback}

**Individual Question Scores:**
${results.individualScores.map((score, index) => 
  `Question ${index + 1}: ${score.score}/100 - ${score.feedback}`
).join('\n\n')}

---

Thank you for completing the interview! Your responses have been recorded and evaluated. This concludes our technical assessment session.`;

    addMessage(resultMessage, 'system');
  };

  const askCurrentQuestion = () => {
    if (!currentQuestion) return;
    
    const questionText = `**Question ${(currentInterview?.currentQuestionIndex || 0) + 1}/6** (${currentQuestion.difficulty} - ${currentQuestion.timeLimit}s)

${currentQuestion.text}

⏱️ You have ${currentQuestion.timeLimit} seconds to answer. Take your time to think through your response and provide specific examples when possible.`;

    addMessage(questionText, 'bot', currentQuestion);
    dispatch(setTimerStatus('running'));
  };

  // Timer management
  useEffect(() => {
    if (timerStatus === 'running' && timeRemaining > 0 && interviewState === 'interview_active') {
      timerRef.current = window.setTimeout(() => {
        const newTime = timeRemaining - 1;
        dispatch(updateTimeRemaining(newTime));
        
        if (newTime <= 0) {
          handleTimeOut();
        }
      }, 1000);
    } else {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    }

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [timeRemaining, timerStatus, interviewState, dispatch]);

  const addMessage = (content: string, type: 'user' | 'bot' | 'system' = 'bot', questionData?: Question) => {
    const message: Message = {
      id: generateUniqueId('msg_'),
      type,
      content,
      timestamp: new Date(),
      isQuestion: !!questionData,
      questionData
    };
    
    setMessages(prev => [...prev, message]);
    dispatch(addChatMessage({
      id: message.id,
      type: message.type,
      content: message.content,
      timestamp: message.timestamp,
      questionId: questionData?.id,
      isQuestion: !!questionData
    }));
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    addMessage(`📄 Processing ${file.name}...`, 'system');
    
    try {
      let resumeText = '';
      
      // Process the resume file
      if (file.type === 'application/pdf') {
        try {
          resumeText = await aiService.processPDFWithGemini(file);
          addMessage("✅ Resume processed successfully with AI enhancement!");
        } catch (error) {
          console.warn('Gemini PDF processing failed, using fallback parser:', error);
          resumeText = await aiService.parseResume(file);
          addMessage("✅ Resume processed successfully!");
        }
      } else {
        resumeText = await aiService.parseResume(file);
        addMessage("✅ Resume processed successfully!");
      }

      // Extract candidate information automatically
      addMessage("🔍 Analyzing your background and expertise...", 'system');
      
      const candidateData = await aiService.extractCandidateInfo(resumeText);
      
      setCandidateInfo({
        name: candidateData.name,
        email: candidateData.email,
        phone: candidateData.phone,
        position: candidateData.position,
        resumeText,
        extractedData: candidateData.extractedData
      });

      // Show extracted information
      const summaryMessage = `🎯 **Profile Analysis Complete!**

**Candidate Details:**
• **Name:** ${candidateData.name}
• **Email:** ${candidateData.email}
• **Phone:** ${candidateData.phone}
• **Domain:** ${candidateData.domain}
• **Target Position:** ${candidateData.position.split(' - ')[1] || 'Developer'}
• **Key Skills:** ${candidateData.skills.join(', ')}

**Experience Summary:** ${candidateData.experience}

---

Perfect! I've analyzed your resume and identified your expertise area. I'm now generating 6 specialized technical questions tailored to your background in **${candidateData.domain}**.

This will include:
• 2 Easy questions (20s each) - Core concepts
• 2 Medium questions (60s each) - Practical application  
• 2 Hard questions (120s each) - Advanced problem-solving

Please wait while I prepare your personalized interview questions...`;

      addMessage(summaryMessage, 'system');
      
      // Skip info collection and domain selection - go directly to question generation
      setInterviewState('generating_questions');
      await generateQuestionsAndStartInterview(candidateData);
      
    } catch (error) {
      console.error('File processing error:', error);
      addMessage("❌ Sorry, I couldn't process that file. Please try uploading a PDF or Word document.");
    }
  };

  const generateQuestionsAndStartInterview = async (candidateData: any) => {
    try {
      // Generate questions based on extracted candidate data
      const generatedQuestions = await aiService.generateAllInterviewQuestions(
        candidateData.extractedData || candidateData.resumeText || '',
        candidateData.position,
        'medium'
      );
      
      // Store questions in Redux
      dispatch(setAllQuestions(generatedQuestions));
      
      // Create candidate and interview records
      const newCandidateId = generateUniqueId('candidate_');
      setCandidateId(newCandidateId);
      
      const candidateRecord = {
        id: newCandidateId,
        name: candidateData.name,
        email: candidateData.email,
        phone: candidateData.phone,
        position: candidateData.position,
        resumeText: candidateData.extractedData,
        status: 'interviewing' as const,
        createdAt: new Date(),
        startedAt: new Date(),
        questions: generatedQuestions,
        responses: []
      };
      
      dispatch(addCandidate(candidateRecord));
      
      const interview = {
        id: generateUniqueId('interview_'),
        candidateId: newCandidateId,
        questions: generatedQuestions,
        answers: [],
        currentQuestionIndex: 0,
        startTime: new Date(),
        isPaused: false
      };
      
      dispatch(startInterviewAction(interview));
      
      addMessage(`✅ **Interview Setup Complete!**

🎯 I've prepared ${generatedQuestions.length} technical questions specifically designed for your **${candidateData.position}** background.

**Question Breakdown:**
• Questions 1-2: **Easy** (20 seconds each) - Fundamental concepts
• Questions 3-4: **Medium** (60 seconds each) - Practical scenarios
• Questions 5-6: **Hard** (120 seconds each) - Complex problem-solving

**Interview Guidelines:**
• Answer as thoroughly as possible within time limits
• Use specific examples from your experience
• Mention relevant technologies and best practices
• You can pause/resume if needed

Ready to demonstrate your expertise? Click below to begin!`, 'system');
      
      setInterviewState('interview_ready');
      
    } catch (error) {
      console.error('Question generation failed:', error);
      addMessage("❌ I encountered an issue generating questions. Let me try again...");
      setInterviewState('interview_ready');
    }
  };



  const startInterviewProcess = () => {
    if (questions.length === 0) {
      addMessage("❌ No questions available. Please refresh and try again.");
      return;
    }
    
    setInterviewState('interview_active');
    askCurrentQuestion();
  };

  const handleInterviewAnswer = async (answer: string) => {
    if (!currentQuestion || !currentInterview) return;
    
    const timeSpent = (currentQuestion.timeLimit - timeRemaining);
    
    const answerData: Answer = {
      questionId: currentQuestion.id,
      answer,
      timeSpent,
      timestamp: new Date()
    };
    
    // Store answer locally for batch processing
    setAllAnswers(prev => [...prev, answerData]);
    
    // Submit answer and move to next question
    dispatch(submitAnswerAndNext(answerData));
    
    addMessage("✅ Answer recorded! Moving to the next question...", 'system');
    
    // Check if interview is completed
    if ((currentInterview.currentQuestionIndex + 1) >= questions.length) {
      completeInterview([...allAnswers, answerData]);
    } else {
      // Move to next question
      setTimeout(() => {
        askCurrentQuestion();
      }, 1500);
    }
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const renderCurrentState = () => {
    if (interviewState === 'resume_upload') {
      return (
        <div className="flex flex-col items-center space-y-4 p-6 bg-blue-50 rounded-lg">
          <Upload className="h-12 w-12 text-blue-500" />
          <h3 className="text-lg font-semibold text-gray-800">Upload Your Resume</h3>
          <p className="text-gray-600 text-center">Please upload your resume (PDF or Word document) to begin the interview process.</p>
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.doc,.docx"
            onChange={handleFileUpload}
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            Choose File
          </button>
        </div>
      );
    }

    if (interviewState === 'generating_questions') {
      return (
        <div className="flex flex-col items-center space-y-4 p-6 bg-yellow-50 rounded-lg">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-500"></div>
          <h3 className="text-lg font-semibold text-gray-800">Generating Interview Questions</h3>
          <p className="text-gray-600 text-center">Creating personalized technical questions based on your background...</p>
        </div>
      );
    }

    if (interviewState === 'interview_ready') {
      return (
        <div className="flex flex-col items-center space-y-4 p-6 bg-green-50 rounded-lg">
          <CheckCircle className="h-12 w-12 text-green-500" />
          <h3 className="text-lg font-semibold text-gray-800">Ready to Start Interview</h3>
          <p className="text-gray-600 text-center">All questions are prepared. Click below to begin your technical interview!</p>
          <button
            onClick={startInterviewProcess}
            className="px-8 py-4 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors font-semibold text-lg"
          >
            Start Interview
          </button>
        </div>
      );
    }

    if (interviewState === 'interview_active' && currentQuestion) {
      return (
        <div className="space-y-4">
          {/* Timer and Question Info */}
          <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
            <div className="flex items-center space-x-2">
              <Clock className="h-5 w-5 text-blue-500" />
              <span className="text-blue-700 font-semibold">
                Question {(currentInterview?.currentQuestionIndex || 0) + 1}/6
              </span>
            </div>
            <div className={`flex items-center space-x-2 ${timeRemaining <= 10 ? 'text-red-600' : 'text-blue-600'}`}>
              <Clock className="h-5 w-5" />
              <span className="font-mono font-bold text-lg">{formatTime(timeRemaining)}</span>
            </div>
          </div>

          {/* Answer Input */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">Your Answer:</label>
            <textarea
              value={currentAnswer}
              onChange={(e) => setCurrentAnswer(e.target.value)}
              placeholder="Type your answer here..."
              className="w-full h-32 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              disabled={timerStatus !== 'running'}
            />
            <div className="flex space-x-2">
              <button
                onClick={() => handleInterviewAnswer(currentAnswer)}
                disabled={!currentAnswer.trim() || timerStatus !== 'running'}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Submit Answer
              </button>
              <button
                onClick={() => {
                  if (timerStatus === 'running') {
                    dispatch(pauseInterview());
                  } else {
                    dispatch(resumeInterview());
                  }
                }}
                className="px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors"
              >
                {timerStatus === 'running' ? 'Pause' : 'Resume'}
              </button>
            </div>
          </div>
        </div>
      );
    }

    if (interviewState === 'interview_completed' && isScoringAnswers) {
      return (
        <div className="flex flex-col items-center space-y-4 p-6 bg-purple-50 rounded-lg">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
          <h3 className="text-lg font-semibold text-gray-800">Analyzing Your Responses</h3>
          <p className="text-gray-600 text-center">Evaluating your technical answers and preparing detailed feedback...</p>
        </div>
      );
    }

    return null;
  };

  return (
    <div className="flex flex-col h-full max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-white border-b border-gray-200">
        <div className="flex items-center space-x-2">
          <MessageCircle className="h-6 w-6 text-blue-500" />
          <h1 className="text-xl font-semibold text-gray-800">AI Interview Assistant</h1>
        </div>
        {candidateInfo.name && (
          <div className="text-sm text-gray-600">
            Candidate: <span className="font-medium">{candidateInfo.name}</span>
          </div>
        )}
      </div>

      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-3xl px-4 py-3 rounded-lg ${
                message.type === 'user'
                  ? 'bg-blue-500 text-white'
                  : message.type === 'system'
                  ? 'bg-yellow-100 text-yellow-800 border border-yellow-300'
                  : 'bg-white text-gray-800 shadow-sm border border-gray-200'
              }`}
            >
              <div className="whitespace-pre-wrap">{message.content}</div>
              {message.isQuestion && message.questionData && (
                <div className="mt-2 text-sm opacity-75">
                  {message.questionData.difficulty} • {message.questionData.timeLimit}s • {message.questionData.category}
                </div>
              )}
            </div>
          </div>
        ))}
        <div ref={chatEndRef} />
      </div>

      {/* Interactive State UI */}
      <div className="p-4 bg-white border-t border-gray-200">
        {renderCurrentState()}
      </div>


    </div>
  );
};

export default NewIntervieweeTab;