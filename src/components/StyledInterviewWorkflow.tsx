import React, { useState, useEffect, useRef } from 'react';
import { Upload, Clock, CheckCircle, AlertCircle, FileText, Zap, Brain } from 'lucide-react';

// Types
interface Question {
  id: number;
  question: string;
  difficulty: 'easy' | 'medium' | 'hard';
  timeLimit: number;
  category: string;
  expectedKeywords: string[];
}

interface Response {
  questionId?: number;
  questionIndex?: number;
  question: string;
  response: string;
  timeUsed: number;
  score: number;
  difficulty: 'easy' | 'medium' | 'hard';
  submittedAt?: string;
  aiAnalysis?: {
    overallScore: number;
    technicalAccuracy?: number;
    completeness?: number;
    clarity?: number;
    relevance?: number;
    depth?: number;
    timeEfficiency?: number;
    isCorrect: boolean;
    feedback: string;
    strengths: string[];
    improvements: string[];
    keywordsFound: string[];
  };
}

interface Interview {
  id: string;
  candidateName: string;
  candidateEmail: string;
  position: string;
  questions: Question[];
  currentQuestionIndex: number;
  status: string;
  startedAt: string;
  responses: Response[];
}

interface FinalReport {
  candidate: {
    name: string;
    position: string;
    totalQuestions: number;
    totalScore: number;
    averageScore: number;
    accuracyPercentage?: number;
    correctAnswers?: number;
    duration: number;
  };
  breakdown: {
    easy: { total: number; count: number; average: number; accuracy?: number };
    medium: { total: number; count: number; average: number; accuracy?: number };
    hard: { total: number; count: number; average: number; accuracy?: number };
  };
  recommendation: string;
  confidenceLevel?: string;
  technicalCompetency?: string;
  communicationScore?: number;
  strengths: string[];
  improvements: string[];
  aiSummary: string;
  categoryInsights?: { [key: string]: number };
  detailedAnalysis?: {
    overallScore: number;
    accuracyPercentage: number;
    categoryInsights: { [key: string]: number };
    individualQuestionAnalysis: Array<{
      questionNumber: number;
      question: string;
      difficulty: string;
      category: string;
      score: number;
      isCorrect: boolean;
      feedback: string;
      timeUsed: number;
      timeLimit: number;
    }>;
  };
  generatedAt: string;
}

interface User {
  id: string;
  email: string;
  role: string;
  profile: {
    firstName: string;
    lastName: string;
    position?: string;
    resumeData?: any;
    resumeText?: string;
  };
  hasResumeData?: boolean;
  needsResumeUpload?: boolean;
}

interface StyledInterviewWorkflowProps {
  user?: User;
}

