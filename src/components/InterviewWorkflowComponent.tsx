import React, { useState, useEffect, useRef } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Progress } from './ui/progress';
import { AlertCircle, Clock, Upload, FileText, CheckCircle, BarChart3, Zap, User, Trophy, Target } from 'lucide-react';
import { Alert, AlertDescription } from './ui/alert';

// Types
interface Question {
  id: number;
  question: string;
  difficulty: 'easy' | 'medium' | 'hard';
  timeLimit: number;
  category: string;
  expectedKeywords: string[];
}

interface Response {
  questionId?: number;
  questionIndex?: number;
  question: string;
  response: string;
  timeUsed: number;
  score: number;
  difficulty: 'easy' | 'medium' | 'hard';
  submittedAt?: string;
}

interface Interview {
  id: string;
  candidateName: string;
  candidateEmail: string;
  position: string;
  questions: Question[];
  currentQuestionIndex: number;
  status: string;
  startedAt: string;
  responses: Response[];
}

interface FinalReport {
  candidate: {
    name: string;
    position: string;
    totalQuestions: number;
    totalScore: number;
    averageScore: number;
    duration: number;
  };
  breakdown: {
    easy: { total: number; count: number; average: number };
    medium: { total: number; count: number; average: number };
    hard: { total: number; count: number; average: number };
  };
  recommendation: string;
  strengths: string[];
  improvements: string[];
  aiSummary: string;
  generatedAt: string;
}

interface User {
  id: string;
  email: string;
  role: string;
  profile: {
    firstName: string;
    lastName: string;
    position?: string;
    resumeData?: any;
    resumeText?: string;
  };
  hasResumeData?: boolean;
  needsResumeUpload?: boolean;
}

interface InterviewWorkflowProps {
  user?: User;
}

