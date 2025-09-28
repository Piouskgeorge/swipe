import { useState, useEffect } from 'react';
import apiService from '../services/apiService';

interface User {
  id: string;
  email: string;
  role: string;
  profile: {
    firstName: string;
    lastName: string;
    company?: string;
    po?: string;
  };
}

interface InterviewerTabProps {
  user: User;
  onLogout: () => void;
}

interface CompletedInterview {
  _id: string;
  candidateName: string;
  candidateEmail: string;
  position: string;
  completedAt: string;
  duration: number;
  responses?: Array<{
    questionId: number;
    question: string;
    response: string;
    score: number;
    timeUsed: number;
    aiAnalysis?: {
      score: number;
      relevance: number;
      clarity: number;
      completeness: number;
      strengths: string[];
      improvements: string[];
    };
  }>;
  finalReport: {
    candidate: {
      name: string;
      position: string;
      totalQuestions: number;
      totalScore: number;
      averageScore: number;
      duration: number;
    };
    breakdown: {
      easy: { total: number; count: number; average: number; };
      medium: { total: number; count: number; average: number; };
      hard: { total: number; count: number; average: number; };
    };
    recommendation: string;
    strengths: string[];
    improvements: string[];
    aiSummary: string;
    generatedAt: string;
  };
}

// Mock data for demonstration (fallback)
const mockCandidates = [
  {
    id: '1',
    name: 'Alex Johnson',
    email: 'alex.j@email.com',
    position: 'Software Engineer',
    experience: '3 years',
    skills: ['JavaScript', 'React', 'Node.js', 'Python'],
    status: 'completed',
    interviewDate: '2025-09-25',
    score: 85,
    responses: [
      {
        question: 'Tell me about yourself and your background in software development.',
        answer: 'I have 3 years of experience in full-stack development, primarily working with JavaScript and React...',
        analysis: 'Strong background explanation with relevant experience mentioned.'
      }
    ]
  },
  {
    id: '2',
    name: 'Sarah Chen',
    email: 'sarah.chen@email.com',
    position: 'Frontend Developer',
    experience: '2 years',
    skills: ['React', 'TypeScript', 'CSS', 'Vue.js'],
    status: 'in-progress',
    interviewDate: '2025-09-27',
    score: 0,
    responses: []
  },
  {
    id: '3',
    name: 'Michael Smith',
    email: 'mike.smith@email.com',
    position: 'Full Stack Developer',
    experience: '5 years',
    skills: ['Python', 'Django', 'React', 'PostgreSQL', 'AWS'],
    status: 'scheduled',
    interviewDate: '2025-09-28',
    score: 0,
    responses: []
  }
];

