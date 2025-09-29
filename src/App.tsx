import { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { MessageSquare, Brain, Users } from 'lucide-react';
import type { RootState } from './store';
import { setActiveTab } from './store/slices/appSlice';
import CleanInterviewTab from './components/CleanInterviewTab';
import CrispInterviewerTab from './components/CrispInterviewerTab';
import WelcomeBackModal from './components/WelcomeBackModal';

function App() {
  const dispatch = useDispatch();
  const [activeTab, setCurrentTab] = useState<'interviewee' | 'interviewer'>('interviewee');
  const [showWelcomeModal, setShowWelcomeModal] = useState(false);
  const { candidates } = useSelector((state: RootState) => state.candidates);

  useEffect(() => {
    // Check for incomplete/paused interviews on app load
    const pausedCandidate = candidates.find((c: any) => c.status === 'paused' || c.status === 'interviewing');
    if (pausedCandidate) {
      setShowWelcomeModal(true);
    }
  }, []);

  const handleTabSwitch = (tab: 'interviewee' | 'interviewer') => {
    setCurrentTab(tab);
    dispatch(setActiveTab(tab));
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Crisp Header */}
      <header className="bg-white border-b-2 border-blue-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                <Brain className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Crisp</h1>
                <p className="text-sm text-gray-600">AI-Powered Interview Assistant</p>
              </div>
            </div>
            
            {/* Tab Navigation */}
            <div className="flex bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => handleTabSwitch('interviewee')}
                className={`px-6 py-2 rounded-md text-sm font-medium transition-all duration-200 flex items-center space-x-2 ${
                  activeTab === 'interviewee'
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                <MessageSquare className="w-4 h-4" />
                <span>Interviewee</span>
              </button>
              <button
                onClick={() => handleTabSwitch('interviewer')}
                className={`px-6 py-2 rounded-md text-sm font-medium transition-all duration-200 flex items-center space-x-2 ${
                  activeTab === 'interviewer'
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                <Users className="w-4 h-4" />
                <span>Interviewer</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-6">
        {activeTab === 'interviewee' ? (
          <CleanInterviewTab />
        ) : (
          <CrispInterviewerTab candidates={[]} />
        )}
      </main>

      {/* Welcome Back Modal for Resume/Pause functionality */}
      <WelcomeBackModal
        visible={showWelcomeModal}
        onClose={() => setShowWelcomeModal(false)}
      />
    </div>
  );
}

export default App;
