import { GoogleGenerativeAI } from '@google/generative-ai';
import type { Candidate, Interview, Question, ChatMessage, Answer, BatchScoringResult } from '../types';

// For demo purposes, we'll use a fallback if no API key is provided
const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY || '';
const USE_AI = Boolean(GEMINI_API_KEY);

// Log AI service status
console.log(`🤖 AI Service: ${USE_AI ? 'Using Gemini AI' : 'Using local fallbacks (add VITE_GEMINI_API_KEY for AI features)'}`);

class AIService {
  private genAI: GoogleGenerativeAI | null = null;
  private model: any = null;

  constructor() {
    if (USE_AI) {
      this.genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
      this.model = this.genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    }
  }

  // Resume parsing with AI enhancement
  async parseResume(file: File): Promise<string> {
    // This will still use the existing resumeParser utility
    const { parseResumeFile } = await import('../utils/resumeParser');
    return parseResumeFile(file).then(data => data.text);
  }

  // Gemini 2.5-flash direct PDF processing
  async processPDFWithGemini(file: File): Promise<string> {
    if (!USE_AI || !this.model) {
      throw new Error('Gemini AI not available - add VITE_GEMINI_API_KEY to .env file');
    }

    try {
      console.log('📄 Converting PDF to base64 for Gemini processing...');
      
      // Convert file to base64
      const arrayBuffer = await file.arrayBuffer();
      const base64Data = btoa(
        new Uint8Array(arrayBuffer).reduce(
          (data, byte) => data + String.fromCharCode(byte), 
          ''
        )
      );

      console.log('🤖 Sending PDF to Gemini 2.5-flash for analysis...');

      const prompt = `You are an expert resume parser. Analyze this PDF resume and extract all the key information.

Please provide the extracted information in this exact format:

RESUME - [Full Name]

Name: [Full Name]
Email: [email@domain.com]
Phone: [phone number formatted nicely]
Position: [current role or desired position]
Skills: [key technical skills]
Experience: [brief summary of work experience]
Education: [education details]

=== ORIGINAL CONTENT ===
[Include any other relevant information from the resume]

IMPORTANT:
- Only extract information that is clearly present in the document
- Do not invent or guess any information
- If something is not found, write "Not specified in resume"
- Format phone numbers properly
- Ensure email addresses are valid`;

      const imagePart = {
        inlineData: {
          data: base64Data,
          mimeType: file.type
        }
      };

      const result = await this.model.generateContent([prompt, imagePart]);
      const response = result.response.text();

      if (response && response.trim().length > 100) {
        console.log('✅ Gemini PDF analysis successful!');
        return response.trim();
      } else {
        throw new Error('Gemini returned empty or short response');
      }

    } catch (error) {
      console.error('❌ Gemini PDF processing failed:', error);
      throw error;
    }
  }

  // AI-powered resume data extraction from raw text
  async extractResumeData(rawText: string): Promise<string> {
    if (USE_AI && this.model) {
      try {
        console.log('🤖 Using Gemini AI for resume data extraction...');
        
        const prompt = `You are an expert resume parser. Extract and identify the following information from this resume text:

1. Full Name (person's name)
2. Email Address
3. Phone Number
4. Current Position/Role
5. Key Skills
6. Experience Summary

Resume Text:
"""
${rawText}
"""

Please return the information in this exact format:
RESUME - [Full Name]

Name: [Full Name]
Email: [email@domain.com]  
Phone: [phone number with proper formatting]
Position: [current role or desired position]
Skills: [list key technical skills]
Experience: [brief summary]

=== ORIGINAL CONTENT ===
[Include the original text for reference]

IMPORTANT RULES:
- Only extract information that is clearly present in the text
- Do not invent or guess any information
- If something is not found, write "Not found in document"
- Format phone numbers clearly (e.g., +1 (555) 123-4567)
- Ensure email addresses are valid format`;

        const result = await this.model.generateContent(prompt);
        const response = result.response.text();
        
        if (response && response.trim().length > 100) {
          console.log('✅ AI resume extraction successful');
          return response.trim();
        } else {
          console.warn('⚠️ AI returned short response, using fallback');
        }
      } catch (error) {
        console.error('❌ AI resume extraction failed:', error);
      }
    } else {
      console.log('🔄 No AI available, using local parsing...');
    }
    
    // Fallback: return structured raw text
    return `Resume Content (AI not available):\n\n${rawText}`;
  }

