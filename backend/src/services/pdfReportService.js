import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';

class PDFReportService {
  
  async generateInterviewReport(interview, candidateData = null) {
    try {
      // Create a new PDF document
      const doc = new PDFDocument({
        size: 'A4',
        margin: 50,
        info: {
          Title: `Interview Assessment Report - ${interview.candidateName}`,
          Author: 'AI Interview Assistant',
          Subject: 'Technical Interview Assessment',
          Creator: 'AI Interview System'
        }
      });

      // Create a buffer to store the PDF
      const buffers = [];
      doc.on('data', buffers.push.bind(buffers));
      
      // Add header
      this.addHeader(doc, interview);
      
      // Add candidate information
      this.addCandidateInfo(doc, interview, candidateData);
      
      // Add assessment overview
      this.addAssessmentOverview(doc, interview);
      
      // Add detailed analysis
      this.addDetailedAnalysis(doc, interview);
      
      // Add question-by-question breakdown
      this.addQuestionBreakdown(doc, interview);
      
      // Add violations if any
      if (interview.violations && interview.violations.length > 0) {
        this.addViolations(doc, interview);
      }
      
      // Add resume details if available
      if (candidateData && candidateData.resumeData) {
        this.addResumeDetails(doc, candidateData);
      }
      
      // Add recommendations
      this.addRecommendations(doc, interview);
      
      // Finalize the PDF
      doc.end();
      
      // Return a promise with the PDF buffer
      return new Promise((resolve) => {
        doc.on('end', () => {
          const pdfBuffer = Buffer.concat(buffers);
          resolve(pdfBuffer);
        });
      });

    } catch (error) {
      console.error('Error generating PDF report:', error);
      throw error;
    }
  }

  addHeader(doc, interview) {
    // Company header
    doc.fontSize(24)
       .fillColor('#2563eb')
       .text('AI Interview Assessment Report', 50, 50);
    
    doc.fontSize(12)
       .fillColor('#6b7280')
       .text(`Generated on: ${new Date().toLocaleString()}`, 50, 80);
    
    // Add a line separator
    doc.moveTo(50, 100)
       .lineTo(550, 100)
       .strokeColor('#e5e7eb')
       .lineWidth(1)
       .stroke();
    
    doc.y = 120;
  }

  addCandidateInfo(doc, interview, candidateData) {
    const startY = doc.y;
    
    // Section header
    doc.fontSize(18)
       .fillColor('#1f2937')
       .text('Candidate Information', 50, startY);
    
    doc.y += 25;
    
    // Basic info
    doc.fontSize(12)
       .fillColor('#374151')
       .text(`Name: ${interview.candidateName}`, 50, doc.y)
       .text(`Email: ${interview.candidateEmail}`, 50, doc.y + 20)
       .text(`Position: ${interview.position}`, 50, doc.y + 40)
       .text(`Interview Date: ${new Date(interview.startedAt).toLocaleDateString()}`, 50, doc.y + 60);
    
    doc.y += 100;
    
    // Add photo placeholder or additional info
    if (candidateData && candidateData.resumeData) {
      const resumeData = candidateData.resumeData;
      
      if (resumeData.phone) {
        doc.text(`Phone: ${resumeData.phone}`, 300, startY + 45);
      }
      
      if (resumeData.location) {
        doc.text(`Location: ${resumeData.location}`, 300, startY + 65);
      }
      
      if (resumeData.linkedin) {
        doc.text(`LinkedIn: ${resumeData.linkedin}`, 300, startY + 85);
      }
    }
  }

  addAssessmentOverview(doc, interview) {
    const startY = doc.y + 20;
    const finalReport = interview.finalReport;
    
    if (!finalReport) return;
    
    // Section header
    doc.fontSize(18)
       .fillColor('#1f2937')
       .text('Assessment Overview', 50, startY);
    
    doc.y = startY + 30;
    
    // Create boxes for key metrics
    const boxWidth = 120;
    const boxHeight = 80;
    const spacing = 20;
    
    // Overall Score Box
    doc.rect(50, doc.y, boxWidth, boxHeight)
       .fillAndStroke('#f0f9ff', '#3b82f6');
    
    doc.fontSize(24)
       .fillColor('#0369a1')
       .text(`${finalReport.candidate?.averageScore || 0}%`, 50 + 35, doc.y + 20);
    
    doc.fontSize(10)
       .fillColor('#0369a1')
       .text('Overall Score', 50 + 25, doc.y + 50);
    
    // Accuracy Box
    doc.rect(50 + boxWidth + spacing, doc.y, boxWidth, boxHeight)
       .fillAndStroke('#f0fdf4', '#10b981');
    
    doc.fontSize(24)
       .fillColor('#166534')
       .text(`${finalReport.candidate?.accuracyPercentage || 0}%`, 50 + boxWidth + spacing + 35, doc.y + 20);
    
    doc.fontSize(10)
       .fillColor('#166534')
       .text('Accuracy Rate', 50 + boxWidth + spacing + 25, doc.y + 50);
    
    // Recommendation Box
    doc.rect(50 + (boxWidth + spacing) * 2, doc.y, boxWidth, boxHeight)
       .fillAndStroke('#fef7cd', '#f59e0b');
    
    doc.fontSize(14)
       .fillColor('#92400e')
       .text(`${finalReport.recommendation || 'N/A'}`, 50 + (boxWidth + spacing) * 2 + 10, doc.y + 25);
    
    doc.fontSize(10)
       .fillColor('#92400e')
       .text('Recommendation', 50 + (boxWidth + spacing) * 2 + 15, doc.y + 50);
    
    doc.y += boxHeight + 30;
  }

