import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './src/models/User.js';

dotenv.config();

const seedUsers = [
  {
    email: 'interviewer@test.com',
    password: 'password123',
    role: 'interviewer',
    profile: {
      firstName: 'John',
      lastName: 'Smith',
      company: 'TechCorp Inc.',
      position: 'Senior Technical Recruiter',
      experience: 5,
      skills: ['Technical Interviews', 'Talent Assessment', 'HR Management']
    }
  },
  {
    email: 'candidate@test.com',
    password: 'password123',
    role: 'interviewee',
    profile: {
      firstName: 'Jane',
      lastName: 'Doe',
      position: 'Software Engineer',
      experience: 3,
      skills: ['JavaScript', 'React', 'Node.js', 'Python', 'MongoDB']
    }
  },
  {
    email: 'admin@test.com',
    password: 'password123',
    role: 'interviewer',
    profile: {
      firstName: 'Admin',
      lastName: 'User',
      company: 'Interview Platform',
      position: 'Platform Administrator',
      experience: 8,
      skills: ['System Administration', 'Interview Management', 'HR Technology']
    }
  }
];

async function seedDatabase() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/interview-assistant');
    console.log('Connected to MongoDB');

    // Clear existing users (optional - remove this line if you want to keep existing data)
    await User.deleteMany({});
    console.log('Cleared existing users');

    // Create seed users
    for (const userData of seedUsers) {
      const existingUser = await User.findOne({ email: userData.email });
      if (!existingUser) {
        const user = new User(userData);
        await user.save();
        console.log(`Created user: ${userData.email} (${userData.role})`);
      } else {
        console.log(`User already exists: ${userData.email}`);
      }
    }

    console.log('Database seeding completed!');
    console.log('Test credentials:');
    console.log('- Interviewer: interviewer@test.com / password123');
    console.log('- Candidate: candidate@test.com / password123');
    console.log('- Admin: admin@test.com / password123');
    
  } catch (error) {
    console.error('Seeding error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Database connection closed');
  }
}

seedDatabase();