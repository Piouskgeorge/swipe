// Simple test server to verify functionality without pdf-parse issues
import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const app = express();

app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:5174'],
  credentials: true
}));

app.use(express.json());

// Simple user schema for testing
const userSchema = new mongoose.Schema({
  email: String,
  role: String,
  profile: {
    firstName: String,
    lastName: String,
    company: String,
    position: String
  },
  isActive: { type: Boolean, default: true }
});

const User = mongoose.model('TestUser', userSchema);

// Test endpoints
app.post('/api/auth/check-user', async (req, res) => {
  try {
    const { email } = req.body;
    
    let role = 'interviewee';
    if (email.includes('interviewer') || email.includes('hr') || email.includes('recruiter')) {
      role = 'interviewer';
    }

    let user = await User.findOne({ email });
    
    if (!user) {
      const firstName = email.split('@')[0].split('.')[0] || 'User';
      const lastName = email.split('@')[0].split('.')[1] || '';
      
      user = new User({
        email,
        role,
        profile: {
          firstName: firstName.charAt(0).toUpperCase() + firstName.slice(1),
          lastName: lastName.charAt(0).toUpperCase() + lastName.slice(1),
          ...(role === 'interviewer' && { company: 'Interview Company' })
        }
      });
      
      await user.save();
      console.log('Created new user:', user.email, 'Role:', user.role);
    }

    res.json({ 
      message: 'User found/created. OTP sent.', 
      userExists: !!user,
      role: user.role
    });

  } catch (error) {
    console.error('Check user error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (otp !== '999999') {
      return res.status(401).json({ message: 'Invalid OTP' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: 'User not found' });
    }

    const token = 'test-token-' + user._id;

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        email: user.email,
        role: user.role,
        profile: user.profile
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

app.post('/api/interview/analyze-response', async (req, res) => {
  try {
    const { question, response } = req.body;
    
    // Simple mock analysis
    const analysis = {
      feedback: "Thank you for your detailed response. You demonstrated good understanding of the topic.",
      score: Math.floor(Math.random() * 3) + 7, // Score between 7-10
      relevance: 9,
      clarity: 8,
      completeness: 8
    };

    res.json(analysis);
  } catch (error) {
    console.error('Analysis error:', error);
    res.status(500).json({ message: 'Analysis error' });
  }
});

app.get('/api/interview/interviews', async (req, res) => {
  try {
    // Return mock interview data
    const mockInterviews = [
      {
        id: '1',
        interviewee: { profile: { firstName: 'John', lastName: 'Doe' }, email: 'john@example.com' },
        position: 'Software Engineer',
        status: 'completed',
        scheduledAt: new Date(),
        score: 85
      }
    ];

    res.json(mockInterviews);
  } catch (error) {
    console.error('Fetch interviews error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Test server running' });
});

// Start server
const PORT = process.env.PORT || 5001;

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/interview-test')
  .then(() => {
    console.log('Connected to MongoDB (test)');
    
    app.listen(PORT, () => {
      console.log(`Test server running on port ${PORT}`);
      console.log(`Frontend should be available at: http://localhost:5174`);
      console.log(`API health check: http://localhost:${PORT}/api/health`);
    });
  })
  .catch(err => {
    console.error('MongoDB connection error:', err);
    app.listen(PORT, () => {
      console.log(`Test server running on port ${PORT} (without MongoDB)`);
    });
  });

export default app;