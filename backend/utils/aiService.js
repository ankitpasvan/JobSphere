import Groq from 'groq-sdk';
import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';

dotenv.config();

const getGroqClient = () => {
  if (!process.env.GROQ_API_KEY) {
    throw new Error('GROQ_API_KEY is missing');
  }

  return new Groq({
    apiKey: process.env.GROQ_API_KEY,
  });
};

const getGeminiClient = () => {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY is missing');
  }

  return new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
};

/**
 * [TalentBridge Intelligence Protocol]
 * Extracts raw text from a base64 encoded PDF using Google Gemini (PDF-Vision-Text).
 */
export const extractTextFromPdf = async (base64Pdf) => {
  if (!base64Pdf || !base64Pdf.startsWith('data:application/pdf;base64,')) return "";
  
  try {
    const genAI = getGeminiClient();
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const pdfData = base64Pdf.split(',')[1];

    const result = await model.generateContent([
      {
        inlineData: {
          data: pdfData,
          mimeType: "application/pdf",
        },
      },
      "Extract all text content from this resume PDF. Maintain structure as best as possible. If there are tables, extract them in readable text.",
    ]);

    return result.response.text();
  } catch (error) {
    console.error('[Gemini AI Error] PDF Extraction failed:', error);
    return "";
  }
};

export const analyzeProfile = async (profileData) => {
  try {
    const groq = getGroqClient();
    // 1. Extract true resume text if available
    const resumeText = await extractTextFromPdf(profileData.resume);

    const chatCompletion = await groq.chat.completions.create({
      messages: [
        {
          role: "system",
          content: "You are an expert technical recruiter and ATS analyst. Extract structured data from the combined candidate profile and resume text."
        },
        {
          role: "user",
          content: `
            Analyze the following candidate data (including their raw resume text if provided).
            Extract a comprehensive list of technical and soft skills.
            Provide a 3-sentence professional summary focusing on their highest value experience.

            RAW RESUME TEXT:
            ${resumeText || 'No raw resume content provided.'}

            PROFILE DATA:
            Bio: ${profileData.bio || 'N/A'}
            Manual Skills: ${profileData.skills?.join(', ') || 'N/A'}
            Experience: ${JSON.stringify(profileData.experience || [])}
            Education: ${JSON.stringify(profileData.education || [])}

            Return ONLY a JSON object:
            {
              "extractedSkills": ["skill1", "skill2"],
              "summary": "Professional summary here..."
            }
          `
        }
      ],
      model: "llama-3.3-70b-versatile",
      temperature: 0.1,
      response_format: { type: "json_object" }
    });

    return JSON.parse(chatCompletion.choices[0].message.content);
  } catch (error) {
    console.error('[Groq AI Error] Profile Analysis failed:', error);
    return {
      extractedSkills: profileData.skills || [],
      summary: profileData.bio || 'AI analysis was temporarily unavailable.'
    };
  }
};

/**
 * [TalentBridge Intelligence Protocol]
 * Matches a candidate's profile against a specific job description using Groq AI.
 */
export const matchWithJob = async (candidateData, jobData) => {
  try {
    const groq = getGroqClient();
    // 1. Extract true resume text if available
    const resumeText = await extractTextFromPdf(candidateData.profile?.resume);

    const chatCompletion = await groq.chat.completions.create({
      messages: [
        {
          role: "system",
          content: "You are an AI Synergy Matcher. Combine profile metadata with raw resume text to provide high-accuracy matching analysis."
        },
        {
          role: "user",
          content: `
            Analyze the synergy between this candidate and the specific job description.
            
            JOB NODE:
            Title: ${jobData.title}
            Description Headings: ${jobData.description}
            Requirements: ${jobData.requirements?.join(', ') || 'N/A'}
 
            CANDIDATE NODE:
            Name: ${candidateData.name}
            Bio: ${candidateData.profile?.bio || 'N/A'}
            Profile Skills: ${candidateData.profile?.skills?.join(', ') || 'N/A'}
            
            RAW RESUME CONTENT (EXTRACTED):
            ${resumeText || 'No text extracted from PDF.'}

            Return a JSON object:
            {
              "matchScore": 85, 
              "matchingSkills": ["skill1", "skill2"],
              "missingSkills": ["skill3"],
              "recommendation": "Shortlist/Review/Reject",
              "analysisReason": "Combine profile insights with resume text to justify this score (Max 2 sentences)."
            }
          `
        }
      ],
      model: "llama-3.3-70b-versatile",
      temperature: 0.2,
      response_format: { type: "json_object" }
    });

    return JSON.parse(chatCompletion.choices[0].message.content);
  } catch (error) {
    console.error('[Groq AI Error] Job Matching failed:', error);
    return {
      matchScore: 50,
      matchingSkills: [],
      missingSkills: [],
      recommendation: 'Manual Review Required',
      analysisReason: 'AI matching service encountered an error.'
    };
  }
};