  // Extract technologies from resume text
  private extractTechnologies(resumeText: string): string[] {
    const techPatterns = [
      // Programming Languages
      /\b(JavaScript|TypeScript|Python|Java|C\+\+|C#|PHP|Ruby|Go|Rust|Swift|Kotlin|Scala)\b/gi,
      // Frameworks & Libraries  
      /\b(React|Angular|Vue|Node\.js|Express|Django|Flask|Spring|Laravel|Rails|ASP\.NET)\b/gi,
      // Databases
      /\b(MySQL|PostgreSQL|MongoDB|Redis|Elasticsearch|Oracle|SQL Server|SQLite)\b/gi,
      // Cloud & DevOps
      /\b(AWS|Azure|GCP|Docker|Kubernetes|Jenkins|GitLab|GitHub Actions|Terraform)\b/gi,
      // Tools & Technologies
      /\b(Git|Linux|Apache|Nginx|Webpack|Babel|Jest|Cypress|Selenium)\b/gi
    ];
    
    const technologies = new Set<string>();
    techPatterns.forEach(pattern => {
      const matches = resumeText.match(pattern) || [];
      matches.forEach(match => technologies.add(match.toLowerCase()));
    });
    
    return Array.from(technologies);
  }

  // Identify domain based on position and resume
  private identifyDomain(position: string, resumeText: string): string {
    const domainKeywords = {
      'frontend': ['frontend', 'front-end', 'react', 'angular', 'vue', 'html', 'css', 'ui', 'ux'],
      'backend': ['backend', 'back-end', 'api', 'server', 'database', 'microservices'],
      'fullstack': ['fullstack', 'full-stack', 'full stack'],
      'devops': ['devops', 'infrastructure', 'deployment', 'ci/cd', 'docker', 'kubernetes'],
      'mobile': ['mobile', 'ios', 'android', 'react native', 'flutter', 'swift', 'kotlin'],
      'data': ['data science', 'machine learning', 'analytics', 'python', 'pandas', 'numpy'],
      'security': ['security', 'cybersecurity', 'penetration', 'vulnerability']
    };

    const positionLower = position.toLowerCase();
    const resumeLower = resumeText.toLowerCase();
    
    for (const [domain, keywords] of Object.entries(domainKeywords)) {
      if (keywords.some(keyword => positionLower.includes(keyword) || resumeLower.includes(keyword))) {
        return domain;
      }
    }
    
    return 'general';
  }

  // Generate all interview questions at once (new workflow)
  async generateAllInterviewQuestions(resumeText: string, positionInput: string, difficulty: 'easy' | 'medium' | 'hard' = 'medium'): Promise<Question[]> {
    return this.generateQuestions(resumeText, positionInput, difficulty);
  }

  // Extract candidate info from resume
  async extractCandidateInfo(resumeText: string): Promise<{
    name: string;
    email: string;
    phone: string;
    domain: string;
    position: string;
    skills: string[];
    experience: string;
    extractedData: string;
  }> {
    if (USE_AI && this.model) {
      try {
        console.log('🤖 Using Gemini AI for candidate info extraction...');
        
        const prompt = `Analyze this resume and extract key candidate information:

RESUME:
${resumeText}

Extract the following information and return in JSON format:
{
  "name": "Full name of the candidate",
  "email": "Email address", 
  "phone": "Phone number",
  "domain": "Technical domain/field (e.g., Frontend Development, Backend, DevOps, Data Science, Mobile, Cybersecurity)",
  "position": "Specific role/title (e.g., React Developer, DevOps Engineer, Data Scientist)",
  "skills": ["skill1", "skill2", "skill3"],
  "experience": "Brief summary of work experience"
}

IMPORTANT:
- For domain, identify the PRIMARY technical area from: Frontend Development, Backend Development, DevOps, Mobile Development, Data Science, Cybersecurity, Full Stack Development
- For position, be specific about the role they're targeting or currently in
- Extract 5-10 key technical skills
- Keep experience summary to 2-3 sentences`;

        const result = await this.model.generateContent(prompt);
        const response = result.response.text();
        
        // Try to parse JSON response
        try {
          const jsonMatch = response.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            const data = JSON.parse(jsonMatch[0]);
            return {
              ...data,
              extractedData: resumeText
            };
          }
        } catch (parseError) {
          console.warn('Failed to parse AI response as JSON, using fallback');
        }
      } catch (error) {
        console.error('AI candidate extraction failed:', error);
      }
    }
    
    return this.extractCandidateInfoLocal(resumeText);
  }

