import { useState } from 'react';

function SimpleIntervieweeTab() {
  const [step, setStep] = useState(1);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [position, setPosition] = useState('');
  const [, setResumeText] = useState('');
  const [messages, setMessages] = useState<Array<{type: 'user' | 'bot', text: string}>>([]);
  const [currentMessage, setCurrentMessage] = useState('');
  const [timeLeft, setTimeLeft] = useState(1800); // 30 minutes

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setResumeText(e.target?.result as string || 'Resume uploaded successfully');
        setStep(2);
      };
      reader.readAsText(file);
    }
  };

  const startInterview = () => {
    if (name && email && position) {
      setStep(3);
      setMessages([
        { type: 'bot', text: `Hello ${name}! Welcome to your interview for the ${position} position. Let's start with a simple question: Tell me about yourself and your experience.` }
      ]);
      
      // Start timer
      const timer = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            clearInterval(timer);
            setStep(4);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
  };

  const sendMessage = () => {
    if (currentMessage.trim()) {
      const newMessages = [...messages, { type: 'user' as const, text: currentMessage }];
      setMessages(newMessages);
      setCurrentMessage('');
      
      // Simulate AI response
      setTimeout(() => {
        const responses = [
          "That's interesting. Can you elaborate on that?",
          "Great! Now tell me about a challenging project you worked on.",
          "How do you handle working under pressure?",
          "What are your strengths and weaknesses?",
          "Why are you interested in this position?"
        ];
        const randomResponse = responses[Math.floor(Math.random() * responses.length)];
        setMessages(prev => [...prev, { type: 'bot', text: randomResponse }]);
      }, 1000);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div>
      {/* Step 1: Upload Resume */}
      {step === 1 && (
        <div className="card">
          <h2>Upload Your Resume</h2>
          <div className="upload-area" onClick={() => document.getElementById('resume-upload')?.click()}>
            <div className="upload-icon">📄</div>
            <p><strong>Click to upload your resume</strong></p>
            <p>Supports PDF, DOC, DOCX files</p>
            <input
              id="resume-upload"
              type="file"
              accept=".pdf,.doc,.docx,.txt"
              onChange={handleFileUpload}
              style={{ display: 'none' }}
            />
          </div>
        </div>
      )}

      {/* Step 2: Basic Information */}
      {step === 2 && (
        <div className="card">
          <h2>Basic Information</h2>
          <div className="form-group">
            <label className="form-label">Full Name</label>
            <input
              type="text"
              className="form-input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter your full name"
            />
          </div>
          <div className="form-group">
            <label className="form-label">Email Address</label>
            <input
              type="email"
              className="form-input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
            />
          </div>
          <div className="form-group">
            <label className="form-label">Position Applied For</label>
            <input
              type="text"
              className="form-input"
              value={position}
              onChange={(e) => setPosition(e.target.value)}
              placeholder="e.g., Software Engineer, Product Manager"
            />
          </div>
          <button className="btn btn-primary" onClick={startInterview}>
            Start Interview
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
                Interview Session with {name}
              </div>
              <div className="chat-messages">
                {messages.map((msg, index) => (
                  <div key={index} className={`message ${msg.type}`}>
                    {msg.text}
                  </div>
                ))}
              </div>
              <div className="chat-input">
                <input
                  type="text"
                  value={currentMessage}
                  onChange={(e) => setCurrentMessage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                  placeholder="Type your response..."
                />
                <button className="btn btn-primary" onClick={sendMessage}>
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
          <h2>Interview Complete!</h2>
          <p>Thank you for completing your interview, {name}. Your responses have been recorded and will be reviewed by our team.</p>
          <p>You will receive feedback within 2-3 business days.</p>
          <button className="btn btn-primary" onClick={() => {
            setStep(1);
            setName('');
            setEmail('');
            setPosition('');
            setMessages([]);
            setTimeLeft(1800);
          }}>
            Start New Interview
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
          step === 2 ? 'Basic Information' :
          step === 3 ? 'Interview' : 'Complete'
        }</p>
      </div>
    </div>
  );
}

export default SimpleIntervieweeTab;