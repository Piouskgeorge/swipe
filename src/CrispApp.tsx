import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { MessageSquare, Users, User, Settings } from 'lucide-react';
import WorkingIntervieweeTab from './components/WorkingIntervieweeTab';
import CrispInterviewerTab from './components/StyledCrispInterviewerTab';
import { addCandidate, updateCandidate } from './store/slices/candidatesSlice';

import type { RootState } from './store';

// Inline styles to ensure CSS loads properly
const styles = {
  container: {
    minHeight: '100vh',
    background: 'linear-gradient(to bottom right, #f8fafc, #f1f5f9)',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
  },
  header: {
    backgroundColor: 'white',
    borderBottom: '1px solid #e5e7eb',
    boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)'
  },
  headerContent: {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '0 24px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: '64px'
  },
  logo: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px'
  },
  logoIcon: {
    width: '32px',
    height: '32px',
    background: 'linear-gradient(to right, #2563eb, #9333ea)',
    borderRadius: '8px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  logoText: {
    fontSize: '20px',
    fontWeight: 'bold',
    color: '#111827'
  },
  tabContainer: {
    display: 'flex',
    gap: '16px',
    alignItems: 'center'
  },
  tabButton: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '12px 24px',
    borderRadius: '8px',
    fontWeight: '500',
    cursor: 'pointer',
    transition: 'all 0.2s',
    border: 'none',
    fontSize: '14px'
  },
  tabButtonActive: {
    backgroundColor: '#2563eb',
    color: 'white',
    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
  },
  tabButtonInactive: {
    backgroundColor: '#f3f4f6',
    color: '#374151'
  },
  stats: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px'
  },
  statsText: {
    textAlign: 'right' as const
  },
  statsMain: {
    fontSize: '14px',
    fontWeight: '500',
    color: '#111827'
  },
  statsSub: {
    fontSize: '12px',
    color: '#6b7280'
  },
  footer: {
    backgroundColor: 'white',
    borderTop: '1px solid #e5e7eb',
    padding: '16px 0'
  },
  footerContent: {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '0 24px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  footerText: {
    fontSize: '14px',
    color: '#6b7280'
  },
  statusIndicators: {
    display: 'flex',
    gap: '16px',
    alignItems: 'center'
  },
  statusItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px'
  },
  statusDot: {
    width: '8px',
    height: '8px',
    borderRadius: '50%'
  },
  statusDotGreen: {
    backgroundColor: '#10b981'
  },
  statusDotBlue: {
    backgroundColor: '#3b82f6'
  },
  statusText: {
    fontSize: '12px',
    color: '#6b7280'
  }
};

const CrispApp: React.FC = () => {
  const dispatch = useDispatch();
  const { candidates } = useSelector((state: RootState) => state.candidates);
  const [activeTab, setActiveTab] = useState<'interviewee' | 'interviewer'>('interviewee');

  const handleCandidateUpdate = (candidateId: string, updates: any) => {
    dispatch(updateCandidate({ id: candidateId, updates }));
  };

  const handleNewCandidate = (candidateData: any) => {
    // Check if candidate already exists (by email)
    const existingCandidate = candidates.find(c => c.email === candidateData.email);
    if (existingCandidate) {
      // Update existing candidate
      dispatch(updateCandidate({ id: existingCandidate.id, updates: candidateData }));
    } else {
      // Add new candidate with proper typing and required fields
      const now = new Date();
      const newCandidate = {
        ...candidateData,
        id: candidateData.id || `candidate_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        createdAt: candidateData.createdAt || now,
        startedAt: candidateData.startedAt || now,
        status: candidateData.status || 'pending'
      };
      dispatch(addCandidate(newCandidate));
    }
  };

  const TabButton: React.FC<{ 
    tab: 'interviewee' | 'interviewer';
    icon: React.ElementType;
    label: string;
  }> = ({ tab, icon: Icon, label }) => (
    <button
      onClick={() => setActiveTab(tab)}
      style={{
        ...styles.tabButton,
        ...(activeTab === tab ? styles.tabButtonActive : styles.tabButtonInactive)
      }}
      onMouseEnter={(e) => {
        if (activeTab !== tab) {
          (e.target as HTMLElement).style.backgroundColor = '#e5e7eb';
        }
      }}
      onMouseLeave={(e) => {
        if (activeTab !== tab) {
          (e.target as HTMLElement).style.backgroundColor = '#f3f4f6';
        }
      }}
    >
      <Icon style={{ width: '20px', height: '20px' }} />
      <span>{label}</span>
    </button>
  );

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <div style={styles.headerContent}>
          {/* Logo */}
          <div style={styles.logo}>
            <div style={styles.logoIcon}>
              <MessageSquare style={{ width: '20px', height: '20px', color: 'white' }} />
            </div>
            <h1 style={styles.logoText}>Connect AI</h1>
          </div>

          {/* Tab Navigation */}
          <div style={styles.tabContainer}>
            <TabButton
              tab="interviewee"
              icon={User}
              label="Interviewee"
            />
            <TabButton
              tab="interviewer"
              icon={Users}
              label="Interviewer"
            />
          </div>

          {/* Stats Badge */}
          <div style={styles.stats}>
            <div style={styles.statsText}>
              <div style={styles.statsMain}>
                {candidates.length} Candidates
              </div>
              <div style={styles.statsSub}>
                {candidates.filter(c => c.status === 'completed').length} Completed
              </div>
            </div>
            <Settings style={{ width: '20px', height: '20px', color: '#9ca3af' }} />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1">
        {activeTab === 'interviewee' ? (
          <WorkingIntervieweeTab
            onCandidateAdd={handleNewCandidate}
            onCandidateUpdate={handleCandidateUpdate}
          />
        ) : (
          <CrispInterviewerTab
            candidates={candidates}
          />
        )}
      </div>

      {/* Footer */}
      <div style={styles.footer}>
        <div style={styles.footerContent}>
          <p style={styles.footerText}>
            Connect AI - Interview Assistant
          </p>
          <div style={styles.statusIndicators}>
            <div style={styles.statusItem}>
              <div style={{...styles.statusDot, ...styles.statusDotGreen}}></div>
              <span style={styles.statusText}>Backend Connected</span>
            </div>
            <div style={styles.statusItem}>
              <div style={{...styles.statusDot, ...styles.statusDotBlue}}></div>
              <span style={styles.statusText}>AI Ready</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CrispApp;