  private extractCandidateInfoLocal(resumeText: string): {
    name: string;
    email: string;
    phone: string;
    domain: string;
    position: string;
    skills: string[];
    experience: string;
    extractedData: string;
  } {
    // Simple extraction using regex patterns
    const emailMatch = resumeText.match(/[\w\.-]+@[\w\.-]+\.\w+/);
    const phoneMatch = resumeText.match(/[\+]?[\d\s\-\(\)]{10,}/);
    const nameMatch = resumeText.match(/(?:Name|NAME):\s*([^\n]+)/i) || 
                     resumeText.split('\n')[0]?.match(/^([A-Z][a-z]+\s+[A-Z][a-z]+)/);
    
    const technologies = this.extractTechnologies(resumeText);
    const domain = this.identifyDomain('', resumeText);
    
    return {
      name: nameMatch?.[1]?.trim() || 'Candidate',
      email: emailMatch?.[0] || 'email@example.com',
      phone: phoneMatch?.[0]?.replace(/\s+/g, '') || '1234567890',
      domain: domain.charAt(0).toUpperCase() + domain.slice(1),
      position: `${domain.charAt(0).toUpperCase() + domain.slice(1)} Developer`,
      skills: technologies.slice(0, 8),
      experience: 'Experienced developer with skills in various technologies.',
      extractedData: resumeText
    };
  }

  // AI-powered question generation with domain-specific focus
  async generateQuestions(resumeText: string, positionInput: string, difficulty: 'easy' | 'medium' | 'hard' = 'medium'): Promise<Question[]> {
    if (USE_AI && this.model) {
      try {
        // Parse domain and position from input (e.g., "Cybersecurity - Security Analyst")
        let domain = positionInput;
        let position = positionInput;
        
        if (positionInput.includes(' - ')) {
          const parts = positionInput.split(' - ');
          domain = parts[0].trim();
          position = parts[1].trim();
        }

        // Extract key technologies and skills from resume
        const techKeywords = this.extractTechnologies(resumeText);
        
        const prompt = `You are an expert technical interviewer. Generate exactly 6 highly domain-specific technical interview questions for a ${position} position in the ${domain} domain based on this resume:

RESUME CONTENT:
${resumeText}

EXTRACTED TECHNOLOGIES: ${techKeywords.join(', ')}
TARGET DOMAIN: ${domain}
TARGET POSITION: ${position}

🎯 CRITICAL REQUIREMENTS:
1. Questions MUST be 100% specific to the ${domain} domain and ${position} role
2. NO generic HR questions - ONLY technical/domain expertise questions
3. Questions should test real-world scenarios they'd face in this exact role
4. Use the specific technologies mentioned in their resume when possible
5. Make questions practical and job-relevant

📊 DIFFICULTY DISTRIBUTION (EXACTLY 6 QUESTIONS):
- 2 Easy questions (20 seconds each): Basic concepts, definitions, fundamentals of ${domain}
- 2 Medium questions (60 seconds each): Practical implementation, troubleshooting, best practices in ${domain}
- 2 Hard questions (120 seconds each): System design, architecture, complex problem-solving specific to ${domain}

🏆 QUALITY EXAMPLES BY DOMAIN:

**Frontend Development:**
- Easy: "What's the difference between useEffect and useLayoutHook in React?"
- Medium: "How would you implement infinite scrolling in a React app with 10,000 items?"
- Hard: "Design a micro-frontend architecture for a large e-commerce platform"

**Backend Development:**
- Easy: "Explain the difference between SQL and NoSQL databases"
- Medium: "How would you implement rate limiting in an Express.js API?"
- Hard: "Design a scalable chat system that handles 1M concurrent users"

**Data Science:**
- Easy: "What's the difference between supervised and unsupervised learning?"
- Medium: "How would you handle missing data in a time series forecasting model?"
- Hard: "Design a real-time recommendation system for a streaming platform"

**DevOps/Cloud:**
- Easy: "What's the difference between Docker containers and virtual machines?"
- Medium: "How would you set up blue-green deployment in Kubernetes?"
- Hard: "Design a multi-region disaster recovery strategy for a critical application"

**Cybersecurity:**
- Easy: "What are the main types of SQL injection attacks?"
- Medium: "How would you implement secure authentication in a web application?"
- Hard: "Design a comprehensive security framework for a financial services company"

**Mobile Development:**
- Easy: "What's the difference between native and hybrid mobile apps?"
- Medium: "How would you optimize app performance for older Android devices?"
- Hard: "Design an offline-first mobile app architecture with sync capabilities"

Generate questions that would actually be asked in a ${position} interview at a top tech company.

Return ONLY a JSON array with exactly this structure:
[
  {
    "text": "Question text here",
    "difficulty": "easy",
    "timeLimit": 20,
    "category": "Category name"
  },
  {
    "text": "Question text here", 
    "difficulty": "easy",
    "timeLimit": 20,
    "category": "Category name"
  },
  {
    "text": "Question text here",
    "difficulty": "medium", 
    "timeLimit": 60,
    "category": "Category name"
  },
  {
    "text": "Question text here",
    "difficulty": "medium",
    "timeLimit": 60, 
    "category": "Category name"
  },
  {
    "text": "Question text here",
    "difficulty": "hard",
    "timeLimit": 120,
    "category": "Category name" 
  },
  {
    "text": "Question text here",
    "difficulty": "hard", 
    "timeLimit": 120,
    "category": "Category name"
  }
]`;

        const result = await this.model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();
        
        // Try to parse JSON response
        try {
          const jsonMatch = text.match(/\[[\s\S]*\]/);
          if (jsonMatch) {
            const questionsData = JSON.parse(jsonMatch[0]);
            return questionsData.map((q: any, index: number) => ({
              ...q,
              id: `ai_q_${Date.now()}_${index}`,
              timeLimit: this.getTimeLimitForDifficulty(q.difficulty)
            }));
          }
        } catch (parseError) {
          console.warn('Failed to parse AI response as JSON, using fallback');
        }
      } catch (error) {
        console.error('AI question generation failed:', error);
      }
    }

    // Fallback to local generation with domain-specific questions
    return this.generateLocalQuestions(resumeText, positionInput, difficulty);
  }

