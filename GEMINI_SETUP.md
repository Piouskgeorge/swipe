# 🤖 Gemini AI Setup for Enhanced PDF Parsing

The AI Interview Assistant now supports **advanced PDF text extraction** and **AI-powered resume parsing** using Google's Gemini AI.

## 🆓 Free Gemini API Setup (Recommended)

### Step 1: Get Your Free API Key
1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Sign in with your Google account
3. Click "Create API Key"
4. Copy the generated key (starts with `AIza...`)

### Step 2: Add API Key to Your Project
1. Open the `.env` file in your project root
2. Replace the empty `VITE_GEMINI_API_KEY=` with your key:
   ```
   VITE_GEMINI_API_KEY=AIzaSyABC123DEF456GHI789JKL012MNO345PQR678
   ```
3. Save the file

### Step 3: Restart Development Server
```bash
npm run dev
```

## ✨ What You Get With Gemini AI

### Without API Key (Local Fallbacks):
- ✅ Basic filename parsing ("Pious K George(22CB042).pdf" → "Pious K George")
- ✅ Simple pattern matching for email/phone
- ✅ Domain-specific questions from templates
- ✅ Basic scoring algorithm

### With Gemini API Key:
- 🚀 **Full PDF text extraction** using pdf-parse + AI analysis
- 🧠 **Smart data identification** - finds name, email, phone even in complex layouts
- 🎯 **Dynamic question generation** based on actual resume content
- 📊 **Intelligent answer scoring** with detailed feedback
- 🎨 **Professional resume formatting** and data structuring

## 📊 Free Tier Limits
- **60 requests per minute**
- **1,500 requests per day** 
- **Perfect for development and testing**

## 🔍 How It Works

1. **PDF Upload** → `pdf-parse` extracts raw text
2. **Text Analysis** → Gemini AI identifies and structures data
3. **Question Generation** → AI creates domain-specific questions based on resume
4. **Answer Scoring** → AI provides detailed feedback and scores

## 🛠 Troubleshooting

### If you see "Using local fallbacks":
- Check your `.env` file has the correct key
- Restart the development server
- Verify the key starts with `AIza`

### If PDF parsing fails:
- The app will gracefully fall back to filename parsing
- User can still manually enter their information
- All features work without AI, just with less automation

## 🔒 Security Notes
- API key is only used client-side for demo purposes
- In production, implement server-side API calls
- Never commit your `.env` file to version control
- Gemini AI doesn't store your resume data

---

**Ready to test?** Upload a PDF resume and watch the AI extract all the details automatically! 🎉