import React, { useState } from 'react';
import { Users, Download, Eye, Clock, CheckCircle, User, Award, Brain } from 'lucide-react';

// Inline styles for guaranteed CSS loading
const interviewerStyles = {
  container: {
    minHeight: '100vh',
    backgroundColor: '#f8fafc',
    padding: '24px'
  },
  content: {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '0 16px'
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: '24px'
  },
  headerLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px'
  },
  headerIcon: {
    width: '40px',
    height: '40px',
    background: 'linear-gradient(to right, #2563eb, #9333ea)',
    borderRadius: '8px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  headerTitle: {
    fontSize: '24px',
    fontWeight: 'bold',
    color: '#111827',
    margin: 0
  },
  headerSubtitle: {
    color: '#6b7280',
    margin: 0
  },
  sortContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px'
  },
  select: {
    border: '1px solid #d1d5db',
    borderRadius: '8px',
    padding: '8px 12px',
    fontSize: '14px',
    outline: 'none',
    backgroundColor: 'white'
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
    gap: '16px',
    marginBottom: '24px'
  },
  statCard: {
    backgroundColor: 'white',
    borderRadius: '8px',
    padding: '16px',
    border: '1px solid #e5e7eb',
    boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)'
  },
  statCardContent: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  statText: {
    fontSize: '14px',
    color: '#6b7280',
    margin: '0 0 4px 0'
  },
  statNumber: {
    fontSize: '24px',
    fontWeight: 'bold',
    margin: 0
  },
  table: {
    backgroundColor: 'white',
    borderRadius: '8px',
    boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
    border: '1px solid #e5e7eb',
    overflow: 'hidden'
  },
  tableHeader: {
    padding: '16px 24px',
    borderBottom: '1px solid #e5e7eb'
  },
  tableTitle: {
    fontSize: '18px',
    fontWeight: '600',
    color: '#111827',
    margin: 0
  },
  tableContent: {
    overflowX: 'auto' as const
  },
  tableElement: {
    minWidth: '100%',
    borderCollapse: 'collapse' as const
  },
  th: {
    backgroundColor: '#f9fafb',
    padding: '12px 24px',
    textAlign: 'left' as const,
    fontSize: '12px',
    fontWeight: '500',
    color: '#6b7280',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.05em'
  },
  td: {
    padding: '16px 24px',
    borderTop: '1px solid #e5e7eb'
  },
  row: {
    backgroundColor: 'white'
  },
  rowHover: {
    backgroundColor: '#f9fafb'
  },
  candidateCell: {
    display: 'flex',
    alignItems: 'center'
  },
  avatar: {
    width: '32px',
    height: '32px',
    backgroundColor: '#e5e7eb',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: '12px'
  },
  candidateName: {
    fontSize: '14px',
    fontWeight: '500',
    color: '#111827',
    margin: 0
  },
  candidateEmail: {
    fontSize: '14px',
    color: '#6b7280',
    margin: 0
  },
  badge: {
    display: 'inline-flex',
    alignItems: 'center',
    padding: '4px 8px',
    borderRadius: '9999px',
    fontSize: '12px',
    fontWeight: '500'
  },
  button: {
    display: 'inline-flex',
    alignItems: 'center',
    padding: '6px 12px',
    border: '1px solid transparent',
    fontSize: '14px',
    fontWeight: '500',
    borderRadius: '6px',
    cursor: 'pointer',
    marginRight: '8px'
  },
  emptyState: {
    padding: '48px',
    textAlign: 'center' as const
  },
  emptyText: {
    color: '#6b7280',
    margin: '16px 0 0 0'
  },
  detailsContainer: {
    marginBottom: '24px'
  },
  backButton: {
    display: 'flex',
    alignItems: 'center',
    color: '#2563eb',
    textDecoration: 'none',
    cursor: 'pointer',
    marginBottom: '24px'
  },
  candidateHeader: {
    backgroundColor: 'white',
    borderRadius: '8px',
    boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
    border: '1px solid #e5e7eb',
    padding: '24px'
  },
  candidateHeaderContent: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  candidateInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px'
  },
  candidateAvatar: {
    width: '64px',
    height: '64px',
    backgroundColor: '#e5e7eb',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  candidateDetails: {
    margin: 0
  },
  candidateTitle: {
    fontSize: '24px',
    fontWeight: 'bold',
    color: '#111827',
    margin: '0 0 4px 0'
  },
  candidateContact: {
    color: '#6b7280',
    margin: '2px 0'
  }
};