  private getTimeLimitForDifficulty(difficulty: string): number {
    switch (difficulty) {
      case 'easy': return 20;
      case 'medium': return 60;
      case 'hard': return 120;
      default: return 60;
    }
  }

  private generateLocalQuestions(resumeText: string, positionInput: string, _difficulty: string): Question[] {
    const techKeywords = this.extractTechnologies(resumeText);
    
    // Parse domain and position from input (e.g., "Cybersecurity - Security Analyst")
    let domain = positionInput.toLowerCase();
    let position = positionInput;
    
    if (positionInput.includes(' - ')) {
      const parts = positionInput.split(' - ');
      domain = parts[0].trim().toLowerCase();
      position = parts[1].trim();
    }
    
    // Map common domains to question categories
    const domainMapping: { [key: string]: string } = {
      'frontend': 'frontend',
      'front-end': 'frontend', 
      'front end': 'frontend',
      'backend': 'backend',
      'back-end': 'backend',
      'back end': 'backend',
      'fullstack': 'fullstack',
      'full-stack': 'fullstack',
      'full stack': 'fullstack',
      'devops': 'devops',
      'cybersecurity': 'security',
      'security': 'security',
      'mobile': 'mobile',
      'data science': 'data',
      'data': 'data',
      'machine learning': 'data',
      'ai': 'data'
    };
    
    // Find the best matching domain or use 'general' as fallback
    let questionDomain = 'general';
    for (const [key, value] of Object.entries(domainMapping)) {
      if (domain.includes(key)) {
        questionDomain = value;
        break;
      }
    }
    
    // Domain-specific question templates
    const questionTemplates = {
      frontend: {
        easy: [
          "What is the virtual DOM in React and how does it work?",
          "Explain the difference between CSS Grid and Flexbox."
        ],
        medium: [
          `How would you optimize a React component that renders ${techKeywords.includes('react') ? 'a large list of data' : 'complex UI elements'}?`,
          "Describe how you would implement state management in a medium-sized application."
        ],
        hard: [
          "Design a scalable frontend architecture for a real-time collaborative application.",
          "How would you implement micro-frontends architecture?"
        ]
      },
      backend: {
        easy: [
          "What are RESTful APIs and their key principles?",
          "Explain the difference between SQL and NoSQL databases."
        ],
        medium: [
          `How would you implement authentication and authorization in a ${techKeywords.includes('node') ? 'Node.js' : 'backend'} application?`,
          "Describe how you would handle database migrations in production."
        ],
        hard: [
          "Design a microservices architecture for a high-traffic e-commerce platform.",
          "How would you implement distributed caching and handle cache invalidation?"
        ]
      },
      fullstack: {
        easy: [
          "What is the difference between client-side and server-side rendering?",
          "Explain HTTP status codes and when to use them."
        ],
        medium: [
          "How would you structure a full-stack application for optimal performance?",
          "Describe your approach to API versioning and backward compatibility."
        ],
        hard: [
          "Design a real-time chat application architecture with offline support.",
          "How would you implement end-to-end testing for a complex web application?"
        ]
      },
      data: {
        easy: [
          "What is the difference between supervised and unsupervised learning?",
          "Explain what overfitting is and how to prevent it."
        ],
        medium: [
          "How would you handle missing data in a machine learning pipeline?",
          "Describe your approach to feature engineering for a recommendation system."
        ],
        hard: [
          "Design a real-time fraud detection system using machine learning.",
          "How would you scale a machine learning model to handle millions of predictions per day?"
        ]
      }
    };

    // Add more domain templates for common fields
    const extendedQuestionTemplates = {
      ...questionTemplates,
      security: {
        easy: [
          "What are the main types of SQL injection attacks?",
          "Explain the difference between authentication and authorization."
        ],
        medium: [
          "How would you implement secure session management in a web application?",
          "Describe common web application vulnerabilities and their mitigations."
        ],
        hard: [
          "Design a comprehensive security framework for a financial services company.",
          "How would you implement zero-trust architecture for a distributed system?"
        ]
      },
      devops: {
        easy: [
          "What's the difference between Docker containers and virtual machines?",
          "Explain the concept of Infrastructure as Code (IaC)."
        ],
        medium: [
          "How would you set up a CI/CD pipeline for a microservices application?",
          "Describe your approach to monitoring and logging in production."
        ],
        hard: [
          "Design a multi-region disaster recovery strategy for a critical application.",
          "How would you implement auto-scaling for a Kubernetes cluster?"
        ]
      },
      mobile: {
        easy: [
          "What's the difference between native and hybrid mobile apps?",
          "Explain the mobile app lifecycle and its key events."
        ],
        medium: [
          "How would you optimize app performance for older devices?",
          "Describe your approach to handling network connectivity issues."
        ],
        hard: [
          "Design an offline-first mobile app architecture with sync capabilities.",
          "How would you implement push notifications at scale?"
        ]
      },
      general: {
        easy: [
          "Explain the concept of Big O notation and its importance.",
          "What are the differences between various data structures?"
        ],
        medium: [
          "How would you approach debugging a performance issue in production?",
          "Describe your experience with version control and collaboration."
        ],
        hard: [
          "Design a system architecture for handling high concurrent loads.",
          "How would you approach technical leadership in a growing team?"
        ]
      }
    };

    const domainQuestions = extendedQuestionTemplates[questionDomain as keyof typeof extendedQuestionTemplates] || extendedQuestionTemplates.general;
    
    const timestamp = Date.now();
    const randomId = Math.random().toString(36).substr(2, 9);
    
    return [
      {
        id: `local_q_${timestamp}_${randomId}_0`,
        text: domainQuestions.easy[0],
        difficulty: 'easy' as const,
        timeLimit: 20,
        category: `${domain} - Basic Concepts`
      },
      {
        id: `local_q_${timestamp}_${randomId}_1`,
        text: domainQuestions.easy[1],
        difficulty: 'easy' as const,
        timeLimit: 20,
        category: `${domain} - Fundamentals`
      },
      {
        id: `local_q_${timestamp}_${randomId}_2`,
        text: domainQuestions.medium[0],
        difficulty: 'medium' as const,
        timeLimit: 60,
        category: `${domain} - Implementation`
      },
      {
        id: `local_q_${timestamp}_${randomId}_3`,
        text: domainQuestions.medium[1],
        difficulty: 'medium' as const,
        timeLimit: 60,
        category: `${domain} - Best Practices`
      },
      {
        id: `local_q_${timestamp}_${randomId}_4`,
        text: domainQuestions.hard[0],
        difficulty: 'hard' as const,
        timeLimit: 120,
        category: `${domain} - System Design`
      },
      {
        id: `local_q_${timestamp}_${randomId}_5`,
        text: domainQuestions.hard[1],
        difficulty: 'hard' as const,
        timeLimit: 120,
        category: `${domain} - Architecture`
      }
    ];
  }

