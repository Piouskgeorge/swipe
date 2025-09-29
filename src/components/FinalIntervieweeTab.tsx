import React, { useState, useEffect, useRef } from 'react';
import { Upload, Clock, MessageCircle, CheckCircle, Send } from 'lucide-react';
import aiService from '../services/aiService';
import type { Answer, Question, BatchScoringResult } from '../types';

interface Message {
  id: string;
  type: 'user' | 'bot' | 'system';
  content: string;
  timestamp: Date;
}

const generateUniqueId = (prefix = '') => {
  return `${prefix}${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

const FinalIntervieweeTab: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      type: 'bot',
      content: "👋 Welcome! I'm your AI Interview Assistant. Let's start by uploading your resume to begin your personalized technical interview.",
      timestamp: new Date()
    }
  ]);
  
  const [currentInput, setCurrentInput] = useState('');
  const [interviewState, setInterviewState] = useState<
    'resume_upload' | 'processing' | 'interview_active' | 'completed'
  >('resume_upload');
  
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [isTimerActive, setIsTimerActive] = useState(false);
  
  const chatEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const timerRef = useRef<number | null>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Timer logic
  useEffect(() => {
    if (isTimerActive && timeRemaining > 0) {
      timerRef.current = setTimeout(() => {
        setTimeRemaining(prev => prev - 1);
      }, 1000);
    } else if (timeRemaining === 0 && isTimerActive) {
      handleTimeOut();
    }

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [timeRemaining, isTimerActive]);

  const addMessage = (content: string, type: 'user' | 'bot' | 'system' = 'bot') => {
    const message: Message = {
      id: generateUniqueId('msg_'),
      type,
      content,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, message]);
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setInterviewState('processing');
    addMessage(`📄 Processing ${file.name}...`, 'system');
    
    try {
      // Process resume
      let resumeText = '';
      if (file.type === 'application/pdf') {
        try {
          resumeText = await aiService.processPDFWithGemini(file);
          addMessage("✅ Resume processed successfully!");
        } catch (error) {
          resumeText = await aiService.parseResume(file);
          addMessage("✅ Resume processed successfully!");
        }
      } else {
        resumeText = await aiService.parseResume(file);
        addMessage("✅ Resume processed successfully!");
      }

      // Extract candidate info automatically
      addMessage("🔍 Analyzing your background...", 'system');
      const candidateData = await aiService.extractCandidateInfo(resumeText);
      
      addMessage(`🎯 **Profile Analysis Complete!**

**Name:** ${candidateData.name}
**Email:** ${candidateData.email}  
**Phone:** ${candidateData.phone}
**Domain:** ${candidateData.domain}
**Position:** ${candidateData.position}

🔄 Generating 6 personalized technical questions...`, 'system');

      // Generate questions
      const generatedQuestions = await aiService.generateAllInterviewQuestions(
        resumeText,
        candidateData.position,
        'medium'
      );
      
      setQuestions(generatedQuestions);
      
      addMessage(`✅ **Interview Ready!**

I've prepared 6 technical questions tailored to your ${candidateData.domain} background:
• 2 Easy questions (20s each)
• 2 Medium questions (60s each)  
• 2 Hard questions (120s each)

Click "Start Interview" when ready!`, 'system');
      
      setInterviewState('interview_active');
      
    } catch (error) {
      console.error('Processing failed:', error);
      addMessage("❌ Sorry, I couldn't process that file. Please try again with a PDF or Word document.");
      setInterviewState('resume_upload');
    }
  };

  const startInterview = () => {
    if (questions.length === 0) return;
    
    addMessage("🎯 **Interview Starting!**\n\nI'll ask you 6 questions one by one. Please answer each question to the best of your ability. I'll evaluate all your answers together at the end.\n\nLet's begin!", 'system');
    
    setCurrentQuestionIndex(0);
    askQuestion(0);
  };

  const askQuestion = (index: number) => {
    if (index >= questions.length) {
      completeInterview();
      return;
    }

    const question = questions[index];
    setTimeRemaining(question.timeLimit);
    setIsTimerActive(true);
    
    const questionMessage = `**Question ${index + 1}/6** (${question.difficulty.toUpperCase()})

${question.text}

⏱️ Time limit: ${question.timeLimit} seconds`;
    
    addMessage(questionMessage, 'bot');
  };

  const submitAnswer = () => {
    if (!currentInput.trim()) return;
    
    const currentQuestion = questions[currentQuestionIndex];
    const timeSpent = currentQuestion.timeLimit - timeRemaining;
    
    addMessage(currentInput, 'user');
    
    const answer: Answer = {
      questionId: currentQuestion.id,
      answer: currentInput,
      timeSpent,
      timestamp: new Date()
    };
    
    setAnswers(prev => [...prev, answer]);
    setCurrentInput('');
    setIsTimerActive(false);
    
    // NO SCORING HERE - just collect the answer
    addMessage("✅ Answer recorded! Moving to next question...", 'system');
    
    // Move to next question after a brief delay
    setTimeout(() => {
      setCurrentQuestionIndex(prev => prev + 1);
      askQuestion(currentQuestionIndex + 1);
    }, 1500);
  };

  const handleTimeOut = () => {
    setIsTimerActive(false);
    
    const currentQuestion = questions[currentQuestionIndex];
    const answer: Answer = {
      questionId: currentQuestion.id,
      answer: currentInput.trim() || 'No answer provided (timeout)',
      timeSpent: currentQuestion.timeLimit,
      timestamp: new Date()
    };
    
    setAnswers(prev => [...prev, answer]);
    addMessage("⏰ Time's up! Moving to next question...", 'system');
    setCurrentInput('');
    
    // NO SCORING HERE - just collect the answer
    
    setTimeout(() => {
      setCurrentQuestionIndex(prev => prev + 1);
      askQuestion(currentQuestionIndex + 1);
    }, 1500);
  };

  const completeInterview = async () => {
    setInterviewState('completed');
    addMessage("🎉 **Interview Complete!**\n\nAll 6 questions completed! Now analyzing ALL your responses together for comprehensive evaluation...", 'system');
    
    try {
      // Prepare all questions and answers for batch scoring
      const questionsAndAnswers = questions.map((q, i) => ({
        question: q,
        answer: answers[i] || {
          questionId: q.id,
          answer: 'No answer provided',
          timeSpent: q.timeLimit,
          timestamp: new Date()
        }
      }));
      
      addMessage("🔍 **Analyzing All Responses with AI...**\n\nEvaluating technical accuracy, depth of knowledge, and overall performance across all questions...", 'system');
      
      // Get comprehensive batch scoring from AI
      const finalResult = await aiService.scoreAllAnswers(questionsAndAnswers);
      
      const finalMessage = `🏆 **Final Interview Results**

**Overall Score: ${finalResult.overallScore}/100**
**Recommendation: ${finalResult.recommendation}**

**Comprehensive Analysis:**
${finalResult.overallFeedback}

**Individual Question Breakdown:**
${finalResult.individualScores.map((score, index) => 
  `**Question ${index + 1}** (${questions[index].difficulty}): ${score.score}/100
${score.feedback}`
).join('\n\n')}

---

**Thank you for completing the technical interview!** Your responses have been thoroughly analyzed using AI evaluation. This assessment provides a comprehensive view of your technical capabilities across multiple difficulty levels.`;
      
      addMessage(finalMessage, 'system');
      
    } catch (error) {
      console.error('Final scoring failed:', error);
      addMessage(`❌ **Error in Final Analysis**\n\nThere was an issue analyzing your responses. However, all ${answers.length} answers have been recorded for manual review.\n\nThank you for completing the interview!`, 'system');
    }
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex flex-col h-full max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-white border-b border-gray-200">
        <div className="flex items-center space-x-2">
          <MessageCircle className="h-6 w-6 text-blue-500" />
          <h1 className="text-xl font-semibold text-gray-800">AI Interview Assistant</h1>
        </div>
        {interviewState === 'interview_active' && currentQuestionIndex < questions.length && (
          <div className={`flex items-center space-x-2 ${timeRemaining <= 10 ? 'text-red-600' : 'text-blue-600'}`}>
            <Clock className="h-5 w-5" />
            <span className="font-mono font-bold text-lg">{formatTime(timeRemaining)}</span>
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
            </div>
          </div>
        ))}
        <div ref={chatEndRef} />
      </div>

      {/* Action Area */}
      <div className="p-4 bg-white border-t border-gray-200">
        {interviewState === 'resume_upload' && (
          <div className="flex flex-col items-center space-y-4 p-6 bg-blue-50 rounded-lg">
            <Upload className="h-12 w-12 text-blue-500" />
            <h3 className="text-lg font-semibold text-gray-800">Upload Your Resume</h3>
            <p className="text-gray-600 text-center">Upload your resume (PDF or Word) to start your personalized technical interview.</p>
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
        )}

        {interviewState === 'processing' && (
          <div className="flex flex-col items-center space-y-4 p-6 bg-yellow-50 rounded-lg">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-500"></div>
            <h3 className="text-lg font-semibold text-gray-800">Processing Resume</h3>
            <p className="text-gray-600 text-center">Analyzing your background and generating personalized questions...</p>
          </div>
        )}

        {interviewState === 'interview_active' && currentQuestionIndex >= questions.length && (
          <div className="flex flex-col items-center space-y-4 p-6 bg-green-50 rounded-lg">
            <CheckCircle className="h-12 w-12 text-green-500" />
            <button
              onClick={startInterview}
              className="px-8 py-4 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors font-semibold text-lg"
            >
              Start Interview
            </button>
          </div>
        )}

        {interviewState === 'interview_active' && currentQuestionIndex < questions.length && isTimerActive && (
          <div className="flex space-x-2">
            <textarea
              value={currentInput}
              onChange={(e) => setCurrentInput(e.target.value)}
              placeholder="Type your answer here..."
              className="flex-1 h-24 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              onKeyPress={(e) => {
                if (e.key === 'Enter' && e.ctrlKey) {
                  submitAnswer();
                }
              }}
            />
            <button
              onClick={submitAnswer}
              disabled={!currentInput.trim()}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Send className="h-4 w-4" />
            </button>
          </div>
        )}

        {interviewState === 'completed' && (
          <div className="flex flex-col items-center space-y-4 p-6 bg-purple-50 rounded-lg">
            <CheckCircle className="h-12 w-12 text-purple-500" />
            <h3 className="text-lg font-semibold text-gray-800">Interview Complete!</h3>
            <p className="text-gray-600 text-center">Thank you for completing the interview. Your responses have been analyzed and scored.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default FinalIntervieweeTab;