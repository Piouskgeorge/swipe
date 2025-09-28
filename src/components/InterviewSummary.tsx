import React from 'react';
import type { Answer, Question } from '../types';

interface InterviewSummaryProps {
  answers: Answer[];
  questions: Question[];
  domain: string;
  position: string;
  candidateName: string;
  totalScore: number;
  onClose: () => void;
}

export const InterviewSummary: React.FC<InterviewSummaryProps> = ({
  answers,
  questions,
  domain,
  position,
  candidateName,
  totalScore,
  onClose
}) => {
  // Calculate detailed metrics
  const answeredQuestions = answers.length;
  const totalQuestions = questions.length;
  const completionRate = Math.round((answeredQuestions / totalQuestions) * 100);
  
  // Calculate difficulty-based scores
  const difficultyScores = {
    easy: answers.filter(a => {
      const question = questions.find(q => q.id === a.questionId);
      return question?.difficulty === 'easy';
    }).reduce((sum, a) => sum + (a.score || 0), 0),
    medium: answers.filter(a => {
      const question = questions.find(q => q.id === a.questionId);
      return question?.difficulty === 'medium';
    }).reduce((sum, a) => sum + (a.score || 0), 0),
    hard: answers.filter(a => {
      const question = questions.find(q => q.id === a.questionId);
      return question?.difficulty === 'hard';
    }).reduce((sum, a) => sum + (a.score || 0), 0)
  };

  const averageScore = totalScore / answeredQuestions;
  
  // Performance rating
  const getPerformanceRating = (score: number): string => {
    if (score >= 85) return 'Excellent';
    if (score >= 70) return 'Good';
    if (score >= 55) return 'Average';
    return 'Needs Improvement';
  };

  const getScoreColor = (score: number): string => {
    if (score >= 85) return '#10B981'; // green
    if (score >= 70) return '#3B82F6'; // blue
    if (score >= 55) return '#F59E0B'; // orange
    return '#EF4444'; // red
  };

  const summaryStyles: React.CSSProperties = {
    position: 'fixed',
    top: '0',
    left: '0',
    right: '0',
    bottom: '0',
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
    padding: '20px'
  };

  const contentStyles: React.CSSProperties = {
    backgroundColor: '#ffffff',
    borderRadius: '12px',
    padding: '32px',
    maxWidth: '800px',
    width: '100%',
    maxHeight: '90vh',
    overflowY: 'auto',
    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
  };

  const headerStyles: React.CSSProperties = {
    textAlign: 'center',
    marginBottom: '32px',
    borderBottom: '2px solid #E5E7EB',
    paddingBottom: '20px'
  };

  const titleStyles: React.CSSProperties = {
    fontSize: '28px',
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: '8px'
  };

  const subtitleStyles: React.CSSProperties = {
    fontSize: '16px',
    color: '#6B7280',
    marginBottom: '4px'
  };

  const scoreCardStyles: React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '20px',
    marginBottom: '32px'
  };

  const cardStyles: React.CSSProperties = {
    backgroundColor: '#F9FAFB',
    padding: '20px',
    borderRadius: '8px',
    border: '1px solid #E5E7EB',
    textAlign: 'center'
  };

  const detailsStyles: React.CSSProperties = {
    marginBottom: '32px'
  };

  const sectionTitleStyles: React.CSSProperties = {
    fontSize: '20px',
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: '16px',
    borderBottom: '2px solid #3B82F6',
    paddingBottom: '8px'
  };

  const answerItemStyles: React.CSSProperties = {
    backgroundColor: '#F8FAFC',
    border: '1px solid #E2E8F0',
    borderRadius: '8px',
    padding: '16px',
    marginBottom: '16px'
  };

  const questionStyles: React.CSSProperties = {
    fontWeight: '600',
    color: '#2D3748',
    marginBottom: '8px',
    fontSize: '14px'
  };

  const answerStyles: React.CSSProperties = {
    color: '#4A5568',
    marginBottom: '12px',
    lineHeight: '1.5',
    fontSize: '14px'
  };

  const scoreStyles: React.CSSProperties = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: '8px'
  };

  const buttonStyles: React.CSSProperties = {
    backgroundColor: '#3B82F6',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    padding: '12px 24px',
    fontSize: '16px',
    fontWeight: '500',
    cursor: 'pointer',
    transition: 'background-color 0.2s',
    display: 'block',
    margin: '0 auto'
  };

  return (
    <div style={summaryStyles}>
      <div style={contentStyles}>
        {/* Header */}
        <div style={headerStyles}>
          <h1 style={titleStyles}>Interview Summary Report</h1>
          <p style={subtitleStyles}>{candidateName} - {position}</p>
          <p style={subtitleStyles}>{domain} Domain</p>
        </div>

        {/* Score Cards */}
        <div style={scoreCardStyles}>
          <div style={cardStyles}>
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: getScoreColor(averageScore), marginBottom: '8px' }}>
              {Math.round(averageScore)}/100
            </div>
            <div style={{ fontSize: '14px', color: '#6B7280' }}>Overall Score</div>
            <div style={{ fontSize: '12px', color: '#9CA3AF', marginTop: '4px' }}>
              {getPerformanceRating(averageScore)}
            </div>
          </div>

          <div style={cardStyles}>
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#3B82F6', marginBottom: '8px' }}>
              {answeredQuestions}/{totalQuestions}
            </div>
            <div style={{ fontSize: '14px', color: '#6B7280' }}>Questions Answered</div>
            <div style={{ fontSize: '12px', color: '#9CA3AF', marginTop: '4px' }}>
              {completionRate}% Complete
            </div>
          </div>

          <div style={cardStyles}>
            <div style={{ fontSize: '14px', color: '#6B7280', marginBottom: '8px' }}>Difficulty Breakdown</div>
            <div style={{ fontSize: '12px', marginBottom: '2px' }}>
              Easy: <span style={{ fontWeight: 'bold', color: getScoreColor(difficultyScores.easy / 2 || 0) }}>
                {Math.round(difficultyScores.easy / 2 || 0)}/100
              </span>
            </div>
            <div style={{ fontSize: '12px', marginBottom: '2px' }}>
              Medium: <span style={{ fontWeight: 'bold', color: getScoreColor(difficultyScores.medium / 2 || 0) }}>
                {Math.round(difficultyScores.medium / 2 || 0)}/100
              </span>
            </div>
            <div style={{ fontSize: '12px' }}>
              Hard: <span style={{ fontWeight: 'bold', color: getScoreColor(difficultyScores.hard / 2 || 0) }}>
                {Math.round(difficultyScores.hard / 2 || 0)}/100
              </span>
            </div>
          </div>
        </div>

        {/* Detailed Answers */}
        <div style={detailsStyles}>
          <h2 style={sectionTitleStyles}>Question-by-Question Analysis</h2>
          {answers.map((answer, index) => {
            const question = questions.find(q => q.id === answer.questionId);
            if (!question) return null;

            return (
              <div key={`${answer.questionId}-${index}`} style={answerItemStyles}>
                <div style={questionStyles}>
                  Q{index + 1}: {question.text}
                  <span style={{
                    marginLeft: '8px',
                    padding: '2px 6px',
                    borderRadius: '4px',
                    fontSize: '12px',
                    backgroundColor: question.difficulty === 'easy' ? '#FEF3C7' : 
                                   question.difficulty === 'medium' ? '#DBEAFE' : '#FEE2E2',
                    color: question.difficulty === 'easy' ? '#92400E' : 
                           question.difficulty === 'medium' ? '#1E40AF' : '#991B1B'
                  }}>
                    {question.difficulty} ({question.timeLimit}s)
                  </span>
                </div>
                
                <div style={answerStyles}>
                  <strong>Answer:</strong> {answer.answer || 'No answer provided'}
                </div>

                <div style={scoreStyles}>
                  <div style={{ fontSize: '14px', color: '#4A5568' }}>
                    <strong>AI Feedback:</strong> {answer.feedback || 'Processing...'}
                  </div>
                  <div style={{
                    fontWeight: 'bold',
                    fontSize: '16px',
                    color: getScoreColor(answer.score || 0)
                  }}>
                    {answer.score || 0}/100
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Recommendations */}
        <div style={detailsStyles}>
          <h2 style={sectionTitleStyles}>Recommendations</h2>
          <div style={{ ...answerItemStyles, backgroundColor: '#F0F9FF' }}>
            <div style={{ fontSize: '14px', color: '#1E40AF', lineHeight: '1.6' }}>
              {averageScore >= 85 && (
                <>
                  <strong>🎉 Outstanding Performance!</strong><br />
                  Excellent technical knowledge and problem-solving skills demonstrated across all difficulty levels. 
                  Ready for senior-level positions in {domain}.
                </>
              )}
              {averageScore >= 70 && averageScore < 85 && (
                <>
                  <strong>👍 Good Performance!</strong><br />
                  Solid technical foundation with good understanding of {domain} concepts. 
                  Consider strengthening knowledge in areas where scores were lower.
                </>
              )}
              {averageScore >= 55 && averageScore < 70 && (
                <>
                  <strong>📚 Room for Growth</strong><br />
                  Basic understanding demonstrated, but needs improvement in technical depth. 
                  Focus on practical experience and deeper study of {domain} fundamentals.
                </>
              )}
              {averageScore < 55 && (
                <>
                  <strong>🔄 Needs Significant Improvement</strong><br />
                  Consider additional study and hands-on practice in {domain}. 
                  Focus on building stronger foundations before pursuing this role level.
                </>
              )}
            </div>
          </div>
        </div>

        {/* Close Button */}
        <button 
          style={buttonStyles} 
          onClick={onClose}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#2563EB';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = '#3B82F6';
          }}
        >
          Close Summary
        </button>
      </div>
    </div>
  );
};