  // AI-powered answer scoring
  async scoreAnswer(answer: Answer, question: Question): Promise<{ score: number; feedback: string }> {
    if (USE_AI && this.model) {
      try {
        const prompt = `Score this technical interview answer on a scale of 0-100:

QUESTION (${question.difficulty}): ${question.text}
ANSWER: ${answer.answer}
TIME SPENT: ${answer.timeSpent}s out of ${question.timeLimit}s

SCORING CRITERIA:
- Technical Accuracy (40 points): Is the answer technically correct?
- Depth of Knowledge (30 points): Does it show deep understanding?
- Practical Application (20 points): Are examples/use cases mentioned?
- Communication (10 points): Is it well-structured and clear?

Provide a score (0-100) and specific feedback focusing on technical aspects.

Format your response as:
SCORE: [number]
FEEDBACK: [detailed technical feedback]`;

        const result = await this.model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();
        
        const scoreMatch = text.match(/SCORE:\s*(\d+)/);
        const feedbackMatch = text.match(/FEEDBACK:\s*([\s\S]*)/);
        
        if (scoreMatch && feedbackMatch) {
          return {
            score: parseInt(scoreMatch[1]),
            feedback: feedbackMatch[1].trim()
          };
        }
      } catch (error) {
        console.error('AI scoring failed:', error);
      }
    }

    return this.scoreAnswerLocal(answer, question);
  }