const InterviewWorkflowComponent = ({ user }: InterviewWorkflowProps = {}) => {
  const [step, setStep] = useState('upload'); // upload, start, interview, completed
  const [candidate, setCandidate] = useState({
    name: user ? `${user.profile?.firstName || ''} ${user.profile?.lastName || ''}`.trim() : '',
    email: user?.email || '',
    position: user?.profile?.position || ''
  });
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [resumeUploaded, setResumeUploaded] = useState(user?.hasResumeData || false);
  const [interview, setInterview] = useState<Interview | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  const [currentResponse, setCurrentResponse] = useState('');
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [isAnswering, setIsAnswering] = useState(false);
  const [responses, setResponses] = useState<Response[]>([]);
  const [finalReport, setFinalReport] = useState<FinalReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const timerRef = useRef<number | null>(null);
  const questionStartTime = useRef<number | null>(null);

  // Update candidate info when user prop changes
  useEffect(() => {
    if (user) {
      setCandidate({
        name: `${user.profile?.firstName || ''} ${user.profile?.lastName || ''}`.trim(),
        email: user.email,
        position: user.profile?.position || ''
      });
      setResumeUploaded(user.hasResumeData || false);
    }
  }, [user]);

  // Timer functionality
  useEffect(() => {
    if (isAnswering && timeRemaining > 0) {
      timerRef.current = setTimeout(() => {
        setTimeRemaining(prev => prev - 1);
      }, 1000);
    } else if (timeRemaining === 0 && isAnswering) {
      // Time's up - auto submit
      handleSubmitResponse(true);
    }
    
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [timeRemaining, isAnswering]);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.includes('pdf') && !file.type.includes('doc')) {
      setError('Please upload a PDF or DOC file');
      return;
    }

    setResumeFile(file);
    setLoading(true);
    setError('');

    try {
      const formData = new FormData();
      formData.append('resume', file);
      formData.append('email', candidate.email);

      const response = await fetch('http://localhost:5001/api/interview/upload-resume', {
        method: 'POST',
        body: formData
      });

      const data = await response.json();
      
      if (response.ok) {
        setResumeUploaded(true);
        setError('');
      } else {
        setError(data.message || 'Failed to upload resume');
      }
    } catch (err) {
      setError('Network error uploading resume');
    } finally {
      setLoading(false);
    }
  };

  const handleStartInterview = async () => {
    if (!candidate.name || !candidate.email || !candidate.position) {
      setError('Please fill in all candidate details');
      return;
    }

    if (!resumeUploaded) {
      setError('Please upload a resume first');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch('http://localhost:5001/api/interview/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          candidateEmail: candidate.email,
          candidateName: candidate.name,
          position: candidate.position
        })
      });

      const data = await response.json();
      
      if (response.ok) {
        setInterview(data.interview);
        setCurrentQuestion(data.interview.questions[0]);
        setStep('interview');
        startQuestionTimer(data.interview.questions[0]);
      } else {
        setError(data.message || 'Failed to start interview');
      }
    } catch (err) {
      setError('Network error starting interview');
    } finally {
      setLoading(false);
    }
  };

  const startQuestionTimer = (question: Question) => {
    setTimeRemaining(question.timeLimit);
    setIsAnswering(true);
    questionStartTime.current = Date.now();
  };

  const handleSubmitResponse = async (timeOut = false) => {
    if (!currentResponse.trim() && !timeOut) {
      setError('Please provide an answer');
      return;
    }

    setIsAnswering(false);
    const timeUsed = Math.ceil((Date.now() - (questionStartTime.current || Date.now())) / 1000);
    
    setLoading(true);
    setError('');

    try {
      const response = await fetch(`http://localhost:5001/api/interview/${interview?.id}/response`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          response: currentResponse || '(No response - time expired)',
          timeUsed: timeUsed,
          questionId: currentQuestion?.id
        })
      });

      const data = await response.json();
      
      if (response.ok) {
        // Add to responses
        const newResponse = {
          question: currentQuestion?.question || '',
          response: currentResponse,
          timeUsed: timeUsed,
          score: data.score,
          difficulty: currentQuestion?.difficulty || 'easy'
        };
        setResponses(prev => [...prev, newResponse]);
        
        if (data.isCompleted) {
          setStep('completed');
          setFinalReport(data.finalReport);
        } else {
          // Move to next question
          setCurrentQuestion(data.nextQuestion);
          setCurrentResponse('');
          startQuestionTimer(data.nextQuestion);
        }
      } else {
        setError(data.message || 'Failed to submit response');
        setIsAnswering(true); // Allow retry
      }
    } catch (err) {
      setError('Network error submitting response');
      setIsAnswering(true); // Allow retry
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getProgressPercentage = () => {
    if (!interview) return 0;
    return ((responses.length) / interview.questions.length) * 100;
  };



  const getDifficultyBadge = (difficulty: string) => {
    const colors: { [key: string]: string } = {
      easy: 'bg-green-100 text-green-800',
      medium: 'bg-yellow-100 text-yellow-800',
      hard: 'bg-red-100 text-red-800'
    };
    return `px-2 py-1 rounded-full text-xs font-medium ${colors[difficulty] || colors.easy}`;
  };

  // Step 1: Upload Resume
  if (step === 'upload') {
    return (
      <div className="max-w-4xl mx-auto p-6 space-y-6">
        <Card className="border-2 border-blue-200 shadow-lg">
          <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50">
            <CardTitle className="flex items-center gap-3 text-xl">
              <Upload className="w-6 h-6 text-blue-600" />
              AI Interview Setup
            </CardTitle>
            <p className="text-gray-600 mt-2">Welcome to the AI-powered interview system. Please provide your details and upload your resume to get started.</p>
          </CardHeader>
          <CardContent className="space-y-6 p-6">
            {/* Welcome Message */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-l-4 border-blue-400 p-6 rounded-r-lg">
              <div className="flex">
                <div className="flex-shrink-0">
                  <Zap className="h-6 w-6 text-blue-500" />
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-semibold text-blue-800 mb-2">
                    {user ? `Hi ${user.profile?.firstName}!` : 'Welcome!'} Ready for your AI Interview?
                  </h3>
                  <p className="text-blue-700 mb-2">
                    <strong>What to expect:</strong> 6 personalized questions based on your experience
                  </p>
                  <ul className="text-sm text-blue-600 space-y-1">
                    <li>• 2 Easy questions (20 seconds each) - Background & basics</li>
                    <li>• 2 Medium questions (60 seconds each) - Technical knowledge</li>
                    <li>• 2 Hard questions (120 seconds each) - Problem solving & design</li>
                    <li>• Real-time AI assessment and detailed feedback report</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Candidate Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700">Full Name *</label>
                <Input
                  type="text"
                  placeholder="Enter your full name"
                  value={candidate.name}
                  onChange={(e) => setCandidate(prev => ({ ...prev, name: e.target.value }))}
                  className="border-2 border-gray-200 focus:border-blue-500 transition-colors"
                />
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700">Email Address *</label>
                <Input
                  type="email"
                  placeholder="your.email@domain.com"
                  value={candidate.email}
                  onChange={(e) => setCandidate(prev => ({ ...prev, email: e.target.value }))}
                  className="border-2 border-gray-200 focus:border-blue-500 transition-colors"
                />
              </div>
            </div>

            {/* Position Selection */}
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-700">Position Applying For *</label>
              <select
                value={candidate.position}
                onChange={(e) => setCandidate(prev => ({ ...prev, position: e.target.value }))}
                className="w-full border-2 border-gray-200 focus:border-blue-500 transition-colors rounded-md px-3 py-2 bg-white"
              >
                <option value="">Select Position</option>
                <option value="Software Engineer">Software Engineer</option>
                <option value="Frontend Developer">Frontend Developer</option>
                <option value="Backend Developer">Backend Developer</option>
                <option value="Data Scientist">Data Scientist</option>
                <option value="Full Stack Developer">Full Stack Developer</option>
                <option value="DevOps Engineer">DevOps Engineer</option>
                <option value="Product Manager">Product Manager</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">Position</label>
              <Input
                type="text"
                placeholder="e.g., Software Engineer, Frontend Developer"
                value={candidate.position}
                onChange={(e) => setCandidate(prev => ({ ...prev, position: e.target.value }))}
              />
            </div>

            {/* Resume Upload */}
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-700">Resume Upload *</label>
              <div className={`border-2 border-dashed rounded-lg p-8 text-center transition-all duration-300 ${
                resumeUploaded 
                  ? 'border-green-400 bg-green-50' 
                  : 'border-gray-300 hover:border-blue-400 hover:bg-blue-50'
              }`}>
                <input
                  type="file"
                  accept=".pdf,.doc,.docx"
                  onChange={handleFileUpload}
                  className="hidden"
                  id="resume-upload"
                />
                {resumeUploaded ? (
                  <div className="space-y-3">
                    <CheckCircle className="mx-auto h-12 w-12 text-green-500" />
                    <div>
                      <p className="text-green-700 font-medium">
                        {resumeFile?.name || (user?.hasResumeData ? 'Resume on file' : 'Resume uploaded')}
                      </p>
                      <p className="text-sm text-green-600">
                        {user?.hasResumeData && !resumeFile ? 'Using previously uploaded resume' : 'Successfully uploaded and processed'}
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setResumeFile(null);
                        setResumeUploaded(false);
                      }}
                      className="text-gray-600"
                    >
                      Upload Different File
                    </Button>
                  </div>
                ) : (
                  <label htmlFor="resume-upload" className="cursor-pointer block">
                    <FileText className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                    <p className="text-lg font-medium text-blue-600 hover:text-blue-800 transition-colors">
                      {resumeFile ? resumeFile.name : 'Click to upload your resume'}
                    </p>
                    <p className="text-sm text-gray-500 mt-2">PDF, DOC, or DOCX (max 5MB)</p>
                    <p className="text-xs text-gray-400 mt-1">Your resume will be analyzed to generate personalized questions</p>
                  </label>
                )}
              </div>
            </div>

            {error && (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* Action Buttons */}
            <div className="space-y-4 pt-4">
              <Button
                onClick={handleStartInterview}
                disabled={loading || !resumeUploaded || !candidate.name || !candidate.email || !candidate.position}
                className="w-full h-12 text-lg font-semibold bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 disabled:from-gray-400 disabled:to-gray-500"
              >
                {loading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Preparing Interview...
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <Zap className="w-5 h-5" />
                    Start AI Interview
                  </div>
                )}
              </Button>

              {/* Requirements Checklist */}
              <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                <h4 className="font-semibold text-gray-700 mb-3">Requirements Checklist:</h4>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className={`flex items-center gap-2 ${candidate.name ? 'text-green-600' : 'text-gray-500'}`}>
                    {candidate.name ? <CheckCircle className="w-4 h-4" /> : <Clock className="w-4 h-4" />}
                    Full Name
                  </div>
                  <div className={`flex items-center gap-2 ${candidate.email ? 'text-green-600' : 'text-gray-500'}`}>
                    {candidate.email ? <CheckCircle className="w-4 h-4" /> : <Clock className="w-4 h-4" />}
                    Email Address
                  </div>
                  <div className={`flex items-center gap-2 ${candidate.position ? 'text-green-600' : 'text-gray-500'}`}>
                    {candidate.position ? <CheckCircle className="w-4 h-4" /> : <Clock className="w-4 h-4" />}
                    Position Selection
                  </div>
                  <div className={`flex items-center gap-2 ${resumeUploaded ? 'text-green-600' : 'text-gray-500'}`}>
                    {resumeUploaded ? <CheckCircle className="w-4 h-4" /> : <Clock className="w-4 h-4" />}
                    Resume Upload
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Step 2: Interview Questions
  if (step === 'interview') {
    return (
      <div className="max-w-4xl mx-auto p-6">
        {/* Enhanced Header */}
        <Card className="border-2 border-blue-200 shadow-lg mb-6">
          <CardContent className="p-6">
            <div className="flex justify-between items-center mb-4">
              <div className="space-y-1">
                <h2 className="text-2xl font-bold text-gray-800">AI Interview: {candidate.position}</h2>
                <p className="text-gray-600">Candidate: {candidate.name}</p>
              </div>
              <div className="text-right space-y-1">
                <div className="text-lg font-semibold text-gray-700">
                  Question {responses.length + 1} of {interview?.questions.length || 6}
                </div>
                <div className={`text-2xl font-bold font-mono px-3 py-1 rounded-lg ${
                  timeRemaining <= 10 ? 'bg-red-100 text-red-700' : 
                  timeRemaining <= 30 ? 'bg-yellow-100 text-yellow-700' : 
                  'bg-green-100 text-green-700'
                }`}>
                  {formatTime(timeRemaining)}
                </div>
              </div>
            </div>
            <Progress value={getProgressPercentage()} className="h-3" />
            <div className="flex justify-between text-sm text-gray-500 mt-2">
              <span>Progress: {Math.round(getProgressPercentage())}% completed</span>
              <span>{responses.length} questions answered</span>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Question Area */}
          <div className="lg:col-span-2">
            <Card className="border-l-4 border-l-blue-500 shadow-lg">
              <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50">
                <div className="space-y-4">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-3">
                      <span className={getDifficultyBadge(currentQuestion?.difficulty || 'easy')}>
                        {currentQuestion?.difficulty?.toUpperCase()}
                      </span>
                      <div className="flex items-center gap-1 text-sm text-gray-600">
                        <Target className="w-4 h-4" />
                        {currentQuestion?.timeLimit}s time limit
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs text-gray-500 mb-1">Time Remaining</div>
                      <div className={`text-xl font-bold font-mono px-2 py-1 rounded ${
                        timeRemaining <= 10 ? 'bg-red-200 text-red-800' : 
                        timeRemaining <= 30 ? 'bg-yellow-200 text-yellow-800' : 
                        'bg-green-200 text-green-800'
                      }`}>
                        {formatTime(timeRemaining)}
                      </div>
                    </div>
                  </div>
                  <CardTitle className="text-xl leading-relaxed text-gray-800">
                    {currentQuestion?.question}
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Your Answer:
                    </label>
                    <Textarea
                      placeholder="Type your detailed answer here... Be specific and provide examples where possible."
                      value={currentResponse}
                      onChange={(e) => setCurrentResponse(e.target.value)}
                      rows={10}
                      className="border-2 border-gray-200 focus:border-blue-500 transition-colors resize-none text-base"
                      disabled={!isAnswering}
                    />
                    <div className="flex justify-between text-sm text-gray-500 mt-2">
                      <span>{currentResponse.length} characters</span>
                      <span>{currentResponse.trim().split(' ').filter(word => word.length > 0).length} words</span>
                    </div>
                  </div>
                  
                  {error && (
                    <Alert className="border-red-200 bg-red-50">
                      <AlertCircle className="h-4 w-4 text-red-600" />
                      <AlertDescription className="text-red-700">{error}</AlertDescription>
                    </Alert>
                  )}

                  <Button
                    onClick={() => handleSubmitResponse(false)}
                    disabled={loading || !isAnswering || !currentResponse.trim()}
                    className="w-full h-12 text-lg font-semibold bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 disabled:from-gray-400 disabled:to-gray-500"
                  >
                    {loading ? (
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        Submitting Answer...
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <CheckCircle className="w-5 h-5" />
                        Submit Answer ({currentResponse.trim() ? 'Ready' : 'Enter answer first'})
                      </div>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Progress Sidebar */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Progress Overview</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {interview?.questions.map((q: Question, index: number) => (
                  <div key={q.id} className={`p-3 rounded-lg border ${
                    index < responses.length
                      ? 'bg-green-50 border-green-200'
                      : index === responses.length
                      ? 'bg-blue-50 border-blue-200'
                      : 'bg-gray-50 border-gray-200'
                  }`}>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-sm font-medium">Q{index + 1}</span>
                      <span className={getDifficultyBadge(q.difficulty)}>
                        {q.difficulty}
                      </span>
                    </div>
                    <p className="text-xs text-gray-600 line-clamp-2">{q.question}</p>
                    {index < responses.length && (
                      <div className="mt-2 text-xs">
                        <span className="text-green-600 font-medium">
                          Score: {responses[index]?.score || 0}/100
                        </span>
                      </div>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  // Step 3: Completed - Final Report
  if (step === 'completed') {
    return (
      <div className="max-w-4xl mx-auto p-6 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="w-6 h-6 text-green-600" />
              Interview Completed
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center mb-6">
              <h3 className="text-2xl font-bold text-gray-900">{candidate.name}</h3>
              <p className="text-gray-600">{candidate.position} Position</p>
            </div>
            
            {finalReport && (
              <div className="space-y-6">
                {/* Overall Score */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card>
                    <CardContent className="pt-6 text-center">
                      <div className="text-3xl font-bold text-blue-600">
                        {finalReport.candidate?.averageScore || 0}%
                      </div>
                      <p className="text-sm text-gray-600">Overall Score</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-6 text-center">
                      <div className="text-3xl font-bold text-green-600">
                        {finalReport.candidate?.totalScore || 0}
                      </div>
                      <p className="text-sm text-gray-600">Total Points</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-6 text-center">
                      <div className="text-lg font-bold text-purple-600">
                        {finalReport.recommendation || 'Pending'}
                      </div>
                      <p className="text-sm text-gray-600">Recommendation</p>
                    </CardContent>
                  </Card>
                </div>

                {/* Difficulty Breakdown */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <BarChart3 className="w-5 h-5" />
                      Performance Breakdown
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-3 gap-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-green-600">
                          {finalReport.breakdown?.easy?.average || 0}%
                        </div>
                        <p className="text-sm text-gray-600">Easy Questions</p>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-yellow-600">
                          {finalReport.breakdown?.medium?.average || 0}%
                        </div>
                        <p className="text-sm text-gray-600">Medium Questions</p>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-red-600">
                          {finalReport.breakdown?.hard?.average || 0}%
                        </div>
                        <p className="text-sm text-gray-600">Hard Questions</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* AI Summary */}
                <Card>
                  <CardHeader>
                    <CardTitle>AI Assessment Summary</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-700 leading-relaxed">
                      {finalReport.aiSummary}
                    </p>
                    
                    {finalReport.strengths && finalReport.strengths.length > 0 && (
                      <div className="mt-4">
                        <h4 className="font-semibold text-green-700 mb-2">Strengths:</h4>
                        <div className="flex flex-wrap gap-2">
                          {finalReport.strengths.map((strength, index) => (
                            <span key={index} className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm">
                              {strength}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {finalReport.improvements && finalReport.improvements.length > 0 && (
                      <div className="mt-4">
                        <h4 className="font-semibold text-orange-700 mb-2">Areas for Improvement:</h4>
                        <div className="flex flex-wrap gap-2">
                          {finalReport.improvements.map((improvement, index) => (
                            <span key={index} className="px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-sm">
                              {improvement}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Response Details */}
                <Card>
                  <CardHeader>
                    <CardTitle>Question Responses</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {responses.map((resp, index) => (
                        <div key={index} className="border rounded-lg p-4">
                          <div className="flex justify-between items-start mb-2">
                            <h4 className="font-medium">Q{index + 1}: {resp.question}</h4>
                            <div className="flex items-center gap-2">
                              <span className={getDifficultyBadge(resp.difficulty)}>
                                {resp.difficulty}
                              </span>
                              <span className="text-sm font-medium">
                                {resp.score}/100
                              </span>
                            </div>
                          </div>
                          <p className="text-gray-600 text-sm mb-2">
                            <strong>Answer:</strong> {resp.response}
                          </p>
                          <p className="text-xs text-gray-500">
                            Time used: {resp.timeUsed}s
                          </p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </CardContent>
        </Card>
        
        <div className="text-center">
          <Button onClick={() => window.location.reload()} variant="outline">
            Start New Interview
          </Button>
        </div>
      </div>
    );
  }

  return null;
};

export default InterviewWorkflowComponent;