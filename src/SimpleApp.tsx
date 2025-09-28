import { useState, useEffect } from 'react';
import Login from './components/Login';
import WorkingIntervieweeTab from './components/WorkingIntervieweeTab';
import WorkingInterviewerTab from './components/WorkingInterviewerTab';

interface User {
  id: string;
  email: string;
  role: string;
  profile: {
    firstName: string;
    lastName: string;
    company?: string;
    position?: string;
    resumeData?: any;
    resumeText?: string;
  };
  hasResumeData?: boolean;
  needsResumeUpload?: boolean;
}

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [backendStatus, setBackendStatus] = useState<'checking' | 'online' | 'offline'>('checking');

  useEffect(() => {
    checkBackendStatus();
    checkExistingAuth();
  }, []);

  const checkBackendStatus = async () => {
    // Skip backend check for now - work with frontend only
    setBackendStatus('online');
  };

  const checkExistingAuth = async () => {
    const savedUser = localStorage.getItem('user');
    
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch (error) {
        // Invalid user data, clear storage
        localStorage.removeItem('user');
        setUser(null);
      }
    }
    setLoading(false);
  };

  const handleLogin = (userData: User, userToken: string) => {
    setUser(userData);
    localStorage.setItem('token', userToken);
    localStorage.setItem('user', JSON.stringify(userData));
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  };



  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="card" style={{ maxWidth: '400px' }}>
          <h2>Loading...</h2>
          <p>Checking authentication status...</p>
        </div>
      </div>
    );
  }

  if (backendStatus === 'offline') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-red-100 flex items-center justify-center p-4">
        <div className="card" style={{ maxWidth: '500px', textAlign: 'center' }}>
          <h2 style={{ color: '#dc2626' }}>Backend Server Offline</h2>
          <p>The backend server is not responding. Please ensure:</p>
          <ul style={{ textAlign: 'left', margin: '20px 0' }}>
            <li>MongoDB is running</li>
            <li>Backend server is started (npm run dev in backend folder)</li>
            <li>Backend is running on http://localhost:5001</li>
          </ul>
          <button 
            className="btn btn-primary" 
            onClick={checkBackendStatus}
          >
            Retry Connection
          </button>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <div>
      <div className="header">
        <div className="container">
          <h1>AI-Powered Interview Assistant</h1>
          <p>Streamline your hiring process with intelligent interview management</p>
        </div>
      </div>

      <div className="container">
        {user.role === 'interviewee' ? (
          <WorkingIntervieweeTab user={user} onLogout={handleLogout} />
        ) : (
          <WorkingInterviewerTab user={user} onLogout={handleLogout} />
        )}
      </div>
    </div>
  );
}

export default App;