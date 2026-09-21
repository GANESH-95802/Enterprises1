const { GoogleGenerativeAI } = require('@google/generative-ai');

let genAI = null;
let apiKeys = [];
let currentKeyIndex = 0;
let invalidKeys = new Set();

// Parse comma-separated API keys for rotation
const parseApiKeys = () => {
  const primaryKey = process.env.GEMINI_API_KEY;
  const multiKeys = process.env.GEMINI_API_KEYS;

  const keys = [];
  if (multiKeys) {
    keys.push(...multiKeys.split(',').map((k) => k.trim()).filter(Boolean));
  }
  if (primaryKey && !keys.includes(primaryKey)) {
    keys.push(primaryKey);
  }
  return keys;
};

const initializeAI = () => {
  apiKeys = parseApiKeys();
  if (apiKeys.length > 0) {
    genAI = new GoogleGenerativeAI(apiKeys[0]);
    return true;
  }
  console.warn('Gemini API key not configured. AI features will return mock data.');
  return false;
};

// Rotate to next available API key
const rotateKey = () => {
  if (apiKeys.length <= 1) return false;
  const startIndex = currentKeyIndex;
  do {
    currentKeyIndex = (currentKeyIndex + 1) % apiKeys.length;
    if (!invalidKeys.has(currentKeyIndex)) {
      genAI = new GoogleGenerativeAI(apiKeys[currentKeyIndex]);
      console.log(`Rotated to Gemini API key ${currentKeyIndex + 1}/${apiKeys.length}`);
      return true;
    }
  } while (currentKeyIndex !== startIndex);
  return false;
};

// Mark current key as invalid (e.g., 401 auth error)
const markKeyInvalid = () => {
  invalidKeys.add(currentKeyIndex);
  console.warn(`Gemini API key ${currentKeyIndex + 1} marked as invalid`);
  return rotateKey();
};

const getModel = (modelName = 'gemini-pro') => {
  if (!genAI) {
    if (!initializeAI()) {
      return null;
    }
  }
  return genAI.getGenerativeModel({ model: modelName });
};

// Execute with automatic key rotation on rate limit (429) or auth (401) errors
const executeWithRetry = async (fn) => {
  try {
    return await fn();
  } catch (error) {
    const status = error?.status || error?.response?.status;
    if (status === 429 || status === 401) {
      // Rate limited or auth error — rotate to next key
      if (status === 401) {
        markKeyInvalid();
      } else {
        rotateKey();
      }
      // Retry once with new key
      try {
        return await fn();
      } catch (retryError) {
        console.error('AI retry failed:', retryError.message);
        return null;
      }
    }
    throw error;
  }
};

// Sales prediction based on historical data
const predictSales = async (salesHistory) => {
  try {
    const model = getModel();
    if (!model) {
      return generateMockPrediction(salesHistory);
    }

    const prompt = `You are a sales prediction AI. Analyze the following sales data and predict future trends.
    Sales History (last 12 months): ${JSON.stringify(salesHistory)}
    
    Provide a JSON response with:
    - predictedRevenue: number (next month prediction)
    - growthRate: percentage
    - trend: "up" | "down" | "stable"
    - confidence: number (0-100)
    - recommendations: array of strings
    - seasonalFactors: array of strings`;

    const result = await executeWithRetry(() => model.generateContent(prompt));
    if (!result) return generateMockPrediction(salesHistory);
    const response = await result.response;
    const text = response.text();
    
    try {
      return JSON.parse(text.replace(/```json|```/g, '').trim());
    } catch {
      return generateMockPrediction(salesHistory);
    }
  } catch (error) {
    console.error('Sales prediction error:', error.message);
    return generateMockPrediction(salesHistory);
  }
};

// Document generation
const generateDocument = async (type, data) => {
  try {
    const model = getModel();
    if (!model) {
      return generateMockDocument(type, data);
    }

    const prompt = `Generate a professional ${type} document based on the following data.
    Data: ${JSON.stringify(data)}
    
    Generate a well-structured document with:
    1. Professional header with company info
    2. Document title and reference number
    3. Date
    4. Recipient details (if applicable)
    5. Main content body
    6. Terms and conditions
    7. Signatures section
    
    Return the document in HTML format with proper styling.`;

    const result = await executeWithRetry(() => model.generateContent(prompt));
    if (!result) return generateMockDocument(type, data);
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error('Document generation error:', error.message);
    return generateMockDocument(type, data);
  }
};

