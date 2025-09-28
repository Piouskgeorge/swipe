import type { Question, Answer } from '../types';

// Predefined questions pool for full-stack React/Node.js role
const QUESTION_POOL = {
  easy: [
    {
      text: "What is JSX in React and how does it differ from regular JavaScript?",
      category: "React Basics",
      timeLimit: 20,
    },
    {
      text: "Explain the difference between npm and npx.",
      category: "Node.js Basics",
      timeLimit: 20,
    },
    {
      text: "What are the main differences between let, const, and var in JavaScript?",
      category: "JavaScript Fundamentals",
      timeLimit: 20,
    },
    {
      text: "How do you handle events in React components?",
      category: "React Basics",
      timeLimit: 20,
    },
  ],
  medium: [
    {
      text: "Explain the React component lifecycle methods and their purposes.",
      category: "React Intermediate",
      timeLimit: 60,
    },
    {
      text: "What is middleware in Express.js and how would you implement custom middleware?",
      category: "Node.js Intermediate",
      timeLimit: 60,
    },
    {
      text: "Describe the differences between REST and GraphQL APIs. When would you use each?",
      category: "API Design",
      timeLimit: 60,
    },
    {
      text: "How does state management work in React? Compare useState, useContext, and Redux.",
      category: "React State Management",
      timeLimit: 60,
    },
  ],
  hard: [
    {
      text: "Design a scalable Node.js application architecture for handling 1M+ concurrent users. Include database considerations, caching strategies, and load balancing.",
      category: "System Design",
      timeLimit: 120,
    },
    {
      text: "Implement a custom React hook for debounced API calls with proper cleanup and error handling. Explain your approach.",
      category: "Advanced React",
      timeLimit: 120,
    },
    {
      text: "Explain how you would optimize a React application's performance, including bundle size, rendering, and memory management.",
      category: "Performance Optimization",
      timeLimit: 120,
    },
    {
      text: "Design a real-time chat application using WebSockets. Include message persistence, user authentication, and room management.",
      category: "Real-time Systems",
      timeLimit: 120,
    },
  ],
};

export const generateInterviewQuestions = (): Question[] => {
  const questions: Question[] = [];
  
  // Select 2 easy, 2 medium, 2 hard questions
  const easyQuestions = getRandomQuestions(QUESTION_POOL.easy, 2);
  const mediumQuestions = getRandomQuestions(QUESTION_POOL.medium, 2);
  const hardQuestions = getRandomQuestions(QUESTION_POOL.hard, 2);
  
  // Add questions in order: easy, medium, hard
  [...easyQuestions, ...mediumQuestions, ...hardQuestions].forEach((q, index) => {
    questions.push({
      id: `q${index + 1}`,
      text: q.text,
      difficulty: index < 2 ? 'easy' : index < 4 ? 'medium' : 'hard',
      timeLimit: q.timeLimit,
      category: q.category,
    });
  });
  
  return questions;
};

const getRandomQuestions = (pool: any[], count: number) => {
  const shuffled = [...pool].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
};

export const calculateQuestionScore = (answer: Answer, question: Question): number => {
  // Simple scoring algorithm (in a real app, this would use AI/ML)
  const answerLength = answer.answer.trim().length;
  const timeUsed = answer.timeSpent;
  const timeLimit = question.timeLimit;
  
  // Base score based on answer length (longer answers generally better)
  let score = Math.min(answerLength / 50, 10); // Max 10 points for length
  
  // Time bonus (faster completion gets bonus points)
  const timeRatio = timeUsed / timeLimit;
  if (timeRatio < 0.5) {
    score += 5; // Bonus for quick completion
  } else if (timeRatio < 0.8) {
    score += 2;
  }
  
  // Difficulty multiplier
  const difficultyMultiplier = {
    easy: 1,
    medium: 1.5,
    hard: 2,
  };
  
  score *= difficultyMultiplier[question.difficulty];
  
  // Cap at 100 and ensure minimum of 0
  return Math.max(0, Math.min(100, score));
};

export const calculateFinalScore = (answers: Answer[], questions: Question[]): number => {
  if (answers.length === 0) return 0;
  
  const totalScore = answers.reduce((sum, answer) => {
    const question = questions.find(q => q.id === answer.questionId);
    if (!question) return sum;
    
    const questionScore = calculateQuestionScore(answer, question);
    return sum + questionScore;
  }, 0);
  
  return Math.round(totalScore / answers.length);
};

export const generateCandidateSummary = (
  answers: Answer[], 
  questions: Question[], 
  finalScore: number
): string => {
  const totalQuestions = questions.length;
  const answeredQuestions = answers.length;
  
  let summary = `Candidate completed ${answeredQuestions} out of ${totalQuestions} questions with an overall score of ${finalScore}/100.\n\n`;
  
  // Analyze performance by difficulty
  const easyAnswers = answers.filter(a => {
    const q = questions.find(q => q.id === a.questionId);
    return q?.difficulty === 'easy';
  });
  
  const mediumAnswers = answers.filter(a => {
    const q = questions.find(q => q.id === a.questionId);
    return q?.difficulty === 'medium';
  });
  
  const hardAnswers = answers.filter(a => {
    const q = questions.find(q => q.id === a.questionId);
    return q?.difficulty === 'hard';
  });
  
  if (easyAnswers.length > 0) {
    const avgEasyScore = easyAnswers.reduce((sum, a) => {
      const q = questions.find(q => q.id === a.questionId)!;
      return sum + calculateQuestionScore(a, q);
    }, 0) / easyAnswers.length;
    summary += `Easy Questions: ${Math.round(avgEasyScore)}/100 average\n`;
  }
  
  if (mediumAnswers.length > 0) {
    const avgMediumScore = mediumAnswers.reduce((sum, a) => {
      const q = questions.find(q => q.id === a.questionId)!;
      return sum + calculateQuestionScore(a, q);
    }, 0) / mediumAnswers.length;
    summary += `Medium Questions: ${Math.round(avgMediumScore)}/100 average\n`;
  }
  
  if (hardAnswers.length > 0) {
    const avgHardScore = hardAnswers.reduce((sum, a) => {
      const q = questions.find(q => q.id === a.questionId)!;
      return sum + calculateQuestionScore(a, q);
    }, 0) / hardAnswers.length;
    summary += `Hard Questions: ${Math.round(avgHardScore)}/100 average\n`;
  }
  
  // Add performance insights
  if (finalScore >= 80) {
    summary += "\nExcellent performance! Strong technical knowledge demonstrated across all difficulty levels.";
  } else if (finalScore >= 60) {
    summary += "\nGood performance with solid understanding of core concepts. Some areas for improvement in advanced topics.";
  } else if (finalScore >= 40) {
    summary += "\nAverage performance. Basic understanding present but needs improvement in technical depth.";
  } else {
    summary += "\nNeeds significant improvement. Consider additional study and practice before proceeding.";
  }
  
  return summary;
};