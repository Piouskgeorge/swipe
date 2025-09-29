import express from 'express';
import User from '../models/User.js';
import { generateToken, authenticate } from '../middleware/auth.js';
import { validateRegistration, validateLogin } from '../middleware/validation.js';

const router = express.Router();

// Check if user exists or create new user
router.post('/check-user', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }

    // Determine role based on email - only specific emails are interviewers
    let role = 'interviewee'; // Default to interviewee
    if (email === 'interviewer@company.com' || email === 'hr@company.com' || email === 'recruiter@company.com') {
      role = 'interviewer';
    }

    // Check if user exists
    let user = await User.findOne({ email });
    let isNewUser = false;
    
    if (!user) {
      // Create new user automatically
      const emailName = email.split('@')[0];
      const nameParts = emailName.replace(/[._-]/g, ' ').split(' ');
      const firstName = nameParts[0] || 'User';
      const lastName = nameParts[1] || (role === 'interviewer' ? 'Admin' : 'Candidate');
      
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
      isNewUser = true;
      console.log('Created new user:', user.email, 'Role:', user.role, 'Name:', `${user.profile.firstName} ${user.profile.lastName}`);
    }

    // Check if user has resume data (for interviewees)
    const hasResumeData = user.profile && user.profile.resumeData && user.profile.resumeText;

    res.json({ 
      message: 'Ready for OTP verification', 
      userExists: !isNewUser,
      isNewUser,
      role: user.role,
      hasResumeData,
      needsResumeUpload: role === 'interviewee' && !hasResumeData
    });

  } catch (error) {
    console.error('Check user error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Register new user
router.post('/register', validateRegistration, async (req, res) => {
  try {
    const { email, password, role, profile } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists with this email' });
    }

    // Create new user
    const user = new User({
      email,
      password,
      role,
      profile
    });

    await user.save();

    // Generate token
    const token = generateToken(user._id);

    res.status(201).json({
      message: 'User registered successfully',
      token,
      user: {
        id: user._id,
        email: user.email,
        role: user.role,
        profile: user.profile
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Server error during registration' });
  }
});

// Login with OTP
router.post('/login', async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({ message: 'Email and OTP are required' });
    }

    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: 'User not found' });
    }

    // Verify OTP (for demo, accept 999999)
    if (otp !== '999999') {
      return res.status(401).json({ message: 'Invalid OTP' });
    }

    // Check if user is active
    if (!user.isActive) {
      return res.status(401).json({ message: 'Account is deactivated' });
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    // Check if user has resume data (for interviewees)
    const hasResumeData = user.profile && user.profile.resumeData && user.profile.resumeText;
    const needsResumeUpload = user.role === 'interviewee' && !hasResumeData;

    // Generate token
    const token = generateToken(user._id);

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        email: user.email,
        role: user.role,
        profile: user.profile,
        hasResumeData,
        needsResumeUpload
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error during login' });
  }
});

// Get current user profile
router.get('/profile', authenticate, async (req, res) => {
  try {
    res.json({
      user: {
        id: req.user._id,
        email: req.user.email,
        role: req.user.role,
        profile: req.user.profile,
        lastLogin: req.user.lastLogin
      }
    });
  } catch (error) {
    console.error('Profile fetch error:', error);
    res.status(500).json({ message: 'Server error fetching profile' });
  }
});

// Update user profile
router.put('/profile', authenticate, async (req, res) => {
  try {
    const { profile } = req.body;
    
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { $set: { profile } },
      { new: true, runValidators: true }
    ).select('-password');

    res.json({
      message: 'Profile updated successfully',
      user: {
        id: user._id,
        email: user.email,
        role: user.role,
        profile: user.profile
      }
    });
  } catch (error) {
    console.error('Profile update error:', error);
    res.status(500).json({ message: 'Server error updating profile' });
  }
});

// Update user resume data
router.post('/update-resume', authenticate, async (req, res) => {
  try {
    const { resumeData, resumeText } = req.body;
    
    if (!resumeData || !resumeText) {
      return res.status(400).json({ message: 'Resume data and text are required' });
    }

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { 
        $set: { 
          'profile.resumeData': resumeData,
          'profile.resumeText': resumeText,
          'profile.resumeProcessedAt': new Date()
        }
      },
      { new: true, runValidators: true }
    ).select('-password');

    res.json({
      message: 'Resume data updated successfully',
      user: {
        id: user._id,
        email: user.email,
        role: user.role,
        profile: user.profile,
        hasResumeData: true,
        needsResumeUpload: false
      }
    });
  } catch (error) {
    console.error('Resume update error:', error);
    res.status(500).json({ message: 'Server error updating resume data' });
  }
});

// Logout (client-side token removal, server-side logging)
router.post('/logout', authenticate, async (req, res) => {
  try {
    // Log the logout event (optional)
    console.log(`User ${req.user.email} logged out at ${new Date()}`);
    
    res.json({ message: 'Logout successful' });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ message: 'Server error during logout' });
  }
});

export default router;