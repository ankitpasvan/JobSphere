/**
 * ATS Resume Analyzer Utility
 * Analyzes resumes with or without job descriptions
 */

// Comprehensive list of action verbs
const ACTION_VERBS = [
  'developed', 'built', 'implemented', 'designed', 'created', 'established',
  'managed', 'led', 'coordinated', 'executed', 'delivered', 'achieved',
  'improved', 'increased', 'reduced', 'optimized', 'streamlined', 'enhanced',
  'launched', 'initiated', 'drove', 'spearheaded', 'pioneered', 'engineered',
  'architected', 'deployed', 'automated', 'integrated', 'collaborated',
  'mentored', 'trained', 'facilitated', 'analyzed', 'researched', 'evaluated',
  'resolved', 'debugged', 'troubleshot', 'maintained', 'configured', 'scaled',
  'migrated', 'refactored', 'tested', 'documented', 'presented', 'negotiated',
  'organized', 'planned', 'strategized', 'directed', 'supervised', 'oversaw'
];

// Common section headers
const SECTION_KEYWORDS = {
  skills: ['skills', 'technical skills', 'core competencies', 'expertise', 'technologies'],
  education: ['education', 'academic', 'qualification', 'degree', 'university', 'college'],
  experience: ['experience', 'work history', 'employment', 'professional experience', 'work experience'],
  projects: ['projects', 'personal projects', 'key projects', 'portfolio']
};

/**
 * Extract keywords from job description
 */
export function extractJobKeywords(jobDescription) {
  if (!jobDescription) return [];

  const text = jobDescription.toLowerCase();
  const keywords = new Set();

  // Extract skills (common programming languages, frameworks, tools)
  const techKeywords = [
    'javascript', 'python', 'java', 'c\\+\\+', 'c#', 'ruby', 'php', 'swift', 'kotlin', 'typescript',
    'react', 'angular', 'vue', 'node\\.js', 'express', 'django', 'flask', 'spring', 'laravel',
    'mongodb', 'mysql', 'postgresql', 'redis', 'sql', 'nosql', 'database',
    'aws', 'azure', 'gcp', 'docker', 'kubernetes', 'ci/cd', 'jenkins', 'git',
    'html', 'css', 'rest', 'api', 'graphql', 'microservices', 'agile', 'scrum',
    'machine learning', 'ai', 'data science', 'analytics', 'cloud', 'devops',
    'frontend', 'backend', 'full-stack', 'mobile', 'web development',
    'testing', 'debugging', 'problem solving', 'problem-solving', 'communication', 'leadership',
    'teamwork', 'collaboration', 'management', 'project management', 'tailwind'
  ];

  techKeywords.forEach(keyword => {
    const regex = new RegExp(`\\b${keyword}\\b`, 'gi');
    if (regex.test(text)) {
      const cleanKeyword = keyword.toLowerCase().replace(/\\+/g, '+').replace(/\\\./g, '.');
      keywords.add(cleanKeyword);
    }
  });

  return Array.from(keywords);
}

/**
 * Extract keywords from resume
 */
export function extractResumeKeywords(resumeText) {
  if (!resumeText) return [];

  const text = resumeText.toLowerCase();
  const keywords = new Set();

  // Same tech keywords as job description
  const techKeywords = [
    'javascript', 'python', 'java', 'c\\+\\+', 'c#', 'ruby', 'php', 'swift', 'kotlin', 'typescript',
    'react', 'angular', 'vue', 'node\\.js', 'express', 'django', 'flask', 'spring', 'laravel',
    'mongodb', 'mysql', 'postgresql', 'redis', 'sql', 'nosql', 'database',
    'aws', 'azure', 'gcp', 'docker', 'kubernetes', 'ci/cd', 'jenkins', 'git',
    'html', 'css', 'rest', 'api', 'graphql', 'microservices', 'agile', 'scrum',
    'machine learning', 'ai', 'data science', 'analytics', 'cloud', 'devops',
    'frontend', 'backend', 'full-stack', 'mobile', 'web development',
    'testing', 'debugging', 'problem solving', 'problem-solving', 'communication', 'leadership',
    'teamwork', 'collaboration', 'management', 'project management', 'tailwind'
  ];

  techKeywords.forEach(keyword => {
    const regex = new RegExp(`\\b${keyword}\\b`, 'gi');
    if (regex.test(text)) {
      const cleanKeyword = keyword.toLowerCase().replace(/\\+/g, '+').replace(/\\\./g, '.');
      keywords.add(cleanKeyword);
    }
  });

  return Array.from(keywords);
}