  addDetailedAnalysis(doc, interview) {
    const finalReport = interview.finalReport;
    if (!finalReport) return;
    
    const startY = doc.y + 20;
    
    // Section header
    doc.fontSize(18)
       .fillColor('#1f2937')
       .text('Performance Analysis', 50, startY);
    
    doc.y = startY + 30;
    
    // Difficulty breakdown
    if (finalReport.breakdown) {
      doc.fontSize(14)
         .fillColor('#374151')
         .text('Performance by Difficulty:', 50, doc.y);
      
      doc.y += 25;
      
      const difficulties = ['easy', 'medium', 'hard'];
      const colors = ['#10b981', '#f59e0b', '#ef4444'];
      
      difficulties.forEach((difficulty, index) => {
        const data = finalReport.breakdown[difficulty];
        if (data && data.count > 0) {
          doc.fontSize(12)
             .fillColor(colors[index])
             .text(`• ${difficulty.toUpperCase()}: ${data.average}% average (${data.count} questions)`, 70, doc.y);
          
          doc.y += 20;
        }
      });
      
      doc.y += 10;
    }
    
    // Technical competency and communication
    if (finalReport.technicalCompetency) {
      doc.fontSize(12)
         .fillColor('#374151')
         .text(`Technical Competency: ${finalReport.technicalCompetency}`, 50, doc.y);
      doc.y += 20;
    }
    
    if (finalReport.communicationScore) {
      doc.fontSize(12)
         .fillColor('#374151')
         .text(`Communication Score: ${finalReport.communicationScore}/100`, 50, doc.y);
      doc.y += 20;
    }
  }

  addQuestionBreakdown(doc, interview) {
    const startY = doc.y + 30;
    
    // Check if we need a new page
    if (startY > 650) {
      doc.addPage();
      doc.y = 50;
    }
    
    // Section header
    doc.fontSize(18)
       .fillColor('#1f2937')
       .text('Question-by-Question Analysis', 50, doc.y);
    
    doc.y += 30;
    
    if (!interview.responses || interview.responses.length === 0) {
      doc.fontSize(12)
         .fillColor('#6b7280')
         .text('No responses available.', 50, doc.y);
      return;
    }
    
    interview.responses.forEach((response, index) => {
      // Check if we need a new page for each question
      if (doc.y > 600) {
        doc.addPage();
        doc.y = 50;
      }
      
      const question = interview.questions[index];
      
      // Question header
      doc.fontSize(12)
         .fillColor('#1f2937')
         .text(`Q${index + 1}: `, 50, doc.y, { continued: true })
         .fillColor('#374151')
         .text(`${question?.question || 'Unknown question'}`, { width: 450 });
      
      doc.y += 25;
      
      // Difficulty and score
      doc.fontSize(10)
         .fillColor('#6b7280')
         .text(`Difficulty: ${question?.difficulty || 'N/A'} | `, 70, doc.y, { continued: true })
         .text(`Score: ${response.score || 0}/100 | `, { continued: true })
         .text(`Time: ${response.timeUsed || 0}s / ${question?.timeLimit || 0}s`);
      
      doc.y += 20;
      
      // Response
      doc.fontSize(11)
         .fillColor('#374151')
         .text('Response: ', 70, doc.y, { continued: true })
         .fillColor('#6b7280')
         .text(`"${(response.response || response.answer || 'No response').substring(0, 200)}${(response.response || response.answer || '').length > 200 ? '...' : ''}"`, { width: 450 });
      
      doc.y += 35;
      
      // AI Analysis if available
      if (response.aiAnalysis && response.aiAnalysis.feedback) {
        doc.fontSize(10)
           .fillColor('#3b82f6')
           .text('AI Feedback: ', 70, doc.y, { continued: true })
           .fillColor('#6b7280')
           .text(response.aiAnalysis.feedback.substring(0, 150) + (response.aiAnalysis.feedback.length > 150 ? '...' : ''), { width: 450 });
        
        doc.y += 25;
      }
      
      doc.y += 10;
    });
  }