import type { Candidate } from '../types';

interface StyledCrispInterviewerTabProps {
  candidates: Candidate[];
}

const StyledCrispInterviewerTab: React.FC<StyledCrispInterviewerTabProps> = ({
  candidates
}) => {
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);
  const [sortBy, setSortBy] = useState<'score' | 'date' | 'name'>('score');

  // Sort candidates
  const sortedCandidates = [...candidates].sort((a, b) => {
    switch (sortBy) {
      case 'score':
        return (b.finalScore || 0) - (a.finalScore || 0);
      case 'date':
        return new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime();
      case 'name':
        return a.name.localeCompare(b.name);
      default:
        return 0;
    }
  });

  const handleDownloadPDF = async (candidate: Candidate) => {
    try {
      // Generate a simple text report instead of PDF for now
      const reportContent = `
INTERVIEW REPORT
================

Candidate: ${candidate.name}
Email: ${candidate.email}
Phone: ${candidate.phone}
Position: ${candidate.position || 'Not specified'}
Date: ${new Date(candidate.startedAt).toLocaleDateString()}
Status: ${candidate.status}
Final Score: ${candidate.finalScore || 0}%

Responses:
${candidate.responses?.map((r: any, i: number) => `
Question ${i + 1}: ${r.question}
Answer: ${r.answer}
Score: ${r.score || 0}/100
Time Used: ${r.timeUsed || 0}s
${r.feedback ? `Feedback: ${r.feedback}` : ''}
`).join('\n') || 'No responses recorded'}

Summary: ${candidate.summary || candidate.finalReport?.aiSummary || 'No summary available'}
      `.trim();

      const blob = new Blob([reportContent], { type: 'text/plain' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Interview_Report_${candidate.name.replace(/\s+/g, '_')}.txt`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading report:', error);
      alert('Error generating report');
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      uploading: { color: '#f59e0b', bgColor: '#fef3c7', text: 'Uploading' },
      interviewing: { color: '#3b82f6', bgColor: '#dbeafe', text: 'In Progress' },
      completed: { color: '#10b981', bgColor: '#d1fae5', text: 'Completed' },
      terminated: { color: '#ef4444', bgColor: '#fee2e2', text: 'Terminated' }
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.uploading;
    
    return (
      <span style={{
        ...interviewerStyles.badge,
        color: config.color,
        backgroundColor: config.bgColor
      }}>
        {config.text}
      </span>
    );
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return '#10b981';
    if (score >= 60) return '#f59e0b';
    return '#ef4444';
  };

  const renderCandidateList = () => (
    <div style={interviewerStyles.content}>
      {/* Header */}
      <div style={interviewerStyles.header}>
        <div style={interviewerStyles.headerLeft}>
          <div style={interviewerStyles.headerIcon}>
            <Users style={{ width: '24px', height: '24px', color: 'white' }} />
          </div>
          <div>
            <h2 style={interviewerStyles.headerTitle}>Interviewer Dashboard</h2>
            <p style={interviewerStyles.headerSubtitle}>Monitor and review candidate interviews</p>
          </div>
        </div>
        
        {/* Sort Options */}
        <div style={interviewerStyles.sortContainer}>
          <span style={{ fontSize: '14px', color: '#6b7280' }}>Sort by:</span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            style={interviewerStyles.select}
          >
            <option value="score">Score (High to Low)</option>
            <option value="date">Date (Recent First)</option>
            <option value="name">Name (A-Z)</option>
          </select>
        </div>
      </div>

      {/* Stats Cards */}
      <div style={interviewerStyles.statsGrid}>
        <div style={interviewerStyles.statCard}>
          <div style={interviewerStyles.statCardContent}>
            <div>
              <p style={interviewerStyles.statText}>Total Candidates</p>
              <p style={{ ...interviewerStyles.statNumber, color: '#111827' }}>{candidates.length}</p>
            </div>
            <Users style={{ width: '32px', height: '32px', color: '#3b82f6' }} />
          </div>
        </div>
        
        <div style={interviewerStyles.statCard}>
          <div style={interviewerStyles.statCardContent}>
            <div>
              <p style={interviewerStyles.statText}>Completed</p>
              <p style={{ ...interviewerStyles.statNumber, color: '#10b981' }}>
                {candidates.filter(c => c.status === 'completed').length}
              </p>
            </div>
            <CheckCircle style={{ width: '32px', height: '32px', color: '#10b981' }} />
          </div>
        </div>
        
        <div style={interviewerStyles.statCard}>
          <div style={interviewerStyles.statCardContent}>
            <div>
              <p style={interviewerStyles.statText}>In Progress</p>
              <p style={{ ...interviewerStyles.statNumber, color: '#3b82f6' }}>
                {candidates.filter(c => c.status === 'interviewing').length}
              </p>
            </div>
            <Clock style={{ width: '32px', height: '32px', color: '#3b82f6' }} />
          </div>
        </div>
        
        <div style={interviewerStyles.statCard}>
          <div style={interviewerStyles.statCardContent}>
            <div>
              <p style={interviewerStyles.statText}>Avg Score</p>
              <p style={{ ...interviewerStyles.statNumber, color: '#9333ea' }}>
                {candidates.length > 0 
                  ? Math.round(candidates.filter(c => c.finalScore).reduce((sum, c) => sum + (c.finalScore || 0), 0) / candidates.filter(c => c.finalScore).length || 0)
                  : 0}%
              </p>
            </div>
            <Award style={{ width: '32px', height: '32px', color: '#9333ea' }} />
          </div>
        </div>
      </div>

      {/* Candidates Table */}
      <div style={interviewerStyles.table}>
        <div style={interviewerStyles.tableHeader}>
          <h3 style={interviewerStyles.tableTitle}>All Candidates</h3>
        </div>
        
        {candidates.length === 0 ? (
          <div style={interviewerStyles.emptyState}>
            <Users style={{ width: '48px', height: '48px', color: '#9ca3af', margin: '0 auto' }} />
            <p style={interviewerStyles.emptyText}>No candidates yet. Candidates will appear here after they start interviews.</p>
          </div>
        ) : (
          <div style={interviewerStyles.tableContent}>
            <table style={interviewerStyles.tableElement}>
              <thead>
                <tr>
                  <th style={interviewerStyles.th}>Candidate</th>
                  <th style={interviewerStyles.th}>Status</th>
                  <th style={interviewerStyles.th}>Score</th>
                  <th style={interviewerStyles.th}>Date</th>
                  <th style={interviewerStyles.th}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {sortedCandidates.map((candidate) => (
                  <tr 
                    key={candidate.id} 
                    style={interviewerStyles.row}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLElement).style.backgroundColor = '#f9fafb';
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLElement).style.backgroundColor = 'white';
                    }}
                  >
                    <td style={interviewerStyles.td}>
                      <div style={interviewerStyles.candidateCell}>
                        <div style={interviewerStyles.avatar}>
                          <User style={{ width: '16px', height: '16px', color: '#6b7280' }} />
                        </div>
                        <div>
                          <div style={interviewerStyles.candidateName}>{candidate.name}</div>
                          <div style={interviewerStyles.candidateEmail}>{candidate.email}</div>
                        </div>
                      </div>
                    </td>
                    <td style={interviewerStyles.td}>
                      {getStatusBadge(candidate.status)}
                    </td>
                    <td style={interviewerStyles.td}>
                      {candidate.finalScore ? (
                        <span style={{
                          fontSize: '18px',
                          fontWeight: 'bold',
                          color: getScoreColor(candidate.finalScore)
                        }}>
                          {candidate.finalScore}%
                        </span>
                      ) : (
                        <span style={{ color: '#9ca3af' }}>-</span>
                      )}
                    </td>
                    <td style={interviewerStyles.td}>
                      <span style={{ fontSize: '14px', color: '#6b7280' }}>
                        {new Date(candidate.startedAt).toLocaleDateString()}
                      </span>
                    </td>
                    <td style={interviewerStyles.td}>
                      <button
                        onClick={() => setSelectedCandidate(candidate)}
                        style={{
                          ...interviewerStyles.button,
                          color: '#2563eb',
                          backgroundColor: '#dbeafe'
                        }}
                        onMouseEnter={(e) => {
                          (e.target as HTMLElement).style.backgroundColor = '#bfdbfe';
                        }}
                        onMouseLeave={(e) => {
                          (e.target as HTMLElement).style.backgroundColor = '#dbeafe';
                        }}
                      >
                        <Eye style={{ width: '16px', height: '16px', marginRight: '4px' }} />
                        View Details
                      </button>
                      {candidate.status === 'completed' && (
                        <button
                          onClick={() => handleDownloadPDF(candidate)}
                          style={{
                            ...interviewerStyles.button,
                            color: '#10b981',
                            backgroundColor: '#d1fae5'
                          }}
                          onMouseEnter={(e) => {
                            (e.target as HTMLElement).style.backgroundColor = '#a7f3d0';
                          }}
                          onMouseLeave={(e) => {
                            (e.target as HTMLElement).style.backgroundColor = '#d1fae5';
                          }}
                        >
                          <Download style={{ width: '16px', height: '16px', marginRight: '4px' }} />
                          PDF Report
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );

  const renderCandidateDetails = () => (
    <div style={interviewerStyles.content}>
      {/* Back Button */}
      <div 
        style={interviewerStyles.backButton}
        onClick={() => setSelectedCandidate(null)}
      >
        ← Back to Candidates
      </div>
      
      {/* Candidate Header */}
      <div style={interviewerStyles.candidateHeader}>
        <div style={interviewerStyles.candidateHeaderContent}>
          <div style={interviewerStyles.candidateInfo}>
            <div style={interviewerStyles.candidateAvatar}>
              <User style={{ width: '32px', height: '32px', color: '#6b7280' }} />
            </div>
            <div style={interviewerStyles.candidateDetails}>
              <h2 style={interviewerStyles.candidateTitle}>{selectedCandidate?.name}</h2>
              <p style={interviewerStyles.candidateContact}>{selectedCandidate?.email}</p>
              <p style={interviewerStyles.candidateContact}>{selectedCandidate?.phone}</p>
            </div>
          </div>
          
          <div style={{ textAlign: 'right' as const }}>
            {getStatusBadge(selectedCandidate?.status || 'uploading')}
            {selectedCandidate?.finalScore && (
              <div style={{ marginTop: '8px' }}>
                <span style={{
                  fontSize: '32px',
                  fontWeight: 'bold',
                  color: getScoreColor(selectedCandidate.finalScore)
                }}>
                  {selectedCandidate.finalScore}%
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Violations (if any) */}
      {selectedCandidate?.violations && selectedCandidate.violations.length > 0 && (
        <div style={{
          backgroundColor: '#fef2f2',
          border: '1px solid #fecaca',
          borderRadius: '8px',
          padding: '16px',
          margin: '24px 0'
        }}>
          <h3 style={{
            fontSize: '18px',
            fontWeight: '600',
            color: '#dc2626',
            margin: '0 0 12px 0'
          }}>
            ⚠️ Interview Violations
          </h3>
          <div>
            {selectedCandidate.violations.map((violation: any, index: number) => (
              <div key={index} style={{
                fontSize: '14px',
                color: '#dc2626',
                margin: '4px 0'
              }}>
                • {violation.type === 'fullscreen_exit' ? 'Exited fullscreen mode' : 
                   violation.type === 'tab_change' ? 'Switched tabs/windows' : 
                   'Lost window focus'} at Question {violation.questionNumber}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* AI Summary */}
      {selectedCandidate?.finalReport?.aiSummary && (
        <div style={{
          backgroundColor: '#eff6ff',
          border: '1px solid: #bfdbfe',
          borderRadius: '8px',
          padding: '24px',
          margin: '24px 0'
        }}>
          <h3 style={{
            fontSize: '18px',
            fontWeight: '600',
            color: '#1d4ed8',
            margin: '0 0 12px 0',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <Brain style={{ width: '20px', height: '20px' }} />
            AI Assessment Summary
          </h3>
          <p style={{ color: '#1d4ed8', margin: 0 }}>{selectedCandidate.finalReport.aiSummary}</p>
        </div>
      )}

      {/* Download PDF Button */}
      {selectedCandidate?.status === 'completed' && (
        <div style={{ textAlign: 'center', margin: '24px 0' }}>
          <button
            onClick={() => handleDownloadPDF(selectedCandidate)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              padding: '12px 24px',
              border: 'none',
              fontSize: '16px',
              fontWeight: '500',
              borderRadius: '8px',
              color: 'white',
              backgroundColor: '#10b981',
              cursor: 'pointer'
            }}
            onMouseEnter={(e) => {
              (e.target as HTMLElement).style.backgroundColor = '#059669';
            }}
            onMouseLeave={(e) => {
              (e.target as HTMLElement).style.backgroundColor = '#10b981';
            }}
          >
            <Download style={{ width: '20px', height: '20px', marginRight: '8px' }} />
            Download Complete PDF Report
          </button>
        </div>
      )}
    </div>
  );

  return (
    <div style={interviewerStyles.container}>
      {selectedCandidate ? renderCandidateDetails() : renderCandidateList()}
    </div>
  );
};

export default StyledCrispInterviewerTab;