// Medical report explanation
const explainMedicalReport = async (reportData) => {
  try {
    const model = getModel();
    if (!model) {
      return generateMockMedicalExplanation(reportData);
    }

    const prompt = `You are a medical AI assistant. Explain the following medical report in simple, understandable terms.
    Report Data: ${JSON.stringify(reportData)}
    
    Provide a JSON response with:
    - summary: plain language summary
    - keyFindings: array of objects with { finding, explanation, severity }
    - recommendations: array of strings
    - followUpActions: array of strings
    - disclaimer: string
    
    Make it comprehensive but easy to understand.`;

    const result = await executeWithRetry(() => model.generateContent(prompt));
    if (!result) return generateMockMedicalExplanation(reportData);
    const response = await result.response;
    const text = response.text();
    
    try {
      return JSON.parse(text.replace(/```json|```/g, '').trim());
    } catch {
      return generateMockMedicalExplanation(reportData);
    }
  } catch (error) {
    console.error('Medical explanation error:', error.message);
    return generateMockMedicalExplanation(reportData);
  }
};

// Image analysis
const analyzeImage = async (imageBase64, mimeType) => {
  try {
    const model = getModel('gemini-pro-vision');
    if (!model) {
      return generateMockImageAnalysis();
    }

    const imageParts = [
      {
        inlineData: {
          data: imageBase64,
          mimeType: mimeType || 'image/jpeg',
        },
      },
    ];

    const prompt = `Analyze this image in detail. Provide a JSON response with:
    - description: overall description
    - objects: array of detected objects
    - text: any text found in the image
    - colors: dominant colors
    - category: image category
    - tags: array of relevant tags`;

    const result = await executeWithRetry(() => model.generateContent([prompt, ...imageParts]));
    if (!result) return generateMockImageAnalysis();
    const response = await result.response;
    const text = response.text();
    
    try {
      return JSON.parse(text.replace(/```json|```/g, '').trim());
    } catch {
      return generateMockImageAnalysis();
    }
  } catch (error) {
    console.error('Image analysis error:', error.message);
    return generateMockImageAnalysis();
  }
};

// Skill evaluation
const evaluateSkill = async (skillData) => {
  try {
    const model = getModel();
    if (!model) {
      return generateMockSkillEvaluation(skillData);
    }

    const prompt = `You are a skill evaluation AI. Evaluate the following skill based on the provided data.
    Skill Data: ${JSON.stringify(skillData)}
    
    Provide a JSON response with:
    - proficiencyScore: number (0-100)
    - skillLevel: "beginner" | "intermediate" | "advanced" | "expert"
    - strengths: array of strings
    - areasForImprovement: array of strings
    - recommendedCourses: array of objects with { title, platform, duration }
    - estimatedTimeToMaster: string
    - careerPaths: array of strings`;

    const result = await executeWithRetry(() => model.generateContent(prompt));
    if (!result) return generateMockSkillEvaluation(skillData);
    const response = await result.response;
    const text = response.text();
    
    try {
      return JSON.parse(text.replace(/```json|```/g, '').trim());
    } catch {
      return generateMockSkillEvaluation(skillData);
    }
  } catch (error) {
    console.error('Skill evaluation error:', error.message);
    return generateMockSkillEvaluation(skillData);
  }
};

// AI recommendations
const getRecommendations = async (userData) => {
  try {
    const model = getModel();
    if (!model) {
      return generateMockRecommendations(userData);
    }

    const prompt = `You are an AI recommendation engine. Based on the following user data, provide personalized recommendations.
    User Data: ${JSON.stringify(userData)}
    
    Provide a JSON response with:
    - recommendedSkills: array of objects with { skill, reason, priority }
    - recommendedCourses: array of objects with { title, provider, url }
    - careerRecommendations: array of strings
    - productivityTips: array of strings
    - networkingSuggestions: array of strings
    - learningPath: array of objects with { step, duration, resources }`;

    const result = await executeWithRetry(() => model.generateContent(prompt));
    if (!result) return generateMockRecommendations(userData);
    const response = await result.response;
    const text = response.text();
    
    try {
      return JSON.parse(text.replace(/```json|```/g, '').trim());
    } catch {
      return generateMockRecommendations(userData);
    }
  } catch (error) {
    console.error('Recommendations error:', error.message);
    return generateMockRecommendations(userData);
  }
};

// Mock generators for when AI is not available
const generateMockPrediction = (history) => ({
  predictedRevenue: Math.floor(Math.random() * 100000) + 50000,
  growthRate: (Math.random() * 30 - 5).toFixed(1) + '%',
  trend: ['up', 'down', 'stable'][Math.floor(Math.random() * 3)],
  confidence: Math.floor(Math.random() * 30) + 70,
  recommendations: [
    'Increase marketing budget by 15%',
    'Expand product line to capture new market segments',
    'Optimize pricing strategy based on competitor analysis',
    'Invest in customer retention programs',
    'Explore international markets for expansion',
  ],
  seasonalFactors: [
    'Q4 holiday season typically shows 20% increase',
    'Summer months have lower business activity',
    'Back-to-school season drives specific product demand',
  ],
});