  private scoreAnswerLocal(answer: Answer, question: Question): { score: number; feedback: string } {
    let score = 50; // Base score
    
    // Enhanced local scoring based on domain-specific keywords
    const answerLower = answer.answer.toLowerCase();
    
    // Technical keyword scoring
    const techKeywords = ['algorithm', 'optimization', 'performance', 'security', 'scalability', 'architecture'];
    const foundKeywords = techKeywords.filter(keyword => answerLower.includes(keyword));
    score += foundKeywords.length * 5;
    
    // Length and detail
    if (answer.answer.length > 100) score += 10;
    if (answer.answer.length > 300) score += 10;
    
    // Time management
    const timeRatio = answer.timeSpent / question.timeLimit;
    if (timeRatio < 0.5) score -= 10; // Too quick, might lack depth
    if (timeRatio > 0.8 && timeRatio <= 1.0) score += 10; // Good use of time
    
    // Difficulty-based scoring
    if (question.difficulty === 'easy' && answer.answer.length > 50) score += 5;
    if (question.difficulty === 'hard' && answer.answer.length > 200) score += 15;
    
    // Ensure score is within bounds
    score = Math.min(100, Math.max(0, score));
    
    const feedback = score >= 85 ? "Excellent technical response with comprehensive coverage and good examples." :
                    score >= 70 ? "Good technical answer, shows solid understanding. Consider adding more specific examples." :
                    score >= 55 ? "Adequate response, but could benefit from more technical depth and detail." :
                    score >= 40 ? "Basic understanding shown, but needs more technical specificity and examples." :
                    "Consider providing more detailed technical explanations and practical examples.";
    
    return { score, feedback };
  }

  // Generate interview summary
  async generateInterviewSummary(interview: Interview, candidate: Candidate): Promise<{ score: number; summary: string }> {
    if (USE_AI && this.model) {
      try {
        const answers = interview.answers;
        const questions = interview.questions;
        
        const prompt = `Generate a comprehensive technical interview summary for ${candidate.name}:

INTERVIEW DATA:
${questions.map((q, i) => `
Question ${i+1} (${q.difficulty}): ${q.text}
Answer: ${answers[i]?.answer || 'No answer provided'}
Score: ${answers[i]?.score || 0}/100
Time: ${answers[i]?.timeSpent || 0}s
`).join('\n')}

CANDIDATE BACKGROUND: ${candidate.resumeText || 'No resume data'}

Generate:
1. Overall technical competency score (0-100)
2. Detailed summary covering:
   - Technical strengths and knowledge areas
   - Areas for improvement
   - Communication and problem-solving skills
   - Recommendation (Hire/Consider/Pass) with reasoning

Format as:
SCORE: [number]
SUMMARY: [detailed analysis]`;

        const result = await this.model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();
        
        const scoreMatch = text.match(/SCORE:\s*(\d+)/);
        const summaryMatch = text.match(/SUMMARY:\s*([\s\S]*)/);
        
        if (scoreMatch && summaryMatch) {
          return {
            score: parseInt(scoreMatch[1]),
            summary: summaryMatch[1].trim()
          };
        }
      } catch (error) {
        console.error('AI summary generation failed:', error);
      }
    }

    return this.generateLocalSummary(interview, candidate);
  }

