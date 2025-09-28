import type { Candidate, Interview, Question, ChatMessage, Answer } from '../types';

// AI-generated questions and scoring - all handled locally
class LocalDataService {
  
  // Resume parsing (using existing resumeParser utility)
  async parseResume(file: File): Promise<string> {
    // This will use the existing resumeParser utility
    const { parseResumeFile } = await import('../utils/resumeParser');
    const resumeData = await parseResumeFile(file);
    return resumeData.text;
  }

  // Generate interview questions based on resume (AI simulation)
  async generateQuestions(resumeText: string, difficulty: 'easy' | 'medium' | 'hard' = 'medium'): Promise<Question[]> {
    console.log('generateQuestions called with:', { resumeText: resumeText?.slice(0, 100), difficulty });
    
    // Simulate AI-generated questions based on resume content
    const baseQuestions = this.getBaseQuestionsByDifficulty(difficulty);
    console.log('Base questions:', baseQuestions);
    
    // Customize questions based on resume keywords
    const customQuestions = this.customizeQuestionsForResume(baseQuestions, resumeText);
    console.log('Custom questions:', customQuestions);
    
    const finalQuestions = customQuestions.map((q, index) => ({
      ...q,
      id: `q_${Date.now()}_${index}`,
    }));
    
    console.log('Final questions generated:', finalQuestions);
    return finalQuestions;
  }

  // Simulate AI chat responses
  async generateChatResponse(message: string, context: { 
    candidate: Candidate, 
    currentQuestion?: Question,
    chatHistory: ChatMessage[] 
  }): Promise<string> {
    // Simulate intelligent AI responses
    const { candidate, currentQuestion } = context;
    
    // Simple AI simulation based on message content
    if (message.toLowerCase().includes('help') || message.toLowerCase().includes('hint')) {
      return this.generateHelpResponse(currentQuestion);
    }
    
    if (currentQuestion) {
      return this.generateQuestionFollowUp(message, currentQuestion);
    }
    
    return this.generateGeneralResponse(message, candidate);
  }

  // Score answers using local algorithm
  async scoreAnswer(answer: Answer, question: Question): Promise<{ score: number; feedback: string }> {
    // Simulate AI scoring
    const score = this.calculateScore(answer.answer, question);
    const feedback = this.generateFeedback(answer.answer, question, score);
    
    return { score, feedback };
  }

  // Generate final interview summary
  async generateInterviewSummary(interview: Interview, candidate: Candidate): Promise<{ score: number; summary: string }> {
    const answers = interview.answers;
    console.log('Generating summary for answers:', answers);
    
    // Handle case where no answers were provided
    const totalScore = answers.length > 0 
      ? answers.reduce((sum, answer) => sum + (answer.score || 0), 0) / answers.length
      : 0;
    
    const summary = this.generateSummaryText(candidate, interview, totalScore);
    
    return { score: totalScore, summary };
  }

  // Local storage utilities
  saveToLocalStorage(key: string, data: any): void {
    localStorage.setItem(key, JSON.stringify(data));
  }

  getFromLocalStorage<T>(key: string): T | null {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : null;
  }

  // Private helper methods
  private getBaseQuestionsByDifficulty(difficulty: 'easy' | 'medium' | 'hard'): Omit<Question, 'id'>[] {
    const questionBank = {
      easy: [
        {
          text: "Tell me about yourself and your background.",
          difficulty: 'easy' as const,
          timeLimit: 300,
          category: 'General'
        },
        {
          text: "What interests you most about this role?",
          difficulty: 'easy' as const,
          timeLimit: 240,
          category: 'Motivation'
        },
        {
          text: "Describe a project you're proud of.",
          difficulty: 'easy' as const,
          timeLimit: 360,
          category: 'Experience'
        }
      ],
      medium: [
        {
          text: "Describe a challenging problem you solved and your approach.",
          difficulty: 'medium' as const,
          timeLimit: 450,
          category: 'Problem Solving'
        },
        {
          text: "How do you handle working under pressure and tight deadlines?",
          difficulty: 'medium' as const,
          timeLimit: 300,
          category: 'Soft Skills'
        },
        {
          text: "Explain a time when you had to learn a new technology quickly.",
          difficulty: 'medium' as const,
          timeLimit: 400,
          category: 'Learning'
        }
      ],
      hard: [
        {
          text: "Design a system to handle 1 million concurrent users. Walk me through your architecture.",
          difficulty: 'hard' as const,
          timeLimit: 600,
          category: 'System Design'
        },
        {
          text: "You have conflicting requirements from different stakeholders. How do you resolve this?",
          difficulty: 'hard' as const,
          timeLimit: 480,
          category: 'Leadership'
        },
        {
          text: "Explain how you would optimize a slow database query.",
          difficulty: 'hard' as const,
          timeLimit: 540,
          category: 'Technical'
        }
      ]
    };

    return questionBank[difficulty];
  }