  addViolations(doc, interview) {
    const startY = doc.y + 30;
    
    // Check if we need a new page
    if (startY > 650) {
      doc.addPage();
      doc.y = 50;
    }
    
    // Section header
    doc.fontSize(18)
       .fillColor('#dc2626')
       .text('⚠️ Interview Violations', 50, doc.y);
    
    doc.y += 30;
    
    if (interview.terminationReason) {
      doc.fontSize(12)
         .fillColor('#dc2626')
         .text(`Termination Reason: ${interview.terminationReason}`, 50, doc.y);
      doc.y += 20;
    }
    
    doc.fontSize(12)
       .fillColor('#374151')
       .text(`Questions Completed: ${interview.questionsCompleted || interview.responses?.length || 0} / ${interview.totalQuestions || interview.questions?.length || 0}`, 50, doc.y);
    
    doc.y += 25;
    
    if (interview.violations && interview.violations.length > 0) {
      doc.fontSize(14)
         .fillColor('#dc2626')
         .text('Violation Details:', 50, doc.y);
      
      doc.y += 20;
      
      interview.violations.forEach((violation, index) => {
        const violationType = violation.type === 'fullscreen_exit' ? 'Exited Fullscreen Mode' :
                             violation.type === 'tab_change' ? 'Switched Tab/Window' :
                             violation.type === 'window_blur' ? 'Window Lost Focus' : violation.type;
        
        doc.fontSize(11)
           .fillColor('#dc2626')
           .text(`${index + 1}. ${violationType}`, 70, doc.y)
           .fillColor('#6b7280')
           .text(`   Time: ${new Date(violation.timestamp).toLocaleTimeString()}`, 70, doc.y + 15)
           .text(`   Question: Q${violation.questionNumber}`, 70, doc.y + 30);
        
        doc.y += 50;
      });
    }
  }

  addResumeDetails(doc, candidateData) {
    const resumeData = candidateData.resumeData;
    if (!resumeData) return;
    
    // Check if we need a new page
    if (doc.y > 600) {
      doc.addPage();
      doc.y = 50;
    }
    
    // Section header
    doc.fontSize(18)
       .fillColor('#1f2937')
       .text('Resume Analysis', 50, doc.y);
    
    doc.y += 30;
    
    // Professional Summary
    if (resumeData.summary || resumeData.objective) {
      doc.fontSize(14)
         .fillColor('#374151')
         .text('Professional Summary:', 50, doc.y);
      
      doc.y += 20;
      
      doc.fontSize(11)
         .fillColor('#6b7280')
         .text(resumeData.summary || resumeData.objective, 70, doc.y, { width: 450 });
      
      doc.y += 40;
    }
    
    // Skills
    if (resumeData.skills && resumeData.skills.length > 0) {
      doc.fontSize(14)
         .fillColor('#374151')
         .text('Technical Skills:', 50, doc.y);
      
      doc.y += 20;
      
      const skillsText = Array.isArray(resumeData.skills) 
        ? resumeData.skills.join(', ') 
        : resumeData.skills.toString();
      
      doc.fontSize(11)
         .fillColor('#6b7280')
         .text(skillsText, 70, doc.y, { width: 450 });
      
      doc.y += 40;
    }
    
    // Experience
    if (resumeData.experience && resumeData.experience.length > 0) {
      // Check if we need a new page
      if (doc.y > 500) {
        doc.addPage();
        doc.y = 50;
      }
      
      doc.fontSize(14)
         .fillColor('#374151')
         .text('Professional Experience:', 50, doc.y);
      
      doc.y += 20;
      
      resumeData.experience.slice(0, 3).forEach((exp, index) => {
        doc.fontSize(12)
           .fillColor('#1f2937')
           .text(`${exp.title || exp.position || 'Position'} at ${exp.company || 'Company'}`, 70, doc.y);
        
        doc.fontSize(10)
           .fillColor('#6b7280')
           .text(`${exp.startDate || ''} - ${exp.endDate || 'Present'}`, 70, doc.y + 15);
        
        if (exp.description) {
          doc.fontSize(10)
             .fillColor('#6b7280')
             .text(exp.description.substring(0, 200) + (exp.description.length > 200 ? '...' : ''), 70, doc.y + 30, { width: 450 });
          
          doc.y += 60;
        } else {
          doc.y += 40;
        }
      });
    }
    
    // Projects
    if (resumeData.projects && resumeData.projects.length > 0) {
      // Check if we need a new page
      if (doc.y > 500) {
        doc.addPage();
        doc.y = 50;
      }
      
      doc.fontSize(14)
         .fillColor('#374151')
         .text('Notable Projects:', 50, doc.y);
      
      doc.y += 20;
      
      resumeData.projects.slice(0, 2).forEach((project, index) => {
        doc.fontSize(12)
           .fillColor('#1f2937')
           .text(`${project.name || project.title || `Project ${index + 1}`}`, 70, doc.y);
        
        if (project.description) {
          doc.fontSize(10)
             .fillColor('#6b7280')
             .text(project.description.substring(0, 150) + (project.description.length > 150 ? '...' : ''), 70, doc.y + 15, { width: 450 });
        }
        
        if (project.technologies) {
          const techText = Array.isArray(project.technologies) 
            ? project.technologies.join(', ') 
            : project.technologies.toString();
          
          doc.fontSize(9)
             .fillColor('#3b82f6')
             .text(`Technologies: ${techText}`, 70, doc.y + 35);
        }
        
        doc.y += 60;
      });
    }
    
    // Education
    if (resumeData.education && resumeData.education.length > 0) {
      doc.fontSize(14)
         .fillColor('#374151')
         .text('Education:', 50, doc.y);
      
      doc.y += 20;
      
      resumeData.education.slice(0, 2).forEach((edu, index) => {
        doc.fontSize(11)
           .fillColor('#1f2937')
           .text(`${edu.degree || 'Degree'} - ${edu.institution || 'Institution'}`, 70, doc.y);
        
        doc.fontSize(10)
           .fillColor('#6b7280')
           .text(`${edu.graduationYear || edu.year || 'Year not specified'}`, 70, doc.y + 15);
        
        doc.y += 35;
      });
    }
  }