const generateMockDocument = (type, data) => `
<!DOCTYPE html>
<html>
<head><style>
  body { font-family: Arial, sans-serif; margin: 40px; }
  h1 { color: #2563eb; border-bottom: 2px solid #2563eb; padding-bottom: 10px; }
  .header { text-align: center; margin-bottom: 30px; }
  .content { line-height: 1.6; }
  .footer { margin-top: 50px; border-top: 1px solid #ccc; padding-top: 20px; }
</style></head>
<body>
  <div class="header">
    <h1>${type.toUpperCase()}</h1>
    <p>AI Enterprise Hub - Generated Document</p>
    <p>Date: ${new Date().toLocaleDateString()}</p>
  </div>
  <div class="content">
    <h2>Document Details</h2>
    <p>Type: ${type}</p>
    <p>Reference: AIH-${Date.now()}</p>
    <hr/>
    <pre>${JSON.stringify(data, null, 2)}</pre>
  </div>
  <div class="footer">
    <p>This document was AI-generated by AI Enterprise Hub</p>
    <p>Document ID: ${Math.random().toString(36).substr(2, 9).toUpperCase()}</p>
  </div>
</body>
</html>`;

const generateMockMedicalExplanation = (report) => ({
  summary: 'Based on the medical report analysis, the patient shows normal results across most parameters. No immediate critical issues detected.',
  keyFindings: [
    { finding: 'Blood Pressure', explanation: 'Within normal range (120/80 mmHg)', severity: 'normal' },
    { finding: 'Cholesterol Levels', explanation: 'Slightly elevated LDL cholesterol', severity: 'moderate' },
    { finding: 'Blood Sugar', explanation: 'Within normal fasting range', severity: 'normal' },
  ],
  recommendations: [
    'Maintain regular exercise routine',
    'Consider reducing saturated fat intake',
    'Schedule follow-up in 3 months',
    'Monitor blood pressure weekly',
  ],
  followUpActions: [
    'Complete lipid profile test in 6 weeks',
    'Schedule annual physical examination',
    'Consult nutritionist for diet plan',
  ],
  disclaimer: 'This AI-generated explanation is for informational purposes only. Always consult with a healthcare professional for medical advice.',
});

const generateMockImageAnalysis = () => ({
  description: 'The image depicts a professional business environment with modern elements.',
  objects: ['Person', 'Computer', 'Desk', 'Chair', 'Documents', 'Smartphone'],
  text: 'No significant text detected in the image',
  colors: ['#2563eb', '#1e293b', '#f8fafc', '#94a3b8'],
  category: 'office',
  tags: ['workplace', 'professional', 'modern', 'corporate', 'technology'],
});

const generateMockSkillEvaluation = (skill) => ({
  proficiencyScore: Math.floor(Math.random() * 40) + 60,
  skillLevel: ['beginner', 'intermediate', 'advanced', 'expert'][Math.floor(Math.random() * 4)],
  strengths: [
    'Strong foundational knowledge',
    'Good problem-solving abilities',
    'Quick learner of new concepts',
  ],
  areasForImprovement: [
    'Advanced techniques and best practices',
    'Real-world project experience',
    'Industry-specific applications',
  ],
  recommendedCourses: [
    { title: 'Advanced ' + skill.name, platform: 'Coursera', duration: '8 weeks' },
    { title: 'Mastering ' + skill.name, platform: 'Udemy', duration: '12 hours' },
    { title: 'Professional Certification', platform: 'LinkedIn Learning', duration: '6 weeks' },
  ],
  estimatedTimeToMaster: '6-12 months with consistent practice',
  careerPaths: [
    'Senior Specialist',
    'Team Lead',
    'Independent Consultant',
    'Technical Trainer',
  ],
});

const generateMockRecommendations = (userData) => ({
  recommendedSkills: [
    { skill: 'Data Analysis', reason: 'High demand in your industry', priority: 'high' },
    { skill: 'Project Management', reason: 'Essential for career growth', priority: 'medium' },
    { skill: 'AI/ML Fundamentals', reason: 'Emerging technology trend', priority: 'high' },
  ],
  recommendedCourses: [
    { title: 'Data Science Specialization', provider: 'Coursera', url: '#' },
    { title: 'AI for Everyone', provider: 'deeplearning.ai', url: '#' },
  ],
  careerRecommendations: [
    'Consider transitioning to a tech-lead role',
    'Explore cross-functional team opportunities',
    'Build expertise in emerging technologies',
  ],
  productivityTips: [
    'Use time-blocking for focused work sessions',
    'Implement the Pomodoro technique',
    'Regular skill assessment and gap analysis',
  ],
  networkingSuggestions: [
    'Join industry-specific Slack communities',
    'Attend virtual tech conferences',
    'Contribute to open-source projects',
  ],
  learningPath: [
    { step: 'Foundation', duration: '2 months', resources: ['Online courses', 'Books'] },
    { step: 'Intermediate', duration: '3 months', resources: ['Projects', 'Mentorship'] },
    { step: 'Advanced', duration: '4 months', resources: ['Real projects', 'Certification'] },
  ],
});

module.exports = {
  initializeAI,
  predictSales,
  generateDocument,
  explainMedicalReport,
  analyzeImage,
  evaluateSkill,
  getRecommendations,
};