  private customizeQuestionsForResume(baseQuestions: Omit<Question, 'id'>[], resumeText: string): Omit<Question, 'id'>[] {
    // Simple keyword-based customization
    const resumeLower = resumeText.toLowerCase();
    
    // Add technology-specific questions based on resume
    if (resumeLower.includes('react') || resumeLower.includes('javascript')) {
      baseQuestions.push({
        text: "How do you handle state management in React applications?",
        difficulty: 'medium',
        timeLimit: 360,
        category: 'Technical - React'
      });
    }
    
    if (resumeLower.includes('python')) {
      baseQuestions.push({
        text: "Explain the difference between list comprehensions and generator expressions in Python.",
        difficulty: 'medium',
        timeLimit: 300,
        category: 'Technical - Python'
      });
    }
    
    if (resumeLower.includes('manager') || resumeLower.includes('lead')) {
      baseQuestions.push({
        text: "How do you motivate a team member who is underperforming?",
        difficulty: 'medium',
        timeLimit: 360,
        category: 'Leadership'
      });
    }
    
    return baseQuestions;
  }

  private generateHelpResponse(question?: Question): string {
    if (!question) {
      return "I'm here to help! Feel free to ask me any questions about the interview process or if you need clarification on anything.";
    }
    
    const helpResponses = [
      "Take your time to think through the question. Structure your answer with specific examples.",
      "Consider breaking down your response into the situation, action you took, and the result.",
      "Think about relevant experiences from your background that relate to this question.",
      "Feel free to ask for clarification if any part of the question is unclear."
    ];
    
    return helpResponses[Math.floor(Math.random() * helpResponses.length)];
  }

  private generateQuestionFollowUp(_answer: string, _question: Question): string {
    const followUps = [
      "That's interesting. Can you elaborate on that approach?",
      "Good point. How did that experience shape your perspective?",
      "I see. What would you do differently if you encountered a similar situation again?",
      "Thank you for sharing. Are there any challenges you faced in that situation?",
      "Great example. How did you measure the success of that initiative?"
    ];
    
    return followUps[Math.floor(Math.random() * followUps.length)];
  }

  private generateGeneralResponse(_message: string, candidate: Candidate): string {
    const responses = [
      `Thanks for sharing, ${candidate.name}. That gives me good insight into your background.`,
      "I appreciate the detailed response. Let's continue with the next part of our conversation.",
      "That's valuable context. I'm getting a good sense of your experience and approach.",
      "Thank you for that perspective. It helps me understand your thinking process."
    ];
    
    return responses[Math.floor(Math.random() * responses.length)];
  }

  private calculateScore(answer: string, question: Question): number {
    // Simple scoring algorithm based on answer characteristics
    let score = 50; // Base score
    
    // Length and detail
    if (answer.length > 100) score += 10;
    if (answer.length > 300) score += 10;
    if (answer.length > 500) score += 5;
    
    // Keywords and structure
    const keywords = ['experience', 'project', 'team', 'challenge', 'solution', 'result', 'learn'];
    const keywordMatches = keywords.filter(keyword => 
      answer.toLowerCase().includes(keyword)
    ).length;
    score += keywordMatches * 3;
    
    // Question-specific scoring
    if (question.category === 'Technical') {
      const technicalKeywords = ['algorithm', 'design', 'architecture', 'performance', 'scalability'];
      const techMatches = technicalKeywords.filter(keyword =>
        answer.toLowerCase().includes(keyword)
      ).length;
      score += techMatches * 5;
    }
    
    // Ensure score is within bounds
    return Math.min(100, Math.max(0, score));
  }

  private generateFeedback(_answer: string, _question: Question, score: number): string {
    if (score >= 80) {
      return "Excellent response! You provided detailed examples and demonstrated clear understanding.";
    } else if (score >= 60) {
      return "Good answer with relevant details. Consider providing more specific examples to strengthen your response.";
    } else if (score >= 40) {
      return "Your response touches on key points. Try to elaborate more on your specific role and the outcomes achieved.";
    } else {
      return "Consider providing more detailed examples and explaining your thought process more clearly.";
    }
  }

  private generateSummaryText(candidate: Candidate, interview: Interview, avgScore: number): string {
    if (interview.answers.length === 0) {
      return `${candidate.name || 'The candidate'} did not complete the interview questions. No answers were provided during the interview session. Please restart the interview to get a proper assessment.`;
    }
    
    const performance = avgScore >= 80 ? 'excellent' : avgScore >= 60 ? 'good' : avgScore >= 40 ? 'satisfactory' : 'needs improvement';
    
    return `${candidate.name || 'The candidate'} demonstrated ${performance} interview performance with an average score of ${avgScore.toFixed(1)}/100. ` +
           `The candidate answered ${interview.answers.length} questions during the interview session. ` +
           `Key strengths observed include clear communication and relevant experience. ` +
           `Areas for potential growth include providing more detailed technical examples and structured responses.`;
  }
}

export default new LocalDataService();