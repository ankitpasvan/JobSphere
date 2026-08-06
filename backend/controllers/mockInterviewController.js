import Groq from 'groq-sdk';
import MockInterview from '../models/MockInterview.js';
import dotenv from 'dotenv';

dotenv.config();

// Lazy model loader
const getGroqClient = () => {
  const apiKey = process.env.GROQ_API_KEY || '';
  if (!apiKey) console.warn('⚠️  GROQ_API_KEY is missing from .env');
  return new Groq({ apiKey });
};

// The exact system prompt the user specified
const buildSystemPrompt = (role) => `
You are an AI Interviewer integrated into a job portal called "Talent Bridge".
Your role is to conduct a realistic mock interview for a candidate based on the selected job role.

## INTERVIEW RULES:
1. Ask ONLY ONE question at a time.
2. Wait for the candidate's answer before continuing.
3. After each answer:
   - Give a score out of 10
   - Provide clear and constructive feedback
   - Mention what was missing or could be improved
4. Then ask the NEXT question based on the candidate's previous answer.
5. Keep the interview limited to 5 questions total.
6. Maintain a professional and slightly strict interviewer tone.
7. Questions should be relevant to the selected role.

## ROLE HANDLING:
If the role is:
- "Frontend Developer" → ask about React, JavaScript, HTML, CSS
- "Backend Developer" → ask about Node.js, APIs, databases
- "DSA" → ask coding & problem-solving questions
- "Machine Learning" → ask ML concepts, algorithms, use cases
- For any other role → ask relevant technical and behavioral questions.

## EVALUATION FORMAT (IMPORTANT):
After each answer, you must respond strictly in JSON format matching the schema exactly.
{
  "score": <number 1-10>,
  "feedback": "<clear explanation>",
  "improvement": "<what user should do better>",
  "nextQuestion": "<next question here or null if this was question 5>",
  "questionNumber": <current question number 1-5>,
  "isComplete": <true if this was the last question, false otherwise>,
  "finalSummary": "<overall performance summary, strengths, weak areas — only if isComplete is true, else null>",
  "finalScore": <total score out of 50, only if isComplete is true, else null>
}

## CONSTRAINTS:
- Do NOT ask multiple questions at once
- Do NOT skip evaluation
- Do NOT end early
- Keep responses concise but meaningful
- Make the interview feel real, not robotic

The selected role is: ${role}
`;

// @desc    Start interview — returns first question
// @route   POST /api/mock-interview/start
// @access  Private (Candidate only)
export const startInterview = async (req, res) => {
  try {
    const { jobRole } = req.body;
    if (!jobRole) return res.status(400).json({ success: false, message: 'Job role is required' });
    if (!process.env.GROQ_API_KEY) return res.status(500).json({ success: false, message: 'AI Engine not configured. Please add GROQ_API_KEY to .env' });

    const groq = getGroqClient();
    const systemPrompt = buildSystemPrompt(jobRole);

    const completion = await groq.chat.completions.create({
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: 'Begin the interview. Ask the first question for the role: ' + jobRole + '. Respond ONLY with a JSON object in this format: {"firstQuestion": "<question here>", "questionNumber": 1}' }
      ],
      model: 'llama-3.3-70b-versatile',
      response_format: { type: 'json_object' },
      temperature: 0.7,
    });

    const text = completion.choices[0]?.message?.content || '{}';
    const data = JSON.parse(text);

    res.status(200).json({
      success: true,
      firstQuestion: data.firstQuestion,
      questionNumber: 1
    });
  } catch (error) {
    console.error('Start interview error:', error);
    let errorMsg = 'Error starting interview';
    if (error.status === 429) {
      errorMsg = 'AI Rate Limit Exceeded: Please wait a minute before trying again.';
    }
    res.status(500).json({ success: false, message: errorMsg, error: error.message });
  }
};

