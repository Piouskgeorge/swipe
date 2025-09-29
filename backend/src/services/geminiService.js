import { GoogleGenerativeAI } from '@google/generative-ai';

class GeminiService {
  constructor() {
    // Debug API key
    const apiKey = process.env.GEMINI_API_KEY;
    console.log('GeminiService - API Key present:', !!apiKey);
    console.log('GeminiService - API Key length:', apiKey ? apiKey.length : 0);
    console.log('GeminiService - API Key starts with:', apiKey ? apiKey.substring(0, 10) + '...' : 'N/A');
    
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY is not set in environment variables');
    }
    
    // Initialize Gemini 2.5 Flash model
    this.genAI = new GoogleGenerativeAI(apiKey.trim());
    this.model = this.genAI.getGenerativeModel({ 
      model: "gemini-2.5-flash",
      generationConfig: {
        temperature: 0.7,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 8192,
      }
    });
  }

  generateFallbackQuestions(position) {
    return [
      { 
        id: 1, 
        question: `Tell me about your background and experience relevant to the ${position} position.`, 
        difficulty: "easy", 
        timeLimit: 20, 
        category: "background", 
        expectedKeywords: ["experience", "background", "skills"] 
      },
      { 
        id: 2, 
        question: "What technologies are you most comfortable working with?", 
        difficulty: "easy", 
        timeLimit: 20, 
        category: "technical", 
        expectedKeywords: ["technology", "programming", "tools"] 
      },
      { 
        id: 3, 
        question: "Describe a challenging project you worked on and how you solved it.", 
        difficulty: "medium", 
        timeLimit: 60, 
        category: "experience", 
        expectedKeywords: ["project", "challenge", "solution"] 
      },
      { 
        id: 4, 
        question: "How would you approach debugging a performance issue?", 
        difficulty: "medium", 
        timeLimit: 60, 
        category: "problem-solving", 
        expectedKeywords: ["debugging", "performance", "troubleshooting"] 
      },
      { 
        id: 5, 
        question: "Design a system to handle high traffic and scale efficiently.", 
        difficulty: "hard", 
        timeLimit: 120, 
        category: "system-design", 
        expectedKeywords: ["scalability", "architecture", "system"] 
      },
      { 
        id: 6, 
        question: "Explain your approach to code quality and best practices.", 
        difficulty: "hard", 
        timeLimit: 120, 
        category: "architecture", 
        expectedKeywords: ["quality", "practices", "standards"] 
      }
    ];
  }
  
  async generateQuestions(resumeText, position) {
    try {
      const prompt = `
As an expert technical interviewer, generate 6 interview questions for a ${position} position based on the candidate's resume below.

Resume Content:
${resumeText}

Requirements:
- Generate exactly 6 questions: 2 easy, 2 medium, 2 hard
- Questions should be relevant to the resume content and position
- Include appropriate time limits (easy: 20-30s, medium: 45-60s, hard: 90-120s)
- Categorize each question (technical, experience, problem-solving, system-design, background, architecture)
- Provide expected keywords for evaluation

Return ONLY a valid JSON array in this exact format:
[
  {
    "id": 1,
    "question": "Your question here",
    "difficulty": "easy|medium|hard",
    "timeLimit": 30,
    "category": "technical",
    "expectedKeywords": ["keyword1", "keyword2", "keyword3"]
  }
]
`;

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      // Parse JSON response
      const cleanedText = text.replace(/```json\n?|\n?```/g, '').trim();
      const questions = JSON.parse(cleanedText);
      
      // Validate and return questions
      if (Array.isArray(questions) && questions.length === 6) {
        return questions.map((q, index) => ({
          ...q,
          id: index + 1,
          expectedKeywords: q.expectedKeywords || []
        }));
      }
      
      throw new Error('Invalid questions format');
      
    } catch (error) {
      console.error('Error generating questions with Gemini:', error);
      return this.generateFallbackQuestions(position);
    }
  }

  async evaluateAnswer(question, answer, timeUsed) {
    console.log('Evaluating answer:', answer.substring(0, 50) + '...');
    
    // Always use fallback for now to ensure consistent results
    console.log('Using fallback evaluation for consistent results');
    return this.fallbackEvaluateAnswer(question, answer, timeUsed);
    
    /* Uncomment when ready to use AI evaluation
    try {
      const prompt = `
As an expert technical interviewer, evaluate this interview response with specific numerical scores:

Question: "${question.question}"
Category: ${question.category}
Difficulty: ${question.difficulty}
Expected Keywords: ${question.expectedKeywords?.join(', ') || 'None specified'}
Time Limit: ${question.timeLimit}s
Time Used: ${timeUsed}s

Candidate's Answer: "${answer}"

IMPORTANT: Provide exact numerical scores (0-100) for each criterion. Be strict but fair.

Evaluation Criteria:
1. Technical Accuracy: Is the answer technically correct and precise?
2. Completeness: Does it fully address all parts of the question?
3. Clarity: Is the communication clear and well-structured?
4. Relevance: How relevant is the answer to what was asked?
5. Depth: How deep is the technical understanding shown?

Scoring Guidelines:
- 90-100: Excellent, comprehensive, accurate
- 70-89: Good, mostly correct with minor gaps
- 50-69: Average, some understanding but significant gaps
- 30-49: Below average, limited understanding
- 0-29: Poor, little to no relevant content

Return ONLY valid JSON:
{
  "overallScore": 75,
  "technicalAccuracy": 80,
  "completeness": 70,
  "clarity": 75,
  "relevance": 85,
  "depth": 65,
  "timeEfficiency": 90,
  "strengths": ["Mentioned relevant technology", "Clear structure"],
  "improvements": ["Need more technical depth", "Missing key concepts"],
  "feedback": "Shows basic understanding but lacks technical depth. Consider explaining the underlying principles.",
  "isCorrect": true,
  "keywordsFound": ["api", "backend"]
}
`;

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      console.log('AI Response:', text.substring(0, 200) + '...');
      
      // Parse JSON response
      let cleanedText = text.replace(/```json\n?|\n?```/g, '').trim();
      // Remove any markdown formatting
      cleanedText = cleanedText.replace(/```\w*\n?|\n?```/g, '').trim();
      
      const evaluation = JSON.parse(cleanedText);
      
      return {
        overallScore: Math.max(0, Math.min(100, Math.round(evaluation.overallScore || 0))),
        technicalAccuracy: Math.max(0, Math.min(100, Math.round(evaluation.technicalAccuracy || 0))),
        completeness: Math.max(0, Math.min(100, Math.round(evaluation.completeness || 0))),
        clarity: Math.max(0, Math.min(100, Math.round(evaluation.clarity || 0))),
        relevance: Math.max(0, Math.min(100, Math.round(evaluation.relevance || 0))),
        depth: Math.max(0, Math.min(100, Math.round(evaluation.depth || 0))),
        timeEfficiency: Math.max(0, Math.min(100, Math.round(evaluation.timeEfficiency || 0))),
        strengths: evaluation.strengths || [],
        improvements: evaluation.improvements || [],
        feedback: evaluation.feedback || 'Response evaluated successfully.',
        isCorrect: (evaluation.overallScore || 0) >= 60,
        keywordsFound: evaluation.keywordsFound || []
      };
      
    } catch (error) {
      console.error('Error evaluating answer with Gemini:', error);
      console.log('Falling back to manual evaluation');
      return this.fallbackEvaluateAnswer(question, answer, timeUsed);
    }
    */
  }

  fallbackEvaluateAnswer(question, answer, timeUsed) {
    console.log(`Evaluating answer: "${answer}" for question: "${question.question}"`);
    
    // Handle empty or very short answers
    if (!answer || answer.trim().length < 2) {
      return {
        overallScore: 0,
        technicalAccuracy: 0,
        completeness: 0,
        clarity: 0,
        relevance: 0,
        depth: 0,
        timeEfficiency: 50,
        strengths: [],
        improvements: ['Please provide a more detailed response'],
        feedback: 'No meaningful response provided. Please answer the question with relevant technical details.',
        isCorrect: false,
        keywordsFound: []
      };
    }

    const keywords = question.expectedKeywords || [];
    const responseLower = answer.toLowerCase().trim();
    const answerWords = responseLower.split(/\s+/);
    
    // Keyword matching with partial matching
    let keywordMatches = 0;
    const foundKeywords = [];
    keywords.forEach(keyword => {
      const keywordLower = keyword.toLowerCase();
      if (responseLower.includes(keywordLower) || 
          answerWords.some(word => word.includes(keywordLower) || keywordLower.includes(word))) {
        keywordMatches++;
        foundKeywords.push(keyword);
      }
    });
    
    // Scoring components
    const keywordRatio = keywords.length > 0 ? (keywordMatches / keywords.length) : 0.5;
    const lengthBonus = Math.min(answer.length / 50, 1); // Bonus for longer, more detailed answers
    const wordCount = answerWords.length;
    
    // Base scoring logic
    let technicalAccuracy = 0;
    let completeness = 0;
    let clarity = 0;
    let relevance = 0;
    let depth = 0;
    
    // Technical Accuracy (0-100)
    if (keywordRatio > 0.7) technicalAccuracy = 85 + (keywordRatio * 15);
    else if (keywordRatio > 0.5) technicalAccuracy = 70 + (keywordRatio * 15);
    else if (keywordRatio > 0.3) technicalAccuracy = 50 + (keywordRatio * 20);
    else if (keywordRatio > 0) technicalAccuracy = 30 + (keywordRatio * 20);
    else technicalAccuracy = wordCount > 5 ? 25 : 10; // Some credit for effort
    
    // Relevance (0-100) - heavily based on keywords
    relevance = Math.max(20, keywordRatio * 100);
    if (foundKeywords.length === 0 && wordCount < 3) relevance = 5;
    
    // Completeness (0-100) - based on answer length and keyword coverage
    completeness = Math.min(100, (wordCount * 3) + (keywordRatio * 40) + (lengthBonus * 30));
    
    // Clarity (0-100) - based on structure and length
    if (wordCount < 3) clarity = 20;
    else if (wordCount < 10) clarity = 40 + (wordCount * 3);
    else if (wordCount < 30) clarity = 70 + (wordCount * 1);
    else clarity = Math.min(95, 85 + lengthBonus * 10);
    
    // Depth (0-100) - technical depth assessment
    depth = Math.min(100, technicalAccuracy * 0.8 + completeness * 0.2);
    
    // Time efficiency (0-100)
    let timeEfficiency = 75;
    if (timeUsed && question.timeLimit) {
      const timeRatio = timeUsed / question.timeLimit;
      if (timeRatio < 0.5) timeEfficiency = 95;
      else if (timeRatio < 0.8) timeEfficiency = 85;
      else if (timeRatio <= 1.0) timeEfficiency = 75;
      else timeEfficiency = 50;
    }
    
    // Difficulty adjustment
    const difficultyMultipliers = {
      easy: { min: 0.8, max: 1.0 },
      medium: { min: 0.7, max: 1.1 },
      hard: { min: 0.6, max: 1.3 }
    };
    
    const diffMultiplier = difficultyMultipliers[question.difficulty] || difficultyMultipliers.medium;
    
    // Apply difficulty scaling
    technicalAccuracy = Math.round(Math.max(0, Math.min(100, technicalAccuracy * (keywordRatio > 0.5 ? diffMultiplier.max : diffMultiplier.min))));
    completeness = Math.round(Math.max(0, Math.min(100, completeness * diffMultiplier.min)));
    clarity = Math.round(Math.max(0, Math.min(100, clarity)));
    relevance = Math.round(Math.max(0, Math.min(100, relevance)));
    depth = Math.round(Math.max(0, Math.min(100, depth * diffMultiplier.min)));
    timeEfficiency = Math.round(Math.max(0, Math.min(100, timeEfficiency)));
    
    // Overall score - weighted average
    const overallScore = Math.round(
      (technicalAccuracy * 0.25) +
      (completeness * 0.2) +
      (clarity * 0.15) +
      (relevance * 0.25) +
      (depth * 0.15)
    );
    
    // Generate feedback
    const strengths = [];
    const improvements = [];
    let feedback = '';
    
    if (foundKeywords.length > 0) {
      strengths.push(`Used relevant keywords: ${foundKeywords.join(', ')}`);
    }
    if (wordCount >= 10) {
      strengths.push('Provided detailed response');
    }
    if (timeEfficiency > 80) {
      strengths.push('Good time management');
    }
    
    if (foundKeywords.length === 0) {
      improvements.push('Use more specific technical terminology');
    }
    if (wordCount < 5) {
      improvements.push('Provide more detailed explanations');
    }
    if (technicalAccuracy < 50) {
      improvements.push('Focus on technical accuracy and precision');
    }
    if (relevance < 60) {
      improvements.push('Ensure response directly addresses the question');
    }
    
    // Generate contextual feedback
    if (overallScore >= 80) {
      feedback = `Excellent response! Shows strong understanding of ${question.category} concepts with good technical depth.`;
    } else if (overallScore >= 60) {
      feedback = `Good response with solid understanding. Consider adding more technical details and specific examples.`;
    } else if (overallScore >= 40) {
      feedback = `Basic understanding demonstrated. Would benefit from more specific technical knowledge and detailed explanations.`;
    } else {
      feedback = `Response needs significant improvement. Focus on understanding core ${question.category} concepts and providing detailed, technical answers.`;
    }
    
    const result = {
      overallScore: Math.max(0, overallScore),
      technicalAccuracy: Math.max(0, technicalAccuracy),
      completeness: Math.max(0, completeness),
      clarity: Math.max(0, clarity),
      relevance: Math.max(0, relevance),
      depth: Math.max(0, depth),
      timeEfficiency: Math.max(0, timeEfficiency),
      strengths,
      improvements,
      feedback,
      isCorrect: overallScore >= 60,
      keywordsFound: foundKeywords
    };
    
    console.log(`Evaluation result: Overall: ${result.overallScore}%, Technical: ${result.technicalAccuracy}%, Relevance: ${result.relevance}%`);
    return result;
  }

  async parseResumeText(resumeText) {
    try {
      const prompt = `
As an expert HR and resume parsing system, extract the following information from this resume text:

Resume Text:
${resumeText}

Extract and return ONLY a valid JSON object in this exact format:
{
  "name": "Full Name",
  "email": "email@example.com",
  "phone": "+1-555-123-4567",
  "summary": "Professional summary in 2-3 sentences",
  "skills": ["skill1", "skill2", "skill3"],
  "experience": [
    {
      "title": "Job Title",
      "company": "Company Name", 
      "duration": "2020-2023",
      "description": "Brief description of role and achievements"
    }
  ],
  "education": [
    {
      "degree": "Bachelor of Science in Computer Science",
      "institution": "University Name",
      "year": "2019"
    }
  ],
  "projects": [
    {
      "name": "Project Name",
      "description": "Brief description",
      "technologies": ["tech1", "tech2"]
    }
  ]
}

Requirements:
- Extract exact name, email, and phone if available
- If email or phone is missing, set as empty string ""
- Summarize work experience concisely
- List all technical skills mentioned
- Include education details
- Extract notable projects if mentioned
- Ensure all JSON is properly formatted and valid
`;

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      console.log('Raw AI response for resume parsing:', text.substring(0, 500) + '...');
      
      // Parse JSON response
      const cleanedText = text.replace(/```json\n?|\n?```/g, '').trim();
      console.log('Cleaned text for JSON parsing:', cleanedText.substring(0, 300) + '...');
      
      const parsedData = JSON.parse(cleanedText);
      console.log('Successfully parsed JSON:', JSON.stringify(parsedData, null, 2));
      
      // Validate required fields and provide warnings
      let warning = null;
      const missingFields = [];
      
      if (!parsedData.name || parsedData.name.trim() === '') missingFields.push('name');
      if (!parsedData.email || parsedData.email.trim() === '') missingFields.push('email');
      if (!parsedData.phone || parsedData.phone.trim() === '') missingFields.push('phone');
      
      if (missingFields.length > 0) {
        warning = `Missing required fields: ${missingFields.join(', ')}. Please provide these manually.`;
      }
      
      return {
        name: parsedData.name || '',
        email: parsedData.email || '',
        phone: parsedData.phone || '',
        summary: parsedData.summary || 'No summary available',
        skills: parsedData.skills || [],
        experience: parsedData.experience || [],
        education: parsedData.education || [],
        projects: parsedData.projects || [],
        warning: warning
      };
      
    } catch (error) {
      console.error('Error parsing resume with Gemini:', error);
      
      // Fallback parsing - try to extract basic info with regex
      return this.fallbackResumeParser(resumeText);
    }
  }

  fallbackResumeParser(text) {
    const result = {
      name: '',
      email: '',
      phone: '',
      summary: 'Resume parsing failed - please verify information',
      skills: [],
      experience: [],
      education: [],
      projects: [],
      warning: 'AI parsing failed, using basic extraction'
    };

    try {
      // Extract email
      const emailMatch = text.match(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/);
      if (emailMatch) result.email = emailMatch[0];

      // Extract phone
      const phoneMatch = text.match(/(\+?1?[-.\s]?)?(\(?[0-9]{3}\)?[-.\s]?[0-9]{3}[-.\s]?[0-9]{4})/);
      if (phoneMatch) result.phone = phoneMatch[0];

      // Extract name (assume first line or first few words)
      const lines = text.trim().split('\n');
      const firstLine = lines[0]?.trim();
      if (firstLine && firstLine.length < 50 && !firstLine.includes('@')) {
        result.name = firstLine;
      }

      // Extract skills (look for common skill-related keywords)
      const skillPatterns = [
        /skills?:\s*(.+)/i,
        /technologies?:\s*(.+)/i,
        /programming languages?:\s*(.+)/i
      ];
      
      for (const pattern of skillPatterns) {
        const match = text.match(pattern);
        if (match) {
          const skillsText = match[1];
          const skills = skillsText.split(/[,;|]/).map(s => s.trim()).filter(s => s.length > 0);
          result.skills = [...result.skills, ...skills];
        }
      }

      // Remove duplicates
      result.skills = [...new Set(result.skills)];
      
    } catch (error) {
      console.error('Fallback parsing also failed:', error);
    }

    return result;
  }

  async generateOverallAssessment(interview) {
    try {
      const responses = interview.responses || [];
      const questions = interview.questions || [];
      
      // Calculate detailed statistics
      const totalQuestions = responses.length;
      const correctAnswers = responses.filter(r => r.aiAnalysis?.isCorrect !== false).length;
      const accuracyPercentage = totalQuestions > 0 ? Math.round((correctAnswers / totalQuestions) * 100) : 0;
      
      const averageScore = responses.length > 0 
        ? Math.round(responses.reduce((sum, r) => sum + (r.score || 0), 0) / responses.length)
        : 0;
      
      // Group by difficulty
      const performanceByDifficulty = { easy: [], medium: [], hard: [] };
      responses.forEach((resp, index) => {
        const question = questions[index];
        if (question && performanceByDifficulty[question.difficulty]) {
          performanceByDifficulty[question.difficulty].push(resp.score || 0);
        }
      });
      
      // Calculate category performance
      const categoryPerformance = {};
      responses.forEach((resp, index) => {
        const question = questions[index];
        if (question) {
          const category = question.category;
          if (!categoryPerformance[category]) {
            categoryPerformance[category] = [];
          }
          categoryPerformance[category].push(resp.score || 0);
        }
      });

      const prompt = `
You are a senior technical interviewer conducting a comprehensive assessment for a ${interview.position} position. 

INTERVIEW DATA ANALYSIS:
======================
Position: ${interview.position}
Candidate: ${interview.candidateName}
Questions Answered: ${totalQuestions}
Correct Answers: ${correctAnswers}/${totalQuestions} (${accuracyPercentage}% accuracy)
Average Score: ${averageScore}/100

PERFORMANCE BREAKDOWN BY DIFFICULTY:
===================================
${performanceByDifficulty.easy.length > 0 ? `Easy Questions (${performanceByDifficulty.easy.length}): Average ${Math.round(performanceByDifficulty.easy.reduce((a,b) => a+b, 0)/performanceByDifficulty.easy.length)}% | Scores: [${performanceByDifficulty.easy.join(', ')}]` : 'No easy questions asked'}
${performanceByDifficulty.medium.length > 0 ? `Medium Questions (${performanceByDifficulty.medium.length}): Average ${Math.round(performanceByDifficulty.medium.reduce((a,b) => a+b, 0)/performanceByDifficulty.medium.length)}% | Scores: [${performanceByDifficulty.medium.join(', ')}]` : 'No medium questions asked'}
${performanceByDifficulty.hard.length > 0 ? `Hard Questions (${performanceByDifficulty.hard.length}): Average ${Math.round(performanceByDifficulty.hard.reduce((a,b) => a+b, 0)/performanceByDifficulty.hard.length)}% | Scores: [${performanceByDifficulty.hard.join(', ')}]` : 'No hard questions asked'}

CATEGORY PERFORMANCE ANALYSIS:
=============================
${Object.entries(categoryPerformance).map(([category, scores]) => {
  const avgScore = Math.round(scores.reduce((a,b) => a+b, 0)/scores.length);
  const competencyLevel = avgScore >= 85 ? 'Excellent' : avgScore >= 70 ? 'Strong' : avgScore >= 60 ? 'Adequate' : avgScore >= 40 ? 'Needs Improvement' : 'Poor';
  return `${category.toUpperCase()}: ${avgScore}% (${competencyLevel}) - ${scores.length} question${scores.length > 1 ? 's' : ''} | Scores: [${scores.join(', ')}]`;
}).join('\n')}

DETAILED QUESTION ANALYSIS:
===========================
${responses.map((resp, index) => {
  const question = questions[index];
  const competencyLevel = (resp.score || 0) >= 80 ? 'Strong' : (resp.score || 0) >= 60 ? 'Adequate' : 'Weak';
  return `Q${index + 1}: ${question?.difficulty?.toUpperCase() || 'UNKNOWN'} | ${question?.category || 'unknown'} | Score: ${resp.score || 0}/100 (${competencyLevel}) | Time: ${resp.timeUsed || 0}s/${question?.timeLimit || 0}s`;
}).join('\n')}

ASSESSMENT INSTRUCTIONS:
=======================
Based on the data above, provide a comprehensive technical assessment following these criteria:

1. TECHNICAL COMPETENCY EVALUATION:
   - 90-100%: Expert Level - Deep understanding, innovative solutions
   - 80-89%: Senior Level - Strong technical skills, good problem-solving
   - 70-79%: Mid Level - Solid understanding, some gaps in complex areas
   - 60-69%: Junior Level - Basic understanding, needs guidance
   - 50-59%: Entry Level - Limited knowledge, requires training
   - <50%: Below Requirements - Insufficient technical skills

2. COMMUNICATION ASSESSMENT (rate 1-100):
   - Clarity of explanations in responses
   - Use of appropriate technical terminology
   - Structure and organization of answers
   - Ability to explain complex concepts simply

3. RECOMMENDATION LOGIC:
   - "Strong Hire" (90%+): Exceptional candidate, exceeds requirements
   - "Hire" (75-89%): Solid candidate, meets requirements well
   - "Hire with Mentoring" (60-74%): Good potential, needs some support
   - "Maybe" (50-59%): Concerns exist, marginal fit
   - "No Hire" (<50%): Does not meet minimum requirements

4. CONFIDENCE LEVEL:
   - "Very High": Consistent performance across all categories
   - "High": Strong performance with minor variations  
   - "Medium": Mixed performance, some concerns
   - "Low": Inconsistent or concerning performance

Provide specific, actionable insights based on the actual performance data. Be objective and fair.

Return ONLY a valid JSON object in this exact format:
{
  "overallScore": 75,
  "accuracyPercentage": 80,
  "technicalCompetency": "Mid Level",
  "communicationScore": 85,
  "problemSolvingScore": 78,
  "experienceScore": 82,
  "recommendation": "Hire",
  "confidenceLevel": "High",
  "riskLevel": "Low",
  "readinessLevel": "Ready for Role",
  "strengths": ["Demonstrates strong analytical thinking", "Excellent communication clarity", "Good time management"],
  "improvements": ["Could deepen system design knowledge", "Practice more complex algorithms"],
  "keyHighlights": ["Scored 90%+ on technical fundamentals", "Consistent performance across all difficulty levels"],
  "redFlags": ["Struggled with advanced concepts", "Time management issues on hard questions"],
  "detailedSummary": "Comprehensive analysis covering technical depth, problem-solving approach, communication effectiveness, and overall readiness for the role. Include specific examples from their performance.",
  "categoryInsights": {
    "technical": 85,
    "problemSolving": 75,
    "communication": 88,
    "experience": 80,
    "systemDesign": 70
  },
  "competencyMatrix": {
    "codingSkills": {"score": 85, "level": "Strong", "evidence": "Solved algorithmic problems efficiently"},
    "systemThinking": {"score": 70, "level": "Developing", "evidence": "Basic understanding but lacks depth"},
    "communication": {"score": 88, "level": "Excellent", "evidence": "Clear explanations with good structure"},
    "problemSolving": {"score": 78, "level": "Good", "evidence": "Methodical approach to breaking down problems"}
  },
  "hiringJustification": "Based on X% overall performance with strong showings in Y categories. Candidate demonstrates Z level competency suitable for the role requirements. Recommendation confidence is high/medium/low due to specific performance patterns.",
  "nextSteps": ["Technical deep-dive interview", "System design round", "Cultural fit assessment"],
  "salaryBandSuggestion": "Mid-range for position level",
  "mentorshipNeeds": ["Advanced system design concepts", "Code optimization techniques"]
}
`;

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      // Parse JSON response
      const cleanedText = text.replace(/```json\n?|\n?```/g, '').trim();
      const assessment = JSON.parse(cleanedText);
      
      return {
        overallScore: assessment.overallScore || averageScore,
        accuracyPercentage: assessment.accuracyPercentage || accuracyPercentage,
        technicalCompetency: assessment.technicalCompetency || 'Mid Level',
        communicationScore: assessment.communicationScore || 75,
        problemSolvingScore: assessment.problemSolvingScore || averageScore,
        experienceScore: assessment.experienceScore || averageScore,
        recommendation: assessment.recommendation || this.getRecommendationFromScore(averageScore),
        confidenceLevel: assessment.confidenceLevel || 'Medium',
        riskLevel: assessment.riskLevel || 'Medium',
        readinessLevel: assessment.readinessLevel || 'Under Review',
        strengths: assessment.strengths || [],
        improvements: assessment.improvements || [],
        keyHighlights: assessment.keyHighlights || [],
        redFlags: assessment.redFlags || [],
        detailedSummary: assessment.detailedSummary || `Candidate completed ${totalQuestions} questions with ${accuracyPercentage}% accuracy rate and ${averageScore}% average score.`,
        categoryInsights: assessment.categoryInsights || {},
        competencyMatrix: assessment.competencyMatrix || {},
        hiringJustification: assessment.hiringJustification || `Based on ${averageScore}% overall performance across ${totalQuestions} questions. Assessment confidence level: ${assessment.confidenceLevel || 'Medium'}.`,
        nextSteps: assessment.nextSteps || ['Follow-up interview recommended'],
        salaryBandSuggestion: assessment.salaryBandSuggestion || 'Standard range for position',
        mentorshipNeeds: assessment.mentorshipNeeds || []
      };
      
    } catch (error) {
      console.error('Error generating overall assessment with Gemini:', error);
      return this.generateFallbackAssessment(interview);
    }
  }

  getRecommendationFromScore(averageScore) {
    if (averageScore >= 90) return 'Strong Hire';
    if (averageScore >= 75) return 'Hire';
    if (averageScore >= 60) return 'Hire with Mentoring';
    if (averageScore >= 50) return 'Maybe';
    return 'No Hire';
  }

  getReadinessLevel(averageScore, accuracyPercentage) {
    if (averageScore >= 85 && accuracyPercentage >= 80) return 'Ready for Role';
    if (averageScore >= 70 && accuracyPercentage >= 70) return 'Ready with Support';
    if (averageScore >= 60) return 'Needs Development';
    if (averageScore >= 50) return 'Significant Training Required';
    return 'Not Ready';
  }

  getRiskLevel(averageScore, accuracyPercentage, consistencyScore = 70) {
    if (averageScore >= 80 && accuracyPercentage >= 75 && consistencyScore >= 70) return 'Low Risk';
    if (averageScore >= 65 && accuracyPercentage >= 60) return 'Medium Risk';
    if (averageScore >= 50) return 'High Risk';
    return 'Very High Risk';
  }

  generateFallbackAssessment(interview) {
    const responses = interview.responses || [];
    const totalQuestions = responses.length;
    const averageScore = responses.length > 0 
      ? Math.round(responses.reduce((sum, r) => sum + (r.score || 0), 0) / responses.length)
      : 0;
    const correctAnswers = responses.filter(r => (r.score || 0) >= 60).length;
    const accuracyPercentage = totalQuestions > 0 ? Math.round((correctAnswers / totalQuestions) * 100) : 0;
    
    return {
      overallScore: averageScore,
      accuracyPercentage: accuracyPercentage,
      technicalCompetency: averageScore >= 85 ? 'Senior Level' : averageScore >= 70 ? 'Mid Level' : averageScore >= 60 ? 'Junior Level' : 'Entry Level',
      communicationScore: Math.min(100, averageScore + 10),
      problemSolvingScore: averageScore,
      experienceScore: averageScore,
      recommendation: this.getRecommendationFromScore(averageScore),
      confidenceLevel: accuracyPercentage >= 75 ? 'High' : accuracyPercentage >= 50 ? 'Medium' : 'Low',
      riskLevel: this.getRiskLevel(averageScore, accuracyPercentage),
      readinessLevel: this.getReadinessLevel(averageScore, accuracyPercentage),
      strengths: averageScore >= 70 ? ['Demonstrated solid technical foundation', 'Consistent performance'] : ['Completed all questions'],
      improvements: averageScore < 70 ? ['Could strengthen technical foundation', 'Practice problem-solving techniques'] : ['Continue developing advanced skills'],
      keyHighlights: averageScore >= 80 ? ['Strong overall performance', 'Above-average technical skills'] : [],
      redFlags: averageScore < 50 ? ['Below minimum performance threshold', 'Significant knowledge gaps'] : [],
      detailedSummary: `Candidate completed ${totalQuestions} questions with an average score of ${averageScore}% and ${accuracyPercentage}% accuracy rate. ${averageScore >= 70 ? 'Shows solid technical competency and readiness for the role.' : 'Performance indicates areas for improvement before role readiness.'}`,
      categoryInsights: { overall: averageScore },
      competencyMatrix: {
        overall: { score: averageScore, level: averageScore >= 70 ? 'Competent' : 'Developing', evidence: `${accuracyPercentage}% accuracy across interview questions` }
      },
      hiringJustification: `Assessment based on ${averageScore}% average performance across ${totalQuestions} questions with ${accuracyPercentage}% accuracy. ${this.getReadinessLevel(averageScore, accuracyPercentage)} for the position.`,
      nextSteps: averageScore >= 70 ? ['Technical deep-dive', 'Cultural fit assessment'] : ['Skills assessment', 'Additional training evaluation'],
      salaryBandSuggestion: averageScore >= 85 ? 'Upper range' : averageScore >= 70 ? 'Mid range' : 'Entry level',
      mentorshipNeeds: averageScore < 70 ? ['Technical fundamentals', 'Problem-solving methodology'] : ['Advanced concepts', 'Best practices']
    };
  }
}

let geminiServiceInstance = null;

export function getGeminiService() {
  if (!geminiServiceInstance) {
    geminiServiceInstance = new GeminiService();
  }
  return geminiServiceInstance;
}

// For backward compatibility, also export as default
export default {
  getGeminiService,
  // Proxy all methods to the singleton instance
  get instance() {
    return getGeminiService();
  }
};