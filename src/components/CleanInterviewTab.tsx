import React, { useState, useEffect, useRef } from 'react';
import { Upload, Clock, MessageCircle, Send } from 'lucide-react';
import aiService from '../services/aiService';
import type { Answer, Question } from '../types';

interface Message {
  id: string;
  type: 'user' | 'bot' | 'system';
  content: string;
  timestamp: Date;
}

const CleanInterviewTab: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      type: 'bot',
      content: "👋 Welcome! Upload your resume to start your personalized technical interview.",
      timestamp: new Date()
    }
  ]);
  
  const [currentInput, setCurrentInput] = useState('');
  const [state, setState] = useState<'upload' | 'processing' | 'ready' | 'active' | 'completed'>('upload');
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [isTimerActive, setIsTimerActive] = useState(false);
  
  const chatEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (isTimerActive && timeRemaining > 0) {
      timerRef.current = setTimeout(() => {
        setTimeRemaining(prev => prev - 1);
      }, 1000);
    } else if (timeRemaining === 0 && isTimerActive) {
      handleTimeout();
    }
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [timeRemaining, isTimerActive]);

  const addMessage = (content: string, type: 'user' | 'bot' | 'system' = 'bot') => {
    const message: Message = {
      id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type,
      content,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, message]);
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setState('processing');
    addMessage(`📄 Processing ${file.name}...`, 'system');
    
    try {
      // Process resume
      let resumeText = '';
      if (file.type === 'application/pdf') {
        try {
          resumeText = await aiService.processPDFWithGemini(file);
          addMessage("✅ Resume processed with AI!");
        } catch (error) {
          resumeText = await aiService.parseResume(file);
          addMessage("✅ Resume processed!");
        }
      } else {
        resumeText = await aiService.parseResume(file);
        addMessage("✅ Resume processed!");
      }

      // Extract candidate info
      addMessage("🔍 Analyzing your background...", 'system');
      const candidateData = await aiService.extractCandidateInfo(resumeText);
      
      addMessage(`🎯 Analysis Complete!\n\nDomain: ${candidateData.domain}\nPosition: ${candidateData.position}\n\n🔄 Generating 6 personalized questions...`, 'system');

      // Generate ALL questions at once
      const allQuestions = await aiService.generateAllInterviewQuestions(
        resumeText,
        candidateData.position,
        'medium'
      );
      
      setQuestions(allQuestions);
      
      addMessage(`✅ Interview Ready!\n\nI've prepared 6 technical questions:\n• 2 Easy (20s each)\n• 2 Medium (60s each)\n• 2 Hard (120s each)\n\nClick "Start Interview" when ready!`, 'system');
      
      setState('ready');
      
    } catch (error) {
      console.error('Processing failed:', error);
      addMessage("❌ Processing failed. Please try again.", 'system');
      setState('upload');
    }
  };

  const startInterview = () => {
    if (questions.length === 0) return;
    setState('active');
    setCurrentQuestionIndex(0);
    askQuestion(0);
  };

  const askQuestion = (index: number) => {
    if (index >= questions.length) {
      finishInterview();
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
    
    // IMPORTANT: No individual scoring - just collect answers
    addMessage("✅ Answer recorded!", 'system');
    
    setTimeout(() => {
      const nextIndex = currentQuestionIndex + 1;
      setCurrentQuestionIndex(nextIndex);
      askQuestion(nextIndex);
    }, 1000);
  };

  const handleTimeout = () => {
    setIsTimerActive(false);
    
    const currentQuestion = questions[currentQuestionIndex];
    const answer: Answer = {
      questionId: currentQuestion.id,
      answer: currentInput.trim() || 'No answer provided (timeout)',
      timeSpent: currentQuestion.timeLimit,
      timestamp: new Date()
    };
    
    setAnswers(prev => [...prev, answer]);
    setCurrentInput('');
    
    addMessage("⏰ Time's up!", 'system');
    
    setTimeout(() => {
      const nextIndex = currentQuestionIndex + 1;
      setCurrentQuestionIndex(nextIndex);
      askQuestion(nextIndex);
    }, 1000);
  };

  const finishInterview = async () => {
    setState('completed');
    addMessage("🎉 Interview Complete!\n\nAnalyzing all 6 responses together...", 'system');
    
    try {
      // Prepare all questions and answers for batch scoring
      const questionsAndAnswers = questions.map((question, index) => ({
        question,
        answer: answers[index] || {
          questionId: question.id,
          answer: 'No answer provided',
          timeSpent: question.timeLimit,
          timestamp: new Date()
        }
      }));
      
      // ONE SINGLE API CALL for all scoring
      const finalResult = await aiService.scoreAllAnswers(questionsAndAnswers);
      
      const resultsMessage = `🏆 **Final Results**

**Overall Score: ${finalResult.overallScore}/100**
**Recommendation: ${finalResult.recommendation}**

**Performance Analysis:**
${finalResult.overallFeedback}

**Individual Scores:**
${finalResult.individualScores.map((score, index) => 
  `Q${index + 1}: ${score.score}/100 - ${score.feedback}`
).join('\n\n')}

Thank you for completing the interview!`;
      
      addMessage(resultsMessage, 'system');
      
    } catch (error) {
      console.error('Final scoring failed:', error);
      addMessage("✅ Interview completed! All responses have been recorded.", 'system');
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
        {state === 'active' && (
          <div className={`flex items-center space-x-2 ${timeRemaining <= 10 ? 'text-red-600' : 'text-blue-600'}`}>
            <Clock className="h-5 w-5" />
            <span className="font-mono font-bold text-lg">{formatTime(timeRemaining)}</span>
          </div>
        )}
      </div>

      {/* Chat */}
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

      {/* Actions */}
      <div className="p-4 bg-white border-t border-gray-200">
        {state === 'upload' && (
          <div className="text-center">
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.doc,.docx"
              onChange={handleFileUpload}
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
            >
              <Upload className="inline mr-2 h-4 w-4" />
              Upload Resume
            </button>
          </div>
        )}

        {state === 'processing' && (
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
            <p className="mt-2 text-gray-600">Processing...</p>
          </div>
        )}

        {state === 'ready' && (
          <div className="text-center">
            <button
              onClick={startInterview}
              className="px-8 py-4 bg-green-500 text-white rounded-lg hover:bg-green-600 font-semibold text-lg"
            >
              Start Interview
            </button>
          </div>
        )}

        {state === 'active' && isTimerActive && (
          <div className="flex space-x-2">
            <textarea
              value={currentInput}
              onChange={(e) => setCurrentInput(e.target.value)}
              placeholder="Type your answer here..."
              className="flex-1 h-24 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 resize-none"
            />
            <button
              onClick={submitAnswer}
              disabled={!currentInput.trim()}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50"
            >
              <Send className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default CleanInterviewTab;