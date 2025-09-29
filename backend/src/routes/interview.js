import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import Interview from '../models/Interview.js';
import User from '../models/User.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { validateInterview } from '../middleware/validation.js';
import { getGeminiService } from '../services/geminiService.js';
import resumeService from '../services/resumeService.js';
import interviewService from '../services/interviewService.js';
import pdfReportService from '../services/pdfReportService.js';

const router = express.Router();

// Configure multer for file uploads - using memory storage for simplicity
const upload = multer({ 
  storage: multer.memoryStorage(), // Store in memory instead of disk
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = /pdf|doc|docx/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (extname && mimetype) {
      return cb(null, true);
    } else {
      cb(new Error('Only PDF and DOC files are allowed'));
    }
  }
});

// Upload and process resume
router.post('/upload-resume', upload.single('resume'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ 
        message: 'No file uploaded. Please select a PDF or DOC file.' 
      });
    }

    console.log('Processing file:', req.file.originalname);

    // Process the uploaded PDF using the buffer from memory storage
    const resumeData = await resumeService.processResumeUpload(
      req.file.buffer,
      req.file.originalname
    );

    console.log('Resume processed successfully');
    console.log('Parsed data being returned:', JSON.stringify(resumeData.parsedData, null, 2));
    console.log('About to send response to frontend...');

    // Save resume data to user profile if email provided
    if (req.body.email) {
      try {
        const user = await User.findOne({ email: req.body.email });
        if (user) {
          user.profile = {
            ...user.profile,
            resumeData: resumeData.parsedData,
            resumeText: resumeData.extractedText,
            resumeProcessedAt: new Date()
          };
          await user.save();
          console.log('Resume data saved to user profile');
        }
      } catch (userError) {
        console.error('Error saving to user profile:', userError);
        // Continue anyway - don't fail the whole upload
      }
    }

    const responseData = {
      message: 'Resume processed successfully',
      extractedData: resumeData.parsedData,
      resumeData: resumeData.parsedData, // Keep both for compatibility
      extractedText: resumeData.extractedText,
      resumeText: resumeData.extractedText, // Alternative field name
      warning: resumeData.warning
    };
    
    console.log('Sending response:', JSON.stringify(responseData, null, 2));
    res.json(responseData);

  } catch (error) {
    console.error('Resume upload error:', error);
    res.status(500).json({ 
      message: 'Error processing resume', 
      error: error.message 
    });
  }
});

// Start interview session with AI-generated questions
router.post('/start', async (req, res) => {
  try {
    const { candidateEmail, candidateName, position } = req.body;

    if (!candidateEmail || !candidateName || !position) {
      return res.status(400).json({ 
        message: 'candidateEmail, candidateName, and position are required' 
      });
    }

    // Get user's resume data
    let resumeData = null;
    let resumeText = '';
    
    try {
      const user = await User.findOne({ email: candidateEmail });
      if (user && user.profile) {
        resumeData = user.profile.resumeData;
        resumeText = user.profile.resumeText || '';
      }
    } catch (userError) {
      console.log('Could not fetch user resume data:', userError.message);
    }

    // Generate dynamic questions based on position and resume
    const questions = await interviewService.generateInterviewQuestions(resumeData, position);

    // Create new interview session
    const interview = new Interview({
      candidateName,
      candidateEmail,
      position,
      questions,
      status: 'in-progress',
      startedAt: new Date(),
      currentQuestionIndex: 0,
      responses: []
    });

    await interview.save();

    res.json({
      message: 'Interview started successfully',
      interview: {
        id: interview._id,
        candidateName: interview.candidateName,
        position: interview.position,
        questions: interview.questions,
        currentQuestionIndex: interview.currentQuestionIndex,
        status: interview.status,
        startedAt: interview.startedAt
      }
    });

  } catch (error) {
    console.error('Error starting interview:', error);
    res.status(500).json({ 
      message: 'Error starting interview', 
      error: error.message 
    });
  }
});

