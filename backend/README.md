# AI-Powered Interview Assistant - Backend

This is the backend server for the AI-Powered Interview Assistant application, built with Node.js, Express, MongoDB, and Gemini AI integration.

## Features

- **User Authentication**: JWT-based authentication with role-based access (interviewer/interviewee)
- **Interview Management**: Create, schedule, and manage interviews
- **Resume Processing**: Upload and parse PDF/DOC/DOCX files
- **AI Integration**: Gemini 2.0 Flash for question generation and response analysis
- **Real-time Assessment**: AI-powered interview evaluation and scoring
- **File Upload**: Secure resume upload with text extraction
- **RESTful API**: Clean API endpoints for frontend integration

## Prerequisites

- Node.js (v18 or higher)
- MongoDB (local or cloud instance)
- Google Gemini API key

## Installation

1. **Navigate to the backend directory**:
   ```bash
   cd backend
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Set up environment variables**:
   - Copy `.env.example` to `.env`
   - Update the variables in `.env`:
   ```env
   NODE_ENV=development
   PORT=5000
   MONGODB_URI=mongodb://localhost:27017/interview-assistant
   JWT_SECRET=your-super-secret-jwt-key
   GEMINI_API_KEY=your-gemini-api-key-here
   FRONTEND_URL=http://localhost:5174
   ```

4. **Get a Gemini API Key**:
   - Go to [Google AI Studio](https://aistudio.google.com/app/apikey)
   - Create a new API key
   - Add it to your `.env` file as `GEMINI_API_KEY`

5. **Start MongoDB**:
   - If using local MongoDB: `mongod`
   - Or use MongoDB Atlas (cloud) and update the connection string

6. **Seed the database** (optional):
   ```bash
   npm run seed
   ```
   This creates test accounts:
   - Interviewer: `interviewer@test.com` / `password123`
   - Candidate: `candidate@test.com` / `password123`

## Running the Server

### Development Mode
```bash
npm run dev
```

### Production Mode
```bash
npm start
```

The server will start on `http://localhost:5000`

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `GET /api/auth/profile` - Get user profile
- `PUT /api/auth/profile` - Update user profile
- `POST /api/auth/logout` - User logout

### Interviews
- `GET /api/interviews` - Get user's interviews
- `POST /api/interviews` - Create new interview (interviewer only)
- `GET /api/interviews/:id` - Get specific interview
- `POST /api/interviews/:id/upload-resume` - Upload resume
- `POST /api/interviews/:id/start` - Start interview and generate questions
- `POST /api/interviews/:id/respond` - Submit response to question
- `PATCH /api/interviews/:id/pause` - Pause/resume interview
- `GET /api/interviews/users/interviewees` - Get all candidates (interviewer only)

### Health Check
- `GET /api/health` - Server health status

## Project Structure

```
backend/
├── src/
│   ├── models/
│   │   ├── User.js          # User schema (interviewer/interviewee)
│   │   └── Interview.js     # Interview schema
│   ├── routes/
│   │   ├── auth.js          # Authentication routes
│   │   └── interview.js     # Interview management routes
│   ├── middleware/
│   │   ├── auth.js          # JWT authentication middleware
│   │   └── validation.js    # Input validation middleware
│   └── services/
│       └── geminiService.js # Gemini AI integration
├── uploads/                 # File upload directory
├── server.js               # Main server file
├── seed.js                 # Database seeder
├── package.json
└── .env                    # Environment variables
```

## AI Features

The backend integrates with Google's Gemini 2.0 Flash model for:

1. **Question Generation**: AI generates relevant interview questions based on:
   - Resume content analysis
   - Job position requirements
   - Difficulty level preferences

2. **Response Analysis**: AI evaluates candidate responses for:
   - Relevance to the question (1-10 scale)
   - Communication clarity (1-10 scale) 
   - Completeness of answer (1-10 scale)
   - Overall score with detailed feedback

3. **Overall Assessment**: AI provides comprehensive interview evaluation:
   - Technical skills assessment
   - Behavioral evaluation
   - Communication skills rating
   - Final hiring recommendation (recommend/maybe/reject)