  private generateLocalSummary(interview: Interview, candidate: Candidate): { score: number; summary: string } {
    const answers = interview.answers;
    const avgScore = answers.length > 0 
      ? answers.reduce((sum, ans) => sum + (ans.score || 0), 0) / answers.length
      : 0;
    
    const performance = avgScore >= 85 ? 'exceptional' : 
                       avgScore >= 75 ? 'strong' :
                       avgScore >= 65 ? 'good' : 
                       avgScore >= 50 ? 'satisfactory' : 'needs improvement';
    
    const summary = answers.length === 0
      ? `${candidate.name || 'The candidate'} did not complete the interview questions. Please restart to get a proper assessment.`
      : `${candidate.name || 'The candidate'} demonstrated ${performance} technical performance with an average score of ${avgScore.toFixed(1)}/100. 

Technical Assessment: Completed ${answers.length}/6 questions across multiple difficulty levels. 

Strengths: ${avgScore >= 70 ? 'Shows solid technical foundation and problem-solving abilities. Good understanding of core concepts.' : 'Basic technical knowledge demonstrated.'}

Areas for Growth: ${avgScore < 70 ? 'Would benefit from deeper technical knowledge and more practical examples. ' : ''}Consider focusing on system design and advanced architectural patterns.

Overall Recommendation: ${avgScore >= 75 ? 'RECOMMENDED - Strong technical candidate' : avgScore >= 60 ? 'CONSIDER - Good potential with some development needed' : 'REQUIRES FURTHER EVALUATION - Additional technical assessment recommended'}`;
    
    return { score: Math.round(avgScore), summary };
  }

  // AI-powered batch scoring for all answers at once (NEW WORKFLOW)
  async scoreAllAnswers(questionsAndAnswers: Array<{question: Question, answer: Answer}>): Promise<BatchScoringResult> {
    console.log('🤖 Scoring Interview - AI Available:', USE_AI, 'Model Ready:', !!this.model);
    
    if (USE_AI && this.model) {
      try {
        console.log('🔄 Starting AI batch scoring for', questionsAndAnswers.length, 'questions...');
        
        const interviewData = questionsAndAnswers.map((qa, index) => 
          `QUESTION ${index + 1} (${qa.question.difficulty.toUpperCase()} - ${qa.question.timeLimit}s):
${qa.question.text}

CANDIDATE ANSWER (Time spent: ${qa.answer.timeSpent}s):
${qa.answer.answer || 'No answer provided'}

---`
        ).join('\n\n');

        const prompt = `You are a senior technical interviewer evaluating a complete technical interview. Please analyze all questions and answers together to provide comprehensive scoring and feedback.

COMPLETE INTERVIEW DATA:
${interviewData}

EVALUATION REQUIREMENTS:

1. INDIVIDUAL QUESTION SCORING (0-100 each):
Score each answer based on:
- Technical Accuracy (40 points): Correctness and precision
- Depth of Knowledge (30 points): Understanding of concepts
- Practical Application (20 points): Real-world examples and use cases  
- Communication (10 points): Clarity and structure

2. OVERALL ASSESSMENT:
- Calculate overall interview score (0-100)
- Provide comprehensive feedback covering strengths and improvement areas
- Give hiring recommendation: "Hire", "Consider", or "Pass"

CRITICAL INSTRUCTIONS:
- Be fair but rigorous in technical evaluation
- Consider difficulty level when scoring (easier questions need higher accuracy)
- Value practical knowledge and real-world understanding
- Account for time management in evaluation
- Provide actionable, specific feedback
- "I don't know" answers should receive 0-10 points maximum

FORMAT YOUR RESPONSE EXACTLY AS:

INDIVIDUAL_SCORES:
Q1: SCORE:[number] FEEDBACK:[specific technical feedback for question 1]
Q2: SCORE:[number] FEEDBACK:[specific technical feedback for question 2]
Q3: SCORE:[number] FEEDBACK:[specific technical feedback for question 3]
Q4: SCORE:[number] FEEDBACK:[specific technical feedback for question 4]
Q5: SCORE:[number] FEEDBACK:[specific technical feedback for question 5]
Q6: SCORE:[number] FEEDBACK:[specific technical feedback for question 6]

OVERALL_SCORE: [number]

OVERALL_FEEDBACK:
[Comprehensive analysis including:
- Technical strengths demonstrated
- Key areas for improvement  
- Communication and problem-solving assessment
- Specific recommendations for growth]

RECOMMENDATION: [Hire/Consider/Pass]
REASONING: [Brief explanation of recommendation]`;

        console.log('📤 Sending interview data to Gemini for scoring...');
        const result = await this.model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();
        console.log('📥 Received AI scoring response:', text.substring(0, 200) + '...');

        // Parse the response
        const individualScores: Array<{ score: number; feedback: string }> = [];
        
        // Extract individual scores
        const scoreMatches = text.match(/Q\d+:\s*SCORE:\s*(\d+)\s*FEEDBACK:\s*([^\n\r]*)/g);
        if (scoreMatches) {
          scoreMatches.forEach((match: string) => {
            const scoreMatch = match.match(/SCORE:\s*(\d+)/);
            const feedbackMatch = match.match(/FEEDBACK:\s*(.*)/);
            if (scoreMatch && feedbackMatch) {
              individualScores.push({
                score: parseInt(scoreMatch[1]),
                feedback: feedbackMatch[1].trim()
              });
            }
          });
        }

        // Extract overall data
        const overallScoreMatch = text.match(/OVERALL_SCORE:\s*(\d+)/);
        const overallFeedbackMatch = text.match(/OVERALL_FEEDBACK:\s*([\s\S]*?)(?=RECOMMENDATION:|$)/);
        const recommendationMatch = text.match(/RECOMMENDATION:\s*(Hire|Consider|Pass)/);

        const overallScore = overallScoreMatch ? parseInt(overallScoreMatch[1]) : 0;
        const overallFeedback = overallFeedbackMatch ? overallFeedbackMatch[1].trim() : '';
        const recommendation = recommendationMatch ? recommendationMatch[1] as 'Hire' | 'Consider' | 'Pass' : 'Pass';

        // Fill in missing individual scores if needed
        while (individualScores.length < questionsAndAnswers.length) {
          const qa = questionsAndAnswers[individualScores.length];
          individualScores.push(this.scoreAnswerLocal(qa.answer, qa.question));
        }

        console.log('✅ AI scoring completed successfully! Overall score:', overallScore);
        
        return {
          individualScores,
          overallScore,
          overallFeedback,
          recommendation
        };

      } catch (error) {
        console.error('❌ AI batch scoring failed:', error);
        console.log('🔄 Falling back to local scoring...');
        return this.scoreAllAnswersLocal(questionsAndAnswers);
      }
    }

    console.log('🔄 Using local scoring (AI not available)');
    return this.scoreAllAnswersLocal(questionsAndAnswers);
  }