// Submit response to current question
router.post('/:interviewId/response', async (req, res) => {
  try {
    const { interviewId } = req.params;
    const { response, timeUsed, questionId } = req.body;

    if (!response) {
      return res.status(400).json({ message: 'Response is required' });
    }

    const interview = await Interview.findById(interviewId);
    if (!interview) {
      return res.status(404).json({ message: 'Interview not found' });
    }

    if (interview.status !== 'in-progress') {
      return res.status(400).json({ message: 'Interview is not in progress' });
    }

    // Get current question
    const currentQuestion = interview.questions[interview.currentQuestionIndex];
    if (!currentQuestion) {
      return res.status(400).json({ message: 'No current question found' });
    }

    // Calculate score based on response using AI evaluation
    console.log('Evaluating response with AI...');
    const evaluationResult = await interviewService.calculateResponseScore(currentQuestion, response, timeUsed || 0);
    console.log('AI evaluation completed. Score:', evaluationResult.score);

    // Add response to interview
    const responseData = {
      questionId: questionId || currentQuestion.id,
      questionIndex: interview.currentQuestionIndex,
      question: currentQuestion.question,
      response,
      timeUsed: timeUsed || 0,
      timeLimit: currentQuestion.timeLimit,
      score: evaluationResult.score,
      aiAnalysis: evaluationResult.aiAnalysis,
      submittedAt: new Date()
    };

    interview.responses.push(responseData);

    // Move to next question or complete interview
    const isLastQuestion = interview.currentQuestionIndex >= interview.questions.length - 1;
    
    if (isLastQuestion) {
      // Complete the interview
      console.log('Completing interview for:', interview.candidateName);
      interview.status = 'completed';
      interview.completedAt = new Date();
      interview.duration = Math.round((new Date() - interview.startedAt) / 1000 / 60); // minutes
      
      // Generate final assessment
      console.log('Generating final report...');
      const finalReport = await interviewService.generateFinalReport(interview);
      interview.finalReport = finalReport;
      console.log('Final report generated successfully');
      
    } else {
      // Move to next question
      interview.currentQuestionIndex++;
    }

    await interview.save();

    const responsePayload = {
      message: isLastQuestion ? 'Interview completed' : 'Response submitted successfully',
      currentQuestionIndex: interview.currentQuestionIndex,
      isCompleted: isLastQuestion,
      score: evaluationResult.score,
      aiAnalysis: evaluationResult.aiAnalysis
    };

    if (isLastQuestion) {
      responsePayload.finalReport = interview.finalReport;
    } else {
      responsePayload.nextQuestion = interview.questions[interview.currentQuestionIndex];
    }

    res.json(responsePayload);

  } catch (error) {
    console.error('Error submitting response:', error);
    res.status(500).json({ 
      message: 'Error submitting response', 
      error: error.message 
    });
  }
});

// Get interview status and current question
router.get('/:interviewId/status', async (req, res) => {
  try {
    const { interviewId } = req.params;
    
    const interview = await Interview.findById(interviewId);
    if (!interview) {
      return res.status(404).json({ message: 'Interview not found' });
    }

    const currentQuestion = interview.questions[interview.currentQuestionIndex];

    res.json({
      interview: {
        id: interview._id,
        candidateName: interview.candidateName,
        position: interview.position,
        status: interview.status,
        currentQuestionIndex: interview.currentQuestionIndex,
        totalQuestions: interview.questions.length,
        currentQuestion: currentQuestion,
        responses: interview.responses,
        startedAt: interview.startedAt,
        completedAt: interview.completedAt
      }
    });

  } catch (error) {
    console.error('Error getting interview status:', error);
    res.status(500).json({ 
      message: 'Error getting interview status', 
      error: error.message 
    });
  }
});

// Get interview report (final results)
router.get('/:interviewId/report', async (req, res) => {
  try {
    const { interviewId } = req.params;
    
    const interview = await Interview.findById(interviewId);
    if (!interview) {
      return res.status(404).json({ message: 'Interview not found' });
    }

    if (interview.status !== 'completed') {
      return res.status(400).json({ message: 'Interview not yet completed' });
    }

    res.json({
      finalReport: interview.finalReport,
      interview: {
        id: interview._id,
        candidateName: interview.candidateName,
        candidateEmail: interview.candidateEmail,
        position: interview.position,
        status: interview.status,
        startedAt: interview.startedAt,
        completedAt: interview.completedAt,
        duration: interview.duration
      },
      responses: interview.responses,
      questions: interview.questions
    });

  } catch (error) {
    console.error('Error getting interview report:', error);
    res.status(500).json({ 
      message: 'Error getting interview report', 
      error: error.message 
    });
  }
});

// Get completed interviews for interviewer dashboard
router.get('/completed', async (req, res) => {
  try {
    console.log('Fetching completed interviews...');
    
    // First check all interviews with status completed
    const allCompletedInterviews = await Interview.find({ status: 'completed' });
    console.log('All completed interviews count:', allCompletedInterviews.length);
    
    // Check interviews with finalReport
    const interviewsWithReport = await Interview.find({ 
      status: 'completed',
      finalReport: { $exists: true }
    });
    console.log('Completed interviews with finalReport count:', interviewsWithReport.length);

    const completedInterviews = await Interview.find({ 
      status: 'completed',
      finalReport: { $exists: true }
    })
    .select('candidateName candidateEmail position completedAt finalReport duration responses')
    .sort({ completedAt: -1 })
    .limit(50); // Limit to last 50 interviews

    console.log('Final interviews to return:', completedInterviews.length);
    
    res.json({
      message: 'Completed interviews fetched successfully',
      interviews: completedInterviews
    });

  } catch (error) {
    console.error('Error fetching completed interviews:', error);
    res.status(500).json({ 
      message: 'Error fetching completed interviews', 
      error: error.message 
    });
  }
});