/**
 * Match keywords between job and resume
 */
export function matchKeywords(jobKeywords, resumeKeywords) {
  const matched = [];
  const missing = [];

  jobKeywords.forEach(jobKeyword => {
    const found = resumeKeywords.some(resumeKeyword => {
      // Exact match or contains
      return resumeKeyword === jobKeyword || 
             resumeKeyword.includes(jobKeyword) || 
             jobKeyword.includes(resumeKeyword);
    });

    if (found) {
      matched.push(jobKeyword);
    } else {
      missing.push(jobKeyword);
    }
  });

  return { matched, missing };
}

/**
 * Detect presence of resume sections
 */
export function detectSections(resumeText) {
  if (!resumeText) {
    return {
      hasSkills: false,
      hasEducation: false,
      hasExperience: false,
      hasProjects: false
    };
  }

  const text = resumeText.toLowerCase();

  return {
    hasSkills: SECTION_KEYWORDS.skills.some(keyword => text.includes(keyword)),
    hasEducation: SECTION_KEYWORDS.education.some(keyword => text.includes(keyword)),
    hasExperience: SECTION_KEYWORDS.experience.some(keyword => text.includes(keyword)),
    hasProjects: SECTION_KEYWORDS.projects.some(keyword => text.includes(keyword))
  };
}

/**
 * Count action verbs in resume
 */
export function countActionVerbs(resumeText) {
  if (!resumeText) return 0;

  const text = resumeText.toLowerCase();
  let count = 0;

  ACTION_VERBS.forEach(verb => {
    const regex = new RegExp(`\\b${verb}\\b`, 'gi');
    const matches = text.match(regex);
    if (matches) {
      count += matches.length;
    }
  });

  return count;
}

/**
 * Detect measurable achievements (numbers, percentages, metrics)
 */
export function detectMeasurableAchievements(resumeText) {
  if (!resumeText) return 0;

  // Patterns for numbers, percentages, dollar amounts, etc.
  const patterns = [
    /\d+%/g,                          // Percentages: 50%
    /\$\d+/g,                         // Dollar amounts: $1000
    /\d+\+/g,                         // Numbers with plus: 100+
    /\d+k/gi,                         // Thousands: 10k
    /\d+m/gi,                         // Millions: 5m
    /increased.*\d+/gi,               // Increased by X
    /decreased.*\d+/gi,               // Decreased by X
    /reduced.*\d+/gi,                 // Reduced by X
    /improved.*\d+/gi,                // Improved by X
    /\d+\s*(users|customers|clients)/gi, // X users/customers
    /\d+\s*(hours|days|weeks|months)/gi  // Time metrics
  ];

  let count = 0;
  patterns.forEach(pattern => {
    const matches = resumeText.match(pattern);
    if (matches) {
      count += matches.length;
    }
  });

  return count;
}

/**
 * Detect formatting issues
 */
