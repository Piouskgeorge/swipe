import { useState, useEffect } from 'react';
import apiService from '../services/apiService';

interface User {
  id: string;
  email: string;
  role: string;
  profile: {
    firstName: string;
    lastName: string;
    position?: string;
  };
}

interface IntervieweeTabProps {
  user: User;
  onLogout: () => void;
}

function IntervieweeTab({ user, onLogout }: IntervieweeTabProps) {
  const [step, setStep] = useState(1);
  const [currentInterview, setCurrentInterview] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [currentMessage, setCurrentMessage] = useState('');
  const [timeLeft, setTimeLeft] = useState(1800);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);

  useEffect(() => {
    loadInterviews();
  }, []);

  useEffect(() => {
    let timer: any;
    if (step === 3 && timeLeft > 0 && currentInterview?.status === 'in-progress') {
      timer = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            handleCompleteInterview();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [step, timeLeft, currentInterview?.status]);

  const loadInterviews = async () => {
    try {
      const data = await apiService.getInterviews();
      // setInterviews(data.interviews || []);
      
      // Check for active interview
      const activeInterview = data.interviews?.find((i: any) => 
        i.status === 'in-progress' || i.status === 'paused'
      );
      
      if (activeInterview) {
        setCurrentInterview(activeInterview);
        setMessages(activeInterview.chatHistory || []);
        setCurrentQuestionIndex(activeInterview.responses?.length || 0);
        setStep(3);
      } else {
        // Check for scheduled interviews
        const scheduledInterview = data.interviews?.find((i: any) => i.status === 'scheduled');
        if (scheduledInterview) {
          setCurrentInterview(scheduledInterview);
          setStep(2);
        }
      }
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !currentInterview) return;

    setLoading(true);
    try {
      await apiService.uploadResume(currentInterview._id, file);
      setStep(2);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const startInterview = async () => {
    if (!currentInterview) return;

    setLoading(true);
    try {
      const data = await apiService.startInterview(currentInterview._id);
      setCurrentInterview(data.interview);
      setMessages(data.interview.chatHistory || []);
      setCurrentQuestionIndex(0);
      setStep(3);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async () => {
    if (!currentMessage.trim() || !currentInterview) return;

    setLoading(true);
    const userMessage = { sender: 'interviewee', message: currentMessage, timestamp: new Date() };
    setMessages(prev => [...prev, userMessage]);
    const messageToSend = currentMessage;
    setCurrentMessage('');

    try {
      const data = await apiService.submitResponse(
        currentInterview._id,
        currentQuestionIndex,
        messageToSend
      );

      if (data.nextQuestion !== null) {
        setCurrentQuestionIndex(data.nextQuestion);
      }

      if (data.isComplete) {
        setStep(4);
      }

      // Refresh messages from server
      setMessages(data.chatHistory || []);
    } catch (err: any) {
      setError(err.message);
      // Remove the user message if sending failed
      setMessages(prev => prev.slice(0, -1));
      setCurrentMessage(messageToSend);
    } finally {
      setLoading(false);
    }
  };

  const handleCompleteInterview = () => {
    setStep(4);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (error) {
    return (
      <div className="card">
        <h2>Error</h2>
        <p style={{ color: 'red' }}>{error}</p>
        <button className="btn btn-primary" onClick={() => {
          setError('');
          loadInterviews();
        }}>
          Retry
        </button>
      </div>
    );
  }

  return (
    <div>
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2>Welcome, {user.profile.firstName}!</h2>
            <p>Role: Candidate | Email: {user.email}</p>
          </div>
          <button onClick={onLogout} className="btn" style={{ background: '#6b7280', color: 'white' }}>
            Logout
          </button>
        </div>
      </div>

      {/* Step 1: Upload Resume */}
      {step === 1 && !currentInterview && (
        <div className="card">
          <h2>No Scheduled Interviews</h2>
          <p>You don't have any scheduled interviews at the moment. Please contact your interviewer to schedule an interview session.</p>
        </div>
      )}

      {/* Step 1: Upload Resume (when interview is scheduled) */}
      {step === 1 && currentInterview && (
        <div className="card">
          <h2>Upload Your Resume</h2>
          <p>Interview for: <strong>{currentInterview.position}</strong></p>
          <p>Scheduled with: {currentInterview.interviewer?.profile?.firstName} {currentInterview.interviewer?.profile?.lastName}</p>
          
          <div className="upload-area" onClick={() => document.getElementById('resume-upload')?.click()}>
            <div className="upload-icon">📄</div>
            <p><strong>Click to upload your resume</strong></p>
            <p>Supports PDF, DOC, DOCX files</p>
            <input
              id="resume-upload"
              type="file"
              accept=".pdf,.doc,.docx"
              onChange={handleFileUpload}
              style={{ display: 'none' }}
            />
          </div>
          {loading && <p>Uploading...</p>}
        </div>
      )}

      {/* Step 2: Ready to Start */}
      {step === 2 && (
        <div className="card">
          <h2>Ready to Start Interview</h2>
          <p>Position: <strong>{currentInterview?.position}</strong></p>
          <p>Duration: {currentInterview?.duration} minutes</p>
          {currentInterview?.resume && (
            <p style={{ color: 'green' }}>✅ Resume uploaded successfully</p>
          )}
          <button 
            className="btn btn-primary" 
            onClick={startInterview}
            disabled={loading}
          >
            {loading ? 'Starting...' : 'Start Interview'}
          </button>
        </div>
      )}

      {/* Step 3: Interview Chat */}
      {step === 3 && (
        <div>
          <div className="card">
            <div className={`timer ${timeLeft < 300 ? 'warning' : ''}`}>
              Time Remaining: {formatTime(timeLeft)}
            </div>
          </div>
          
          <div className="card">
            <div className="chat-container">
              <div className="chat-header">
                Interview Session - {currentInterview?.position}
              </div>
              <div className="chat-messages">
                {messages.map((msg, index) => (
                  <div key={index} className={`message ${msg.sender === 'interviewee' ? 'user' : 'bot'}`}>
                    {msg.message}
                  </div>
                ))}
                {loading && (
                  <div className="message bot">
                    <em>AI is thinking...</em>
                  </div>
                )}
              </div>
              <div className="chat-input">
                <input
                  type="text"
                  value={currentMessage}
                  onChange={(e) => setCurrentMessage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && !loading && sendMessage()}
                  placeholder="Type your response..."
                  disabled={loading}
                />
                <button 
                  className="btn btn-primary" 
                  onClick={sendMessage}
                  disabled={loading || !currentMessage.trim()}
                >
                  Send
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Step 4: Interview Complete */}
      {step === 4 && (
        <div className="card">
          <h2>Interview Complete! 🎉</h2>
          <p>Thank you for completing your interview for <strong>{currentInterview?.position}</strong>.</p>
          <p>Your responses have been recorded and will be reviewed by the hiring team.</p>
          <p>You will receive feedback within 2-3 business days.</p>
          
          {currentInterview?.overallAssessment && (
            <div style={{ marginTop: '20px', padding: '15px', background: '#f0f9ff', borderRadius: '8px' }}>
              <h3>Initial Assessment</h3>
              <p><strong>Overall Score:</strong> {currentInterview.overallAssessment.totalScore}/100</p>
              <p><strong>Summary:</strong> {currentInterview.overallAssessment.aiSummary}</p>
            </div>
          )}
          
          <button className="btn btn-primary" onClick={() => {
            setStep(1);
            setCurrentInterview(null);
            setMessages([]);
            setTimeLeft(1800);
            loadInterviews();
          }}>
            Back to Dashboard
          </button>
        </div>
      )}

      {/* Progress Bar */}
      <div className="card">
        <div className="progress-bar">
          <div 
            className="progress-fill" 
            style={{ width: `${(step / 4) * 100}%` }}
          ></div>
        </div>
        <p>Step {step} of 4: {
          step === 1 ? 'Upload Resume' :
          step === 2 ? 'Start Interview' :
          step === 3 ? 'Interview in Progress' : 'Complete'
        }</p>
      </div>
    </div>
  );
}

export default IntervieweeTab;