// Terminate interview due to violations
router.post('/:interviewId/terminate', async (req, res) => {
  try {
    const { interviewId } = req.params;
    const { reason, questionsCompleted, totalQuestions, violations, terminatedAt } = req.body;

    const interview = await Interview.findById(interviewId);
    if (!interview) {
      return res.status(404).json({ message: 'Interview not found' });
    }

    // Update interview status
    interview.status = 'terminated';
    interview.completedAt = new Date(terminatedAt);
    interview.duration = Math.round((new Date(terminatedAt) - interview.startedAt) / 1000 / 60); // minutes
    
    // Add violation tracking to interview
    interview.violations = violations || [];
    interview.terminationReason = reason;
    interview.questionsCompleted = questionsCompleted;
    interview.totalQuestions = totalQuestions;

    // Generate a special final report for terminated interviews
    const violationSummary = violations.length > 0 
      ? `Interview terminated due to ${violations.length} violation(s): ${violations.map(v => v.type).join(', ')}`
      : 'Interview terminated early';

    const finalReport = {
      candidate: {
        name: interview.candidateName,
        position: interview.position,
        totalQuestions: totalQuestions,
        questionsCompleted: questionsCompleted,
        totalScore: 0,
        averageScore: 0,
        accuracyPercentage: 0,
        correctAnswers: 0,
        duration: interview.duration || 0
      },
      breakdown: {
        easy: { total: 0, count: 0, average: 0, accuracy: 0 },
        medium: { total: 0, count: 0, average: 0, accuracy: 0 },
        hard: { total: 0, count: 0, average: 0, accuracy: 0 }
      },
      recommendation: 'No Hire',
      confidenceLevel: 'High',
      technicalCompetency: 'Cannot Assess',
      communicationScore: 0,
      strengths: [],
      improvements: ['Complete interview without violations', 'Follow test guidelines'],
      aiSummary: `${violationSummary}. Completed ${questionsCompleted} out of ${totalQuestions} questions. ${reason}`,
      categoryInsights: {},
      violations: violations,
      terminationReason: reason,
      isTerminated: true,
      generatedAt: new Date().toISOString()
    };

    interview.finalReport = finalReport;
    await interview.save();

    res.json({
      message: 'Interview terminated successfully',
      finalReport: finalReport
    });

  } catch (error) {
    console.error('Error terminating interview:', error);
    res.status(500).json({ 
      message: 'Error terminating interview', 
      error: error.message 
    });
  }
});

// Generate PDF report for interview
router.get('/:interviewId/pdf-report', async (req, res) => {
  try {
    const { interviewId } = req.params;
    
    // Find the interview with full details
    const interview = await Interview.findById(interviewId);
    if (!interview) {
      return res.status(404).json({ message: 'Interview not found' });
    }

    // Get candidate resume data if available
    let candidateData = null;
    if (interview.candidateEmail) {
      try {
        const user = await User.findOne({ email: interview.candidateEmail });
        if (user && user.profile) {
          candidateData = {
            resumeData: user.profile.resumeData,
            resumeText: user.profile.resumeText
          };
        }
      } catch (userError) {
        console.log('Could not fetch candidate resume data:', userError.message);
      }
    }

    // Generate PDF report
    const pdfBuffer = await pdfReportService.generateInterviewReport(interview, candidateData);
    
    // Set response headers for PDF download
    const fileName = `interview_report_${interview.candidateName.replace(/\s+/g, '_')}_${interview.position.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`;
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    res.setHeader('Content-Length', pdfBuffer.length);
    
    // Send the PDF buffer
    res.send(pdfBuffer);

  } catch (error) {
    console.error('Error generating PDF report:', error);
    res.status(500).json({ 
      message: 'Error generating PDF report', 
      error: error.message 
    });
  }
});

// Generate PDF report by candidate email (alternative endpoint)
router.post('/pdf-report-by-email', async (req, res) => {
  try {
    const { candidateEmail } = req.body;
    
    if (!candidateEmail) {
      return res.status(400).json({ message: 'Candidate email is required' });
    }

    // Find the most recent completed interview for this candidate
    const interview = await Interview.findOne({ 
      candidateEmail: candidateEmail,
      status: { $in: ['completed', 'terminated'] }
    }).sort({ completedAt: -1 });
    
    if (!interview) {
      return res.status(404).json({ 
        message: 'No completed interview found for this candidate' 
      });
    }

    // Get candidate resume data
    let candidateData = null;
    try {
      const user = await User.findOne({ email: candidateEmail });
      if (user && user.profile) {
        candidateData = {
          resumeData: user.profile.resumeData,
          resumeText: user.profile.resumeText
        };
      }
    } catch (userError) {
      console.log('Could not fetch candidate resume data:', userError.message);
    }

    // Generate PDF report
    const pdfBuffer = await pdfReportService.generateInterviewReport(interview, candidateData);
    
    // Set response headers for PDF download
    const fileName = `interview_report_${interview.candidateName.replace(/\s+/g, '_')}_${interview.position.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`;
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    res.setHeader('Content-Length', pdfBuffer.length);
    
    // Send the PDF buffer
    res.send(pdfBuffer);

  } catch (error) {
    console.error('Error generating PDF report by email:', error);
    res.status(500).json({ 
      message: 'Error generating PDF report', 
      error: error.message 
    });
  }
});

export default router;