export function detectFormattingIssues(resumeText) {
  const issues = [];

  if (!resumeText) {
    issues.push('Resume text is empty or could not be parsed');
    return issues;
  }

  // Check for long paragraphs (>500 characters without line break)
  const paragraphs = resumeText.split(/\n\n+/);
  const longParagraphs = paragraphs.filter(p => p.length > 500);
  if (longParagraphs.length > 0) {
    issues.push('Contains long paragraphs that may be hard to read (consider breaking them down)');
  }

  // Check for bullet points
  const hasBullets = /[•\-\*\u2022\u2023\u25E6\u2043\u2219]/.test(resumeText);
  if (!hasBullets) {
    issues.push('Lacks bullet points for better readability');
  }

  // Check resume length
  const wordCount = resumeText.split(/\s+/).length;
  if (wordCount < 150) {
    issues.push('Resume appears too short (should be more detailed)');
  } else if (wordCount > 2000) {
    issues.push('Resume is quite lengthy (consider condensing to 1-2 pages)');
  }

  return issues;
}

/**
 * Generate suggestions based on analysis
 */
export function generateSuggestions(analysisData) {
  const suggestions = [];
  const { sectionAnalysis, actionVerbCount, measurableCount, formattingIssues, keywordAnalysis, mode } = analysisData;

  // Section-based suggestions
  if (!sectionAnalysis.hasSkills) {
    suggestions.push('Add a dedicated "Skills" section to highlight your technical abilities');
  }
  if (!sectionAnalysis.hasEducation) {
    suggestions.push('Include your educational background and qualifications');
  }
  if (!sectionAnalysis.hasExperience) {
    suggestions.push('Add a "Work Experience" or "Professional Experience" section');
  }
  if (!sectionAnalysis.hasProjects) {
    suggestions.push('Consider adding a "Projects" section to showcase practical work');
  }

  // Action verbs
  if (actionVerbCount < 5) {
    suggestions.push('Use more action verbs (developed, built, implemented, designed) to strengthen descriptions');
  }

  // Measurable achievements
  if (measurableCount < 3) {
    suggestions.push('Add quantifiable achievements with numbers, percentages, or metrics to demonstrate impact');
  }

  // Formatting
  if (formattingIssues.length > 0) {
    formattingIssues.forEach(issue => {
      if (!suggestions.includes(issue)) {
        suggestions.push(issue);
      }
    });
  }

  // Job-based specific suggestions
  if (mode === 'job-based' && keywordAnalysis && keywordAnalysis.matchedKeywords) {
    const totalKeywords = keywordAnalysis.matchedKeywords.length + keywordAnalysis.missingKeywords.length;
    
    if (totalKeywords > 0) {
      const matchPercentage = (keywordAnalysis.matchedKeywords.length / totalKeywords) * 100;

      if (matchPercentage < 50) {
        suggestions.push(`Only ${Math.round(matchPercentage)}% keyword match - consider incorporating more relevant skills from the job description`);
      }

      if (keywordAnalysis.missingKeywords.length > 0) {
        const topMissing = keywordAnalysis.missingKeywords.slice(0, 5).join(', ');
        suggestions.push(`Consider adding these missing keywords if applicable: ${topMissing}`);
      }
    }
  }

  return suggestions;
}

/**
 * Calculate ATS score based on analysis
 */
