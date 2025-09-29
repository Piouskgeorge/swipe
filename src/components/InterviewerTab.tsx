import React, { useState, useMemo } from 'react';
import { useSelector } from 'react-redux';
import { Search, Eye, Users, Trophy, Clock, Filter, Calendar, Mail, Phone } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import type { RootState } from '../store';
import type { Candidate, ChatMessage } from '../types';
import { cn, formatRelativeDate } from '@/lib/utils';

const InterviewerTab: React.FC = () => {
  const { candidates } = useSelector((state: RootState) => state.candidates);
  
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'score' | 'name' | 'date'>('score');
  const [completedInterviews, setCompletedInterviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // Fetch completed interviews from API
  const fetchCompletedInterviews = async () => {
    setLoading(true);
    try {
      const response = await fetch('http://localhost:5001/api/interview/completed');
      const data = await response.json();
      if (response.ok) {
        setCompletedInterviews(data.interviews || []);
      } else {
        console.error('Failed to fetch completed interviews:', data.message);
      }
    } catch (error) {
      console.error('Error fetching completed interviews:', error);
    } finally {
      setLoading(false);
    }
  };

  // Load completed interviews on component mount
  React.useEffect(() => {
    fetchCompletedInterviews();
  }, []);

  // Filter and sort candidates
  const filteredCandidates = useMemo(() => {
    return candidates
      .filter(candidate => {
        const matchesSearch = candidate.name.toLowerCase().includes(searchText.toLowerCase()) ||
                             candidate.email.toLowerCase().includes(searchText.toLowerCase());
        const matchesStatus = statusFilter === 'all' || candidate.status === statusFilter;
        return matchesSearch && matchesStatus;
      })
      .sort((a, b) => {
        switch (sortBy) {
          case 'score':
            return (b.score || 0) - (a.score || 0);
          case 'name':
            return a.name.localeCompare(b.name);
          case 'date':
            return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
          default:
            return 0;
        }
      });
  }, [candidates, searchText, statusFilter, sortBy]);

  const stats = useMemo(() => {
    const total = candidates.length;
    const completed = candidates.filter(c => c.status === 'completed').length;
    const interviewing = candidates.filter(c => c.status === 'interviewing').length;
    const avgScore = completed > 0 
      ? Math.round(candidates
          .filter(c => c.score !== undefined)
          .reduce((sum, c) => sum + (c.score || 0), 0) / completed)
      : 0;
    
    return { total, completed, interviewing, avgScore };
  }, [candidates]);

  const getStatusBadge = (status: string) => {
    const baseClass = "px-2 py-1 rounded-full text-xs font-medium";
    switch (status) {
      case 'completed':
        return `${baseClass} bg-green-100 text-green-800`;
      case 'interviewing':
        return `${baseClass} bg-blue-100 text-blue-800`;
      case 'paused':
        return `${baseClass} bg-yellow-100 text-yellow-800`;
      default:
        return `${baseClass} bg-gray-100 text-gray-800`;
    }
  };

  const getScoreBadge = (score?: number) => {
    if (!score) return "px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800";
    
    const baseClass = "px-2 py-1 rounded-full text-xs font-medium";
    if (score >= 80) return `${baseClass} bg-green-100 text-green-800`;
    if (score >= 60) return `${baseClass} bg-blue-100 text-blue-800`;
    if (score >= 40) return `${baseClass} bg-yellow-100 text-yellow-800`;
    return `${baseClass} bg-red-100 text-red-800`;
  };

  const renderChatHistory = (_candidateId: string) => {
    const messages: ChatMessage[] = [];
    
    if (messages.length === 0) {
      return (
        <div className="text-center text-muted-foreground py-8">
          No chat history available
        </div>
      );
    }

    return (
      <div className="space-y-4 max-h-96 overflow-y-auto custom-scrollbar">
        {messages.map((message, index) => (
          <div key={index} className={cn(
            "flex",
            message.type === 'user' ? "justify-end" : "justify-start"
          )}>
            <div className={cn(
              "max-w-xs lg:max-w-md px-4 py-2 rounded-lg",
              message.type === 'user' 
                ? "bg-primary text-primary-foreground" 
                : message.type === 'bot'
                ? "bg-secondary text-secondary-foreground"
                : "bg-muted text-muted-foreground"
            )}>
              <div className="text-sm">{message.content}</div>
              <div className="text-xs opacity-70 mt-1">
                {new Date(message.timestamp).toLocaleTimeString()}
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-4 md:p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Interviewer Dashboard
          </h1>
          <p className="text-muted-foreground">
            Manage candidates, review interviews, and track performance
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-blue-800">Total Candidates</CardTitle>
              <Users className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-900">{stats.total}</div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-green-800">Completed</CardTitle>
              <Trophy className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-900">{stats.completed}</div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-yellow-50 to-yellow-100 border-yellow-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-yellow-800">In Progress</CardTitle>
              <Clock className="h-4 w-4 text-yellow-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-900">{stats.interviewing}</div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-purple-800">Average Score</CardTitle>
              <Trophy className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-900">{stats.avgScore}/100</div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filters & Search
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search candidates by name or email..."
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                  className="pl-10"
                />
              </div>
              
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 border border-input bg-background rounded-md text-sm"
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="interviewing">Interviewing</option>
                <option value="paused">Paused</option>
                <option value="completed">Completed</option>
              </select>
              
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as 'score' | 'name' | 'date')}
                className="px-3 py-2 border border-input bg-background rounded-md text-sm"
              >
                <option value="score">Sort by Score</option>
                <option value="name">Sort by Name</option>
                <option value="date">Sort by Date</option>
              </select>
            </div>
          </CardContent>
        </Card>

        {/* Completed AI Interviews Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-yellow-500" />
              Completed AI Interviews
              <Button onClick={fetchCompletedInterviews} variant="outline" size="sm" className="ml-auto">
                Refresh
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-center text-muted-foreground">Loading interviews...</p>
            ) : completedInterviews.length === 0 ? (
              <p className="text-center text-muted-foreground">No completed interviews found</p>
            ) : (
              <div className="space-y-4">
                {completedInterviews.map((interview) => (
                  <div key={interview.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h3 className="font-semibold text-lg">{interview.candidateName}</h3>
                        <p className="text-sm text-gray-600">{interview.position}</p>
                        <p className="text-xs text-gray-500">{interview.candidateEmail}</p>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-blue-600">
                          {interview.totalScore}/600
                        </div>
                        <div className="text-sm text-gray-500">
                          {Math.round((interview.totalScore / 600) * 100)}% Score
                        </div>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-3">
                      <div>
                        <span className="text-xs text-gray-500">Recommendation</span>
                        <div className={`font-medium ${
                          interview.recommendation === 'Strong Hire' ? 'text-green-600' :
                          interview.recommendation === 'Hire' ? 'text-blue-600' :
                          interview.recommendation === 'Maybe' ? 'text-yellow-600' :
                          'text-red-600'
                        }`}>
                          {interview.recommendation}
                        </div>
                      </div>
                      <div>
                        <span className="text-xs text-gray-500">Duration</span>
                        <div className="font-medium">{interview.duration || 0} min</div>
                      </div>
                      <div>
                        <span className="text-xs text-gray-500">Completed</span>
                        <div className="font-medium">
                          {interview.completedAt ? formatRelativeDate(interview.completedAt) : 'N/A'}
                        </div>
                      </div>
                      <div>
                        <Button 
                          onClick={() => window.open(`/api/interview/${interview.id}/report`, '_blank')}
                          variant="outline" 
                          size="sm"
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          View Report
                        </Button>
                      </div>
                    </div>

                    {interview.finalReport?.aiSummary && (
                      <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                        <h4 className="font-medium text-sm text-blue-800 mb-1">AI Assessment</h4>
                        <p className="text-sm text-blue-700">
                          {interview.finalReport.aiSummary.length > 200 
                            ? `${interview.finalReport.aiSummary.substring(0, 200)}...` 
                            : interview.finalReport.aiSummary
                          }
                        </p>
                      </div>
                    )}

                    {interview.finalReport?.breakdown && (
                      <div className="mt-3 grid grid-cols-3 gap-2 text-sm">
                        <div className="text-center p-2 bg-green-50 rounded">
                          <div className="text-green-800 font-medium">Easy</div>
                          <div className="text-green-600">{interview.finalReport.breakdown.easy?.average || 0}%</div>
                        </div>
                        <div className="text-center p-2 bg-yellow-50 rounded">
                          <div className="text-yellow-800 font-medium">Medium</div>
                          <div className="text-yellow-600">{interview.finalReport.breakdown.medium?.average || 0}%</div>
                        </div>
                        <div className="text-center p-2 bg-red-50 rounded">
                          <div className="text-red-800 font-medium">Hard</div>
                          <div className="text-red-600">{interview.finalReport.breakdown.hard?.average || 0}%</div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Candidates Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredCandidates.map((candidate) => (
            <Card key={candidate.id} className="hover:shadow-lg transition-shadow cursor-pointer group">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <CardTitle className="text-lg">{candidate.name}</CardTitle>
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <Mail className="h-3 w-3" />
                      {candidate.email}
                    </div>
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <Phone className="h-3 w-3" />
                      {candidate.phone}
                    </div>
                  </div>
                  <span className={getStatusBadge(candidate.status)}>
                    {candidate.status}
                  </span>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Score:</span>
                    <span className={getScoreBadge(candidate.score)}>
                      {candidate.score !== undefined ? `${candidate.score}/100` : 'N/A'}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Calendar className="h-3 w-3" />
                    {formatRelativeDate(candidate.createdAt)}
                  </div>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full group-hover:bg-primary group-hover:text-primary-foreground"
                    onClick={() => {
                      setSelectedCandidate(candidate);
                      setShowDetailModal(true);
                    }}
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    View Details
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredCandidates.length === 0 && (
          <Card>
            <CardContent className="text-center py-8">
              <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No candidates found matching your criteria.</p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Candidate Details Modal */}
      <Dialog open={showDetailModal} onOpenChange={setShowDetailModal}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Candidate Details: {selectedCandidate?.name}</DialogTitle>
          </DialogHeader>
          
          {selectedCandidate && (
            <div className="space-y-6">
              {/* Basic Information */}
              <Card>
                <CardHeader>
                  <CardTitle>Personal Information</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Name</label>
                    <p className="text-sm">{selectedCandidate.name}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Email</label>
                    <p className="text-sm">{selectedCandidate.email}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Phone</label>
                    <p className="text-sm">{selectedCandidate.phone}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Status</label>
                    <div className="mt-1">
                      <span className={getStatusBadge(selectedCandidate.status)}>
                        {selectedCandidate.status}
                      </span>
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Score</label>
                    <div className="mt-1">
                      <span className={getScoreBadge(selectedCandidate.score)}>
                        {selectedCandidate.score !== undefined ? `${selectedCandidate.score}/100` : 'Not Available'}
                      </span>
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Interview Date</label>
                    <p className="text-sm">{formatRelativeDate(selectedCandidate.createdAt)}</p>
                  </div>
                </CardContent>
              </Card>

              {/* AI Summary */}
              {selectedCandidate.summary && (
                <Card>
                  <CardHeader>
                    <CardTitle>AI Assessment Summary</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="prose prose-sm max-w-none">
                      <p className="whitespace-pre-line text-sm leading-relaxed">
                        {selectedCandidate.summary}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Chat History */}
              <Card>
                <CardHeader>
                  <CardTitle>Interview Chat History</CardTitle>
                </CardHeader>
                <CardContent>
                  {renderChatHistory(selectedCandidate.id)}
                </CardContent>
              </Card>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default InterviewerTab;