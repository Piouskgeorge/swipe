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
    position?: string;
  };
}

interface InterviewerTabProps {
  user: User;
  onLogout: () => void;
}

function InterviewerTab({ user, onLogout }: InterviewerTabProps) {
  const [activeView, setActiveView] = useState('dashboard');
  const [interviews, setInterviews] = useState<any[]>([]);
  const [interviewees, setInterviewees] = useState<any[]>([]);
  const [selectedInterview, setSelectedInterview] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [newInterview, setNewInterview] = useState({
    intervieweeId: '',
    position: '',
    scheduledAt: '',
    duration: 30
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [interviewsData, intervieweesData] = await Promise.all([
        apiService.getInterviews(),
        apiService.getInterviewees()
      ]);
      setInterviews(interviewsData.interviews || []);
      setInterviewees(intervieweesData.interviewees || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const createInterview = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await apiService.createInterview(newInterview);
      setNewInterview({ intervieweeId: '', position: '', scheduledAt: '', duration: 30 });
      setActiveView('dashboard');
      loadData();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const viewInterviewDetails = async (interview: any) => {
    setLoading(true);
    try {
      const data = await apiService.getInterview(interview._id);
      setSelectedInterview(data.interview);
      setActiveView('details');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    const colors = {
      'scheduled': '#3b82f6',
      'in-progress': '#10b981',
      'paused': '#f59e0b',
      'completed': '#6b7280',
      'cancelled': '#ef4444'
    };
    return colors[status as keyof typeof colors] || '#6b7280';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return '#10b981'; // green
    if (score >= 60) return '#f59e0b'; // yellow
    return '#ef4444'; // red
  };

  if (error) {
    return (
      <div className="card">
        <h2>Error</h2>
        <p style={{ color: 'red' }}>{error}</p>
        <button className="btn btn-primary" onClick={() => {
          setError('');
          loadData();
        }}>
          Retry
        </button>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2>Welcome, {user.profile.firstName}!</h2>
            <p>Role: Interviewer | Company: {user.profile.company}</p>
          </div>
          <button onClick={onLogout} className="btn" style={{ background: '#6b7280', color: 'white' }}>
            Logout
          </button>
        </div>
      </div>

      {/* Navigation */}
      <div className="tabs">
        <button 
          className={`tab-button ${activeView === 'dashboard' ? 'active' : ''}`}
          onClick={() => setActiveView('dashboard')}
        >
          📊 Dashboard
        </button>
        <button 
          className={`tab-button ${activeView === 'schedule' ? 'active' : ''}`}
          onClick={() => setActiveView('schedule')}
        >
          ➕ Schedule Interview
        </button>
        <button 
          className={`tab-button ${activeView === 'candidates' ? 'active' : ''}`}
          onClick={() => setActiveView('candidates')}
        >
          👥 Candidates
        </button>
      </div>

      {loading && <div className="card"><p>Loading...</p></div>}

      {/* Dashboard View */}
      {activeView === 'dashboard' && (
        <div>
          <div className="card">
            <h2>Interview Statistics</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginTop: '20px' }}>
              <div style={{ padding: '20px', background: '#f0f9ff', borderRadius: '8px', textAlign: 'center' }}>
                <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#3b82f6' }}>
                  {interviews.length}
                </div>
                <div>Total Interviews</div>
              </div>
              <div style={{ padding: '20px', background: '#f0fdf4', borderRadius: '8px', textAlign: 'center' }}>
                <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#10b981' }}>
                  {interviews.filter(i => i.status === 'completed').length}
                </div>
                <div>Completed</div>
              </div>
              <div style={{ padding: '20px', background: '#fffbeb', borderRadius: '8px', textAlign: 'center' }}>
                <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#f59e0b' }}>
                  {interviews.filter(i => i.status === 'in-progress' || i.status === 'paused').length}
                </div>
                <div>Active</div>
              </div>
              <div style={{ padding: '20px', background: '#f8fafc', borderRadius: '8px', textAlign: 'center' }}>
                <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#6b7280' }}>
                  {interviews.filter(i => i.status === 'scheduled').length}
                </div>
                <div>Scheduled</div>
              </div>
            </div>
          </div>

          <div className="card">
            <h2>Recent Interviews</h2>
            {interviews.length === 0 ? (
              <p>No interviews found. <button className="btn btn-primary" onClick={() => setActiveView('schedule')}>Schedule your first interview</button></p>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ borderBottom: '2px solid #e2e8f0' }}>
                      <th style={{ padding: '12px', textAlign: 'left' }}>Candidate</th>
                      <th style={{ padding: '12px', textAlign: 'left' }}>Position</th>
                      <th style={{ padding: '12px', textAlign: 'left' }}>Status</th>
                      <th style={{ padding: '12px', textAlign: 'left' }}>Scheduled</th>
                      <th style={{ padding: '12px', textAlign: 'left' }}>Score</th>
                      <th style={{ padding: '12px', textAlign: 'left' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {interviews.map((interview) => (
                      <tr key={interview._id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '12px' }}>
                          {interview.interviewee?.profile?.firstName} {interview.interviewee?.profile?.lastName}
                        </td>
                        <td style={{ padding: '12px' }}>{interview.position}</td>
                        <td style={{ padding: '12px' }}>
                          <span style={{ 
                            padding: '4px 8px', 
                            borderRadius: '12px', 
                            background: getStatusColor(interview.status) + '20',
                            color: getStatusColor(interview.status),
                            fontSize: '0.875rem',
                            fontWeight: 500
                          }}>
                            {interview.status}
                          </span>
                        </td>
                        <td style={{ padding: '12px' }}>{formatDate(interview.scheduledAt)}</td>
                        <td style={{ padding: '12px' }}>
                          {interview.overallAssessment?.totalScore ? (
                            <span style={{ color: getScoreColor(interview.overallAssessment.totalScore) }}>
                              {interview.overallAssessment.totalScore}/100
                            </span>
                          ) : '-'}
                        </td>
                        <td style={{ padding: '12px' }}>
                          <button 
                            className="btn btn-primary"
                            style={{ fontSize: '0.875rem', padding: '4px 8px' }}
                            onClick={() => viewInterviewDetails(interview)}
                          >
                            View
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Schedule Interview View */}
      {activeView === 'schedule' && (
        <div className="card">
          <h2>Schedule New Interview</h2>
          <form onSubmit={createInterview}>
            <div className="form-group">
              <label className="form-label">Select Candidate</label>
              <select
                value={newInterview.intervieweeId}
                onChange={(e) => setNewInterview({...newInterview, intervieweeId: e.target.value})}
                className="form-input"
                required
              >
                <option value="">Choose a candidate...</option>
                {interviewees.map((candidate) => (
                  <option key={candidate._id} value={candidate._id}>
                    {candidate.profile.firstName} {candidate.profile.lastName} ({candidate.email})
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Position</label>
              <input
                type="text"
                value={newInterview.position}
                onChange={(e) => setNewInterview({...newInterview, position: e.target.value})}
                className="form-input"
                placeholder="e.g., Software Engineer, Product Manager"
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Scheduled Date & Time</label>
              <input
                type="datetime-local"
                value={newInterview.scheduledAt}
                onChange={(e) => setNewInterview({...newInterview, scheduledAt: e.target.value})}
                className="form-input"
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Duration (minutes)</label>
              <select
                value={newInterview.duration}
                onChange={(e) => setNewInterview({...newInterview, duration: parseInt(e.target.value)})}
                className="form-input"
              >
                <option value={15}>15 minutes</option>
                <option value={30}>30 minutes</option>
                <option value={45}>45 minutes</option>
                <option value={60}>60 minutes</option>
                <option value={90}>90 minutes</option>
              </select>
            </div>

            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Scheduling...' : 'Schedule Interview'}
            </button>
          </form>
        </div>
      )}

      {/* Candidates View */}
      {activeView === 'candidates' && (
        <div className="card">
          <h2>Registered Candidates</h2>
          {interviewees.length === 0 ? (
            <p>No candidates registered yet.</p>
          ) : (
            <div style={{ display: 'grid', gap: '15px', marginTop: '20px' }}>
              {interviewees.map((candidate) => (
                <div key={candidate._id} style={{ 
                  border: '1px solid #e2e8f0', 
                  borderRadius: '8px', 
                  padding: '16px',
                  background: 'white'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                    <div>
                      <h3 style={{ margin: '0 0 8px 0' }}>
                        {candidate.profile.firstName} {candidate.profile.lastName}
                      </h3>
                      <p style={{ margin: '4px 0', color: '#6b7280' }}>📧 {candidate.email}</p>
                      {candidate.profile.position && (
                        <p style={{ margin: '4px 0', color: '#6b7280' }}>💼 {candidate.profile.position}</p>
                      )}
                      {candidate.profile.skills && candidate.profile.skills.length > 0 && (
                        <div style={{ marginTop: '8px' }}>
                          {candidate.profile.skills.map((skill: string, index: number) => (
                            <span key={index} style={{
                              display: 'inline-block',
                              background: '#f0f9ff',
                              color: '#1e40af',
                              padding: '2px 8px',
                              borderRadius: '12px',
                              fontSize: '0.875rem',
                              marginRight: '8px',
                              marginTop: '4px'
                            }}>
                              {skill}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    <button
                      className="btn btn-primary"
                      onClick={() => {
                        setNewInterview({...newInterview, intervieweeId: candidate._id});
                        setActiveView('schedule');
                      }}
                    >
                      Schedule Interview
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Interview Details View */}
      {activeView === 'details' && selectedInterview && (
        <div>
          <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2>Interview Details</h2>
              <button className="btn" onClick={() => setActiveView('dashboard')}>
                ← Back to Dashboard
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px' }}>
              <div>
                <h3>Candidate Information</h3>
                <p><strong>Name:</strong> {selectedInterview.interviewee?.profile?.firstName} {selectedInterview.interviewee?.profile?.lastName}</p>
                <p><strong>Email:</strong> {selectedInterview.interviewee?.email}</p>
                <p><strong>Position:</strong> {selectedInterview.position}</p>
              </div>
              
              <div>
                <h3>Interview Details</h3>
                <p><strong>Status:</strong> 
                  <span style={{ 
                    marginLeft: '8px',
                    padding: '4px 8px', 
                    borderRadius: '12px', 
                    background: getStatusColor(selectedInterview.status) + '20',
                    color: getStatusColor(selectedInterview.status)
                  }}>
                    {selectedInterview.status}
                  </span>
                </p>
                <p><strong>Scheduled:</strong> {formatDate(selectedInterview.scheduledAt)}</p>
                <p><strong>Duration:</strong> {selectedInterview.duration} minutes</p>
                {selectedInterview.timeSpent && (
                  <p><strong>Time Spent:</strong> {selectedInterview.timeSpent} minutes</p>
                )}
              </div>
            </div>

            {selectedInterview.overallAssessment && (
              <div style={{ marginTop: '30px' }}>
                <h3>Assessment Results</h3>
                <div style={{ background: '#f8fafc', padding: '20px', borderRadius: '8px' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '20px', marginBottom: '20px' }}>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ 
                        fontSize: '2rem', 
                        fontWeight: 'bold', 
                        color: getScoreColor(selectedInterview.overallAssessment.totalScore) 
                      }}>
                        {selectedInterview.overallAssessment.totalScore}
                      </div>
                      <div>Overall Score</div>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>
                        {selectedInterview.overallAssessment.technicalScore}/10
                      </div>
                      <div>Technical</div>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>
                        {selectedInterview.overallAssessment.behavioralScore}/10
                      </div>
                      <div>Behavioral</div>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>
                        {selectedInterview.overallAssessment.communicationScore}/10
                      </div>
                      <div>Communication</div>
                    </div>
                  </div>
                  
                  {selectedInterview.overallAssessment.aiSummary && (
                    <div>
                      <h4>AI Summary</h4>
                      <p>{selectedInterview.overallAssessment.aiSummary}</p>
                    </div>
                  )}

                  {selectedInterview.overallAssessment.recommendations && (
                    <div style={{ marginTop: '15px' }}>
                      <h4>Recommendations</h4>
                      <ul>
                        {selectedInterview.overallAssessment.recommendations.map((rec: string, index: number) => (
                          <li key={index}>{rec}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <div style={{ marginTop: '15px' }}>
                    <strong>Verdict: </strong>
                    <span style={{ 
                      padding: '4px 8px',
                      borderRadius: '12px',
                      background: selectedInterview.overallAssessment.verdict === 'recommend' ? '#dcfce7' : 
                                 selectedInterview.overallAssessment.verdict === 'maybe' ? '#fef3c7' : '#fecaca',
                      color: selectedInterview.overallAssessment.verdict === 'recommend' ? '#16a34a' : 
                             selectedInterview.overallAssessment.verdict === 'maybe' ? '#d97706' : '#dc2626'
                    }}>
                      {selectedInterview.overallAssessment.verdict}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {selectedInterview.responses && selectedInterview.responses.length > 0 && (
              <div style={{ marginTop: '30px' }}>
                <h3>Interview Questions & Responses</h3>
                {selectedInterview.responses.map((response: any, index: number) => (
                  <div key={index} style={{ 
                    border: '1px solid #e2e8f0', 
                    borderRadius: '8px', 
                    padding: '16px', 
                    marginBottom: '16px' 
                  }}>
                    <div style={{ marginBottom: '12px' }}>
                      <strong>Q{index + 1}:</strong> {selectedInterview.questions[response.questionIndex]?.question}
                    </div>
                    <div style={{ marginBottom: '12px', padding: '12px', background: '#f8fafc', borderRadius: '6px' }}>
                      <strong>Response:</strong> {response.response}
                    </div>
                    {response.aiAnalysis && (
                      <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                        <strong>AI Analysis:</strong> Score {response.aiAnalysis.score}/10 | 
                        Relevance {response.aiAnalysis.relevance}/10 | 
                        Clarity {response.aiAnalysis.clarity}/10
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default InterviewerTab;