export function calculateATSScore(analysisData) {
  const { mode, sectionAnalysis, actionVerbCount, measurableCount, formattingIssues, keywordAnalysis } = analysisData;

  let score = 0;

  if (mode === 'job-based') {
    // Job-based scoring (out of 100)
    
    // 1. Keyword Match → 40%
    if (keywordAnalysis && keywordAnalysis.matchedKeywords && 
        (keywordAnalysis.matchedKeywords.length + keywordAnalysis.missingKeywords.length) > 0) {
      const matchRatio = keywordAnalysis.matchedKeywords.length / 
        (keywordAnalysis.matchedKeywords.length + keywordAnalysis.missingKeywords.length);
      score += matchRatio * 40;
    }

    // 2. Sections → 20%
    const sectionScore = (
      (sectionAnalysis.hasSkills ? 1 : 0) +
      (sectionAnalysis.hasEducation ? 1 : 0) +
      (sectionAnalysis.hasExperience ? 1 : 0) +
      (sectionAnalysis.hasProjects ? 1 : 0)
    ) / 4;
    score += sectionScore * 20;

    // 3. Action Words → 15%
    const actionScore = Math.min(actionVerbCount / 10, 1); // 10+ action verbs = full score
    score += actionScore * 15;

    // 4. Measurable Results → 15%
    const measurableScore = Math.min(measurableCount / 5, 1); // 5+ measurable results = full score
    score += measurableScore * 15;

    // 5. Formatting → 10%
    const formattingScore = Math.max(0, 1 - (formattingIssues.length * 0.2)); // Deduct per issue
    score += formattingScore * 10;

  } else {
    // General analysis scoring (out of 100)
    
    // 1. Sections → 30%
    const sectionScore = (
      (sectionAnalysis.hasSkills ? 1 : 0) +
      (sectionAnalysis.hasEducation ? 1 : 0) +
      (sectionAnalysis.hasExperience ? 1 : 0) +
      (sectionAnalysis.hasProjects ? 1 : 0)
    ) / 4;
    score += sectionScore * 30;

    // 2. Action Words → 20%
    const actionScore = Math.min(actionVerbCount / 10, 1);
    score += actionScore * 20;

    // 3. Measurable Results → 20%
    const measurableScore = Math.min(measurableCount / 5, 1);
    score += measurableScore * 20;

    // 4. Formatting → 15%
    const formattingScore = Math.max(0, 1 - (formattingIssues.length * 0.2));
    score += formattingScore * 15;

    // 5. Skill Strength → 15%
    const resumeKeywords = extractResumeKeywords(analysisData.resumeText || '');
    const skillScore = Math.min(resumeKeywords.length / 10, 1); // 10+ skills = full score
    score += skillScore * 15;
  }

  return Math.round(score);
}

/**
 * Main ATS Analysis Function
 */
export function analyzeResume(resumeText, jobDescription = null) {
  // Determine mode
  const mode = jobDescription ? 'job-based' : 'general';

  // Detect sections
  const sectionAnalysis = detectSections(resumeText);

  // Count action verbs and measurable achievements
  const actionVerbCount = countActionVerbs(resumeText);
  const measurableCount = detectMeasurableAchievements(resumeText);

  // Detect formatting issues
  const formattingIssues = detectFormattingIssues(resumeText);

  // Keyword analysis (job-based only)
  let keywordAnalysis = {
    matchedKeywords: [],
    missingKeywords: []
  };

  if (mode === 'job-based' && jobDescription) {
    const jobKeywords = extractJobKeywords(jobDescription);
    const resumeKeywords = extractResumeKeywords(resumeText);
    const { matched, missing } = matchKeywords(jobKeywords, resumeKeywords);
    keywordAnalysis = {
      matchedKeywords: matched,
      missingKeywords: missing
    };
  }

  // Prepare analysis data
  const analysisData = {
    mode,
    sectionAnalysis,
    actionVerbCount,
    measurableCount,
    formattingIssues,
    keywordAnalysis,
    resumeText
  };

  // Calculate score
  const atsScore = calculateATSScore(analysisData);

  // Generate issues list
  const issues = [...formattingIssues];
  
  if (!sectionAnalysis.hasSkills) issues.push('Missing Skills section');
  if (!sectionAnalysis.hasEducation) issues.push('Missing Education section');
  if (!sectionAnalysis.hasExperience) issues.push('Missing Experience section');
  if (actionVerbCount < 5) issues.push('Limited use of action verbs');
  if (measurableCount < 3) issues.push('Lacks measurable achievements');

  // Generate suggestions
  const suggestions = generateSuggestions(analysisData);

  // Return result in strict JSON format
  return {
    mode,
    atsScore,
    keywordAnalysis,
    sectionAnalysis,
    issues,
    suggestions
  };
}