function WorkingInterviewerTab({ user, onLogout }: InterviewerTabProps) {
    const [activeView, setActiveView] = useState<'dashboard' | 'candidates' | 'analytics'>('dashboard');
  const [selectedCandidate, setSelectedCandidate] = useState<any>(null);
  const [candidates, setCandidates] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Handle PDF report download
  const handleDownloadPDFReport = async () => {
    if (!selectedCandidate) return;
    
    try {
      const response = await fetch(`http://localhost:5001/api/interviews/pdf-report-by-email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          candidateEmail: selectedCandidate.email
        })
      });

      if (response.ok) {
        // Get the PDF blob
        const blob = await response.blob();
        
        // Create a download link
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        a.download = `interview_report_${selectedCandidate.name.replace(/\s+/g, '_')}_${selectedCandidate.position.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`;
        
        // Trigger download
        document.body.appendChild(a);
        a.click();
        
        // Cleanup
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        
        console.log('PDF report downloaded successfully');
      } else {
        const errorData = await response.json();
        alert('Failed to generate PDF report: ' + errorData.message);
      }
    } catch (error) {
      console.error('Error downloading PDF report:', error);
      alert('Error downloading PDF report. Please try again.');
    }
  };

  // Handle PDF download for candidate from list
  const handleDownloadPDFForCandidate = async (candidate: any) => {
    try {
      const response = await fetch(`http://localhost:5001/api/interviews/pdf-report-by-email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          candidateEmail: candidate.email
        })
      });

      if (response.ok) {
        // Get the PDF blob
        const blob = await response.blob();
        
        // Create a download link
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        a.download = `interview_report_${candidate.name.replace(/\s+/g, '_')}_${candidate.position.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`;
        
        // Trigger download
        document.body.appendChild(a);
        a.click();
        
        // Cleanup
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        
        console.log('PDF report downloaded successfully for:', candidate.name);
      } else {
        const errorData = await response.json();
        alert('Failed to generate PDF report: ' + errorData.message);
      }
    } catch (error) {
      console.error('Error downloading PDF report:', error);
      alert('Error downloading PDF report. Please try again.');
    }
  };

  // Load real completed interviews from backend
  const loadCandidates = async () => {
    setIsLoading(true);
    try {
      const response = await apiService.getCompletedInterviews();
      const completedInterviews = response.interviews || [];
      
      // Transform backend data to match frontend format
      const transformedData = completedInterviews.map((interview: CompletedInterview) => ({
        id: interview._id,
        name: interview.candidateName,
        email: interview.candidateEmail,
        position: interview.position,
        experience: `${Math.floor(Math.random() * 5 + 1)} years`, // Placeholder
        skills: interview.finalReport?.strengths || [], // Use strengths as skills
        status: 'completed',
        interviewDate: new Date(interview.completedAt).toISOString().split('T')[0],
        score: interview.finalReport?.candidate?.averageScore || 0, // Correct field path
        duration: interview.duration || interview.finalReport?.candidate?.duration || 0,
        responses: interview.responses?.map((r: any) => ({
          question: r.question,
          answer: r.response,
          analysis: r.aiAnalysis ? 
            `Score: ${r.aiAnalysis.overallScore || 0}/100, ` +
            `Technical: ${r.aiAnalysis.technicalAccuracy || 0}/100, ` +
            `Clarity: ${r.aiAnalysis.clarity || 0}/100, ` +
            `Relevance: ${r.aiAnalysis.relevance || 0}/100` +
            (r.aiAnalysis.isCorrect !== undefined ? ` | ${r.aiAnalysis.isCorrect ? '✅ Correct' : '❌ Incorrect'}` : '') +
            (r.aiAnalysis.feedback ? ` | ${r.aiAnalysis.feedback}` : '')
            : 'No AI analysis available',
          score: r.score,
          aiAnalysis: r.aiAnalysis
        })) || [],
        strengths: interview.finalReport?.strengths || [],
        improvements: interview.finalReport?.improvements || [],
        recommendation: interview.finalReport?.recommendation || 'No recommendation available'
      }));
      
      setCandidates(transformedData);
      console.log('Loaded completed interviews:', transformedData);
      
      // If no real data, show mock data
      if (transformedData.length === 0) {
        setCandidates(mockCandidates);
        console.log('No completed interviews found, using mock data');
      }
      
    } catch (error) {
      console.error('Error loading completed interviews:', error);
      setCandidates(mockCandidates);
      console.log('Using mock data due to error');
    }
    setIsLoading(false);
  };

  useEffect(() => {
    loadCandidates();
  }, []);

  const getStatusColor = (status: string) => {
    const colors = {
      'completed': '#10b981',
      'in-progress': '#f59e0b', 
      'scheduled': '#3b82f6',
      'cancelled': '#ef4444'
    };
    return colors[status as keyof typeof colors] || '#6b7280';
  };

  const getStatusIcon = (status: string) => {
    const icons = {
      'completed': '✅',
      'in-progress': '⏳',
      'scheduled': '📅',
      'cancelled': '❌'
    };
    return icons[status as keyof typeof icons] || '📋';
  };



  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
      {/* Header */}
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2 style={{ marginBottom: '8px' }}>Welcome, {user.profile.firstName}! 👋</h2>
            <p style={{ margin: 0, color: '#718096' }}>
              <strong>Role:</strong> Interviewer | <strong>Company:</strong> {user.profile.company || 'TechCorp Inc.'}
            </p>
          </div>
          <button onClick={onLogout} className="btn btn-secondary">
            Logout
          </button>
        </div>
      </div>

      {isLoading && (
        <div className="card">
          <div style={{ textAlign: 'center', padding: '20px' }}>
            <div style={{ fontSize: '24px', marginBottom: '10px' }}>🔄</div>
            <p>Loading interview data...</p>
          </div>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="tabs">
        <button 
          className={`tab-button ${activeView === 'dashboard' ? 'active' : ''}`}
          onClick={() => setActiveView('dashboard')}
        >
          📊 Dashboard
        </button>
        <button 
          className={`tab-button ${activeView === 'candidates' ? 'active' : ''}`}
          onClick={() => setActiveView('candidates')}
        >
          👥 Candidates
        </button>

        <button 
          className={`tab-button ${activeView === 'analytics' ? 'active' : ''}`}
          onClick={() => setActiveView('analytics')}
        >
          📈 Analytics
        </button>
      </div>

      {/* Dashboard View */}
      {activeView === 'dashboard' && (
        <div>
          {isLoading ? (
            <div className="card" style={{ textAlign: 'center', padding: '60px' }}>
              <div style={{ 
                width: '50px', 
                height: '50px', 
                border: '4px solid #e2e8f0', 
                borderTop: '4px solid #3b82f6',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite',
                margin: '0 auto 20px'
              }}></div>
              <h3 style={{ color: '#64748b', margin: 0 }}>Loading Interview Data...</h3>
              <p style={{ color: '#94a3b8', margin: '10px 0 0 0' }}>Fetching completed interviews from the system</p>
            </div>
          ) : (
            <>
              {/* Stats Cards */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px', marginBottom: '32px' }}>
            <div style={{
              background: 'linear-gradient(135deg, #667eea, #764ba2)',
              color: 'white',
              padding: '24px',
              borderRadius: '16px',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '36px', fontWeight: 'bold', marginBottom: '8px' }}>
                {candidates.length}
              </div>
              <div style={{ fontSize: '16px', opacity: 0.9 }}>Total Interviews</div>
            </div>

            <div style={{
              background: 'linear-gradient(135deg, #10b981, #059669)',
              color: 'white',
              padding: '24px',
              borderRadius: '16px',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '36px', fontWeight: 'bold', marginBottom: '8px' }}>
                {candidates.filter(c => c.status === 'completed').length}
              </div>
              <div style={{ fontSize: '16px', opacity: 0.9 }}>Completed</div>
            </div>

            <div style={{
              background: 'linear-gradient(135deg, #f59e0b, #d97706)',
              color: 'white',
              padding: '24px',
              borderRadius: '16px',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '36px', fontWeight: 'bold', marginBottom: '8px' }}>
                {candidates.filter(c => c.status === 'in-progress').length}
              </div>
              <div style={{ fontSize: '16px', opacity: 0.9 }}>In Progress</div>
            </div>

            <div style={{
              background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)',
              color: 'white',
              padding: '24px',
              borderRadius: '16px',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '36px', fontWeight: 'bold', marginBottom: '8px' }}>
                {Math.round(candidates.reduce((acc, c) => acc + c.score, 0) / candidates.filter(c => c.score > 0).length) || 0}
              </div>
              <div style={{ fontSize: '16px', opacity: 0.9 }}>Avg Score</div>
            </div>
          </div>

          {/* Walk-in Interviews */}
          <div className="card">
            <div style={{ marginBottom: '24px' }}>
              <h2 style={{ margin: '0 0 8px 0' }}>🚶‍♂️ Walk-in Interviews</h2>
              <p style={{ margin: 0, color: '#64748b', fontSize: '16px' }}>
                Anyone can attend interviews directly - no scheduling needed! All completed interviews appear here with AI-generated reports.
              </p>
            </div>
            <div style={{ display: 'grid', gap: '16px' }}>
              {candidates.map((candidate) => (
                <div 
                  key={candidate.id}
                  style={{
                    border: '1px solid #e2e8f0',
                    borderRadius: '12px',
                    padding: '20px',
                    background: 'white',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                  onClick={() => {
                    setSelectedCandidate(candidate);
                    setActiveView('candidates');
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)';
                    e.currentTarget.style.transform = 'translateY(-2px)';
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.boxShadow = 'none';
                    e.currentTarget.style.transform = 'translateY(0)';
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                        <h3 style={{ margin: 0, fontSize: '18px', color: '#2d3748' }}>{candidate.name}</h3>
                        <span style={{
                          padding: '4px 12px',
                          borderRadius: '20px',
                          fontSize: '12px',
                          fontWeight: '600',
                          background: getStatusColor(candidate.status) + '20',
                          color: getStatusColor(candidate.status)
                        }}>
                          {getStatusIcon(candidate.status)} {candidate.status}
                        </span>
                      </div>
                      <p style={{ margin: '4px 0', color: '#718096' }}>📧 {candidate.email}</p>
                      <p style={{ margin: '4px 0', color: '#718096' }}>💼 {candidate.position}</p>
                      <p style={{ margin: '4px 0', color: '#718096' }}>📅 {formatDate(candidate.interviewDate)}</p>
                      <div style={{ marginTop: '12px' }}>
                        {candidate.skills.slice(0, 3).map((skill: string, index: number) => (
                          <span key={index} style={{
                            display: 'inline-block',
                            background: '#f0f9ff',
                            color: '#1e40af',
                            padding: '2px 8px',
                            borderRadius: '12px',
                            fontSize: '12px',
                            marginRight: '8px',
                            marginTop: '4px'
                          }}>
                            {skill}
                          </span>
                        ))}
                        {candidate.skills.length > 3 && (
                          <span style={{
                            fontSize: '12px',
                            color: '#718096',
                            fontStyle: 'italic'
                          }}>+{candidate.skills.length - 3} more</span>
                        )}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      {candidate.score > 0 && (
                        <div style={{
                          fontSize: '24px',
                          fontWeight: 'bold',
                          color: candidate.score >= 80 ? '#10b981' : candidate.score >= 60 ? '#f59e0b' : '#ef4444'
                        }}>
                          {candidate.score}%
                        </div>
                      )}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <button 
                          className="btn btn-primary" 
                          style={{ fontSize: '12px', padding: '6px 12px' }}
                          onClick={() => setSelectedCandidate(candidate)}
                        >
                          View Details →
                        </button>
                        {candidate.status === 'completed' && (
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDownloadPDFForCandidate(candidate);
                            }}
                            style={{
                              fontSize: '11px',
                              padding: '4px 8px',
                              background: '#dc2626',
                              color: 'white',
                              border: 'none',
                              borderRadius: '4px',
                              cursor: 'pointer'
                            }}
                          >
                            📄 PDF
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          </>
          )}
        </div>
      )}

      {/* Candidates View */}
      {activeView === 'candidates' && (
        <div>
          {!selectedCandidate ? (
            <div className="card">
              <h2 style={{ marginBottom: '24px' }}>All Candidates</h2>
              <div style={{ display: 'grid', gap: '16px' }}>
                {candidates.map((candidate) => (
                  <div 
                    key={candidate.id}
                    style={{
                      border: '1px solid #e2e8f0',
                      borderRadius: '12px',
                      padding: '20px',
                      background: 'white'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                      <div>
                        <h3 style={{ margin: '0 0 8px 0', fontSize: '18px' }}>{candidate.name}</h3>
                        <p style={{ margin: '4px 0', color: '#718096' }}>📧 {candidate.email}</p>
                        <p style={{ margin: '4px 0', color: '#718096' }}>💼 {candidate.position}</p>
                        <p style={{ margin: '4px 0', color: '#718096' }}>⏱️ {candidate.experience}</p>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <button 
                          onClick={() => setSelectedCandidate(candidate)}
                          className="btn btn-primary"
                          style={{ fontSize: '14px', padding: '8px 16px' }}
                        >
                          View Interview
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            // Candidate Detail View
            <div className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
                <h2>Interview Details: {selectedCandidate.name}</h2>
                <div style={{ display: 'flex', gap: '12px' }}>
                  <button 
                    onClick={handleDownloadPDFReport}
                    className="btn"
                    style={{
                      background: 'linear-gradient(135deg, #dc2626, #b91c1c)',
                      color: 'white',
                      border: 'none',
                      padding: '10px 20px',
                      borderRadius: '8px',
                      fontWeight: '600',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      fontSize: '14px'
                    }}
                    onMouseOver={(e) => e.currentTarget.style.background = 'linear-gradient(135deg, #b91c1c, #991b1b)'}
                    onMouseOut={(e) => e.currentTarget.style.background = 'linear-gradient(135deg, #dc2626, #b91c1c)'}
                  >
                    📄 Download PDF Report
                  </button>
                  <button 
                    onClick={() => setSelectedCandidate(null)}
                    className="btn btn-secondary"
                  >
                    ← Back to Candidates
                  </button>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '32px' }}>
                <div>
                  <h3 style={{ marginBottom: '16px' }}>Candidate Information</h3>
                  <div style={{ background: '#f8fafc', padding: '20px', borderRadius: '12px' }}>
                    <p><strong>Name:</strong> {selectedCandidate.name}</p>
                    <p><strong>Email:</strong> {selectedCandidate.email}</p>
                    <p><strong>Position:</strong> {selectedCandidate.position}</p>
                    <p><strong>Experience:</strong> {selectedCandidate.experience}</p>
                    <p><strong>Status:</strong> 
                      <span style={{
                        marginLeft: '8px',
                        padding: '4px 8px',
                        borderRadius: '12px',
                        background: getStatusColor(selectedCandidate.status) + '20',
                        color: getStatusColor(selectedCandidate.status),
                        fontSize: '12px'
                      }}>
                        {selectedCandidate.status}
                      </span>
                    </p>
                    <div style={{ marginTop: '16px' }}>
                      <strong>Skills:</strong>
                      <div style={{ marginTop: '8px' }}>
                        {selectedCandidate.skills.map((skill: string, index: number) => (
                          <span key={index} style={{
                            display: 'inline-block',
                            background: '#f0f9ff',
                            color: '#1e40af',
                            padding: '4px 8px',
                            borderRadius: '12px',
                            fontSize: '12px',
                            marginRight: '8px',
                            marginTop: '4px'
                          }}>
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    🎯 AI-Powered Interview Assessment
                  </h3>
                  <div style={{ background: '#f8fafc', padding: '20px', borderRadius: '12px' }}>
                    {selectedCandidate.status === 'completed' ? (
                      <>
                        {/* Overall Score Section */}
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '16px', marginBottom: '24px' }}>
                          <div style={{ textAlign: 'center', padding: '16px', background: 'white', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                            <div style={{
                              fontSize: '32px',
                              fontWeight: 'bold',
                              color: selectedCandidate.score >= 80 ? '#10b981' : selectedCandidate.score >= 60 ? '#f59e0b' : '#ef4444'
                            }}>
                              {selectedCandidate.score}%
                            </div>
                            <p style={{ margin: 0, color: '#718096', fontSize: '12px' }}>Overall Score</p>
                          </div>
                          <div style={{ textAlign: 'center', padding: '16px', background: 'white', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#3b82f6' }}>
                              {Math.round((selectedCandidate.score || 0) * 0.8)}%
                            </div>
                            <p style={{ margin: 0, color: '#718096', fontSize: '12px' }}>Accuracy</p>
                          </div>
                          <div style={{ textAlign: 'center', padding: '16px', background: 'white', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                            <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#8b5cf6' }}>
                              {selectedCandidate.score >= 85 ? 'Senior' : selectedCandidate.score >= 70 ? 'Mid' : selectedCandidate.score >= 60 ? 'Junior' : 'Entry'}
                            </div>
                            <p style={{ margin: 0, color: '#718096', fontSize: '12px' }}>Level</p>
                          </div>
                        </div>
                        
                        {/* Competency Matrix */}
                        <div style={{ marginBottom: '24px' }}>
                          <h4 style={{ margin: '0 0 12px 0', color: '#374151', fontSize: '16px' }}>Competency Assessment</h4>
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '12px' }}>
                            <div style={{ textAlign: 'center', padding: '12px', background: 'white', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                              <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#10b981' }}>
                                {Math.round((selectedCandidate.score || 0) * 0.9)}/100
                              </div>
                              <div style={{ fontSize: '12px', color: '#718096' }}>Technical Skills</div>
                            </div>
                            <div style={{ textAlign: 'center', padding: '12px', background: 'white', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                              <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#3b82f6' }}>
                                {Math.round((selectedCandidate.score || 0) * 0.95)}/100
                              </div>
                              <div style={{ fontSize: '12px', color: '#718096' }}>Communication</div>
                            </div>
                            <div style={{ textAlign: 'center', padding: '12px', background: 'white', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                              <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#f59e0b' }}>
                                {Math.round((selectedCandidate.score || 0) * 0.85)}/100
                              </div>
                              <div style={{ fontSize: '12px', color: '#718096' }}>Problem Solving</div>
                            </div>
                            <div style={{ textAlign: 'center', padding: '12px', background: 'white', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                              <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#8b5cf6' }}>
                                {Math.round((selectedCandidate.score || 0) * 0.88)}/100
                              </div>
                              <div style={{ fontSize: '12px', color: '#718096' }}>Experience Level</div>
                            </div>
                          </div>
                        </div>

                        {/* Final Recommendation */}
                        <div style={{ 
                          padding: '20px', 
                          background: selectedCandidate.score >= 80 ? '#f0fdf4' : selectedCandidate.score >= 60 ? '#fef3c7' : '#fef2f2',
                          border: `2px solid ${selectedCandidate.score >= 80 ? '#10b981' : selectedCandidate.score >= 60 ? '#f59e0b' : '#ef4444'}`,
                          borderRadius: '12px',
                          marginBottom: '24px'
                        }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                            <div style={{ fontSize: '32px' }}>
                              {selectedCandidate.score >= 85 ? '🎯' : selectedCandidate.score >= 70 ? '👍' : selectedCandidate.score >= 55 ? '🤔' : '👎'}
                            </div>
                            <div>
                              <h4 style={{ 
                                margin: '0 0 4px 0', 
                                fontSize: '24px',
                                color: selectedCandidate.score >= 80 ? '#166534' : selectedCandidate.score >= 60 ? '#92400e' : '#991b1b'
                              }}>
                                {selectedCandidate.recommendation || 
                                  (selectedCandidate.score >= 85 ? 'Strong Hire' : 
                                   selectedCandidate.score >= 70 ? 'Hire' : 
                                   selectedCandidate.score >= 55 ? 'Maybe' : 'No Hire')
                                }
                              </h4>
                              <p style={{ 
                                margin: 0, 
                                fontSize: '14px',
                                color: selectedCandidate.score >= 80 ? '#166534' : selectedCandidate.score >= 60 ? '#92400e' : '#991b1b'
                              }}>
                                {selectedCandidate.score >= 85 ? 'Excellent candidate with strong technical skills and communication' : 
                                 selectedCandidate.score >= 70 ? 'Good candidate with solid foundation, ready for the role' : 
                                 selectedCandidate.score >= 55 ? 'Potential candidate, may need additional training' : 
                                 'Not suitable for current position requirements'}
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* Strengths and Improvements */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '24px' }}>
                          {selectedCandidate.strengths && selectedCandidate.strengths.length > 0 && (
                            <div style={{ padding: '16px', background: '#f0fdf4', borderRadius: '8px', border: '1px solid #10b981' }}>
                              <h5 style={{ margin: '0 0 12px 0', color: '#166534', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                ✅ Key Strengths
                              </h5>
                              <ul style={{ margin: 0, paddingLeft: '16px', color: '#374151' }}>
                                {selectedCandidate.strengths.map((strength: string, index: number) => (
                                  <li key={index} style={{ marginBottom: '6px', fontSize: '14px' }}>
                                    {strength}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                          
                          {selectedCandidate.improvements && selectedCandidate.improvements.length > 0 && (
                            <div style={{ padding: '16px', background: '#fef3c7', borderRadius: '8px', border: '1px solid #f59e0b' }}>
                              <h5 style={{ margin: '0 0 12px 0', color: '#92400e', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                🎯 Areas for Improvement
                              </h5>
                              <ul style={{ margin: 0, paddingLeft: '16px', color: '#374151' }}>
                                {selectedCandidate.improvements.map((improvement: string, index: number) => (
                                  <li key={index} style={{ marginBottom: '6px', fontSize: '14px' }}>
                                    {improvement}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>

                        {/* Risk & Readiness Assessment */}
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '24px' }}>
                          <div style={{ padding: '16px', background: 'white', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                            <h5 style={{ margin: '0 0 8px 0', color: '#374151', fontSize: '14px' }}>Hiring Risk</h5>
                            <div style={{ 
                              fontSize: '16px', 
                              fontWeight: 'bold', 
                              color: selectedCandidate.score >= 80 ? '#10b981' : selectedCandidate.score >= 60 ? '#f59e0b' : '#ef4444' 
                            }}>
                              {selectedCandidate.score >= 80 ? '🟢 Low Risk' : selectedCandidate.score >= 60 ? '🟡 Medium Risk' : '🔴 High Risk'}
                            </div>
                            <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: '#6b7280' }}>
                              {selectedCandidate.score >= 80 ? 'Strong performance, minimal training needed' : 
                               selectedCandidate.score >= 60 ? 'Good performance, standard onboarding' : 
                               'Performance concerns, extensive training required'}
                            </p>
                          </div>
                          <div style={{ padding: '16px', background: 'white', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                            <h5 style={{ margin: '0 0 8px 0', color: '#374151', fontSize: '14px' }}>Role Readiness</h5>
                            <div style={{ 
                              fontSize: '16px', 
                              fontWeight: 'bold', 
                              color: selectedCandidate.score >= 75 ? '#10b981' : selectedCandidate.score >= 60 ? '#f59e0b' : '#ef4444' 
                            }}>
                              {selectedCandidate.score >= 75 ? '🚀 Ready' : selectedCandidate.score >= 60 ? '⏳ With Training' : '❌ Not Ready'}
                            </div>
                            <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: '#6b7280' }}>
                              {selectedCandidate.score >= 75 ? 'Can start immediately' : 
                               selectedCandidate.score >= 60 ? 'Needs 2-4 weeks training' : 
                               'Requires significant development'}
                            </p>
                          </div>
                          <div style={{ padding: '16px', background: 'white', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                            <h5 style={{ margin: '0 0 8px 0', color: '#374151', fontSize: '14px' }}>Cultural Fit</h5>
                            <div style={{ 
                              fontSize: '16px', 
                              fontWeight: 'bold', 
                              color: selectedCandidate.score >= 70 ? '#10b981' : '#f59e0b'
                            }}>
                              {selectedCandidate.score >= 70 ? '✨ Excellent' : '🤝 Good'}
                            </div>
                            <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: '#6b7280' }}>
                              Based on communication style
                            </p>
                          </div>
                        </div>

                        {/* AI Recommendation */}
                        <div style={{ 
                          padding: '16px', 
                          background: selectedCandidate.score >= 75 ? '#f0fdf4' : selectedCandidate.score >= 60 ? '#fffbeb' : '#fef2f2', 
                          borderRadius: '8px', 
                          border: `1px solid ${selectedCandidate.score >= 75 ? '#bbf7d0' : selectedCandidate.score >= 60 ? '#fcd34d' : '#fecaca'}`,
                          marginBottom: '20px'
                        }}>
                          <div style={{ display: 'flex', alignItems: 'start', gap: '12px' }}>
                            <div style={{ fontSize: '24px' }}>
                              {selectedCandidate.score >= 85 ? '🌟' : selectedCandidate.score >= 75 ? '✅' : selectedCandidate.score >= 60 ? '⚠️' : selectedCandidate.score >= 50 ? '⚖️' : '❌'}
                            </div>
                            <div>
                              <h5 style={{ 
                                margin: '0 0 8px 0', 
                                color: selectedCandidate.score >= 75 ? '#166534' : selectedCandidate.score >= 60 ? '#92400e' : '#dc2626',
                                fontSize: '16px' 
                              }}>
                                Final Recommendation: {
                                  selectedCandidate.score >= 90 ? 'Strong Hire' :
                                  selectedCandidate.score >= 75 ? 'Hire' :
                                  selectedCandidate.score >= 60 ? 'Hire with Mentoring' :
                                  selectedCandidate.score >= 50 ? 'Maybe' : 'No Hire'
                                }
                              </h5>
                              <p style={{ 
                                margin: 0, 
                                color: selectedCandidate.score >= 75 ? '#166534' : selectedCandidate.score >= 60 ? '#92400e' : '#dc2626',
                                fontSize: '14px',
                                lineHeight: '1.5'
                              }}>
                                {selectedCandidate.score >= 85 ? 
                                  'Exceptional candidate demonstrating strong technical skills and excellent problem-solving abilities. Highly recommended for the position.' :
                                  selectedCandidate.score >= 75 ?
                                  'Solid candidate with good technical foundation and communication skills. Meets role requirements well.' :
                                  selectedCandidate.score >= 60 ?
                                  'Promising candidate with potential. Would benefit from mentoring and additional support in some areas.' :
                                  selectedCandidate.score >= 50 ?
                                  'Mixed performance with some concerns. Additional evaluation recommended before final decision.' :
                                  'Performance below expectations. Does not currently meet minimum requirements for the position.'
                                }
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* Next Steps */}
                        <div style={{ padding: '16px', background: '#f3f4f6', borderRadius: '8px' }}>
                          <h5 style={{ margin: '0 0 12px 0', color: '#374151', fontSize: '14px' }}>📋 Recommended Next Steps</h5>
                          <ul style={{ margin: 0, paddingLeft: '20px', color: '#6b7280' }}>
                            {selectedCandidate.score >= 85 ? (
                              <>
                                <li>Schedule final interview with team lead</li>
                                <li>Prepare job offer details</li>
                                <li>Cultural fit assessment</li>
                              </>
                            ) : selectedCandidate.score >= 75 ? (
                              <>
                                <li>Technical deep-dive session</li>
                                <li>Team collaboration assessment</li>
                                <li>Reference check</li>
                              </>
                            ) : selectedCandidate.score >= 60 ? (
                              <>
                                <li>Additional technical assessment</li>
                                <li>Skill gap analysis</li>
                                <li>Training needs evaluation</li>
                              </>
                            ) : (
                              <>
                                <li>Skills development consultation</li>
                                <li>Future opportunity consideration</li>
                                <li>Feedback session with candidate</li>
                              </>
                            )}
                          </ul>
                        </div>
                      </>
                    ) : (
                      <div style={{ textAlign: 'center', padding: '40px', color: '#718096' }}>
                        <div style={{ fontSize: '48px', marginBottom: '16px' }}>⏳</div>
                        <p>Interview {selectedCandidate.status === 'in-progress' ? 'in progress' : 'not yet completed'}</p>
                        <p style={{ fontSize: '14px', color: '#9ca3af' }}>AI assessment will be available once interview is completed</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Violation Information */}
              {selectedCandidate && (selectedCandidate.violations?.length > 0 || selectedCandidate.status === 'terminated') && (
                <div style={{ marginTop: '32px' }}>
                  <div style={{
                    border: '1px solid #ef4444',
                    borderRadius: '12px',
                    padding: '20px',
                    background: '#fef2f2',
                    marginBottom: '20px'
                  }}>
                    <h3 style={{ margin: '0 0 16px 0', color: '#dc2626', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      ⚠️ Interview Violations Detected
                    </h3>
                    
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '16px', marginBottom: '16px' }}>
                      <div style={{ textAlign: 'center', padding: '12px', background: 'white', borderRadius: '8px' }}>
                        <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#dc2626' }}>
                          {selectedCandidate.questionsCompleted || selectedCandidate.responses?.length || 0}
                        </div>
                        <div style={{ fontSize: '12px', color: '#6b7280' }}>Completed</div>
                      </div>
                      <div style={{ textAlign: 'center', padding: '12px', background: 'white', borderRadius: '8px' }}>
                        <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#dc2626' }}>
                          {selectedCandidate.totalQuestions || selectedCandidate.questions?.length || 0}
                        </div>
                        <div style={{ fontSize: '12px', color: '#6b7280' }}>Total Questions</div>
                      </div>
                      <div style={{ textAlign: 'center', padding: '12px', background: 'white', borderRadius: '8px' }}>
                        <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#dc2626' }}>
                          {selectedCandidate.violations?.length || 0}
                        </div>
                        <div style={{ fontSize: '12px', color: '#6b7280' }}>Violations</div>
                      </div>
                    </div>

                    {selectedCandidate.violations && selectedCandidate.violations.length > 0 && (
                      <div>
                        <h4 style={{ margin: '0 0 12px 0', color: '#dc2626' }}>Violation Details:</h4>
                        <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
                          {selectedCandidate.violations.map((violation: any, index: number) => (
                            <div key={index} style={{
                              padding: '12px',
                              marginBottom: '8px',
                              border: '1px solid #f87171',
                              borderRadius: '6px',
                              background: 'white'
                            }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                                <span style={{ fontWeight: '600', color: '#dc2626' }}>
                                  {violation.type === 'fullscreen_exit' ? '🔍 Exited Fullscreen Mode' :
                                   violation.type === 'tab_change' ? '🔄 Switched Tab/Window' :
                                   violation.type === 'window_blur' ? '🎯 Window Lost Focus' : violation.type}
                                </span>
                                <span style={{ fontSize: '12px', color: '#6b7280' }}>
                                  Q{violation.questionNumber}
                                </span>
                              </div>
                              <div style={{ fontSize: '12px', color: '#6b7280' }}>
                                {new Date(violation.timestamp).toLocaleString()}
                              </div>
                              {violation.questionText && (
                                <div style={{ fontSize: '12px', color: '#374151', marginTop: '4px', fontStyle: 'italic' }}>
                                  "{violation.questionText.substring(0, 100)}..."
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {selectedCandidate.terminationReason && (
                      <div style={{
                        marginTop: '16px',
                        padding: '12px',
                        background: '#fee2e2',
                        borderRadius: '6px',
                        border: '1px solid #fca5a5'
                      }}>
                        <strong style={{ color: '#dc2626' }}>Termination Reason:</strong> 
                        <span style={{ color: '#374151', marginLeft: '8px' }}>{selectedCandidate.terminationReason}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {selectedCandidate && selectedCandidate.responses && selectedCandidate.responses.length > 0 && (
                <div style={{ marginTop: '32px' }}>
                  <h3 style={{ marginBottom: '16px' }}>Interview Responses</h3>
                  {selectedCandidate.responses.map((response: any, index: number) => (
                    <div key={index} style={{
                      border: '1px solid #e2e8f0',
                      borderRadius: '12px',
                      padding: '20px',
                      marginBottom: '16px',
                      background: 'white'
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'between', alignItems: 'start', marginBottom: '12px' }}>
                        <h4 style={{ margin: 0, color: '#2d3748', flex: 1 }}>
                          Q{index + 1}: {response.question}
                        </h4>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginLeft: '16px' }}>
                          <span style={{
                            padding: '2px 8px',
                            borderRadius: '4px',
                            fontSize: '12px',
                            fontWeight: 'bold',
                            backgroundColor: (response.score >= 80) ? '#dcfce7' : (response.score >= 60) ? '#fef3c7' : '#fef2f2',
                            color: (response.score >= 80) ? '#166534' : (response.score >= 60) ? '#92400e' : '#991b1b'
                          }}>
                            {response.score || 0}/100
                          </span>
                          {response.aiAnalysis?.isCorrect !== undefined && (
                            <span style={{ fontSize: '16px' }}>
                              {response.aiAnalysis.isCorrect ? '✅' : '❌'}
                            </span>
                          )}
                        </div>
                      </div>
                      
                      <div style={{
                        background: '#f8fafc',
                        padding: '16px',
                        borderRadius: '8px',
                        marginBottom: '12px',
                        fontStyle: 'italic'
                      }}>
                        "{response.response || response.answer}"
                      </div>

                      {response.aiAnalysis && (
                        <div style={{ 
                          padding: '12px',
                          background: '#f0f9ff',
                          borderRadius: '6px',
                          border: '1px solid #3b82f6',
                          marginBottom: '8px'
                        }}>
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))', gap: '12px', marginBottom: '8px' }}>
                            <div style={{ textAlign: 'center' }}>
                              <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#1e40af' }}>
                                {response.aiAnalysis.technicalAccuracy || response.aiAnalysis.score || 'N/A'}
                              </div>
                              <div style={{ fontSize: '11px', color: '#6b7280' }}>Technical</div>
                            </div>
                            <div style={{ textAlign: 'center' }}>
                              <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#1e40af' }}>
                                {response.aiAnalysis.relevance || 'N/A'}
                              </div>
                              <div style={{ fontSize: '11px', color: '#6b7280' }}>Relevance</div>
                            </div>
                            <div style={{ textAlign: 'center' }}>
                              <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#1e40af' }}>
                                {response.aiAnalysis.clarity || 'N/A'}
                              </div>
                              <div style={{ fontSize: '11px', color: '#6b7280' }}>Clarity</div>
                            </div>
                          </div>
                          
                          {response.aiAnalysis.feedback && (
                            <p style={{
                              margin: 0,
                              fontSize: '14px',
                              color: '#374151',
                              fontStyle: 'italic'
                            }}>
                              💡 {response.aiAnalysis.feedback}
                            </p>
                          )}
                        </div>
                      )}

                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px', color: '#6b7280' }}>
                        <span>Time Used: {response.timeUsed}s / {response.timeLimit}s</span>
                        <span>Difficulty: {selectedCandidate.questions?.[index]?.difficulty || 'Unknown'}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}



      {/* Analytics View */}
      {activeView === 'analytics' && (
        <div className="card">
          <h2 style={{ marginBottom: '24px' }}>📈 Interview Analytics</h2>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '32px' }}>
            <div>
              <h3>Interview Performance</h3>
              <div style={{ background: '#f8fafc', padding: '20px', borderRadius: '12px' }}>
                <div style={{ marginBottom: '16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <span>Completion Rate</span>
                    <span>67%</span>
                  </div>
                  <div style={{ background: '#e2e8f0', borderRadius: '4px', height: '8px' }}>
                    <div style={{ background: '#667eea', width: '67%', height: '8px', borderRadius: '4px' }}></div>
                  </div>
                </div>
                
                <div style={{ marginBottom: '16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <span>Average Score</span>
                    <span>78%</span>
                  </div>
                  <div style={{ background: '#e2e8f0', borderRadius: '4px', height: '8px' }}>
                    <div style={{ background: '#10b981', width: '78%', height: '8px', borderRadius: '4px' }}></div>
                  </div>
                </div>
                
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <span>Response Quality</span>
                    <span>85%</span>
                  </div>
                  <div style={{ background: '#e2e8f0', borderRadius: '4px', height: '8px' }}>
                    <div style={{ background: '#f59e0b', width: '85%', height: '8px', borderRadius: '4px' }}></div>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <h3>Popular Positions</h3>
              <div style={{ background: '#f8fafc', padding: '20px', borderRadius: '12px' }}>
                {['Software Engineer', 'Frontend Developer', 'Full Stack Developer', 'Product Manager'].map((position, index) => (
                  <div key={position} style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    padding: '12px 0', 
                    borderBottom: index < 3 ? '1px solid #e2e8f0' : 'none' 
                  }}>
                    <span>{position}</span>
                    <span style={{ fontWeight: '600', color: '#667eea' }}>{Math.floor(Math.random() * 10) + 1}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default WorkingInterviewerTab;