// @desc    Submit answer, get feedback + next question
// @route   POST /api/mock-interview/next
// @access  Private (Candidate only)
export const nextQuestion = async (req, res) => {
  try {
    const { jobRole, conversationHistory, currentQuestion, answer, questionNumber } = req.body;

    if (!process.env.GROQ_API_KEY) return res.status(500).json({ success: false, message: 'AI Engine not configured.' });

    const groq = getGroqClient();
    const systemPrompt = buildSystemPrompt(jobRole);

    const messages = [
      { role: 'system', content: systemPrompt }
    ];

    // Reconstruct conversation directly as user/assistant messages for the LLM context
    (conversationHistory || []).forEach((turn) => {
      messages.push({ role: 'assistant', content: turn.question });
      messages.push({ role: 'user', content: turn.answer });
    });

    messages.push({ role: 'assistant', content: currentQuestion });
    messages.push({ 
      role: 'user', 
      content: `My answer: ${answer}\n\nThis was question ${questionNumber} of 5. Now evaluate the answer and ${questionNumber < 5 ? 'ask the next question' : 'provide the final summary'}. Return ONLY a JSON object.` 
    });

    const completion = await groq.chat.completions.create({
      messages,
      model: 'llama-3.3-70b-versatile',
      response_format: { type: 'json_object' },
      temperature: 0.7,
    });

    const text = completion.choices[0]?.message?.content || '{}';
    const feedback = JSON.parse(text);

    // Absolute enforcement: Ensure EXACTLY 5 questions. Do not trust AI's count.
    if (questionNumber < 5) {
      feedback.isComplete = false;
      if (!feedback.nextQuestion) {
        feedback.nextQuestion = "Interesting answer. Can you expand on your technical approach there before we move to the next topic?";
      }
    } else {
      feedback.isComplete = true;
    }

    res.status(200).json({ success: true, feedback });
  } catch (error) {
    console.error('Next question error:', error);
    let errorMsg = 'Error processing your answer';
    if (error.status === 429) {
      errorMsg = 'AI Rate Limit Exceeded: Please wait a minute before replying.';
    }
    res.status(500).json({ success: false, message: errorMsg, error: error.message });
  }
};

// @desc    Save completed session to DB
// @route   POST /api/mock-interview/save-session
// @access  Private (Candidate only)
export const saveSession = async (req, res) => {
  try {
    const { jobRole, conversationHistory, overallScore, finalSummary } = req.body;

    const session = await MockInterview.create({
      user: req.user.id,
      jobRole,
      questions: (conversationHistory || []).map(t => t.question),
      results: (conversationHistory || []).map(t => ({
        question: t.question,
        answer: t.answer,
        score: t.score,
        feedback: t.feedback,
        improvement: t.improvement
      })),
      overallScore: overallScore || 0,
      summary: finalSummary || '',
      status: 'Completed'
    });

    res.status(201).json({ success: true, message: 'Session saved.', session });
  } catch (error) {
    console.error('Save session error:', error);
    res.status(500).json({ success: false, message: 'Error saving session', error: error.message });
  }
};

// @desc    Get all candidate mock sessions
// @route   GET /api/mock-interview/my-sessions
// @access  Private (Candidate only)
export const getMySessions = async (req, res) => {
  try {
    const sessions = await MockInterview.find({ user: req.user.id }).sort('-createdAt');
    res.status(200).json({ success: true, sessions });
  } catch (error) {
    console.error('Get my sessions error:', error);
    res.status(500).json({ success: false, message: 'Error fetching history' });
  }
};

// @desc    Get specific session by ID
// @route   GET /api/mock-interview/:id
// @access  Private (Candidate only)
export const getSessionById = async (req, res) => {
  try {
    const session = await MockInterview.findById(req.params.id);
    if (!session) return res.status(404).json({ success: false, message: 'Session not found' });
    if (session.user.toString() !== req.user.id) return res.status(403).json({ success: false, message: 'Not authorized' });
    res.status(200).json({ success: true, session });
  } catch (error) {
    console.error('Get session error:', error);
    res.status(500).json({ success: false, message: 'Error loading session' });
  }
};

// @desc    Delete a mock session
// @route   DELETE /api/mock-interview/:id
// @access  Private (Candidate only)
export const deleteSession = async (req, res) => {
  try {
    const session = await MockInterview.findById(req.params.id);
    if (!session) return res.status(404).json({ success: false, message: 'Session not found' });
    if (session.user.toString() !== req.user.id) return res.status(403).json({ success: false, message: 'Not authorized' });
    
    await session.deleteOne();
    res.status(200).json({ success: true, message: 'Session deleted successfully' });
  } catch (error) {
    console.error('Delete session error:', error);
    res.status(500).json({ success: false, message: 'Error deleting session' });
  }
};