const StyledInterviewWorkflow = ({ user }: StyledInterviewWorkflowProps = {}) => {
  const [step, setStep] = useState('upload'); // upload, start, interview, completed
  const [candidate, setCandidate] = useState({
    name: user ? `${user.profile?.firstName || ''} ${user.profile?.lastName || ''}`.trim() : '',
    email: user?.email || '',
    position: user?.profile?.position || ''
  });
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [resumeUploaded, setResumeUploaded] = useState(user?.hasResumeData || false);
  const [interview, setInterview] = useState<Interview | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  const [currentResponse, setCurrentResponse] = useState('');
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [isAnswering, setIsAnswering] = useState(false);
  const [responses, setResponses] = useState<Response[]>([]);
  const [finalReport, setFinalReport] = useState<FinalReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [wasInFullscreen, setWasInFullscreen] = useState(false);
  
  // Violation tracking
  const [screenChangeCount, setScreenChangeCount] = useState(0);
  const [violations, setViolations] = useState<Array<{
    type: 'fullscreen_exit' | 'tab_change' | 'window_blur';
    timestamp: Date;
    questionNumber: number;
    questionText: string;
  }>>([]);
  const [interviewTerminated, setInterviewTerminated] = useState(false);
  const [terminationReason, setTerminationReason] = useState('');
  
  const timerRef = useRef<number | null>(null);
  const questionStartTime = useRef<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Update candidate info when user prop changes
  useEffect(() => {
    if (user) {
      setCandidate({
        name: `${user.profile?.firstName || ''} ${user.profile?.lastName || ''}`.trim(),
        email: user.email,
        position: user.profile?.position || ''
      });
      setResumeUploaded(user.hasResumeData || false);
    }
  }, [user]);

  // Timer functionality
  useEffect(() => {
    if (isAnswering && timeRemaining > 0) {
      timerRef.current = setTimeout(() => {
        setTimeRemaining(prev => prev - 1);
      }, 1000);
    } else if (timeRemaining === 0 && isAnswering) {
      // Auto-submit when time runs out
      handleSubmitResponse(true);
    }

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [timeRemaining, isAnswering]);

  // Track violations and enforce fullscreen
  useEffect(() => {
    const handleFullscreenChange = () => {
      const isCurrentlyFullscreen = document.fullscreenElement !== null;
      setIsFullscreen(isCurrentlyFullscreen);
      
      // If user exits fullscreen during interview
      if (wasInFullscreen && !isCurrentlyFullscreen && step === 'interview' && isAnswering) {
        const currentQuestionNum = responses.length + 1;
        const violation = {
          type: 'fullscreen_exit' as const,
          timestamp: new Date(),
          questionNumber: currentQuestionNum,
          questionText: currentQuestion?.question || 'Unknown question'
        };
        
        setViolations(prev => [...prev, violation]);
        setScreenChangeCount(prev => prev + 1);
        
        // Auto-complete interview after violation
        setTimeout(() => {
          completeInterviewEarly('Exited fullscreen mode during interview');
        }, 1000);
      }
    };

    const handleVisibilityChange = () => {
      // If user switches tabs/windows during interview
      if (document.hidden && step === 'interview' && isAnswering) {
        const currentQuestionNum = responses.length + 1;
        const violation = {
          type: 'tab_change' as const,
          timestamp: new Date(),
          questionNumber: currentQuestionNum,
          questionText: currentQuestion?.question || 'Unknown question'
        };
        
        setViolations(prev => [...prev, violation]);
        setScreenChangeCount(prev => prev + 1);
        
        // Auto-complete interview after violation
        setTimeout(() => {
          completeInterviewEarly('Switched tabs/windows during interview');
        }, 1000);
      }
    };

    const handleWindowBlur = () => {
      // If window loses focus during interview
      if (step === 'interview' && isAnswering) {
        const currentQuestionNum = responses.length + 1;
        const violation = {
          type: 'window_blur' as const,
          timestamp: new Date(),
          questionNumber: currentQuestionNum,
          questionText: currentQuestion?.question || 'Unknown question'
        };
        
        setViolations(prev => [...prev, violation]);
        setScreenChangeCount(prev => prev + 1);
      }
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleWindowBlur);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleWindowBlur);
    };
  }, [step, isAnswering, wasInFullscreen, currentQuestion, responses.length]);

  // Enter fullscreen when interview starts
  const enterFullscreen = () => {
    if (containerRef.current) {
      if (containerRef.current.requestFullscreen) {
        containerRef.current.requestFullscreen();
      } else if ((containerRef.current as any).webkitRequestFullscreen) {
        (containerRef.current as any).webkitRequestFullscreen();
      } else if ((containerRef.current as any).mozRequestFullScreen) {
        (containerRef.current as any).mozRequestFullScreen();
      } else if ((containerRef.current as any).msRequestFullscreen) {
        (containerRef.current as any).msRequestFullscreen();
      }
      setWasInFullscreen(true);
    }
  };

  const completeInterviewEarly = async (reason?: string) => {
    if (!interview) return;
    
    try {
      // Set termination details
      setInterviewTerminated(true);
      setTerminationReason(reason || 'Interview terminated early');
      
      // Submit current answer if any
      if (currentResponse.trim()) {
        await handleSubmitResponse(true);
      }
      
      // Mark interview as completed
      setStep('completed');
      setIsAnswering(false);
      
      // Call API to mark interview as terminated due to violations
      try {
        const response = await fetch(`http://localhost:5001/api/interviews/${interview.id}/terminate`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            reason: reason || 'Interview terminated early',
            questionsCompleted: responses.length,
            totalQuestions: interview.questions.length,
            violations: violations,
            terminatedAt: new Date().toISOString()
          })
        });
        
        if (response.ok) {
          const data = await response.json();
          setFinalReport(data.finalReport);
        }
      } catch (apiError) {
        console.error('Error calling termination API:', apiError);
      }
      
    } catch (error) {
      console.error('Error completing interview early:', error);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.includes('pdf') && !file.type.includes('doc')) {
      setError('Please upload a PDF or DOC file');
      return;
    }

    setResumeFile(file);
    setLoading(true);
    setError('');

    try {
      const formData = new FormData();
      formData.append('resume', file);
      formData.append('email', candidate.email);

      const response = await fetch('http://localhost:5001/api/interviews/upload-resume', {
        method: 'POST',
        body: formData
      });

      const data = await response.json();
      
      if (response.ok) {
        setResumeUploaded(true);
      } else {
        setError(data.message || 'Upload failed');
      }
    } catch (error) {
      setError('Upload failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleStartInterview = async () => {
    if (!candidate.name || !candidate.email || !candidate.position) {
      setError('Please fill in all required fields');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch('http://localhost:5001/api/interviews/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          candidateEmail: candidate.email,
          candidateName: candidate.name,
          position: candidate.position
        })
      });

      const data = await response.json();
      
      if (response.ok) {
        setInterview(data.interview);
        setCurrentQuestion(data.interview.questions[0]);
        setStep('interview');
        startQuestionTimer(data.interview.questions[0]);
      } else {
        setError(data.message || 'Failed to start interview');
      }
    } catch (error) {
      setError('Failed to start interview. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const startQuestionTimer = (question: Question) => {
    setTimeRemaining(question.timeLimit);
    setIsAnswering(true);
    questionStartTime.current = Date.now();
    
    // Enter fullscreen mode when starting interview
    if (!wasInFullscreen) {
      enterFullscreen();
    }
  };

  const handleSubmitResponse = async (isTimeUp = false) => {
    if (!interview || !currentQuestion) return;

    setLoading(true);
    setIsAnswering(false);
    
    const timeUsed = Math.ceil((Date.now() - (questionStartTime.current || Date.now())) / 1000);

    try {
      const response = await fetch(`http://localhost:5001/api/interviews/${interview?.id}/response`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          response: currentResponse || '(No response - time expired)',
          timeUsed: timeUsed,
          questionId: currentQuestion?.id
        })
      });

      const data = await response.json();
      
      if (response.ok) {
        // Add to responses with AI analysis
        const newResponse = {
          question: currentQuestion?.question || '',
          response: currentResponse,
          timeUsed: timeUsed,
          score: data.score,
          difficulty: currentQuestion?.difficulty || 'easy',
          aiAnalysis: data.aiAnalysis
        };
        setResponses(prev => [...prev, newResponse]);
        
        // Show AI feedback notification (optional - for immediate feedback)
        if (data.aiAnalysis?.feedback) {
          // You could add a toast notification here if desired
          console.log('AI Feedback:', data.aiAnalysis.feedback);
        }
        
        if (data.isCompleted) {
          setStep('completed');
          setFinalReport(data.finalReport);
        } else {
          // Move to next question
          setCurrentQuestion(data.nextQuestion);
          setCurrentResponse('');
          startQuestionTimer(data.nextQuestion);
        }
      } else {
        setError(data.message || 'Failed to submit response');
        setIsAnswering(true); // Allow retry
      }
    } catch (err) {
      setError('Network error submitting response');
      setIsAnswering(true); // Allow retry
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getProgressPercentage = () => {
    if (!interview) return 0;
    return ((responses.length) / interview.questions.length) * 100;
  };

  // Step 1: Upload Resume
  if (step === 'upload') {
    return (
      <div style={{ maxWidth: '800px', margin: '0 auto', padding: '20px' }}>
        <div className="card" style={{ marginBottom: '20px' }}>
          <h2 style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '10px',
            marginBottom: '15px',
            color: '#2563eb'
          }}>
            <Zap size={24} />
            AI Interview Setup
          </h2>
          <p style={{ color: '#666', marginBottom: '20px', fontSize: '16px' }}>
            {user ? `Hi ${user.profile?.firstName}!` : 'Welcome!'} Ready for your AI-powered interview? 
            Complete the setup below to get started with personalized questions.
          </p>
          
          {/* Welcome Info Box */}
          <div style={{
            background: 'linear-gradient(135deg, #dbeafe 0%, #e0e7ff 100%)',
            border: '1px solid #3b82f6',
            borderLeft: '4px solid #2563eb',
            borderRadius: '8px',
            padding: '20px',
            marginBottom: '25px'
          }}>
            <h3 style={{ color: '#1d4ed8', marginBottom: '10px', fontSize: '18px', fontWeight: '600' }}>
              What to expect:
            </h3>
            <ul style={{ color: '#1e40af', margin: 0, paddingLeft: '20px' }}>
              <li style={{ marginBottom: '5px' }}>2 Easy questions (20 seconds each) - Background & basics</li>
              <li style={{ marginBottom: '5px' }}>2 Medium questions (60 seconds each) - Technical knowledge</li>
              <li style={{ marginBottom: '5px' }}>2 Hard questions (120 seconds each) - Problem solving & design</li>
              <li>Real-time AI assessment and detailed feedback report</li>
            </ul>
          </div>

          {/* Form Fields */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
            <div>
              <label style={{ display: 'block', fontWeight: '600', marginBottom: '8px', color: '#374151' }}>
                Full Name *
              </label>
              <input
                type="text"
                placeholder="Enter your full name"
                value={candidate.name}
                onChange={(e) => setCandidate(prev => ({ ...prev, name: e.target.value }))}
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '2px solid #d1d5db',
                  borderRadius: '8px',
                  fontSize: '16px',
                  transition: 'border-color 0.2s'
                }}
                onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
                onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontWeight: '600', marginBottom: '8px', color: '#374151' }}>
                Email Address *
              </label>
              <input
                type="email"
                placeholder="your.email@domain.com"
                value={candidate.email}
                onChange={(e) => setCandidate(prev => ({ ...prev, email: e.target.value }))}
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '2px solid #d1d5db',
                  borderRadius: '8px',
                  fontSize: '16px',
                  transition: 'border-color 0.2s'
                }}
                onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
                onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
              />
            </div>
          </div>

          {/* Position Selection */}
          <div style={{ marginBottom: '25px' }}>
            <label style={{ display: 'block', fontWeight: '600', marginBottom: '8px', color: '#374151' }}>
              Position Applying For *
            </label>
            <select
              value={candidate.position}
              onChange={(e) => setCandidate(prev => ({ ...prev, position: e.target.value }))}
              style={{
                width: '100%',
                padding: '12px',
                border: '2px solid #d1d5db',
                borderRadius: '8px',
                fontSize: '16px',
                backgroundColor: 'white'
              }}
            >
              <option value="">Select Position</option>
              <option value="Software Engineer">Software Engineer</option>
              <option value="Frontend Developer">Frontend Developer</option>
              <option value="Backend Developer">Backend Developer</option>
              <option value="Data Scientist">Data Scientist</option>
              <option value="Full Stack Developer">Full Stack Developer</option>
              <option value="DevOps Engineer">DevOps Engineer</option>
              <option value="Product Manager">Product Manager</option>
            </select>
          </div>

          {/* Resume Upload */}
          <div style={{ marginBottom: '25px' }}>
            <label style={{ display: 'block', fontWeight: '600', marginBottom: '8px', color: '#374151' }}>
              Resume Upload *
            </label>
            <div style={{
              border: resumeUploaded ? '2px dashed #10b981' : '2px dashed #d1d5db',
              borderRadius: '12px',
              padding: '40px 20px',
              textAlign: 'center',
              backgroundColor: resumeUploaded ? '#ecfdf5' : '#f9fafb',
              cursor: 'pointer',
              transition: 'all 0.3s'
            }}>
              <input
                type="file"
                accept=".pdf,.doc,.docx"
                onChange={handleFileUpload}
                style={{ display: 'none' }}
                id="resume-upload"
              />
              {resumeUploaded ? (
                <div>
                  <CheckCircle size={48} style={{ color: '#10b981', margin: '0 auto 15px' }} />
                  <p style={{ color: '#059669', fontWeight: '600', margin: '0 0 5px 0' }}>
                    {resumeFile?.name || 'Resume on file'}
                  </p>
                  <p style={{ color: '#047857', fontSize: '14px', margin: '0 0 15px 0' }}>
                    {user?.hasResumeData && !resumeFile ? 'Using previously uploaded resume' : 'Successfully uploaded and processed'}
                  </p>
                  <button
                    onClick={() => {
                      setResumeFile(null);
                      setResumeUploaded(false);
                    }}
                    className="btn btn-secondary"
                    style={{ fontSize: '14px' }}
                  >
                    Upload Different File
                  </button>
                </div>
              ) : (
                <label htmlFor="resume-upload" style={{ cursor: 'pointer', display: 'block' }}>
                  <FileText size={64} style={{ color: '#9ca3af', margin: '0 auto 20px' }} />
                  <p style={{ fontSize: '18px', fontWeight: '600', color: '#3b82f6', margin: '0 0 5px 0' }}>
                    {resumeFile ? resumeFile.name : 'Click to upload your resume'}
                  </p>
                  <p style={{ color: '#6b7280', fontSize: '14px', margin: '0' }}>
                    PDF, DOC, or DOCX (max 5MB)
                  </p>
                </label>
              )}
            </div>
          </div>

          {error && (
            <div style={{
              background: '#fef2f2',
              border: '1px solid #fca5a5',
              borderRadius: '8px',
              padding: '15px',
              marginBottom: '20px',
              display: 'flex',
              alignItems: 'center',
              gap: '10px'
            }}>
              <AlertCircle size={20} style={{ color: '#dc2626' }} />
              <span style={{ color: '#dc2626' }}>{error}</span>
            </div>
          )}

          {/* Start Button */}
          <button
            onClick={handleStartInterview}
            disabled={loading || !resumeUploaded || !candidate.name || !candidate.email || !candidate.position}
            className="btn btn-primary"
            style={{
              width: '100%',
              height: '50px',
              fontSize: '18px',
              fontWeight: '600',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '10px',
              opacity: (loading || !resumeUploaded || !candidate.name || !candidate.email || !candidate.position) ? 0.6 : 1
            }}
          >
            {loading ? (
              <>
                <div style={{
                  width: '20px',
                  height: '20px',
                  border: '2px solid #ffffff',
                  borderTop: '2px solid transparent',
                  borderRadius: '50%',
                  animation: 'spin 1s linear infinite'
                }}></div>
                Preparing Interview...
              </>
            ) : (
              <>
                <Zap size={20} />
                Start AI Interview
              </>
            )}
          </button>

          {/* Requirements Checklist */}
          <div style={{
            background: '#f9fafb',
            borderRadius: '8px',
            padding: '20px',
            marginTop: '20px'
          }}>
            <h4 style={{ fontWeight: '600', color: '#374151', marginBottom: '15px' }}>Requirements Checklist:</h4>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', fontSize: '14px' }}>
              {[
                { label: 'Full Name', completed: !!candidate.name },
                { label: 'Email Address', completed: !!candidate.email },
                { label: 'Position Selection', completed: !!candidate.position },
                { label: 'Resume Upload', completed: resumeUploaded }
              ].map((item, index) => (
                <div key={index} style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  color: item.completed ? '#10b981' : '#6b7280'
                }}>
                  {item.completed ? <CheckCircle size={16} /> : <Clock size={16} />}
                  {item.label}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Step 2: Interview Questions
  if (step === 'interview') {
    return (
      <div 
        ref={containerRef}
        style={{ 
          maxWidth: '1000px', 
          margin: '0 auto', 
          padding: '20px',
          minHeight: '100vh',
          backgroundColor: isFullscreen ? '#000' : 'transparent'
        }}
      >
        {/* Fullscreen Warning */}
        {!isFullscreen && wasInFullscreen && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            backgroundColor: '#dc2626',
            color: 'white',
            padding: '15px',
            textAlign: 'center',
            zIndex: 1000,
            fontSize: '18px',
            fontWeight: 'bold'
          }}>
            ⚠️ Please remain in fullscreen mode during the interview!
          </div>
        )}

        {/* Progress Header */}
        <div className="card" style={{ marginBottom: '20px', backgroundColor: isFullscreen ? '#1f2937' : 'white' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
            <div>
              <h2 style={{ margin: '0 0 5px 0', color: isFullscreen ? 'white' : '#1f2937' }}>
                Question {responses.length + 1} of {interview?.questions.length || 6}
              </h2>
              <p style={{ margin: 0, color: isFullscreen ? '#d1d5db' : '#6b7280' }}>
                AI Interview: {candidate.position}
              </p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
              {/* Difficulty Badge */}
              <div style={{
                padding: '6px 12px',
                borderRadius: '20px',
                fontSize: '12px',
                fontWeight: '600',
                backgroundColor: currentQuestion?.difficulty === 'easy' ? '#dcfce7' : 
                               currentQuestion?.difficulty === 'medium' ? '#fef3c7' : '#fef2f2',
                color: currentQuestion?.difficulty === 'easy' ? '#166534' : 
                       currentQuestion?.difficulty === 'medium' ? '#92400e' : '#991b1b'
              }}>
                {currentQuestion?.difficulty?.toUpperCase()}
              </div>
              
              {/* Enhanced Timer */}
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                padding: '15px 20px',
                borderRadius: '12px',
                backgroundColor: timeRemaining <= 10 ? '#fef2f2' : timeRemaining <= 30 ? '#fef3c7' : '#ecfdf5',
                border: `3px solid ${timeRemaining <= 10 ? '#dc2626' : timeRemaining <= 30 ? '#d97706' : '#059669'}`,
                minWidth: '120px'
              }}>
                <div style={{
                  fontSize: '28px',
                  fontWeight: 'bold',
                  fontFamily: 'monospace',
                  color: timeRemaining <= 10 ? '#dc2626' : timeRemaining <= 30 ? '#d97706' : '#059669',
                  lineHeight: '1'
                }}>
                  {formatTime(timeRemaining)}
                </div>
                <div style={{
                  fontSize: '12px',
                  color: timeRemaining <= 10 ? '#991b1b' : timeRemaining <= 30 ? '#92400e' : '#166534',
                  fontWeight: '600',
                  marginTop: '4px'
                }}>
                  {timeRemaining <= 10 ? '⚠️ HURRY UP!' : timeRemaining <= 30 ? '⏰ Time Running Out' : '⏱️ Time Remaining'}
                </div>
              </div>
            </div>
          </div>
          <div style={{
            width: '100%',
            height: '8px',
            backgroundColor: '#e5e7eb',
            borderRadius: '4px',
            overflow: 'hidden'
          }}>
            <div style={{
              width: `${getProgressPercentage()}%`,
              height: '100%',
              backgroundColor: '#3b82f6',
              transition: 'width 0.3s ease'
            }} />
          </div>
          <p style={{ marginTop: '10px', fontSize: '14px', color: '#6b7280' }}>
            Progress: {Math.round(getProgressPercentage())}% completed • {responses.length} questions answered
          </p>
        </div>

        {/* Question Card */}
        <div className="card" style={{ borderLeft: '4px solid #3b82f6', marginBottom: '20px' }}>
          <div style={{
            background: 'linear-gradient(135deg, #dbeafe 0%, #e0e7ff 100%)',
            borderRadius: '8px 8px 0 0',
            padding: '20px',
            marginBottom: '20px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '15px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                <span style={{
                  padding: '4px 12px',
                  borderRadius: '20px',
                  fontSize: '12px',
                  fontWeight: '600',
                  backgroundColor: currentQuestion?.difficulty === 'easy' ? '#dcfce7' : 
                                 currentQuestion?.difficulty === 'medium' ? '#fef3c7' : '#fef2f2',
                  color: currentQuestion?.difficulty === 'easy' ? '#166534' : 
                         currentQuestion?.difficulty === 'medium' ? '#92400e' : '#991b1b'
                }}>
                  {currentQuestion?.difficulty?.toUpperCase()}
                </span>
                <span style={{ fontSize: '14px', color: '#6b7280', display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <Clock size={16} />
                  {currentQuestion?.timeLimit}s limit
                </span>
              </div>
            </div>
            <h3 style={{ fontSize: '20px', lineHeight: '1.4', color: '#1f2937', margin: 0 }}>
              {currentQuestion?.question}
            </h3>
          </div>

          <div style={{ padding: '0 20px 20px' }}>
            <label style={{ display: 'block', fontWeight: '600', marginBottom: '10px', color: '#374151' }}>
              Your Answer:
            </label>
            <textarea
              placeholder="Type your detailed answer here... Be specific and provide examples where possible."
              value={currentResponse}
              onChange={(e) => setCurrentResponse(e.target.value)}
              disabled={!isAnswering}
              rows={10}
              style={{
                width: '100%',
                padding: '15px',
                border: '2px solid #d1d5db',
                borderRadius: '8px',
                fontSize: '16px',
                resize: 'none',
                fontFamily: 'inherit',
                lineHeight: '1.5'
              }}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', color: '#6b7280', marginTop: '8px' }}>
              <span>{currentResponse.length} characters</span>
              <span>{currentResponse.trim().split(' ').filter(word => word.length > 0).length} words</span>
            </div>

            {error && (
              <div style={{
                background: '#fef2f2',
                border: '1px solid #fca5a5',
                borderRadius: '8px',
                padding: '15px',
                margin: '15px 0',
                display: 'flex',
                alignItems: 'center',
                gap: '10px'
              }}>
                <AlertCircle size={20} style={{ color: '#dc2626' }} />
                <span style={{ color: '#dc2626' }}>{error}</span>
              </div>
            )}

            <button
              onClick={() => handleSubmitResponse(false)}
              disabled={loading || !isAnswering || !currentResponse.trim()}
              className="btn btn-primary"
              style={{
                width: '100%',
                height: '50px',
                fontSize: '18px',
                fontWeight: '600',
                marginTop: '20px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '10px',
                opacity: (loading || !isAnswering || !currentResponse.trim()) ? 0.6 : 1
              }}
            >
              {loading ? (
                <>
                  <div style={{
                    width: '20px',
                    height: '20px',
                    border: '2px solid #ffffff',
                    borderTop: '2px solid transparent',
                    borderRadius: '50%',
                    animation: 'spin 1s linear infinite'
                  }}></div>
                  Submitting Answer...
                </>
              ) : (
                <>
                  <CheckCircle size={20} />
                  Submit Answer {currentResponse.trim() ? '(Ready)' : '(Enter answer first)'}
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Step 3: Completed
  if (step === 'completed') {
    return (
      <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '20px' }}>
        <div className="card" style={{ textAlign: 'center', marginBottom: '30px' }}>
          {interviewTerminated ? (
            <>
              <AlertCircle size={80} style={{ color: '#ef4444', margin: '0 auto 20px' }} />
              <h2 style={{ color: '#dc2626', marginBottom: '10px' }}>Interview Terminated</h2>
              <p style={{ color: '#6b7280', fontSize: '18px' }}>
                {terminationReason}
              </p>
            </>
          ) : (
            <>
              <CheckCircle size={80} style={{ color: '#10b981', margin: '0 auto 20px' }} />
              <h2 style={{ color: '#1f2937', marginBottom: '10px' }}>Interview Completed!</h2>
              <p style={{ color: '#6b7280', fontSize: '18px' }}>
                Great job! Here's your comprehensive assessment report.
              </p>
            </>
          )}
        </div>

        {/* Violation Summary - Show if there were any violations */}
        {(violations.length > 0 || interviewTerminated) && (
          <div className="card" style={{ 
            marginBottom: '20px', 
            borderLeft: '4px solid #ef4444',
            backgroundColor: '#fef2f2'
          }}>
            <h3 style={{ color: '#dc2626', marginBottom: '15px', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <AlertCircle size={24} />
              Interview Violations Detected
            </h3>
            <div style={{ 
              padding: '15px', 
              backgroundColor: 'white', 
              borderRadius: '6px',
              border: '1px solid #f87171'
            }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px', marginBottom: '15px' }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#dc2626' }}>
                    {responses.length}
                  </div>
                  <div style={{ fontSize: '14px', color: '#6b7280' }}>Questions Completed</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#dc2626' }}>
                    {interview?.questions?.length || 0}
                  </div>
                  <div style={{ fontSize: '14px', color: '#6b7280' }}>Total Questions</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#dc2626' }}>
                    {violations.length}
                  </div>
                  <div style={{ fontSize: '14px', color: '#6b7280' }}>Violations</div>
                </div>
              </div>
              
              {violations.length > 0 && (
                <div>
                  <h4 style={{ color: '#dc2626', marginBottom: '10px' }}>Violation Details:</h4>
                  <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
                    {violations.map((violation, index) => (
                      <div key={index} style={{ 
                        padding: '10px', 
                        marginBottom: '8px',
                        border: '1px solid #f87171',
                        borderRadius: '4px',
                        backgroundColor: '#fef2f2'
                      }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontWeight: '600', color: '#dc2626' }}>
                            {violation.type === 'fullscreen_exit' ? '🔍 Exited Fullscreen' :
                             violation.type === 'tab_change' ? '🔄 Changed Tab/Window' :
                             violation.type === 'window_blur' ? '🎯 Window Lost Focus' : violation.type}
                          </span>
                          <span style={{ fontSize: '12px', color: '#6b7280' }}>
                            Question {violation.questionNumber}
                          </span>
                        </div>
                        <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '4px' }}>
                          {new Date(violation.timestamp).toLocaleTimeString()}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {interviewTerminated && (
                <div style={{ 
                  marginTop: '15px', 
                  padding: '10px', 
                  backgroundColor: '#fee2e2',
                  borderRadius: '4px',
                  border: '1px solid #fca5a5'
                }}>
                  <strong>Termination Reason:</strong> {terminationReason}
                </div>
              )}
            </div>
          </div>
        )}

        {finalReport && (
          <>
            {/* Score Overview */}
            <div className="card" style={{ marginBottom: '20px' }}>
              <h3 style={{ marginBottom: '20px', color: '#1f2937', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Brain size={24} style={{ color: '#3b82f6' }} />
                AI Assessment Overview
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', textAlign: 'center' }}>
                <div style={{ padding: '20px', background: '#f0f9ff', borderRadius: '8px', border: '1px solid #3b82f6' }}>
                  <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#0369a1', marginBottom: '5px' }}>
                    {finalReport.candidate?.averageScore || 0}%
                  </div>
                  <div style={{ color: '#0369a1', fontWeight: '600' }}>Overall Score</div>
                  <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '5px' }}>
                    {finalReport.candidate?.correctAnswers || 0}/{finalReport.candidate?.totalQuestions || 0} correct
                  </div>
                </div>
                <div style={{ padding: '20px', background: '#f0fdf4', borderRadius: '8px', border: '1px solid #10b981' }}>
                  <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#166534', marginBottom: '5px' }}>
                    {finalReport.candidate?.accuracyPercentage || 0}%
                  </div>
                  <div style={{ color: '#166534', fontWeight: '600' }}>Accuracy Rate</div>
                  <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '5px' }}>
                    Correct vs Incorrect Answers
                  </div>
                </div>
                <div style={{ padding: '20px', background: '#fef7cd', borderRadius: '8px', border: '1px solid #f59e0b' }}>
                  <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#92400e', marginBottom: '5px' }}>
                    {finalReport.recommendation || 'Pending'}
                  </div>
                  <div style={{ color: '#92400e', fontWeight: '600' }}>Recommendation</div>
                  <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '5px' }}>
                    {finalReport.confidenceLevel || 'Medium'} Confidence
                  </div>
                </div>
                {finalReport.technicalCompetency && (
                  <div style={{ padding: '20px', background: '#f3f4f6', borderRadius: '8px', border: '1px solid #6b7280' }}>
                    <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#374151', marginBottom: '5px' }}>
                      {finalReport.technicalCompetency}
                    </div>
                    <div style={{ color: '#374151', fontWeight: '600' }}>Tech Level</div>
                    <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '5px' }}>
                      Communication: {finalReport.communicationScore || 'N/A'}/100
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Difficulty & Accuracy Breakdown */}
            <div className="card" style={{ marginBottom: '20px' }}>
              <h3 style={{ marginBottom: '20px', color: '#1f2937' }}>Performance Analysis by Difficulty</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px' }}>
                {[
                  { 
                    label: 'Easy Questions', 
                    score: finalReport.breakdown?.easy?.average || 0, 
                    accuracy: finalReport.breakdown?.easy?.accuracy || 0,
                    count: finalReport.breakdown?.easy?.count || 0,
                    color: '#10b981' 
                  },
                  { 
                    label: 'Medium Questions', 
                    score: finalReport.breakdown?.medium?.average || 0, 
                    accuracy: finalReport.breakdown?.medium?.accuracy || 0,
                    count: finalReport.breakdown?.medium?.count || 0,
                    color: '#f59e0b' 
                  },
                  { 
                    label: 'Hard Questions', 
                    score: finalReport.breakdown?.hard?.average || 0, 
                    accuracy: finalReport.breakdown?.hard?.accuracy || 0,
                    count: finalReport.breakdown?.hard?.count || 0,
                    color: '#ef4444' 
                  }
                ].map((item, index) => (
                  <div key={index} style={{ 
                    border: '1px solid #e5e7eb', 
                    borderRadius: '8px', 
                    padding: '20px', 
                    backgroundColor: '#fafafa' 
                  }}>
                    <div style={{ textAlign: 'center', marginBottom: '15px' }}>
                      <h4 style={{ margin: '0 0 10px 0', color: item.color, fontWeight: '600' }}>
                        {item.label}
                      </h4>
                      <div style={{ fontSize: '12px', color: '#6b7280' }}>
                        {item.count} question{item.count !== 1 ? 's' : ''}
                      </div>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: '24px', fontWeight: 'bold', color: item.color }}>
                          {item.score}%
                        </div>
                        <div style={{ fontSize: '12px', color: '#6b7280' }}>Avg Score</div>
                      </div>
                      <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: '24px', fontWeight: 'bold', color: item.color }}>
                          {item.accuracy}%
                        </div>
                        <div style={{ fontSize: '12px', color: '#6b7280' }}>Accuracy</div>
                      </div>
                    </div>
                    <div style={{ 
                      marginTop: '10px', 
                      height: '6px', 
                      backgroundColor: '#e5e7eb', 
                      borderRadius: '3px',
                      overflow: 'hidden'
                    }}>
                      <div style={{ 
                        height: '100%', 
                        width: `${item.score}%`, 
                        backgroundColor: item.color,
                        transition: 'width 0.3s ease'
                      }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Category Insights */}
            {finalReport.categoryInsights && Object.keys(finalReport.categoryInsights).length > 0 && (
              <div className="card" style={{ marginBottom: '20px' }}>
                <h3 style={{ marginBottom: '20px', color: '#1f2937' }}>Category Performance</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '15px' }}>
                  {Object.entries(finalReport.categoryInsights).map(([category, score]) => (
                    <div key={category} style={{ 
                      padding: '15px', 
                      border: '1px solid #e5e7eb', 
                      borderRadius: '6px',
                      textAlign: 'center',
                      backgroundColor: '#f9fafb'
                    }}>
                      <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#374151', marginBottom: '5px' }}>
                        {Number(score)}%
                      </div>
                      <div style={{ fontSize: '14px', color: '#6b7280', textTransform: 'capitalize' }}>
                        {category}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Strengths and Improvements */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
              {finalReport.strengths && finalReport.strengths.length > 0 && (
                <div className="card" style={{ borderLeft: '4px solid #10b981' }}>
                  <h4 style={{ color: '#166534', marginBottom: '15px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <CheckCircle size={18} />
                    Key Strengths
                  </h4>
                  <ul style={{ margin: 0, paddingLeft: '20px', color: '#374151' }}>
                    {finalReport.strengths.map((strength, index) => (
                      <li key={index} style={{ marginBottom: '8px', lineHeight: '1.5' }}>
                        {strength}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              
              {finalReport.improvements && finalReport.improvements.length > 0 && (
                <div className="card" style={{ borderLeft: '4px solid #f59e0b' }}>
                  <h4 style={{ color: '#92400e', marginBottom: '15px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <AlertCircle size={18} />
                    Areas for Improvement
                  </h4>
                  <ul style={{ margin: 0, paddingLeft: '20px', color: '#374151' }}>
                    {finalReport.improvements.map((improvement, index) => (
                      <li key={index} style={{ marginBottom: '8px', lineHeight: '1.5' }}>
                        {improvement}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* AI Summary */}
            <div className="card" style={{ border: '1px solid #3b82f6', backgroundColor: '#f8fafc' }}>
              <h3 style={{ marginBottom: '15px', color: '#1f2937', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Brain size={24} style={{ color: '#3b82f6' }} />
                AI Assessment Summary
              </h3>
              <div style={{ 
                padding: '20px', 
                backgroundColor: 'white', 
                borderRadius: '6px',
                border: '1px solid #e5e7eb',
                lineHeight: '1.7',
                color: '#374151'
              }}>
                {finalReport.aiSummary}
              </div>
            </div>

            {/* Individual Question Analysis */}
            {finalReport.detailedAnalysis?.individualQuestionAnalysis && (
              <div className="card" style={{ marginTop: '20px' }}>
                <h3 style={{ marginBottom: '20px', color: '#1f2937' }}>Question-by-Question Analysis</h3>
                <div style={{ maxHeight: '400px', overflowY: 'auto', padding: '10px' }}>
                  {finalReport.detailedAnalysis.individualQuestionAnalysis.map((analysis, index) => (
                    <div key={index} style={{ 
                      border: '1px solid #e5e7eb', 
                      borderRadius: '8px', 
                      padding: '15px', 
                      marginBottom: '15px',
                      backgroundColor: analysis.isCorrect ? '#f0fdf4' : '#fef2f2'
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                        <h5 style={{ margin: 0, color: '#374151' }}>
                          Q{analysis.questionNumber}: {analysis.difficulty?.toUpperCase()} - {analysis.category}
                        </h5>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <span style={{ 
                            padding: '2px 8px', 
                            borderRadius: '4px', 
                            fontSize: '12px', 
                            fontWeight: 'bold',
                            backgroundColor: analysis.isCorrect ? '#10b981' : '#ef4444',
                            color: 'white'
                          }}>
                            {analysis.score}%
                          </span>
                          <span style={{ fontSize: '12px', color: '#6b7280' }}>
                            {analysis.timeUsed}s / {analysis.timeLimit}s
                          </span>
                        </div>
                      </div>
                      {analysis.feedback && (
                        <p style={{ 
                          margin: 0, 
                          fontSize: '14px', 
                          color: '#6b7280',
                          fontStyle: 'italic',
                          backgroundColor: 'rgba(255, 255, 255, 0.5)',
                          padding: '8px',
                          borderRadius: '4px'
                        }}>
                          💡 {analysis.feedback}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    );
  }

  return null;
};

export default StyledInterviewWorkflow;