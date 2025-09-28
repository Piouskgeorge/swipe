import React, { useState } from 'react';
import { Users, Download, Eye, Clock, CheckCircle, AlertCircle, User, Award, Brain } from 'lucide-react';

interface Candidate {
  id: string;
  name: string;
  email: string;
  phone: string;
  position?: string;
  resumeData?: any;
  resumeText?: string;
  status: 'uploading' | 'interviewing' | 'completed' | 'terminated';
  startedAt: Date;
  completedAt?: Date;
  finalScore?: number;
  finalReport?: any;
  responses?: any[];
  questions?: any[];
  violations?: any[];
}

interface CrispInterviewerTabProps {
  candidates: Candidate[];
  onCandidateUpdate?: (candidateId: string, updates: any) => void;
}

const CrispInterviewerTab: React.FC<CrispInterviewerTabProps> = ({
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
      const response = await fetch(`http://localhost:5001/api/interviews/${candidate.id}/pdf-report`, {
        method: 'GET',
      });
      
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Interview_Report_${candidate.name.replace(/\s+/g, '_')}.pdf`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(url);
      } else {
        alert('Error generating PDF report');
      }
    } catch (error) {
      console.error('Error downloading PDF:', error);
      alert('Error downloading PDF report');
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      uploading: { color: 'bg-yellow-100 text-yellow-800', icon: Clock, text: 'Uploading' },
      interviewing: { color: 'bg-blue-100 text-blue-800', icon: Clock, text: 'In Progress' },
      completed: { color: 'bg-green-100 text-green-800', icon: CheckCircle, text: 'Completed' },
      terminated: { color: 'bg-red-100 text-red-800', icon: AlertCircle, text: 'Terminated' }
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.uploading;
    const Icon = config.icon;
    
    return (
      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${config.color}`}>
        <Icon className="w-3 h-3 mr-1" />
        {config.text}
      </span>
    );
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const renderCandidateList = () => (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
            <Users className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Interviewer Dashboard</h2>
            <p className="text-gray-600">Monitor and review candidate interviews</p>
          </div>
        </div>
        
        {/* Sort Options */}
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-500">Sort by:</span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="border border-gray-300 rounded-lg px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="score">Score (High to Low)</option>
            <option value="date">Date (Recent First)</option>
            <option value="name">Name (A-Z)</option>
          </select>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Total Candidates</p>
              <p className="text-2xl font-bold text-gray-900">{candidates.length}</p>
            </div>
            <Users className="w-8 h-8 text-blue-500" />
          </div>
        </div>
        
        <div className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Completed</p>
              <p className="text-2xl font-bold text-green-600">
                {candidates.filter(c => c.status === 'completed').length}
              </p>
            </div>
            <CheckCircle className="w-8 h-8 text-green-500" />
          </div>
        </div>
        
        <div className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">In Progress</p>
              <p className="text-2xl font-bold text-blue-600">
                {candidates.filter(c => c.status === 'interviewing').length}
              </p>
            </div>
            <Clock className="w-8 h-8 text-blue-500" />
          </div>
        </div>
        
        <div className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Avg Score</p>
              <p className="text-2xl font-bold text-purple-600">
                {candidates.length > 0 
                  ? Math.round(candidates.filter(c => c.finalScore).reduce((sum, c) => sum + (c.finalScore || 0), 0) / candidates.filter(c => c.finalScore).length || 0)
                  : 0}%
              </p>
            </div>
            <Award className="w-8 h-8 text-purple-500" />
          </div>
        </div>
      </div>

      {/* Candidates Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">All Candidates</h3>
        </div>
        
        {candidates.length === 0 ? (
          <div className="p-12 text-center">
            <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">No candidates yet. Candidates will appear here after they start interviews.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Candidate
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Score
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {sortedCandidates.map((candidate) => (
                  <tr key={candidate.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                          <User className="w-4 h-4 text-gray-600" />
                        </div>
                        <div className="ml-3">
                          <div className="text-sm font-medium text-gray-900">{candidate.name}</div>
                          <div className="text-sm text-gray-500">{candidate.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(candidate.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {candidate.finalScore ? (
                        <span className={`text-lg font-bold ${getScoreColor(candidate.finalScore)}`}>
                          {candidate.finalScore}%
                        </span>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(candidate.startedAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                      <button
                        onClick={() => setSelectedCandidate(candidate)}
                        className="inline-flex items-center px-3 py-1 border border-transparent text-sm leading-4 font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                      >
                        <Eye className="w-4 h-4 mr-1" />
                        View Details
                      </button>
                      {candidate.status === 'completed' && (
                        <button
                          onClick={() => handleDownloadPDF(candidate)}
                          className="inline-flex items-center px-3 py-1 border border-transparent text-sm leading-4 font-medium rounded-md text-green-700 bg-green-100 hover:bg-green-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                        >
                          <Download className="w-4 h-4 mr-1" />
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
    <div className="space-y-6">
      {/* Back Button */}
      <button
        onClick={() => setSelectedCandidate(null)}
        className="flex items-center text-blue-600 hover:text-blue-700"
      >
        ← Back to Candidates
      </button>
      
      {/* Candidate Header */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center">
              <User className="w-8 h-8 text-gray-600" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">{selectedCandidate?.name}</h2>
              <p className="text-gray-600">{selectedCandidate?.email}</p>
              <p className="text-gray-600">{selectedCandidate?.phone}</p>
            </div>
          </div>
          
          <div className="text-right">
            {getStatusBadge(selectedCandidate?.status || 'uploading')}
            {selectedCandidate?.finalScore && (
              <div className="mt-2">
                <span className={`text-3xl font-bold ${getScoreColor(selectedCandidate.finalScore)}`}>
                  {selectedCandidate.finalScore}%
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Violations (if any) */}
      {selectedCandidate?.violations && selectedCandidate.violations.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-red-800 mb-3">⚠️ Interview Violations</h3>
          <div className="space-y-2">
            {selectedCandidate.violations.map((violation: any, index: number) => (
              <div key={index} className="text-sm text-red-700">
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
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-blue-800 mb-3 flex items-center">
            <Brain className="w-5 h-5 mr-2" />
            AI Assessment Summary
          </h3>
          <p className="text-blue-700">{selectedCandidate.finalReport.aiSummary}</p>
        </div>
      )}

      {/* Interview Responses */}
      {selectedCandidate?.responses && selectedCandidate.responses.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Interview Responses</h3>
          </div>
          <div className="p-6 space-y-6">
            {selectedCandidate.responses.map((response: any, index: number) => (
              <div key={index} className="border border-gray-200 rounded-lg p-4">
                <div className="flex justify-between items-start mb-3">
                  <h4 className="font-semibold text-gray-900">Q{index + 1}: {response.question}</h4>
                  <div className="flex items-center space-x-2">
                    {response.score && (
                      <span className={`px-2 py-1 rounded text-sm font-bold ${getScoreColor(response.score)} bg-gray-100`}>
                        {response.score}/100
                      </span>
                    )}
                    {response.aiAnalysis?.isCorrect !== undefined && (
                      <span className="text-lg">
                        {response.aiAnalysis.isCorrect ? '✅' : '❌'}
                      </span>
                    )}
                  </div>
                </div>
                
                <div className="bg-gray-50 rounded p-3 mb-3">
                  <strong>Answer:</strong> {response.answer || response.response}
                </div>
                
                {response.aiAnalysis?.feedback && (
                  <div className="text-sm text-gray-600 bg-blue-50 rounded p-3">
                    <strong>AI Feedback:</strong> {response.aiAnalysis.feedback}
                  </div>
                )}
                
                <div className="text-xs text-gray-500 mt-2">
                  Time used: {response.timeUsed}s
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Download PDF Button */}
      {selectedCandidate?.status === 'completed' && (
        <div className="text-center">
          <button
            onClick={() => handleDownloadPDF(selectedCandidate)}
            className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
          >
            <Download className="w-5 h-5 mr-2" />
            Download Complete PDF Report
          </button>
        </div>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {selectedCandidate ? renderCandidateDetails() : renderCandidateList()}
      </div>
    </div>
  );
};

export default CrispInterviewerTab;