import React, { useState, useEffect, useRef } from 'react';
import { Upload, Send, Clock, MessageCircle } from 'lucide-react';
import aiService from '../services/aiService';
import type { Answer } from '../types';
import { InterviewSummary } from './InterviewSummary';

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

// Generate unique IDs to avoid React key conflicts
const generateUniqueId = (prefix = '') => {
  return `${prefix}${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

const WorkingIntervieweeTab: React.FC<CrispIntervieweeChatProps> = ({
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
  
  const [selectedDomain, setSelectedDomain] = useState<string>('');
  const [selectedPosition, setSelectedPosition] = useState<string>('');
  const [interviewState, setInterviewState] = useState<'resume_upload' | 'collecting_info' | 'domain_selection' | 'confirming_info' | 'interview' | 'completed'>('resume_upload');
  const [missingFields, setMissingFields] = useState<string[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState<any>(null);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [questions, setQuestions] = useState<any[]>([]);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [isAnswering, setIsAnswering] = useState(false);
  const [candidateId, setCandidateId] = useState<string>('');
  const [interviewResponses, setInterviewResponses] = useState<any[]>([]);
  const [showWelcomeBack, setShowWelcomeBack] = useState<boolean>(false);
  const [savedSession, setSavedSession] = useState<any>(null);
  const [showSummary, setShowSummary] = useState<boolean>(false);
  
  const chatEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const timerRef = useRef<number | null>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Check for saved session on component mount
  useEffect(() => {
    const savedSessionData = localStorage.getItem('interviewSession');
    if (savedSessionData) {
      try {
        const session = JSON.parse(savedSessionData);
        // Only show welcome back if session is incomplete and recent (within 24 hours)
        const sessionAge = Date.now() - new Date(session.lastActivity).getTime();
        const isRecent = sessionAge < 24 * 60 * 60 * 1000; // 24 hours
        
        if (session.interviewState !== 'completed' && isRecent) {
          setSavedSession(session);
          setShowWelcomeBack(true);
        } else if (!isRecent) {
          // Clear old session
          localStorage.removeItem('interviewSession');
        }
      } catch (error) {
        console.error('Error loading saved session:', error);
        localStorage.removeItem('interviewSession');
      }
    }
  }, []);

  // Save session to localStorage
  const saveSession = () => {
    const sessionData = {
      candidateInfo,
      interviewState,
      currentQuestion,
      questionIndex,
      questions,
      timeRemaining,
      isAnswering,
      candidateId,
      interviewResponses,
      selectedDomain,
      selectedPosition,
      messages: messages.filter(msg => !msg.id?.includes('timestamp')), // Filter out timestamp messages
      lastActivity: new Date().toISOString()
    };
    
    try {
      localStorage.setItem('interviewSession', JSON.stringify(sessionData));
    } catch (error) {
      console.error('Error saving session:', error);
    }
  };

  // Auto-save session when key state changes
  useEffect(() => {
    if (candidateId && interviewState !== 'resume_upload') {
      const saveTimer = setTimeout(() => {
        saveSession();
      }, 1000); // Debounce saves

      return () => clearTimeout(saveTimer);
    }
  }, [candidateInfo, interviewState, currentQuestion, questionIndex, timeRemaining, interviewResponses, messages]);

  // Restore session from saved data
  const restoreSession = () => {
    if (savedSession) {
      setCandidateInfo(savedSession.candidateInfo);
      setInterviewState(savedSession.interviewState);
      setCurrentQuestion(savedSession.currentQuestion);
      setQuestionIndex(savedSession.questionIndex);
      setQuestions(savedSession.questions);
      setTimeRemaining(savedSession.timeRemaining);
      setIsAnswering(savedSession.isAnswering);
      setCandidateId(savedSession.candidateId);
      setInterviewResponses(savedSession.interviewResponses || []);
      setSelectedDomain(savedSession.selectedDomain || '');
      setSelectedPosition(savedSession.selectedPosition || '');
      setMessages(savedSession.messages || []);
      setShowWelcomeBack(false);
      
      // If they were in the middle of answering, restart the timer
      if (savedSession.isAnswering && savedSession.timeRemaining > 0) {
        setIsAnswering(true);
      }
      
      addMessage({
        type: 'system',
        content: `🔄 Welcome back! Your interview session has been restored. You were on question ${savedSession.questionIndex + 1} of ${savedSession.questions?.length || 6}.`
      });
    }
  };

  // Start fresh session (clear saved data)
  const startFreshSession = () => {
    localStorage.removeItem('interviewSession');
    setShowWelcomeBack(false);
    setSavedSession(null);
    
    addMessage({
      type: 'bot',
      content: `👋 Hello! I'm your AI interview assistant. Let's start with uploading your resume to personalize your interview experience.

📄 **Please upload your resume** (PDF or DOCX format)

I'll analyze it to:
✅ Extract your information  
✅ Identify your technical skills  
✅ Generate domain-specific questions  
✅ Create a personalized interview experience`
    });
  };

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
      id: generateUniqueId('msg_'),
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
      // Use local resume parsing instead of API
      const resumeParser = await import('../utils/resumeParser');
      const parsedData = await resumeParser.parseResumeFile(file);
      
      if (parsedData) {
        // Extract candidate info from resume
        const extractedData = {
          name: parsedData.name,
          email: parsedData.email,
          phone: parsedData.phone,
          desiredPosition: 'Software Engineer' // Default position
        };
        const resumeText = parsedData.text;
        
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
• Position: ${extractedData.desiredPosition}
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
            const fieldPrompts = {
              name: "📝 Please enter your full name:",
              email: "📧 Please enter your email address:",
              phone: "📱 Please enter your phone number:"
            };
            
            addMessage({
              type: 'bot',
              content: `I need to collect some missing information before we can start.\n\n${fieldPrompts[missing[0] as keyof typeof fieldPrompts]}`
            });
          }, 1000);
        } else {
          setInterviewState('domain_selection');
          setTimeout(() => {
            addMessage({
              type: 'bot',
              content: `Perfect! Now tell me about your domain and the position you'd like to be interviewed for.

🎯 **Please specify:**
- **Domain/Field**: (e.g., Frontend Development, Backend, DevOps, Data Science, Mobile Development, Cybersecurity, AI/ML, Cloud Computing, etc.)
- **Position**: (e.g., React Developer, Python Backend Engineer, Data Scientist, Security Analyst, etc.)

**Examples:**
- "Frontend Development - React Developer" 
- "Data Science - Machine Learning Engineer"
- "Cybersecurity - Security Analyst"
- "DevOps - Cloud Engineer"
- "Mobile Development - Flutter Developer"

Type your domain and position:`
            });
          }, 1000);
        }
      } else {
        addMessage({
          type: 'bot',
          content: "❌ Error processing resume. Please try again or enter information manually."
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
    } else if (interviewState === 'domain_selection') {
      handleDomainSelection(userResponse);
    } else if (interviewState === 'confirming_info') {
      if (userResponse.toLowerCase().includes('yes')) {
        await startInterview();
      } else if (userResponse.toLowerCase().includes('edit')) {
        // Allow editing information
        addMessage({
          type: 'bot',
          content: `📝 Which field would you like to edit?\n\n• Type **'name'** to change your name\n• Type **'email'** to change your email\n• Type **'phone'** to change your phone number`
        });
        
        setInterviewState('collecting_info');
        // Don't set missing fields, let user choose what to edit
      } else {
        addMessage({
          type: 'bot',
          content: "Please type **'yes'** to start the interview or **'edit'** to make changes to your information."
        });
      }
    } else if (interviewState === 'interview') {
      await submitAnswer(userResponse);
    }
  };

  const validateInput = (field: string, value: string): { isValid: boolean; message?: string } => {
    switch (field) {
      case 'email':
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(value)) {
          return { isValid: false, message: "Please enter a valid email address (e.g., john@example.com)" };
        }
        break;
      case 'phone':
        const phoneRegex = /^[\d\s\-\+\(\)]{10,}$/;
        if (!phoneRegex.test(value)) {
          return { isValid: false, message: "Please enter a valid phone number (at least 10 digits)" };
        }
        break;
      case 'name':
        if (value.trim().length < 2) {
          return { isValid: false, message: "Please enter your full name (at least 2 characters)" };
        }
        break;
    }
    return { isValid: true };
  };

  const formatPhoneNumber = (phone: string): string => {
    // Remove all non-digits
    const digits = phone.replace(/\D/g, '');
    
    // Format as (XXX) XXX-XXXX for US numbers
    if (digits.length === 10) {
      return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
    } else if (digits.length === 11 && digits[0] === '1') {
      return `+1 (${digits.slice(1, 4)}) ${digits.slice(4, 7)}-${digits.slice(7)}`;
    }
    return phone; // Return as-is if doesn't match common patterns
  };

  const handleInfoCollection = (response: string) => {
    const trimmedResponse = response.trim();
    
    // If no missing fields, user is choosing a field to edit
    if (missingFields.length === 0) {
      const fieldToEdit = trimmedResponse.toLowerCase();
      if (['name', 'email', 'phone'].includes(fieldToEdit)) {
        setMissingFields([fieldToEdit]);
        const fieldPrompts = {
          name: "📝 Please enter your new full name:",
          email: "📧 Please enter your new email address:",
          phone: "📱 Please enter your new phone number:"
        };
        
        addMessage({
          type: 'bot',
          content: fieldPrompts[fieldToEdit as keyof typeof fieldPrompts]
        });
        return;
      } else {
        addMessage({
          type: 'bot',
          content: "Please type 'name', 'email', or 'phone' to choose which field to edit."
        });
        return;
      }
    }
    
    const currentField = missingFields[0];
    
    // Validate input
    const validation = validateInput(currentField, trimmedResponse);
    if (!validation.isValid) {
      addMessage({
        type: 'bot',
        content: `❌ ${validation.message}\n\nPlease enter your ${currentField} again:`
      });
      return;
    }

    // Format the response if needed
    let formattedResponse = trimmedResponse;
    if (currentField === 'phone') {
      formattedResponse = formatPhoneNumber(trimmedResponse);
    }
    
    // Update candidate info
    setCandidateInfo(prev => ({
      ...prev,
      [currentField]: formattedResponse
    }));

    // Show confirmation of collected info
    addMessage({
      type: 'bot',
      content: `✅ Got it! ${currentField === 'name' ? 'Name' : currentField === 'email' ? 'Email' : 'Phone'}: ${formattedResponse}`
    });

    // Remove collected field
    const remaining = missingFields.slice(1);
    setMissingFields(remaining);

    if (remaining.length > 0) {
      setTimeout(() => {
        const fieldPrompts = {
          name: "📝 Now please enter your full name:",
          email: "📧 Now please enter your email address:",
          phone: "📱 Now please enter your phone number:"
        };
        
        addMessage({
          type: 'bot',
          content: `Great! ${fieldPrompts[remaining[0] as keyof typeof fieldPrompts]}`
        });
      }, 800);
    } else {
      setInterviewState('confirming_info');
      setTimeout(() => {
        // Get updated candidateInfo with the last response
        const updatedInfo = { ...candidateInfo, [currentField]: formattedResponse };
        addMessage({
          type: 'bot',
          content: `Perfect! Here's your complete information:
          
📋 **Your Details:**
• **Name:** ${updatedInfo.name}
• **Email:** ${updatedInfo.email}  
• **Phone:** ${updatedInfo.phone}

✅ All information looks good! Type **'yes'** to start the interview, or type **'edit'** to make changes.`
        });
      }, 800);
    }
  };

  const handleDomainSelection = (response: string) => {
    const input = response.trim();
    
    if (input.length < 5) {
      addMessage({
        type: 'bot',
        content: `Please provide more details about your domain and position.

**Examples:**
- "Frontend Development - React Developer"
- "Data Science - Machine Learning Engineer" 
- "Cybersecurity - Security Analyst"
- "DevOps - Cloud Engineer"

Type your domain and position:`
      });
      return;
    }

    // Parse the input to extract domain and position
    let domain = '';
    let position = '';
    
    // Check if input contains a dash or similar separator
    if (input.includes(' - ')) {
      const parts = input.split(' - ');
      domain = parts[0].trim();
      position = parts[1].trim();
    } else if (input.includes('-')) {
      const parts = input.split('-');
      domain = parts[0].trim();
      position = parts[1].trim();
    } else {
      // If no separator, treat the whole input as domain and try to infer position
      domain = input;
      position = input; // Will be refined by AI
    }

    setSelectedDomain(domain);
    setSelectedPosition(position);
    setInterviewState('confirming_info');
    
    setTimeout(() => {
      addMessage({
        type: 'bot',
        content: `Perfect! I'll prepare an interview for:

**Domain:** ${domain}
**Position:** ${position}

Here's your complete information:
👤 **Name:** ${candidateInfo.name}
📧 **Email:** ${candidateInfo.email}  
📱 **Phone:** ${candidateInfo.phone}
💼 **Domain:** ${domain}
🎯 **Position:** ${position}

✅ All information looks good! Type **'yes'** to start the interview, or type **'edit'** to make changes.`
      });
    }, 800);
  };

  const startInterview = async () => {
    addMessage({
      type: 'bot',
      content: "🚀 Starting your AI-powered interview! Generating personalized questions based on your resume..."
    });

    try {
      // Use selected domain and position for generating questions
      const resumeText = candidateInfo.resumeText || `
Name: ${candidateInfo.name}
Position: ${selectedPosition}
Domain: ${selectedDomain}
Email: ${candidateInfo.email}
Phone: ${candidateInfo.phone}
`;
      
      addMessage({
        type: 'bot',
        content: `🎯 Generating **${selectedDomain}** questions for **${selectedPosition}** position...

📊 **Interview Structure:**
- 2 Easy questions (20 seconds each)
- 2 Medium questions (60 seconds each) 
- 2 Hard questions (120 seconds each)`
      });

      const generatedQuestions = await aiService.generateQuestions(resumeText, selectedPosition);
      
      if (generatedQuestions && generatedQuestions.length > 0) {
        setQuestions(generatedQuestions);
        setCurrentQuestion(generatedQuestions[0]);
        setQuestionIndex(0);
        setInterviewState('interview');
        const candidateId = generateUniqueId('candidate_');
        setCandidateId(candidateId);

        // Create candidate record
        const candidateRecord = {
          id: candidateId,
          name: candidateInfo.name,
          email: candidateInfo.email,
          phone: candidateInfo.phone,
          position: selectedPosition,
          resumeData: candidateInfo.extractedData,
          resumeText: candidateInfo.resumeText,
          status: 'interviewing',
          startedAt: new Date(),
          questions: generatedQuestions,
          responses: []
        };

        onCandidateAdd?.(candidateRecord);

        setTimeout(() => {
          startQuestion(generatedQuestions[0]);
        }, 1000);
      } else {
        // Fallback questions with correct time limits
        const fallbackQuestions = [
          { id: 'q1', text: 'Tell me about yourself and your background.', category: 'General', difficulty: 'easy', timeLimit: 20 },
          { id: 'q2', text: 'What are your greatest strengths and how do they apply to this role?', category: 'General', difficulty: 'medium', timeLimit: 60 },
          { id: 'q3', text: 'Describe a challenging project you worked on and how you overcame obstacles.', category: 'Experience', difficulty: 'hard', timeLimit: 120 },
          { id: 'q4', text: 'Where do you see yourself in 5 years?', category: 'Goals', difficulty: 'medium', timeLimit: 60 },
          { id: 'q5', text: 'Why are you interested in this position?', category: 'Motivation', difficulty: 'easy', timeLimit: 20 },
          { id: 'q6', text: 'Describe a time when you had to work under pressure with tight deadlines.', category: 'Experience', difficulty: 'hard', timeLimit: 120 }
        ];
        
        setQuestions(fallbackQuestions);
        setCurrentQuestion(fallbackQuestions[0]);
        setQuestionIndex(0);
        setInterviewState('interview');
        const candidateId = generateUniqueId('candidate_');
        setCandidateId(candidateId);

        const candidateRecord = {
          id: candidateId,
          name: candidateInfo.name,
          email: candidateInfo.email,
          phone: candidateInfo.phone,
          position: candidateInfo.extractedData?.desiredPosition || 'Software Engineer',
          resumeData: candidateInfo.extractedData,
          resumeText: candidateInfo.resumeText,
          status: 'interviewing',
          startedAt: new Date(),
          questions: fallbackQuestions,
          responses: []
        };
        
        onCandidateAdd?.(candidateRecord);
        
        addMessage({
          type: 'bot',
          content: "✅ Interview questions ready! Using our comprehensive question set."
        });

        setTimeout(() => {
          startQuestion(fallbackQuestions[0]);
        }, 1000);
      }
    } catch (error) {
      console.error('Error generating questions:', error);
      addMessage({
        type: 'bot',
        content: "⚠️ Using fallback questions. Let's begin the interview!"
      });
      
      // Use fallback questions on error
      const fallbackQuestions = [
        { id: 'q1', text: 'Tell me about yourself and your background.', category: 'General', difficulty: 'easy', timeLimit: 20 },
        { id: 'q2', text: 'What are your greatest strengths?', category: 'General', difficulty: 'medium', timeLimit: 60 },
        { id: 'q3', text: 'Describe a challenging project you worked on.', category: 'Experience', difficulty: 'hard', timeLimit: 120 }
      ];
      
      setQuestions(fallbackQuestions);
      setCurrentQuestion(fallbackQuestions[0]);
      setQuestionIndex(0);
      setInterviewState('interview');
      const candidateId = generateUniqueId('candidate_');
      setCandidateId(candidateId);

      setTimeout(() => {
        startQuestion(fallbackQuestions[0]);
      }, 1000);
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
      
${question.text}

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
      // Create Answer object for AI analysis
      const answerObj: Answer = {
        questionId: currentQuestion.id,
        answer: answer,
        timeSpent: Math.max(0, currentQuestion.timeLimit - timeRemaining),
        timestamp: new Date()
      };

      // Use local AI service for analysis
      const analysis = await aiService.scoreAnswer(answerObj, currentQuestion);
      
      if (analysis) {
        // Show AI feedback
        const feedback = analysis.feedback || 'Response recorded successfully.';
        const score = analysis.score || 0;
        
        addMessage({
          type: 'system',
          content: `✅ **AI Analysis Complete**
Score: ${score}/100
${feedback}`
        });

        // Add to local responses state
        const newResponse = {
          question: currentQuestion.text,
          answer: answer,
          score: score,
          timeUsed: timeUsed,
          feedback: feedback
        };
        
        setInterviewResponses(prev => [...prev, newResponse]);

        // Update candidate record
        onCandidateUpdate?.(candidateId, {
          responses: [...(candidateInfo.extractedData?.responses || []), newResponse]
        });

        // Check if this was the last question
        if (questionIndex >= questions.length - 1) {
          // Generate final interview report
          setTimeout(async () => {
            addMessage({
              type: 'system',
              content: "📊 Generating final interview report..."
            });

            try {
              // Create candidate object for AI summary - not used currently
              // const candidate = {
              //   id: candidateId,
              //   name: candidateInfo.name || 'Candidate',
              //   email: candidateInfo.email || '',
              //   phone: candidateInfo.phone || '',
              //   status: 'completed' as const,
              //   createdAt: new Date(),
              //   startedAt: new Date()
              // };

              // Create interview object using local responses - not used currently  
              // const interview = {
              //   id: `interview_${candidateId}`,
              //   candidateId: candidateId,
              //   questions: questions,
              //   answers: interviewResponses.map((r: any, index: number) => ({
              //     questionId: questions[index]?.id || `q_${index}`,
              //     answer: r.answer,
              //     timeSpent: r.timeUsed || 0,
              //     score: r.score,
              //     feedback: r.feedback,
              //     timestamp: new Date()
              //   })),
              //   currentQuestionIndex: questions.length,
              //   isPaused: false
              // };

              const avgScore = interviewResponses.reduce((sum: number, r: any) => sum + (r.score || 0), 0) / interviewResponses.length;
              
              const finalReport = {
                candidate: { 
                  averageScore: avgScore 
                },
                recommendation: avgScore >= 70 ? 'Recommended' : avgScore >= 50 ? 'Consider' : 'Not Recommended',
                aiSummary: `Interview completed with ${interviewResponses.length} questions answered. Average performance: ${Math.round(avgScore)}%.`
              };
              
              completeInterview(finalReport);
            } catch (error) {
              console.error('Error generating AI summary:', error);
              
              // Fallback report using local responses
              const responses = interviewResponses;
              const avgScore = responses.length > 0 
                ? responses.reduce((sum: number, r: any) => sum + (r.score || 0), 0) / responses.length 
                : 0;
              
              completeInterview({
                candidate: { averageScore: Math.round(avgScore) },
                recommendation: avgScore >= 70 ? 'Recommended' : avgScore >= 50 ? 'Consider' : 'Not Recommended',
                aiSummary: `Interview completed with ${responses.length} questions answered. Average performance: ${Math.round(avgScore)}%.`
              });
            }
          }, 1000);
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

Thank you for completing the interview! Your responses have been recorded and will be reviewed by our team.

Click "View Detailed Summary" below to see your comprehensive interview analysis.`
    });

    // Update final candidate status
    onCandidateUpdate?.(candidateId, {
      status: 'completed',
      completedAt: new Date(),
      finalReport: finalReport,
      finalScore: finalReport.candidate?.averageScore || 0
    });
  };

  const showDetailedSummary = () => {
    setShowSummary(true);
  };

  const closeSummary = () => {
    setShowSummary(false);
  };

  const calculateTotalScore = (): number => {
    if (interviewResponses.length === 0) return 0;
    const totalScore = interviewResponses.reduce((sum, response) => sum + (response.score || 0), 0);
    return Math.round(totalScore / interviewResponses.length);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const styles = {
    container: {
      display: 'flex',
      flexDirection: 'column' as const,
      height: 'calc(100vh - 200px)',
      backgroundColor: 'white',
      borderRadius: '12px',
      boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
      overflow: 'hidden'
    },
    header: {
      background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)',
      padding: '16px',
      color: 'white'
    },
    headerContent: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between'
    },
    headerLeft: {
      display: 'flex',
      alignItems: 'center',
      gap: '12px'
    },
    iconWrapper: {
      width: '40px',
      height: '40px',
      backgroundColor: 'rgba(255, 255, 255, 0.2)',
      borderRadius: '50%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    },
    titleSection: {
      display: 'flex',
      flexDirection: 'column' as const
    },
    title: {
      fontWeight: '600',
      fontSize: '18px',
      margin: 0
    },
    subtitle: {
      fontSize: '14px',
      opacity: 0.9,
      margin: 0
    },
    timer: {
      borderRadius: '8px',
      padding: '8px 16px',
      border: '2px solid rgba(255, 255, 255, 0.3)',
      transition: 'all 0.3s ease'
    },
    timerContent: {
      display: 'flex',
      alignItems: 'center',
      gap: '12px'
    },
    timerText: {
      textAlign: 'center' as const
    },
    timerTime: {
      fontFamily: 'monospace',
      fontWeight: 'bold',
      fontSize: '18px',
      color: 'white',
      margin: 0
    },
    timerStatus: {
      fontSize: '12px',
      color: 'rgba(255, 255, 255, 0.9)',
      fontWeight: '500',
      margin: 0
    },
    messagesContainer: {
      flex: 1,
      overflowY: 'auto' as const,
      padding: '16px',
      display: 'flex',
      flexDirection: 'column' as const,
      gap: '16px'
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
      backgroundColor: '#f1f5f9',
      color: '#374151',
      alignSelf: 'flex-start'
    },
    systemMessage: {
      backgroundColor: '#fef3c7',
      color: '#92400e',
      alignSelf: 'center',
      fontSize: '13px',
      fontStyle: 'italic'
    },
    inputArea: {
      padding: '16px',
      borderTop: '1px solid #e5e7eb',
      backgroundColor: '#f9fafb'
    },
    uploadSection: {
      display: 'flex',
      gap: '12px',
      flexWrap: 'wrap' as const,
      marginBottom: '12px'
    },
    uploadButton: {
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      padding: '10px 16px',
      backgroundColor: '#10b981',
      color: 'white',
      border: 'none',
      borderRadius: '8px',
      cursor: 'pointer',
      fontSize: '14px',
      fontWeight: '500'
    },
    inputRow: {
      display: 'flex',
      gap: '12px',
      alignItems: 'center'
    },
    input: {
      flex: 1,
      padding: '10px 14px',
      border: '1px solid #d1d5db',
      borderRadius: '8px',
      fontSize: '14px',
      outline: 'none'
    },
    sendButton: {
      padding: '10px 16px',
      backgroundColor: '#3b82f6',
      color: 'white',
      border: 'none',
      borderRadius: '8px',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      gap: '6px',
      fontSize: '14px',
      fontWeight: '500'
    },
    hiddenInput: {
      display: 'none'
    }
  };

  const getTimerStyles = () => ({
    ...styles.timer,
    backgroundColor: timeRemaining <= 10 
      ? 'rgba(239, 68, 68, 0.9)' 
      : timeRemaining <= 30 
      ? 'rgba(245, 158, 11, 0.8)' 
      : 'rgba(34, 197, 94, 0.8)',
    boxShadow: timeRemaining <= 10 
      ? '0 0 20px rgba(239, 68, 68, 0.5)' 
      : 'none',
    animation: timeRemaining <= 10 ? 'pulse 1s infinite' : 'none'
  });

  return (
    <div style={styles.container}>
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.7; }
        }
        @keyframes bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-3px); }
        }
      `}</style>
      
      {/* Chat Header */}
      <div style={styles.header}>
        <div style={styles.headerContent}>
          <div style={styles.headerLeft}>
            <div style={styles.iconWrapper}>
              <MessageCircle size={24} />
            </div>
            <div style={styles.titleSection}>
              <h2 style={styles.title}>Connect AI Assistant</h2>
              <p style={styles.subtitle}>
                {interviewState === 'resume_upload' && 'Upload your resume to start'}
                {interviewState === 'collecting_info' && 'Collecting missing information'}
                {interviewState === 'confirming_info' && 'Ready to begin interview'}
                {interviewState === 'interview' && `Question ${questionIndex + 1}/${questions.length}`}
                {interviewState === 'completed' && 'Interview completed'}
              </p>
            </div>
          </div>
          
          {/* Enhanced Timer Display */}
          {isAnswering && (
            <div style={getTimerStyles()}>
              <div style={styles.timerContent}>
                <Clock size={20} style={{ 
                  animation: timeRemaining <= 10 ? 'bounce 0.5s infinite' : 'none' 
                }} />
                <div style={styles.timerText}>
                  <div style={styles.timerTime}>
                    {formatTime(timeRemaining)}
                  </div>
                  <div style={styles.timerStatus}>
                    {timeRemaining <= 10 ? 'HURRY!' : timeRemaining <= 30 ? 'WARNING!' : 'TIME LEFT'}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Messages */}
      <div style={styles.messagesContainer}>
        {messages.map((message) => (
          <div
            key={message.id}
            style={{
              display: 'flex',
              justifyContent: message.type === 'user' ? 'flex-end' : 
                           message.type === 'system' ? 'center' : 'flex-start'
            }}
          >
            <div
              style={{
                ...styles.message,
                ...(message.type === 'user' 
                  ? styles.userMessage 
                  : message.type === 'system' 
                    ? styles.systemMessage 
                    : styles.botMessage)
              }}
            >
              <div style={{ whiteSpace: 'pre-wrap' }}>{message.content}</div>
              <div style={{ 
                fontSize: '12px', 
                opacity: 0.7, 
                marginTop: '4px' 
              }}>
                {message.timestamp.toLocaleTimeString()}
              </div>
            </div>
          </div>
        ))}
        <div ref={chatEndRef} />
      </div>

      {/* Input Area */}
      <div style={styles.inputArea}>
        {interviewState === 'resume_upload' && (
          <div style={styles.uploadSection}>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              accept=".pdf,.doc,.docx"
              style={styles.hiddenInput}
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              style={{
                width: '100%',
                background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)',
                color: 'white',
                padding: '12px 16px',
                borderRadius: '8px',
                border: 'none',
                cursor: 'pointer',
                fontWeight: '500',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                fontSize: '16px'
              }}
            >
              <Upload size={20} />
              <span>Upload Resume (PDF/DOCX)</span>
            </button>
          </div>
        )}
        
        {(interviewState === 'collecting_info' || interviewState === 'domain_selection' || interviewState === 'confirming_info' || interviewState === 'interview') && (
          <div style={styles.inputRow}>
            <input
              type="text"
              value={currentInput}
              onChange={(e) => setCurrentInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
              placeholder={
                interviewState === 'collecting_info' 
                  ? `Enter your ${missingFields[0]}...`
                  : interviewState === 'domain_selection'
                  ? "Enter your domain and position (e.g., 'Frontend - React Developer')..."
                  : interviewState === 'confirming_info'
                  ? "Type 'yes' to start the interview..."
                  : "Type your answer here..."
              }
              style={{
                ...styles.input,
                opacity: (!isAnswering && interviewState === 'interview') ? 0.6 : 1
              }}
              disabled={!isAnswering && interviewState === 'interview'}
            />
            <button
              onClick={handleSendMessage}
              disabled={!currentInput.trim() || (!isAnswering && interviewState === 'interview')}
              style={{
                ...styles.sendButton,
                opacity: (!currentInput.trim() || (!isAnswering && interviewState === 'interview')) ? 0.5 : 1,
                cursor: (!currentInput.trim() || (!isAnswering && interviewState === 'interview')) ? 'not-allowed' : 'pointer'
              }}
            >
              <Send size={20} />
            </button>
          </div>
        )}
        
        {/* Show Summary Button when interview is completed */}
        {interviewState === 'completed' && (
          <div style={styles.uploadSection}>
            <button
              onClick={showDetailedSummary}
              style={{
                width: '100%',
                background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                color: 'white',
                padding: '12px 16px',
                borderRadius: '8px',
                border: 'none',
                cursor: 'pointer',
                fontWeight: '500',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                fontSize: '16px',
                marginTop: '12px'
              }}
            >
              📊 View Detailed Summary
            </button>
          </div>
        )}
      </div>

      {/* Interview Summary Modal */}
      {showSummary && (
        <InterviewSummary
          answers={interviewResponses}
          questions={questions}
          domain={selectedDomain}
          position={selectedPosition}
          candidateName={candidateInfo.name}
          totalScore={calculateTotalScore()}
          onClose={closeSummary}
        />
      )}

      {/* Welcome Back Modal */}
      {showWelcomeBack && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '12px',
            padding: '24px',
            maxWidth: '400px',
            width: '90%',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
            border: '1px solid #e5e7eb'
          }}>
            <h3 style={{
              fontSize: '18px',
              fontWeight: '600',
              color: '#111827',
              marginBottom: '12px'
            }}>
              🔄 Welcome Back!
            </h3>
            <p style={{
              color: '#6b7280',
              marginBottom: '20px',
              lineHeight: '1.5'
            }}>
              We found an unfinished interview session. Would you like to continue where you left off or start fresh?
            </p>
            {savedSession && (
              <div style={{
                backgroundColor: '#f3f4f6',
                padding: '12px',
                borderRadius: '8px',
                marginBottom: '20px',
                fontSize: '14px',
                color: '#374151'
              }}>
                <strong>Previous Session:</strong><br/>
                Candidate: {savedSession.candidateInfo?.name || 'Unknown'}<br/>
                Question: {savedSession.questionIndex + 1} of {savedSession.questions?.length || 6}<br/>
                Status: {savedSession.interviewState}
              </div>
            )}
            <div style={{
              display: 'flex',
              gap: '12px',
              justifyContent: 'flex-end'
            }}>
              <button
                onClick={startFreshSession}
                style={{
                  padding: '8px 16px',
                  borderRadius: '8px',
                  border: '1px solid #d1d5db',
                  backgroundColor: 'white',
                  color: '#374151',
                  cursor: 'pointer',
                  fontSize: '14px'
                }}
              >
                Start Fresh
              </button>
              <button
                onClick={restoreSession}
                style={{
                  padding: '8px 16px',
                  borderRadius: '8px',
                  border: 'none',
                  backgroundColor: '#2563eb',
                  color: 'white',
                  cursor: 'pointer',
                  fontSize: '14px'
                }}
              >
                Continue Session
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WorkingIntervieweeTab;