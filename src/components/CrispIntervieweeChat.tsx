import React, { useState, useEffect, useRef } from 'react';
import { Upload, Send, Clock, MessageCircle } from 'lucide-react';

interface Message {
  id: string;
  type: 'user' | 'bot' | 'system';
  content: string;
  timestamp: Date;
  isQuestion?: boolean;
  questionData?: any;
}

interface CandidateInfo {
  name: string;
  email: string;
  phone: string;
  resumeText?: string;
  extractedData?: any;
}

interface CrispIntervieweeChatProps {
  onCandidateAdd?: (candidate: any) => void;
  onCandidateUpdate?: (candidateId: string, updates: any) => void;
}

const CrispIntervieweeChat: React.FC<CrispIntervieweeChatProps> = ({
  onCandidateAdd,
  onCandidateUpdate
}) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      type: 'bot',
      content: "👋 Welcome to Crisp AI Interview Assistant! I'm here to help you through your interview process. Let's start by uploading your resume.",
      timestamp: new Date()
    }
  ]);
  
  const [currentInput, setCurrentInput] = useState('');
  const [candidateInfo, setCandidateInfo] = useState<CandidateInfo>({
    name: '',
    email: '',
    phone: ''
  });
  
  const [interviewState, setInterviewState] = useState<'resume_upload' | 'collecting_info' | 'confirming_info' | 'interview' | 'completed'>('resume_upload');
  const [missingFields, setMissingFields] = useState<string[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState<any>(null);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [questions, setQuestions] = useState<any[]>([]);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [isAnswering, setIsAnswering] = useState(false);
  const [candidateId, setCandidateId] = useState<string>('');
  
  const chatEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const timerRef = useRef<number | null>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Timer logic
  useEffect(() => {
    if (isAnswering && timeRemaining > 0) {
      timerRef.current = setTimeout(() => {
        setTimeRemaining(prev => prev - 1);
      }, 1000);
    } else if (timeRemaining === 0 && isAnswering) {
      handleTimeUp();
    }

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [timeRemaining, isAnswering]);

  const addMessage = (message: Omit<Message, 'id' | 'timestamp'>) => {
    const newMessage: Message = {
      ...message,
      id: Date.now().toString(),
      timestamp: new Date()
    };
    setMessages(prev => [...prev, newMessage]);
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.includes('pdf') && !file.type.includes('doc')) {
      addMessage({
        type: 'bot',
        content: "❌ Please upload a PDF or DOCX file only."
      });
      return;
    }

    addMessage({
      type: 'system',
      content: `📄 Uploaded: ${file.name}`
    });

    addMessage({
      type: 'bot',
      content: "🔍 Processing your resume... This may take a moment."
    });

    try {
      // Create FormData for file upload
      const formData = new FormData();
      formData.append('resume', file);
      formData.append('email', 'temp@example.com'); // Temporary email

      const response = await fetch('http://localhost:5001/api/interviews/upload-resume', {
        method: 'POST',
        body: formData
      });

      const data = await response.json();
      
      if (response.ok) {
        // Extract candidate info from resume
        const extractedData = data.resumeData;
        const resumeText = data.extractedText;
        
        setCandidateInfo(prev => ({
          ...prev,
          name: extractedData.name || '',
          email: extractedData.email || '',
          phone: extractedData.phone || '',
          resumeText,
          extractedData
        }));

        addMessage({
          type: 'bot',
          content: `✅ Resume processed successfully! I found the following information:`
        });

        // Show extracted information
        const infoMessage = `
📋 **Extracted Information:**
${extractedData.name ? `• Name: ${extractedData.name}` : '• Name: ❌ Not found'}
${extractedData.email ? `• Email: ${extractedData.email}` : '• Email: ❌ Not found'}
${extractedData.phone ? `• Phone: ${extractedData.phone}` : '• Phone: ❌ Not found'}
${extractedData.experience ? `• Experience: ${extractedData.experience}` : ''}
${extractedData.skills ? `• Skills: ${extractedData.skills.join(', ')}` : ''}
        `.trim();

        addMessage({
          type: 'system',
          content: infoMessage
        });

        // Check for missing fields
        const missing: string[] = [];
        if (!extractedData.name) missing.push('name');
        if (!extractedData.email) missing.push('email');
        if (!extractedData.phone) missing.push('phone');

        if (missing.length > 0) {
          setMissingFields(missing);
          setInterviewState('collecting_info');
          
          setTimeout(() => {
            addMessage({
              type: 'bot',
              content: `I need to collect some missing information before we can start. Let's begin with your ${missing[0]}:`
            });
          }, 1000);
        } else {
          setInterviewState('confirming_info');
          setTimeout(() => {
            addMessage({
              type: 'bot',
              content: "Perfect! All information is complete. Would you like to start the interview? Type 'yes' to begin."
            });
          }, 1000);
        }
      } else {
        addMessage({
          type: 'bot',
          content: `❌ Error processing resume: ${data.message}`
        });
      }
    } catch (error) {
      addMessage({
        type: 'bot',
        content: "❌ Error uploading resume. Please try again."
      });
    }
  };

  const handleSendMessage = async () => {
    if (!currentInput.trim()) return;

    // Add user message
    addMessage({
      type: 'user',
      content: currentInput
    });

    const userResponse = currentInput;
    setCurrentInput('');

    // Handle different states
    if (interviewState === 'collecting_info') {
      handleInfoCollection(userResponse);
    } else if (interviewState === 'confirming_info') {
      if (userResponse.toLowerCase().includes('yes')) {
        await startInterview();
      } else {
        addMessage({
          type: 'bot',
          content: "No problem! Please type 'yes' when you're ready to start the interview."
        });
      }
    } else if (interviewState === 'interview') {
      await submitAnswer(userResponse);
    }
  };

  const handleInfoCollection = (response: string) => {
    const currentField = missingFields[0];
    
    // Update candidate info
    setCandidateInfo(prev => ({
      ...prev,
      [currentField]: response
    }));

    // Remove collected field
    const remaining = missingFields.slice(1);
    setMissingFields(remaining);

    if (remaining.length > 0) {
      setTimeout(() => {
        addMessage({
          type: 'bot',
          content: `Great! Now I need your ${remaining[0]}:`
        });
      }, 500);
    } else {
      setInterviewState('confirming_info');
      setTimeout(() => {
        addMessage({
          type: 'bot',
          content: `Perfect! Here's your complete information:
          
📋 **Your Details:**
• Name: ${candidateInfo.name}
• Email: ${candidateInfo.email}  
• Phone: ${response}

Ready to start the interview? Type 'yes' to begin!`
        });
      }, 500);
    }
  };

  const startInterview = async () => {
    addMessage({
      type: 'bot',
      content: "🚀 Starting your AI-powered interview! Generating personalized questions based on your resume..."
    });

    try {
      const response = await fetch('http://localhost:5001/api/interviews/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          candidateEmail: candidateInfo.email,
          candidateName: candidateInfo.name,
          position: candidateInfo.extractedData?.desiredPosition || 'Software Engineer'
        })
      });

      const data = await response.json();
      
      if (response.ok) {
        setQuestions(data.interview.questions);
        setCurrentQuestion(data.interview.questions[0]);
        setQuestionIndex(0);
        setInterviewState('interview');
        setCandidateId(data.interview.id);

        // Create candidate record
        const candidateRecord = {
          id: data.interview.id,
          name: candidateInfo.name,
          email: candidateInfo.email,
          phone: candidateInfo.phone,
          position: candidateInfo.extractedData?.desiredPosition || 'Software Engineer',
          resumeData: candidateInfo.extractedData,
          resumeText: candidateInfo.resumeText,
          status: 'interviewing',
          startedAt: new Date(),
          questions: data.interview.questions,
          responses: []
        };

        onCandidateAdd?.(candidateRecord);

        setTimeout(() => {
          startQuestion(data.interview.questions[0]);
        }, 1000);
      }
    } catch (error) {
      addMessage({
        type: 'bot',
        content: "❌ Error starting interview. Please try again."
      });
    }
  };

  const startQuestion = (question: any) => {
    setTimeRemaining(question.timeLimit);
    setIsAnswering(true);

    const difficultyColor = {
      easy: '🟢',
      medium: '🟡', 
      hard: '🔴'
    };

    addMessage({
      type: 'bot',
      content: `${difficultyColor[question.difficulty as keyof typeof difficultyColor]} **Question ${questionIndex + 1}/${questions.length}** (${question.difficulty.toUpperCase()})
      
${question.question}

⏱️ Time limit: ${question.timeLimit} seconds`,
      isQuestion: true,
      questionData: question
    });
  };

  const submitAnswer = async (answer: string) => {
    setIsAnswering(false);
    
    const timeUsed = currentQuestion.timeLimit - timeRemaining;
    
    addMessage({
      type: 'bot',
      content: "🔍 Analyzing your response with AI..."
    });

    try {
      const response = await fetch(`http://localhost:5001/api/interviews/${candidateId}/response`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          response: answer,
          timeUsed: timeUsed,
          questionId: currentQuestion.id
        })
      });

      const data = await response.json();
      
      if (response.ok) {
        // Show AI feedback
        const feedback = data.aiAnalysis?.feedback || 'Response recorded successfully.';
        const score = data.score || 0;
        
        addMessage({
          type: 'system',
          content: `✅ **AI Analysis Complete**
Score: ${score}/100
${feedback}`
        });

        // Update candidate record
        onCandidateUpdate?.(candidateId, {
          responses: [...(candidateInfo.extractedData?.responses || []), {
            question: currentQuestion.question,
            answer: answer,
            score: score,
            timeUsed: timeUsed,
            aiAnalysis: data.aiAnalysis
          }]
        });

        if (data.isCompleted) {
          completeInterview(data.finalReport);
        } else {
          // Move to next question
          const nextIndex = questionIndex + 1;
          setQuestionIndex(nextIndex);
          setCurrentQuestion(questions[nextIndex]);
          
          setTimeout(() => {
            startQuestion(questions[nextIndex]);
          }, 2000);
        }
      }
    } catch (error) {
      addMessage({
        type: 'bot',
        content: "❌ Error submitting answer. Please try again."
      });
      setIsAnswering(true);
    }
  };

  const handleTimeUp = () => {
    if (currentInput.trim()) {
      addMessage({
        type: 'user',
        content: currentInput
      });
      submitAnswer(currentInput);
    } else {
      addMessage({
        type: 'system',
        content: "⏰ Time's up! Moving to next question..."
      });
      submitAnswer("(No response - time expired)");
    }
    setCurrentInput('');
  };

  const completeInterview = (finalReport: any) => {
    setInterviewState('completed');
    
    addMessage({
      type: 'bot',
      content: `🎉 **Interview Completed!**
      
Your final score: **${finalReport.candidate?.averageScore || 0}%**
Recommendation: **${finalReport.recommendation}**

${finalReport.aiSummary}

Thank you for completing the interview! Your responses have been recorded and will be reviewed by our team.`
    });

    // Update final candidate status
    onCandidateUpdate?.(candidateId, {
      status: 'completed',
      completedAt: new Date(),
      finalReport: finalReport,
      finalScore: finalReport.candidate?.averageScore || 0
    });
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex flex-col h-[calc(100vh-200px)] bg-white rounded-lg shadow-lg overflow-hidden">
      {/* Chat Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-4 text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
              <MessageCircle className="w-6 h-6" />
            </div>
            <div>
              <h2 className="font-semibold">AI Interview Assistant</h2>
              <p className="text-sm opacity-90">
                {interviewState === 'resume_upload' && 'Upload your resume to start'}
                {interviewState === 'collecting_info' && 'Collecting missing information'}
                {interviewState === 'confirming_info' && 'Ready to begin interview'}
                {interviewState === 'interview' && `Question ${questionIndex + 1}/${questions.length}`}
                {interviewState === 'completed' && 'Interview completed'}
              </p>
            </div>
          </div>
          
          {/* Timer */}
          {isAnswering && (
            <div className="bg-white/20 rounded-lg px-3 py-1">
              <div className="flex items-center space-x-2">
                <Clock className="w-4 h-4" />
                <span className={`font-mono font-bold ${timeRemaining <= 10 ? 'text-red-300' : ''}`}>
                  {formatTime(timeRemaining)}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-xs md:max-w-md lg:max-w-lg px-4 py-2 rounded-lg ${
                message.type === 'user'
                  ? 'bg-blue-600 text-white'
                  : message.type === 'system'
                  ? 'bg-gray-100 text-gray-800 border border-gray-200'
                  : 'bg-gray-50 text-gray-800 border border-gray-200'
              }`}
            >
              <div className="text-sm whitespace-pre-wrap">{message.content}</div>
              <div className="text-xs opacity-70 mt-1">
                {message.timestamp.toLocaleTimeString()}
              </div>
            </div>
          </div>
        ))}
        <div ref={chatEndRef} />
      </div>

      {/* Input Area */}
      <div className="border-t border-gray-200 p-4">
        {interviewState === 'resume_upload' && (
          <div className="space-y-3">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              accept=".pdf,.doc,.docx"
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 px-4 rounded-lg font-medium hover:from-blue-700 hover:to-purple-700 transition-all duration-200 flex items-center justify-center space-x-2"
            >
              <Upload className="w-5 h-5" />
              <span>Upload Resume (PDF/DOCX)</span>
            </button>
          </div>
        )}
        
        {(interviewState === 'collecting_info' || interviewState === 'confirming_info' || interviewState === 'interview') && (
          <div className="flex space-x-2">
            <input
              type="text"
              value={currentInput}
              onChange={(e) => setCurrentInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
              placeholder={
                interviewState === 'collecting_info' 
                  ? `Enter your ${missingFields[0]}...`
                  : interviewState === 'confirming_info'
                  ? "Type 'yes' to start the interview..."
                  : "Type your answer here..."
              }
              className="flex-1 border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={!isAnswering && interviewState === 'interview'}
            />
            <button
              onClick={handleSendMessage}
              disabled={!currentInput.trim() || (!isAnswering && interviewState === 'interview')}
              className="bg-blue-600 text-white p-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default CrispIntervieweeChat;