import React, { useState, useEffect, useRef } from 'react';
import { Upload, Send, Clock, MessageCircle } from 'lucide-react';

// Inline styles for guaranteed CSS loading
const chatStyles = {
  container: {
    minHeight: '100vh',
    backgroundColor: '#f8fafc',
    padding: '24px'
  },
  chatBox: {
    maxWidth: '800px',
    margin: '0 auto',
    backgroundColor: 'white',
    borderRadius: '12px',
    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
    overflow: 'hidden'
  },
  header: {
    padding: '20px 24px',
    backgroundColor: '#3b82f6',
    color: 'white',
    display: 'flex',
    alignItems: 'center',
    gap: '12px'
  },
  headerTitle: {
    fontSize: '20px',
    fontWeight: 'bold',
    margin: 0
  },
  messagesContainer: {
    height: '500px',
    overflowY: 'auto' as const,
    padding: '16px',
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '12px'
  },
  message: {
    maxWidth: '80%',
    padding: '12px 16px',
    borderRadius: '18px',
    fontSize: '14px',
    lineHeight: '1.5'
  },
  userMessage: {
    backgroundColor: '#3b82f6',
    color: 'white',
    alignSelf: 'flex-end',
    marginLeft: 'auto'
  },
  botMessage: {
    backgroundColor: '#f3f4f6',
    color: '#1f2937',
    alignSelf: 'flex-start'
  },
  systemMessage: {
    backgroundColor: '#fef3c7',
    color: '#92400e',
    alignSelf: 'center',
    textAlign: 'center' as const,
    fontStyle: 'italic',
    fontSize: '13px'
  },
  inputContainer: {
    padding: '16px 24px',
    borderTop: '1px solid #e5e7eb',
    display: 'flex',
    gap: '12px',
    alignItems: 'center'
  },
  input: {
    flex: 1,
    padding: '12px 16px',
    border: '1px solid #d1d5db',
    borderRadius: '8px',
    fontSize: '14px',
    outline: 'none',
    fontFamily: 'inherit'
  },
  button: {
    padding: '12px 16px',
    backgroundColor: '#3b82f6',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '14px',
    fontWeight: '500'
  },
  buttonDisabled: {
    backgroundColor: '#9ca3af',
    cursor: 'not-allowed'
  },
  uploadArea: {
    padding: '40px 24px',
    textAlign: 'center' as const,
    borderTop: '1px solid #e5e7eb'
  },
  uploadBox: {
    border: '2px dashed #d1d5db',
    borderRadius: '8px',
    padding: '40px 20px',
    cursor: 'pointer',
    transition: 'all 0.2s',
    backgroundColor: '#fafafa'
  },
  uploadText: {
    color: '#6b7280',
    fontSize: '14px',
    margin: '8px 0 0 0'
  },
  timer: {
    position: 'fixed' as const,
    top: '20px',
    right: '20px',
    backgroundColor: '#ef4444',
    color: 'white',
    padding: '8px 16px',
    borderRadius: '8px',
    fontSize: '16px',
    fontWeight: 'bold',
    zIndex: 1000,
    display: 'flex',
    alignItems: 'center',
    gap: '8px'
  },
  statusBar: {
    padding: '12px 24px',
    backgroundColor: '#f9fafb',
    borderTop: '1px solid #e5e7eb',
    fontSize: '13px',
    color: '#6b7280',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
  }
};

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
      content: "👋 Welcome to Connect AI Interview Assistant! I'm here to help you through your interview process. Let's start by uploading your resume.",
      timestamp: new Date()
    }
  ]);
  
  const [currentInput, setCurrentInput] = useState('');
  const [candidateInfo, setCandidateInfo] = useState<CandidateInfo>({
    name: '',
    email: '',
    phone: ''
  });
  const [interviewState, setInterviewState] = useState<'upload' | 'collecting_info' | 'collecting_position' | 'interviewing' | 'completed'>('upload');
  const [isUploading, setIsUploading] = useState(false);
  const [missingFields, setMissingFields] = useState<string[]>([]);
  const [currentFieldIndex, setCurrentFieldIndex] = useState(0);
  const [currentQuestion, setCurrentQuestion] = useState<any>(null);
  const [questionTimer, setQuestionTimer] = useState(60);
  const [isTimerActive, setIsTimerActive] = useState(false);
  const [responses, setResponses] = useState<any[]>([]);
  const [candidateId, setCandidateId] = useState<string>('');
  const [interviewQuestions, setInterviewQuestions] = useState<any[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState<number>(0);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Timer effect
  useEffect(() => {
    let interval: any;
    if (isTimerActive && questionTimer > 0) {
      interval = setInterval(() => {
        setQuestionTimer((prev) => prev - 1);
      }, 1000);
    } else if (questionTimer === 0 && isTimerActive) {
      handleSubmitResponse(true);
    }
    return () => clearInterval(interval);
  }, [isTimerActive, questionTimer]);

  const addMessage = (message: Omit<Message, 'id' | 'timestamp'>) => {
    const newMessage: Message = {
      ...message,
      id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, newMessage]);
    return newMessage;
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    addMessage({
      type: 'system',
      content: `📄 Uploading ${file.name}...`
    });

    try {
      // Use local resume parsing instead of API call
      const { parseResumeFile } = await import('../utils/resumeParser');
      const resumeData = await parseResumeFile(file);
      
      // Update candidate info with parsed data
      setCandidateInfo(prev => ({
        ...prev,
        resumeText: resumeData.text,
        extractedData: resumeData,
        name: resumeData.name || prev.name,
        email: resumeData.email || prev.email,
        phone: resumeData.phone || prev.phone,
      }));

      // Format the extracted data nicely for display
      const formattedInfo = `
📋 **Resume Information Extracted:**

👤 **Name:** ${resumeData.name || 'Not found'}
📧 **Email:** ${resumeData.email || 'Not found'}
📞 **Phone:** ${resumeData.phone || 'Not found'}

${resumeData.text ? '📄 **Resume text extracted successfully**' : ''}
      `.trim();

      addMessage({
        type: 'bot',
        content: `✅ Resume uploaded successfully! I've extracted the following information:\n\n${formattedInfo}`
      });

      // Check for missing fields
      const missing: string[] = [];
      if (!resumeData.name) missing.push('name');
      if (!resumeData.email) missing.push('email');
      if (!resumeData.phone) missing.push('phone');

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
        setTimeout(() => {
          addMessage({
            type: 'bot',
            content: `Perfect! I have all the information I need. Now, what position are you interviewing for? Please specify the role (e.g., "Software Engineer", "Frontend Developer", "Full Stack Developer", etc.):`
          });
          setInterviewState('collecting_position');
        }, 1500);
      }
    } catch (error) {
      console.error('Upload error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      addMessage({
        type: 'bot',
        content: `❌ Sorry, there was an error uploading your resume. Error: ${errorMessage}. Please try again.`
      });
    } finally {
      setIsUploading(false);
    }
  };

  const showCurrentQuestion = (questions: any[], questionIndex: number) => {
    if (questionIndex >= questions.length) {
      // Interview completed
      completeInterview(candidateId);
      return;
    }

    const question = questions[questionIndex];
    setCurrentQuestion(question);
    setQuestionTimer(question.timeLimit || 60);
    setIsTimerActive(true);
    
    addMessage({
      type: 'bot',
      content: `❓ **Question ${questionIndex + 1} of ${questions.length}:** ${question.question}\n\n⏱️ Time limit: ${question.timeLimit || 60} seconds\n💡 Difficulty: ${question.difficulty}`,
    });
  };

  const startInterview = async (fullCandidateInfo: any) => {
    try {
      // Use local data service to generate questions
      const localDataService = (await import('../services/localDataService')).default;
      const questions = await localDataService.generateQuestions(
        fullCandidateInfo.resumeText || '', 
        'medium'
      );
      
      // Create candidate ID and interview data
      const candidateId = `candidate_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const interview = {
        id: candidateId,
        candidateId,
        questions,
        position: fullCandidateInfo.position,
        startTime: new Date(),
        answers: [],
        currentQuestionIndex: 0
      };
      
      setCandidateId(candidateId);
      setInterviewQuestions(questions);
      setCurrentQuestionIndex(0);
      
      // Create candidate object for persistence
      const candidateData = {
        ...fullCandidateInfo,
        id: candidateId,
        status: 'interviewing',
        startedAt: new Date(),
        createdAt: new Date(),
        questions,
      };
      
      // Call parent callback to add candidate to Redux store
      onCandidateAdd?.(candidateData);
      
      addMessage({
        type: 'bot',
        content: `🎯 Perfect! Let's begin your interview for the ${interview.position} position. You'll have ${questions[0]?.timeLimit || 60} seconds to answer each question. Ready for your first question?`
      });
      
      setTimeout(() => {
        showCurrentQuestion(questions, 0);
      }, 2000);
      
      setInterviewState('interviewing');
    } catch (error) {
      console.error('Start interview error:', error);
      addMessage({
        type: 'bot',
        content: '❌ Error starting interview. Please refresh and try again.'
      });
    }
  };

  const formatFinalReport = (report: any) => {
    if (!report) return 'Report not available';
    
    return `**Overall Score:** ${report.overallScore}%
**Accuracy:** ${report.accuracyPercentage}%
**Technical Competency:** ${report.technicalCompetency}
**Communication:** ${report.communicationScore}/100
**Recommendation:** ${report.recommendation}

**Strengths:**
${report.strengths?.map((s: string) => `• ${s}`).join('\n') || 'None listed'}

**Areas for Improvement:**
${report.improvements?.map((i: string) => `• ${i}`).join('\n') || 'None listed'}`;
  };

  const handleSubmitResponse = async (isTimeUp = false) => {
    if (!currentQuestion || (!currentInput.trim() && !isTimeUp)) return;

    const timeUsed = 60 - questionTimer;
    const response = currentInput.trim() || "(No response provided)";
    
    setIsTimerActive(false);
    
    addMessage({
      type: 'user',
      content: response
    });

    try {
      // Use local data service to score the answer
      const localDataService = (await import('../services/localDataService')).default;
      const answer = {
        questionId: currentQuestion.id,
        answer: response,
        timeSpent: timeUsed,
        timestamp: new Date()
      };
      
      const scoreResult = await localDataService.scoreAnswer(answer, currentQuestion);
      
      // Show AI feedback
      addMessage({
        type: 'bot',
        content: `✅ Response submitted! Score: ${scoreResult.score}/100\n📝 ${scoreResult.feedback}`
      });

      setResponses(prev => [...prev, {
        question: currentQuestion,
        response: response,
        timeUsed: timeUsed,
        score: scoreResult.score,
        aiAnalysis: { feedback: scoreResult.feedback }
      }]);

      setCurrentInput('');
      setCurrentQuestion(null);

      // Check if this was the last question
      const isCompleted = (currentQuestionIndex + 1) >= interviewQuestions.length;
      
      if (isCompleted) {
        // Interview completed - generate final summary
        setTimeout(async () => {
          const localDataService = (await import('../services/localDataService')).default;
          const candidate = { 
            id: candidateId, 
            name: candidateInfo?.name || '', 
            email: candidateInfo?.email || '',
            phone: candidateInfo?.phone || '',
            status: 'completed' as const,
            createdAt: new Date(),
            startedAt: new Date()
          };
          const interview = {
            id: candidateId,
            candidateId,
            questions: interviewQuestions,
            answers: responses.map(r => ({
              questionId: r.question.id,
              answer: r.response,
              timeSpent: r.timeUsed,
              score: r.score,
              timestamp: new Date()
            })),
            currentQuestionIndex: currentQuestionIndex,
            isPaused: false
          };
          
          const summary = await localDataService.generateInterviewSummary(interview, candidate);
          
          addMessage({
            type: 'bot',
            content: `🎉 Congratulations! You've completed the interview!\n\n📊 **Final Results:**\n⭐ **Overall Score:** ${summary.score.toFixed(1)}/100\n\n📝 **Summary:**\n${summary.summary}`
          });
          setInterviewState('completed');
          
          // Update candidate with final results
          onCandidateUpdate?.(candidateId, {
            status: 'completed',
            completedAt: new Date(),
            finalScore: summary.score,
            summary: summary.summary
          });
        }, 2000);
        return;
      } else {
        // Move to next question
        const nextIndex = currentQuestionIndex + 1;
        const nextQuestion = interviewQuestions[nextIndex];
        
        if (nextQuestion) {
          setTimeout(() => {
            setCurrentQuestion(nextQuestion);
            setCurrentQuestionIndex(nextIndex);
            setQuestionTimer(nextQuestion.timeLimit || 60);
            setIsTimerActive(true);
            
            addMessage({
              type: 'bot',
              content: `❓ **Question ${nextIndex + 1} of ${interviewQuestions.length}:** ${nextQuestion.text}\n\n⏱️ Time limit: ${nextQuestion.timeLimit || 60} seconds\n💡 Difficulty: ${nextQuestion.difficulty}`
            });
          }, 2000);
        }
      }
    } catch (error) {
      console.error('Submit response error:', error);
    }

    // Note: Question flow is now handled by the backend response
  };

  const completeInterview = async (interviewId: string) => {
    // This function is now handled by the response submission endpoint
    // Just update the UI state
    addMessage({
      type: 'bot',
      content: '🎉 Interview completed! Generating your final report...'
    });
    setInterviewState('completed');
  };

  const handleInfoSubmit = () => {
    if (!currentInput.trim()) return;

    if (interviewState === 'collecting_position') {
      // Handle position collection
      const position = currentInput.trim();
      setCandidateInfo(prev => ({
        ...prev,
        position: position
      }));

      addMessage({
        type: 'user',
        content: position
      });

      setCurrentInput('');

      const fullInfo = {
        ...candidateInfo,
        position: position,
        resumeText: candidateInfo.resumeText,
        extractedData: candidateInfo.extractedData
      };

      setTimeout(() => {
        addMessage({
          type: 'bot',
          content: `Excellent! You're interviewing for ${position}. Let me start your interview now. I'll ask you questions tailored to this role based on your resume. Good luck! 🚀`
        });
        startInterview(fullInfo);
      }, 1000);
      
      return;
    }

    // Handle missing field collection
    const fieldName = missingFields[currentFieldIndex];
    setCandidateInfo(prev => ({
      ...prev,
      [fieldName]: currentInput.trim()
    }));

    addMessage({
      type: 'user',
      content: currentInput.trim()
    });

    setCurrentInput('');

    if (currentFieldIndex < missingFields.length - 1) {
      setCurrentFieldIndex(prev => prev + 1);
      setTimeout(() => {
        addMessage({
          type: 'bot',
          content: `Great! Now please provide your ${missingFields[currentFieldIndex + 1]}:`
        });
      }, 1000);
    } else {
      const fullInfo = {
        ...candidateInfo,
        [fieldName]: currentInput.trim(),
        resumeText: candidateInfo.resumeText,
        extractedData: candidateInfo.extractedData
      };
      
      setTimeout(() => {
        addMessage({
          type: 'bot',
          content: `Perfect! I have all your information. Now, what position are you interviewing for? Please specify the role (e.g., "Software Engineer", "Frontend Developer", "Full Stack Developer", etc.):`
        });
        setInterviewState('collecting_position');
      }, 1000);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (interviewState === 'collecting_info' || interviewState === 'collecting_position') {
        handleInfoSubmit();
      } else if (interviewState === 'interviewing') {
        handleSubmitResponse();
      }
    }
  };

  return (
    <div style={chatStyles.container}>
      {/* Timer */}
      {isTimerActive && (
        <div style={chatStyles.timer}>
          <Clock style={{ width: '16px', height: '16px' }} />
          {questionTimer}s
        </div>
      )}

      <div style={chatStyles.chatBox}>
        {/* Header */}
        <div style={chatStyles.header}>
          <MessageCircle style={{ width: '24px', height: '24px' }} />
          <h2 style={chatStyles.headerTitle}>Connect AI Assistant</h2>
        </div>

        {/* Messages */}
        <div style={chatStyles.messagesContainer}>
          {messages.map((message) => (
            <div
              key={message.id}
              style={{
                ...chatStyles.message,
                ...(message.type === 'user' ? chatStyles.userMessage : 
                    message.type === 'system' ? chatStyles.systemMessage : 
                    chatStyles.botMessage)
              }}
            >
              {message.content}
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        {interviewState === 'upload' && (
          <div style={chatStyles.uploadArea}>
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.docx"
              onChange={handleFileUpload}
              style={{ display: 'none' }}
            />
            <div 
              style={chatStyles.uploadBox}
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload style={{ width: '32px', height: '32px', color: '#6b7280', margin: '0 auto' }} />
              <p style={chatStyles.uploadText}>
                {isUploading ? 'Uploading...' : 'Click to upload your resume (PDF or DOCX)'}
              </p>
            </div>
          </div>
        )}

        {(interviewState === 'collecting_info' || interviewState === 'collecting_position' || interviewState === 'interviewing' || interviewState === 'completed') && (
          <div style={chatStyles.inputContainer}>
            <input
              type="text"
              value={currentInput}
              onChange={(e) => setCurrentInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={
                interviewState === 'collecting_info' 
                  ? `Enter your ${missingFields[currentFieldIndex]}...`
                  : interviewState === 'collecting_position'
                    ? 'Enter the position you\'re interviewing for...'
                  : "Type your answer..."
              }
              style={chatStyles.input}
              disabled={interviewState === 'completed'}
            />
            <button
              onClick={interviewState === 'collecting_info' || interviewState === 'collecting_position' ? handleInfoSubmit : () => handleSubmitResponse()}
              disabled={!currentInput.trim() || interviewState === 'completed'}
              style={{
                ...chatStyles.button,
                ...((!currentInput.trim() || interviewState === 'completed') ? chatStyles.buttonDisabled : {})
              }}
            >
              <Send style={{ width: '16px', height: '16px' }} />
              Send
            </button>
          </div>
        )}

        {/* Status Bar */}
        <div style={chatStyles.statusBar}>
          <span>
            Status: {interviewState === 'upload' ? 'Waiting for resume' :
                    interviewState === 'collecting_info' ? 'Collecting information' :
                    interviewState === 'collecting_position' ? 'Getting position details' :
                    interviewState === 'interviewing' ? 'Interview in progress' :
                    'Interview completed'}
          </span>
          <span>
            {interviewState === 'interviewing' && currentQuestion && 
              `Question ${currentQuestion.questionNumber || responses.length + 1}`}
          </span>
        </div>
      </div>
    </div>
  );
};

export default CrispIntervieweeChat;