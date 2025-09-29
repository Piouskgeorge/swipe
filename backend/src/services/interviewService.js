class InterviewService {
  
  // Generate dynamic interview questions based on position and resume
  async generateInterviewQuestions(resumeData, position) {
    // Position-specific question pools
    const questionPools = {
      "Software Engineer": {
        easy: [
          "Tell me about your programming experience and preferred languages.",
          "What development tools and IDEs do you use regularly?",
          "Describe your experience with version control systems like Git.",
          "How do you stay updated with new programming technologies?",
          "What coding standards do you follow in your projects?"
        ],
        medium: [
          "Explain the difference between synchronous and asynchronous programming.",
          "How would you optimize a slow-performing database query?",
          "Describe your experience with testing frameworks and methodologies.",
          "Walk me through your debugging process for a complex issue.",
          "How do you handle code reviews and collaboration?"
        ],
        hard: [
          "Design a distributed caching system for a high-traffic application.",
          "Explain how you would implement a real-time chat system.",
          "How would you design a URL shortening service like bit.ly?",
          "Describe strategies for handling database migrations in production.",
          "Design a system to process millions of financial transactions daily."
        ]
      },
      "Frontend Developer": {
        easy: [
          "What frontend frameworks and libraries are you most comfortable with?",
          "How do you ensure cross-browser compatibility?",
          "Describe your experience with responsive web design.",
          "What CSS preprocessors have you worked with?",
          "How do you optimize frontend performance?"
        ],
        medium: [
          "Explain the concept of virtual DOM and its benefits.",
          "How do you manage state in large React applications?",
          "Describe your approach to handling API calls in frontend apps.",
          "What are Progressive Web Apps and how do you implement them?",
          "How do you handle user authentication in frontend applications?"
        ],
        hard: [
          "Design a component library that can be used across multiple projects.",
          "How would you implement server-side rendering for a React app?",
          "Design a real-time collaborative editor like Google Docs.",
          "Explain your strategy for micro-frontend architecture.",
          "How would you build a complex data visualization dashboard?"
        ]
      },
      "Backend Developer": {
        easy: [
          "What backend technologies and databases are you experienced with?",
          "Describe your experience with RESTful API design.",
          "How do you handle error handling in backend applications?",
          "What is your experience with cloud platforms?",
          "How do you ensure API security?"
        ],
        medium: [
          "Explain the differences between SQL and NoSQL databases.",
          "How do you handle database transactions and ACID properties?",
          "Describe your approach to API rate limiting and throttling.",
          "How do you implement caching strategies in backend systems?",
          "Explain your experience with message queues and event-driven architecture."
        ],
        hard: [
          "Design a microservices architecture for an e-commerce platform.",
          "How would you implement a distributed search engine?",
          "Design a real-time notification system for millions of users.",
          "Explain your approach to database sharding and replication.",
          "How would you design a fault-tolerant payment processing system?"
        ]
      },
      "Data Scientist": {
        easy: [
          "What programming languages do you use for data analysis?",
          "Describe your experience with data visualization tools.",
          "What machine learning libraries are you familiar with?",
          "How do you handle missing or dirty data?",
          "What statistical methods do you commonly use?"
        ],
        medium: [
          "Explain the bias-variance tradeoff in machine learning.",
          "How do you evaluate the performance of a machine learning model?",
          "Describe your approach to feature engineering.",
          "What is your experience with A/B testing and experimental design?",
          "How do you handle imbalanced datasets?"
        ],
        hard: [
          "Design a recommendation system for a streaming platform.",
          "How would you build a real-time fraud detection system?",
          "Explain your approach to natural language processing for sentiment analysis.",
          "Design a machine learning pipeline for predictive maintenance.",
          "How would you implement a computer vision system for autonomous vehicles?"
        ]
      }
    };

    // Get questions for the specific position or default to Software Engineer
    const positionQuestions = questionPools[position] || questionPools["Software Engineer"];
    
    // Randomly select questions from each difficulty level
    const selectedQuestions = [];
    
    // Select 2 easy questions
    const easyQuestions = this.getRandomQuestions(positionQuestions.easy, 2);
    easyQuestions.forEach((q, index) => {
      selectedQuestions.push({
        id: selectedQuestions.length + 1,
        question: q,
        difficulty: "easy",
        timeLimit: 20,
        category: "easy",
        expectedKeywords: this.extractKeywords(q, position)
      });
    });
    
    // Select 2 medium questions
    const mediumQuestions = this.getRandomQuestions(positionQuestions.medium, 2);
    mediumQuestions.forEach((q, index) => {
      selectedQuestions.push({
        id: selectedQuestions.length + 1,
        question: q,
        difficulty: "medium",
        timeLimit: 60,
        category: "medium",
        expectedKeywords: this.extractKeywords(q, position)
      });
    });
    
    // Select 2 hard questions
    const hardQuestions = this.getRandomQuestions(positionQuestions.hard, 2);
    hardQuestions.forEach((q, index) => {
      selectedQuestions.push({
        id: selectedQuestions.length + 1,
        question: q,
        difficulty: "hard",
        timeLimit: 120,
        category: "hard",
        expectedKeywords: this.extractKeywords(q, position)
      });
    });

    return selectedQuestions;
  }

  // Helper method to get random questions
  getRandomQuestions(questionArray, count) {
    const shuffled = [...questionArray].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, count);
  }

  // Helper method to extract keywords based on question and position
  extractKeywords(question, position) {
    const keywords = [];
    const questionLower = question.toLowerCase();
    
    // Common technical keywords
    const technicalTerms = [
      'api', 'database', 'system', 'design', 'architecture', 'performance',
      'security', 'testing', 'deployment', 'scaling', 'optimization',
      'framework', 'library', 'algorithm', 'data structure'
    ];
    
    // Position-specific keywords
    const positionKeywords = {
      "Software Engineer": ['programming', 'coding', 'development', 'software'],
      "Frontend Developer": ['frontend', 'ui', 'react', 'javascript', 'css'],
      "Backend Developer": ['backend', 'server', 'api', 'database', 'microservices'],
      "Data Scientist": ['data', 'analysis', 'machine learning', 'statistics', 'model']
    };
    
    // Add relevant keywords
    technicalTerms.forEach(term => {
      if (questionLower.includes(term)) {
        keywords.push(term);
      }
    });
    
    if (positionKeywords[position]) {
      positionKeywords[position].forEach(term => {
        if (questionLower.includes(term)) {
          keywords.push(term);
        }
      });
    }
    
    // If no keywords found, add some generic ones
    if (keywords.length === 0) {
      keywords.push('experience', 'approach', 'solution');
    }
    
    return keywords;
  }

  // Calculate score for a response using AI evaluation
  async calculateResponseScore(question, response, timeUsed) {
    if (!response || response.trim().length < 5) {
      return {
        score: 0,
        aiAnalysis: {
          overallScore: 0,
          isCorrect: false,
          feedback: 'Response too short or empty.',
          strengths: [],
          improvements: ['Please provide a more detailed response']
        }
      };
    }

    try {
      // Import geminiService here to avoid circular dependencies
      const { getGeminiService } = await import('./geminiService.js');
      const geminiService = getGeminiService();
      
      // Get AI evaluation
      const aiEvaluation = await geminiService.evaluateAnswer(question, response, timeUsed);
      
      return {
        score: aiEvaluation.overallScore,
        aiAnalysis: {
          overallScore: aiEvaluation.overallScore,
          technicalAccuracy: aiEvaluation.technicalAccuracy,
          completeness: aiEvaluation.completeness,
          clarity: aiEvaluation.clarity,
          relevance: aiEvaluation.relevance,
          depth: aiEvaluation.depth,
          timeEfficiency: aiEvaluation.timeEfficiency,
          isCorrect: aiEvaluation.isCorrect,
          feedback: aiEvaluation.feedback,
          strengths: aiEvaluation.strengths,
          improvements: aiEvaluation.improvements,
          keywordsFound: aiEvaluation.keywordsFound
        }
      };
    } catch (error) {
      console.error('Error in AI evaluation, using fallback:', error);
      
      // Fallback calculation
      const keywords = question.expectedKeywords || [];
      const responseLower = response.toLowerCase();
      
      let keywordMatches = 0;
      const foundKeywords = [];
      keywords.forEach(keyword => {
        if (responseLower.includes(keyword.toLowerCase())) {
          keywordMatches++;
          foundKeywords.push(keyword);
        }
      });
      
      const keywordScore = (keywordMatches / Math.max(keywords.length, 1)) * 40;
      const lengthScore = Math.min(30, response.length / 20);
      const coherenceScore = response.split(' ').length > 5 ? 20 : 10;
      
      // Time bonus
      let timeBonus = 0;
      if (timeUsed < question.timeLimit) {
        const percentageLeft = (question.timeLimit - timeUsed) / question.timeLimit;
        timeBonus = percentageLeft * 10;
      }
      
      // Difficulty multiplier
      const multipliers = {
        easy: 0.8,
        medium: 1.0,
        hard: 1.2
      };
      const multiplier = multipliers[question.difficulty] || 1.0;
      
      const finalScore = Math.min(100, Math.round((keywordScore + lengthScore + coherenceScore + timeBonus) * multiplier));
      
      return {
        score: finalScore,
        aiAnalysis: {
          overallScore: finalScore,
          isCorrect: finalScore >= 60,
          feedback: `Response evaluated with ${finalScore >= 70 ? 'good' : 'basic'} performance.`,
          strengths: foundKeywords.length > 0 ? [`Used relevant keywords: ${foundKeywords.join(', ')}`] : [],
          improvements: foundKeywords.length === 0 ? ['Could use more specific technical terminology'] : [],
          keywordsFound: foundKeywords
        }
      };
    }
  }

  // Generate final report with enhanced AI analysis
  async generateFinalReport(interview) {
    try {
      // Import geminiService here to avoid circular dependencies
      const { getGeminiService } = await import('./geminiService.js');
      const geminiService = getGeminiService();
      
      // Get comprehensive AI assessment
      const aiAssessment = await geminiService.generateOverallAssessment(interview);
      
      // Calculate basic statistics
      const totalScore = interview.responses.reduce((sum, resp) => sum + (resp.score || 0), 0);
      const averageScore = interview.responses.length > 0 ? Math.round(totalScore / interview.responses.length) : 0;
      
      // Calculate accuracy based on correct/incorrect answers
      const correctAnswers = interview.responses.filter(resp => 
        resp.aiAnalysis?.isCorrect !== false
      ).length;
      const accuracyPercentage = interview.responses.length > 0 
        ? Math.round((correctAnswers / interview.responses.length) * 100) 
        : 0;
      
      // Group scores by difficulty with enhanced analysis
      const scoresByDifficulty = {
        easy: { total: 0, count: 0, correct: 0 },
        medium: { total: 0, count: 0, correct: 0 },
        hard: { total: 0, count: 0, correct: 0 }
      };
      
      interview.responses.forEach((resp, index) => {
        const question = interview.questions[index];
        if (question && scoresByDifficulty[question.difficulty]) {
          const difficulty = question.difficulty;
          scoresByDifficulty[difficulty].total += resp.score || 0;
          scoresByDifficulty[difficulty].count += 1;
          if (resp.aiAnalysis?.isCorrect !== false) {
            scoresByDifficulty[difficulty].correct += 1;
          }
        }
      });
      
      // Calculate averages and accuracy per difficulty
      Object.keys(scoresByDifficulty).forEach(difficulty => {
        const data = scoresByDifficulty[difficulty];
        data.average = data.count > 0 ? Math.round(data.total / data.count) : 0;
        data.accuracy = data.count > 0 ? Math.round((data.correct / data.count) * 100) : 0;
      });

      // Collect all strengths and improvements from AI analysis
      const allStrengths = [];
      const allImprovements = [];
      const categoryInsights = {};
      
      interview.responses.forEach((resp, index) => {
        const question = interview.questions[index];
        if (question && resp.aiAnalysis) {
          if (resp.aiAnalysis.strengths) {
            allStrengths.push(...resp.aiAnalysis.strengths);
          }
          if (resp.aiAnalysis.improvements) {
            allImprovements.push(...resp.aiAnalysis.improvements);
          }
          
          // Track category performance
          const category = question.category;
          if (!categoryInsights[category]) {
            categoryInsights[category] = [];
          }
          categoryInsights[category].push(resp.score || 0);
        }
      });

      // Calculate category averages
      Object.keys(categoryInsights).forEach(category => {
        const scores = categoryInsights[category];
        categoryInsights[category] = scores.length > 0 
          ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
          : 0;
      });

      // Enhanced AI summary with detailed insights
      let detailedSummary = aiAssessment.detailedSummary;
      if (!detailedSummary || detailedSummary.length < 100) {
        detailedSummary = `
Performance Analysis:
• Overall Score: ${averageScore}% (${correctAnswers}/${interview.responses.length} questions answered correctly)
• Accuracy Rate: ${accuracyPercentage}%
• Technical Competency: ${aiAssessment.technicalCompetency}
• Communication Score: ${aiAssessment.communicationScore}/100

Difficulty Breakdown:
• Easy Questions: ${scoresByDifficulty.easy.average}% avg (${scoresByDifficulty.easy.accuracy}% accuracy)
• Medium Questions: ${scoresByDifficulty.medium.average}% avg (${scoresByDifficulty.medium.accuracy}% accuracy)  
• Hard Questions: ${scoresByDifficulty.hard.average}% avg (${scoresByDifficulty.hard.accuracy}% accuracy)

Category Performance:
${Object.entries(categoryInsights).map(([cat, score]) => `• ${cat}: ${score}%`).join('\n')}

${aiAssessment.hiringJustification}
        `.trim();
      }

      return {
        candidate: {
          name: interview.candidateName,
          position: interview.position,
          totalQuestions: interview.questions.length,
          totalScore: Math.round(totalScore),
          averageScore: averageScore,
          accuracyPercentage: accuracyPercentage,
          correctAnswers: correctAnswers,
          duration: interview.duration || 0
        },
        breakdown: {
          easy: scoresByDifficulty.easy,
          medium: scoresByDifficulty.medium,
          hard: scoresByDifficulty.hard
        },
        categoryInsights: categoryInsights,
        recommendation: aiAssessment.recommendation,
        confidenceLevel: aiAssessment.confidenceLevel,
        technicalCompetency: aiAssessment.technicalCompetency,
        communicationScore: aiAssessment.communicationScore,
        strengths: [...new Set([...aiAssessment.strengths, ...allStrengths])],
        improvements: [...new Set([...aiAssessment.improvements, ...allImprovements])],
        aiSummary: detailedSummary,
        detailedAnalysis: {
          overallScore: aiAssessment.overallScore,
          accuracyPercentage: aiAssessment.accuracyPercentage,
          categoryInsights: aiAssessment.categoryInsights,
          individualQuestionAnalysis: interview.responses.map((resp, index) => ({
            questionNumber: index + 1,
            question: interview.questions[index]?.question,
            difficulty: interview.questions[index]?.difficulty,
            category: interview.questions[index]?.category,
            score: resp.score,
            isCorrect: resp.aiAnalysis?.isCorrect,
            feedback: resp.aiAnalysis?.feedback,
            timeUsed: resp.timeUsed,
            timeLimit: interview.questions[index]?.timeLimit
          }))
        },
        generatedAt: new Date().toISOString()
      };
      
    } catch (error) {
      console.error('Error generating enhanced final report, using basic version:', error);
      
      // Fallback to basic report generation
      const totalScore = interview.responses.reduce((sum, resp) => sum + (resp.score || 0), 0);
      const averageScore = interview.responses.length > 0 ? Math.round(totalScore / interview.responses.length) : 0;
      
      // Basic difficulty grouping
      const scoresByDifficulty = {
        easy: { total: 0, count: 0 },
        medium: { total: 0, count: 0 },
        hard: { total: 0, count: 0 }
      };
      
      interview.responses.forEach((resp, index) => {
        const question = interview.questions[index];
        if (question && scoresByDifficulty[question.difficulty]) {
          scoresByDifficulty[question.difficulty].total += resp.score || 0;
          scoresByDifficulty[question.difficulty].count += 1;
        }
      });
      
      Object.keys(scoresByDifficulty).forEach(difficulty => {
        const data = scoresByDifficulty[difficulty];
        data.average = data.count > 0 ? Math.round(data.total / data.count) : 0;
      });

      let recommendation = 'No Hire';
      if (averageScore >= 85) recommendation = 'Strong Hire';
      else if (averageScore >= 70) recommendation = 'Hire';
      else if (averageScore >= 55) recommendation = 'Maybe';

      return {
        candidate: {
          name: interview.candidateName,
          position: interview.position,
          totalQuestions: interview.questions.length,
          totalScore: Math.round(totalScore),
          averageScore: averageScore,
          duration: interview.duration || 0
        },
        breakdown: {
          easy: scoresByDifficulty.easy,
          medium: scoresByDifficulty.medium,
          hard: scoresByDifficulty.hard
        },
        recommendation: recommendation,
        strengths: [],
        improvements: [],
        aiSummary: `Basic assessment: ${averageScore}% average performance across ${interview.responses.length} questions.`,
        generatedAt: new Date().toISOString()
      };
    }
  }
}

const interviewService = new InterviewService();
export default interviewService;