4. **Fallback System**: If AI is unavailable, the system uses predefined fallback responses

## Database Schema

### User Model
```javascript
{
  email: String (unique),
  password: String (hashed),
  role: 'interviewer' | 'interviewee',
  profile: {
    firstName: String,
    lastName: String,
    company: String,
    position: String,
    experience: Number,
    skills: [String]
  }
}
```

### Interview Model
```javascript
{
  interviewee: ObjectId (ref: User),
  interviewer: ObjectId (ref: User),
  position: String,
  status: 'scheduled' | 'in-progress' | 'paused' | 'completed' | 'cancelled',
  resume: {
    filename: String,
    extractedText: String
  },
  questions: [{
    question: String,
    category: String,
    difficulty: String
  }],
  responses: [{
    response: String,
    aiAnalysis: {
      score: Number,
      relevance: Number,
      clarity: Number,
      completeness: Number
    }
  }],
  overallAssessment: {
    totalScore: Number,
    technicalScore: Number,
    behavioralScore: Number,
    communicationScore: Number,
    verdict: String
  }
}
```

## Security Features

- **JWT Authentication**: Secure token-based authentication
- **Password Hashing**: bcryptjs with salt rounds
- **Input Validation**: Joi validation for all inputs  
- **Rate Limiting**: Express rate limiting to prevent abuse
- **CORS Protection**: Configurable CORS settings
- **Helmet**: Security headers protection
- **File Upload Security**: Restricted file types and size limits

## Error Handling

The server includes comprehensive error handling:
- Validation errors (400)
- Authentication errors (401) 
- Authorization errors (403)
- Not found errors (404)
- Server errors (500)
- MongoDB errors (duplicate keys, cast errors)

## Testing the API

You can test the API using the provided seed data:

1. **Register/Login as Interviewer**:
   ```bash
   curl -X POST http://localhost:5000/api/auth/login \
     -H "Content-Type: application/json" \
     -d '{"email": "interviewer@test.com", "password": "password123"}'
   ```

2. **Create Interview**:
   ```bash
   curl -X POST http://localhost:5000/api/interviews \
     -H "Authorization: Bearer YOUR_TOKEN" \
     -H "Content-Type: application/json" \
     -d '{"intervieweeId": "CANDIDATE_ID", "position": "Software Engineer", "scheduledAt": "2024-01-01T10:00:00.000Z"}'
   ```

3. **Health Check**:
   ```bash
   curl http://localhost:5000/api/health
   ```

## Troubleshooting

### Common Issues

1. **MongoDB Connection Error**:
   - Ensure MongoDB is running
   - Check the MONGODB_URI in `.env`

2. **Gemini AI Not Working**:
   - Verify GEMINI_API_KEY is correct
   - Check API key permissions
   - The app will use fallbacks if AI fails

3. **File Upload Issues**:
   - Ensure `uploads/` directory exists
   - Check file size limits (5MB max)
   - Only PDF, DOC, DOCX files allowed

4. **CORS Errors**:
   - Update FRONTEND_URL in `.env`
   - Ensure frontend URL matches exactly

### Logs

The server logs important information:
- Server startup and port
- Database connection status  
- Gemini AI availability
- API request errors
- Authentication attempts

## Development

### Adding New Features

1. **New Routes**: Add to `src/routes/`
2. **New Models**: Add to `src/models/`
3. **New Middleware**: Add to `src/middleware/`
4. **AI Features**: Extend `src/services/geminiService.js`

### Code Style

- Use ES6 modules
- Async/await for asynchronous operations
- Proper error handling in try/catch blocks
- JSDoc comments for functions
- Consistent naming conventions

## Deployment

For production deployment:

1. Set `NODE_ENV=production`
2. Use a strong JWT_SECRET
3. Configure production MongoDB
4. Set up proper logging
5. Use PM2 or similar for process management
6. Configure reverse proxy (nginx)
7. Set up SSL certificates

## License

MIT License - see LICENSE file for details.