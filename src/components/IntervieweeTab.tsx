import { useState, useEffect, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Upload, MessageCircle, Clock, FileText, Send, CheckCircle2, AlertCircle, Brain, Zap } from 'lucide-react';
import type { RootState } from '../store';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { parseResumeFile } from '../utils/resumeParser';
import { generateInterviewQuestions, calculateFinalScore, generateCandidateSummary } from '../utils/interviewLogic';
import { addCandidate, setCandidateScore } from '../store/slices/candidatesSlice';
import { startInterview, setCurrentQuestion, addChatMessage, nextQuestion, endInterview } from '../store/slices/interviewSlice';
import type { Candidate } from '../types';

interface IntervieweeTabProps {}

const IntervieweeTab: React.FC<IntervieweeTabProps> = () => {
  const dispatch = useDispatch();
  const { currentInterview, chatHistory, currentQuestion, timeRemaining, timerStatus } = useSelector((state: RootState) => state.interview);
  
  // Local state
  const [step, setStep] = useState<'upload' | 'info' | 'interview' | 'completed'>('upload');
  const [candidateInfo, setCandidateInfo] = useState({ name: '', email: '', phone: '' });
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [currentAnswer, setCurrentAnswer] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Refs
  const chatEndRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<number | null>(null);

  // Auto-scroll chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory]);

  // Timer logic
  useEffect(() => {
    if (timerStatus === 'running' && timeRemaining > 0) {
      timerRef.current = window.setInterval(() => {
        dispatch({ type: 'interview/updateTimeRemaining', payload: timeRemaining - 1 });
      }, 1000);
    } else if (timeRemaining === 0 && currentQuestion) {
      handleTimeUp();
    }

    return () => {
      if (timerRef.current) window.clearInterval(timerRef.current);
    };
  }, [timerStatus, timeRemaining, currentQuestion, dispatch]);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.type !== 'application/pdf' && file.type !== 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
      setError('Please upload a PDF or DOCX file');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const resumeData = await parseResumeFile(file);
      setCandidateInfo({
        name: resumeData.name || '',
        email: resumeData.email || '',
        phone: resumeData.phone || ''
      });
      setResumeFile(file);
      setStep('info');
    } catch (err) {
      setError('Failed to parse resume. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleStartInterview = async () => {
    if (!candidateInfo.name || !candidateInfo.email || !candidateInfo.phone) {
      setError('Please fill in all required information');
      return;
    }

    const candidate: Candidate = {
      id: Date.now().toString(),
      ...candidateInfo,
      status: 'interviewing',
      createdAt: new Date(),
      resumeFile: resumeFile || undefined
    };

    const questions = generateInterviewQuestions();
    
    dispatch(addCandidate(candidate));
    dispatch(startInterview({
      id: Date.now().toString(),
      candidateId: candidate.id,
      questions,
      answers: [],
      currentQuestionIndex: 0,
      isPaused: false
    }));

    // Add welcome message
    dispatch(addChatMessage({
      id: Date.now().toString(),
      type: 'bot',
      content: `Hello ${candidateInfo.name}! Welcome to your technical interview. You'll be asked 6 questions with varying difficulty levels. Good luck!`,
      timestamp: new Date()
    }));

    // Start with first question
    dispatch(setCurrentQuestion(questions[0]));
    setStep('interview');
  };

  const handleSubmitAnswer = () => {
    if (!currentAnswer.trim() || !currentQuestion || !currentInterview) return;

    // Add user message
    dispatch(addChatMessage({
      id: Date.now().toString(),
      type: 'user',
      content: currentAnswer,
      timestamp: new Date(),
      questionId: currentQuestion.id
    }));

    // Add answer to interview
    dispatch({ 
      type: 'interview/addAnswer', 
      payload: {
        questionId: currentQuestion.id,
        answer: currentAnswer,
        timeSpent: currentQuestion.timeLimit - timeRemaining,
        timestamp: new Date()
      }
    });

    // Move to next question or complete interview
    const nextIndex = currentInterview.currentQuestionIndex + 1;
    if (nextIndex < currentInterview.questions.length) {
      dispatch(nextQuestion());
      dispatch(setCurrentQuestion(currentInterview.questions[nextIndex]));
      
      // Add next question message
      setTimeout(() => {
        dispatch(addChatMessage({
          id: Date.now().toString(),
          type: 'bot',
          content: currentInterview.questions[nextIndex].text,
          timestamp: new Date(),
          questionId: currentInterview.questions[nextIndex].id,
          isQuestion: true
        }));
      }, 1000);
    } else {
      completeInterview();
    }

    setCurrentAnswer('');
  };

  const handleTimeUp = () => {
    if (!currentAnswer.trim()) {
      setCurrentAnswer('No answer provided');
    }
    setTimeout(() => handleSubmitAnswer(), 100);
  };

  const completeInterview = () => {
    if (!currentInterview) return;

    const finalScore = calculateFinalScore(currentInterview.answers, currentInterview.questions);
    const summary = generateCandidateSummary(currentInterview.answers, currentInterview.questions, finalScore);

    dispatch(setCandidateScore({
      id: currentInterview.candidateId,
      score: finalScore,
      summary
    }));

    dispatch(endInterview());
    
    dispatch(addChatMessage({
      id: Date.now().toString(),
      type: 'system',
      content: `Interview completed! Your final score: ${finalScore}/100. ${summary}`,
      timestamp: new Date()
    }));

    setStep('completed');
  };

  const renderUploadStep = () => (
    <div className="max-w-3xl mx-auto">
      <Card className="shadow-2xl border-0 bg-white/80 backdrop-blur-sm">
        <CardHeader className="text-center pb-8">
          <div className="mx-auto w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mb-6 shadow-lg">
            <FileText className="w-10 h-10 text-white" />
          </div>
          <CardTitle className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Upload Your Resume
          </CardTitle>
          <CardDescription className="text-lg text-gray-600 mt-2">
            Upload your resume in PDF or DOCX format to begin your AI-powered interview
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6 pb-8">
          <div className="relative">
            <div className="border-2 border-dashed border-blue-300 rounded-xl p-12 text-center hover:border-blue-500 hover:bg-blue-50/50 transition-all duration-300 bg-gradient-to-br from-blue-50/30 to-purple-50/30">
              <div className="space-y-6">
                <Upload className="w-16 h-16 text-blue-500 mx-auto" />
                <div className="space-y-2">
                  <p className="text-lg font-medium text-gray-700">
                    Drag and drop your resume here
                  </p>
                  <p className="text-gray-500">
                    or click to browse your files
                  </p>
                </div>
                <Input
                  type="file"
                  accept=".pdf,.docx"
                  onChange={handleFileUpload}
                  className="hidden"
                  id="resume-upload"
                />
                <Button 
                  asChild 
                  size="lg"
                  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg"
                >
                  <label htmlFor="resume-upload" className="cursor-pointer">
                    Choose File
                  </label>
                </Button>
              </div>
            </div>
          </div>
          
          <div className="flex items-center justify-center space-x-8 text-sm text-gray-500">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <span>PDF Supported</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <span>DOCX Supported</span>
            </div>
          </div>

          {error && (
            <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}
          
          {isLoading && (
            <div className="text-center space-y-4 py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-blue-600 mx-auto"></div>
              <div className="space-y-2">
                <p className="text-lg font-medium text-gray-700">Analyzing your resume...</p>
                <p className="text-sm text-gray-500">Our AI is extracting your information</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );

  const renderInfoStep = () => (
    <div className="max-w-2xl mx-auto">
      <Card className="shadow-2xl border-0 bg-white/80 backdrop-blur-sm">
        <CardHeader className="text-center pb-6">
          <div className="mx-auto w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center mb-4 shadow-lg">
            <CheckCircle2 className="w-8 h-8 text-white" />
          </div>
          <CardTitle className="text-2xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
            Complete Your Information
          </CardTitle>
          <CardDescription className="text-gray-600">
            We've extracted information from your resume. Please verify and complete any missing fields.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-6">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                Full Name *
              </label>
              <Input
                value={candidateInfo.name}
                onChange={(e) => setCandidateInfo(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Enter your full name"
                className="h-12 text-lg border-2 focus:border-blue-500"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                Email Address *
              </label>
              <Input
                type="email"
                value={candidateInfo.email}
                onChange={(e) => setCandidateInfo(prev => ({ ...prev, email: e.target.value }))}
                placeholder="Enter your email address"
                className="h-12 text-lg border-2 focus:border-purple-500"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                <div className="w-2 h-2 bg-indigo-500 rounded-full"></div>
                Phone Number *
              </label>
              <Input
                value={candidateInfo.phone}
                onChange={(e) => setCandidateInfo(prev => ({ ...prev, phone: e.target.value }))}
                placeholder="Enter your phone number"
                className="h-12 text-lg border-2 focus:border-indigo-500"
              />
            </div>
          </div>

          {error && (
            <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}
          
          <Button 
            onClick={handleStartInterview} 
            className="w-full h-12 text-lg bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg"
          >
            🚀 Start AI Interview
          </Button>
        </CardContent>
      </Card>
    </div>
  );

  const renderInterviewStep = () => (
    <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-4 gap-6">
      {/* Interview Progress Sidebar */}
      <div className="lg:col-span-1">
        <div className="sticky top-6 space-y-6">
          <Card className="shadow-xl border-0 bg-gradient-to-br from-blue-50 to-indigo-50">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-blue-700">
                <Clock className="w-5 h-5" />
                Interview Progress
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {currentInterview && (
                <>
                  <div>
                    <div className="flex justify-between text-sm mb-3 font-medium">
                      <span>Question {currentInterview.currentQuestionIndex + 1} of {currentInterview.questions.length}</span>
                      <span className="text-blue-600">{Math.round((currentInterview.currentQuestionIndex / currentInterview.questions.length) * 100)}%</span>
                    </div>
                    <Progress 
                      value={(currentInterview.currentQuestionIndex / currentInterview.questions.length) * 100} 
                      className="h-3"
                    />
                  </div>
                  
                  {currentQuestion && (
                    <div className="text-center p-4 bg-white rounded-xl shadow-sm">
                      <div className={`text-4xl font-bold mb-2 ${timeRemaining <= 10 ? 'text-red-500 pulse-timer' : 'text-blue-600'}`}>
                        {Math.floor(timeRemaining / 60)}:{(timeRemaining % 60).toString().padStart(2, '0')}
                      </div>
                      <div className={`text-xs font-semibold uppercase tracking-wider px-3 py-1 rounded-full inline-block ${
                        currentQuestion.difficulty === 'easy' ? 'bg-green-100 text-green-700' :
                        currentQuestion.difficulty === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-red-100 text-red-700'
                      }`}>
                        {currentQuestion.difficulty} Question
                      </div>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Chat Interface */}
      <div className="lg:col-span-3">
        <Card className="h-[700px] flex flex-col shadow-xl border-0 bg-white/90 backdrop-blur-sm">
          <CardHeader className="bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-t-lg">
            <CardTitle className="flex items-center gap-2">
              <MessageCircle className="w-6 h-6" />
              AI Interview Assistant
            </CardTitle>
            <CardDescription className="text-blue-100">
              Answer questions naturally - our AI is here to help assess your skills
            </CardDescription>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col p-0">
            {/* Chat History */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
              {chatHistory.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[80%] rounded-2xl px-4 py-3 shadow-sm ${
                      message.type === 'user'
                        ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white'
                        : message.type === 'bot'
                        ? 'bg-gray-100 text-gray-800 border border-gray-200'
                        : 'bg-gradient-to-r from-orange-100 to-yellow-100 text-orange-800 border border-orange-200'
                    }`}
                  >
                    <p className="text-sm leading-relaxed">{message.content}</p>
                    <p className="text-xs opacity-60 mt-2">
                      {new Date(message.timestamp).toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              ))}
              <div ref={chatEndRef} />
            </div>

            {/* Answer Input */}
            {currentQuestion && timerStatus !== 'completed' && (
              <div className="border-t bg-gray-50/50 p-6 space-y-4">
                <Textarea
                  value={currentAnswer}
                  onChange={(e) => setCurrentAnswer(e.target.value)}
                  placeholder="Type your detailed answer here... Press Enter to submit or Shift+Enter for new line"
                  rows={4}
                  className="border-2 focus:border-blue-500 bg-white resize-none"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSubmitAnswer();
                    }
                  }}
                />
                <Button 
                  onClick={handleSubmitAnswer} 
                  className="w-full h-12 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg"
                  disabled={!currentAnswer.trim()}
                >
                  <Send className="w-5 h-5 mr-2" />
                  Submit Answer & Continue
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );

  const renderCompletedStep = () => (
    <div className="max-w-3xl mx-auto text-center">
      <Card className="shadow-2xl border-0 bg-gradient-to-br from-green-50 to-emerald-50">
        <CardHeader className="pb-8">
          <div className="mx-auto w-24 h-24 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center mb-6 shadow-xl">
            <CheckCircle2 className="w-12 h-12 text-white" />
          </div>
          <CardTitle className="text-4xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent mb-4">
            🎉 Interview Completed!
          </CardTitle>
          <CardDescription className="text-lg text-gray-600">
            Congratulations! You've successfully completed your AI-powered technical interview.
            Your responses have been recorded and analyzed.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6 pb-8">
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-800 mb-3">What happens next?</h3>
            <div className="grid md:grid-cols-3 gap-4 text-sm text-gray-600">
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-blue-600 font-bold text-xs">1</span>
                </div>
                <span>AI analysis of your responses</span>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-purple-600 font-bold text-xs">2</span>
                </div>
                <span>Score calculation & feedback</span>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-green-600 font-bold text-xs">3</span>
                </div>
                <span>Results available in dashboard</span>
              </div>
            </div>
          </div>
          
          <Button 
            onClick={() => {
              setStep('upload');
              setCandidateInfo({ name: '', email: '', phone: '' });
              setResumeFile(null);
              setCurrentAnswer('');
            }}
            size="lg"
            className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 shadow-lg px-8"
          >
            🚀 Start Another Interview
          </Button>
        </CardContent>
      </Card>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 p-6">
      <div className="container mx-auto">
        {step === 'upload' && renderUploadStep()}
        {step === 'info' && renderInfoStep()}
        {step === 'interview' && renderInterviewStep()}
        {step === 'completed' && renderCompletedStep()}
      </div>
    </div>
  );
};

export default IntervieweeTab;