  addRecommendations(doc, interview) {
    const finalReport = interview.finalReport;
    if (!finalReport) return;
    
    // Check if we need a new page
    if (doc.y > 600) {
      doc.addPage();
      doc.y = 50;
    }
    
    // Section header
    doc.fontSize(18)
       .fillColor('#1f2937')
       .text('Recommendations & Insights', 50, doc.y);
    
    doc.y += 30;
    
    // AI Summary
    if (finalReport.aiSummary) {
      doc.fontSize(14)
         .fillColor('#374151')
         .text('AI Assessment Summary:', 50, doc.y);
      
      doc.y += 20;
      
      doc.fontSize(11)
         .fillColor('#6b7280')
         .text(finalReport.aiSummary, 70, doc.y, { width: 450 });
      
      doc.y += 50;
    }
    
    // Strengths
    if (finalReport.strengths && finalReport.strengths.length > 0) {
      doc.fontSize(14)
         .fillColor('#166534')
         .text('✓ Key Strengths:', 50, doc.y);
      
      doc.y += 20;
      
      finalReport.strengths.forEach((strength, index) => {
        doc.fontSize(11)
           .fillColor('#6b7280')
           .text(`• ${strength}`, 70, doc.y);
        doc.y += 18;
      });
      
      doc.y += 15;
    }
    
    // Areas for Improvement
    if (finalReport.improvements && finalReport.improvements.length > 0) {
      doc.fontSize(14)
         .fillColor('#dc2626')
         .text('⚠ Areas for Improvement:', 50, doc.y);
      
      doc.y += 20;
      
      finalReport.improvements.forEach((improvement, index) => {
        doc.fontSize(11)
           .fillColor('#6b7280')
           .text(`• ${improvement}`, 70, doc.y);
        doc.y += 18;
      });
      
      doc.y += 15;
    }
    
    // Final recommendation
    doc.fontSize(16)
       .fillColor('#1f2937')
       .text('Final Recommendation:', 50, doc.y);
    
    doc.y += 25;
    
    const recommendationColor = finalReport.recommendation === 'Strong Hire' ? '#166534' :
                               finalReport.recommendation === 'Hire' ? '#059669' :
                               finalReport.recommendation === 'Maybe' ? '#d97706' : '#dc2626';
    
    doc.fontSize(20)
       .fillColor(recommendationColor)
       .text(finalReport.recommendation || 'No Hire', 50, doc.y);
    
    if (finalReport.confidenceLevel) {
      doc.fontSize(12)
         .fillColor('#6b7280')
         .text(`Confidence Level: ${finalReport.confidenceLevel}`, 50, doc.y + 30);
    }
    
    // Add footer
    doc.fontSize(8)
       .fillColor('#9ca3af')
       .text('This report was generated automatically by the AI Interview Assessment System.', 50, 750)
       .text(`Report ID: ${interview._id || 'N/A'} | Generated: ${new Date().toLocaleString()}`, 50, 765);
  }
}

export default new PDFReportService();