  private scoreAllAnswersLocal(questionsAndAnswers: Array<{question: Question, answer: Answer}>): BatchScoringResult {
    const individualScores = questionsAndAnswers.map(qa => {
      // Improved local scoring for "I don't know" answers
      const answerLower = qa.answer.answer.toLowerCase().trim();
      if (answerLower === "i don't know" || answerLower === "i dont know" || answerLower === "idk") {
        return {
          score: 0,
          feedback: `No technical knowledge demonstrated for this ${qa.question.difficulty} question. Consider studying the relevant concepts and practicing with examples.`
        };
      }
      return this.scoreAnswerLocal(qa.answer, qa.question);
    });

    const overallScore = individualScores.length > 0 
      ? Math.round(individualScores.reduce((sum, score) => sum + score.score, 0) / individualScores.length)
      : 0;

    // Count answered vs unanswered questions
    const answeredQuestions = questionsAndAnswers.filter(qa => 
      qa.answer.answer && 
      qa.answer.answer.trim() !== '' && 
      !qa.answer.answer.toLowerCase().includes('no answer provided') &&
      !qa.answer.answer.toLowerCase().includes("i don't know") &&
      !qa.answer.answer.toLowerCase().includes("i dont know")
    ).length;

    const recommendation: 'Hire' | 'Consider' | 'Pass' = 
      overallScore >= 80 && answeredQuestions >= 5 ? 'Hire' : 
      overallScore >= 65 && answeredQuestions >= 4 ? 'Consider' : 'Pass';

    const overallFeedback = `**Interview Performance Analysis**

**Overall Score:** ${overallScore}/100
**Questions Answered:** ${answeredQuestions}/${questionsAndAnswers.length}

**Individual Question Performance:**
${individualScores.map((score, index) => 
  `Question ${index + 1} (${questionsAndAnswers[index].question.difficulty}): ${score.score}/100`
).join('\n')}

**Assessment:**
${overallScore >= 75 ? 
  'Good technical performance with solid understanding of core concepts.' :
  overallScore >= 50 ? 
  'Basic technical knowledge demonstrated. Room for improvement in depth and practical application.' :
  'Limited technical knowledge shown. Significant preparation needed before considering technical roles.'}

**Recommendation:** ${recommendation}
${recommendation === 'Hire' ? 'Strong technical candidate ready for the role.' :
  recommendation === 'Consider' ? 'Shows potential but needs development in key areas.' :
  'Requires significant technical skill development before being ready for this role.'}`;

    return {
      individualScores,
      overallScore,
      overallFeedback,
      recommendation
    };
  }
}

export default new AIService();