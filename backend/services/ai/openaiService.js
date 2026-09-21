const OpenAI = require('openai');

let openai = null;
let apiKeys = [];
let currentKeyIndex = 0;
let invalidKeys = new Set();

// Parse comma-separated API keys for rotation
const parseApiKeys = () => {
  const primaryKey = process.env.OPENAI_API_KEY;
  const multiKeys = process.env.OPENAI_API_KEYS;

  const keys = [];
  if (multiKeys) {
    keys.push(...multiKeys.split(',').map((k) => k.trim()).filter(Boolean));
  }
  if (primaryKey && !keys.includes(primaryKey)) {
    keys.push(primaryKey);
  }
  return keys;
};

const initializeOpenAI = () => {
  apiKeys = parseApiKeys();
  if (apiKeys.length > 0) {
    openai = new OpenAI({ apiKey: apiKeys[0] });
    return true;
  }
  console.warn('OpenAI API key not configured. OpenAI features disabled.');
  return false;
};

// Rotate to next available API key
const rotateKey = () => {
  if (apiKeys.length <= 1) return false;
  const startIndex = currentKeyIndex;
  do {
    currentKeyIndex = (currentKeyIndex + 1) % apiKeys.length;
    if (!invalidKeys.has(currentKeyIndex)) {
      openai = new OpenAI({ apiKey: apiKeys[currentKeyIndex] });
      console.log(`Rotated to OpenAI API key ${currentKeyIndex + 1}/${apiKeys.length}`);
      return true;
    }
  } while (currentKeyIndex !== startIndex);
  return false;
};

// Mark current key as invalid (e.g., 401 auth error)
const markKeyInvalid = () => {
  invalidKeys.add(currentKeyIndex);
  console.warn(`OpenAI API key ${currentKeyIndex + 1} marked as invalid`);
  return rotateKey();
};

const getOpenAI = () => {
  if (!openai) {
    if (!initializeOpenAI()) return null;
  }
  return openai;
};

// Execute with automatic key rotation on rate limit (429) or auth (401) errors
const executeWithRetry = async (fn) => {
  try {
    return await fn();
  } catch (error) {
    const status = error?.status || error?.response?.status;
    if (status === 429 || status === 401) {
      if (status === 401) {
        markKeyInvalid();
      } else {
        rotateKey();
      }
      try {
        return await fn();
      } catch (retryError) {
        console.error('OpenAI retry failed:', retryError.message);
        return null;
      }
    }
    throw error;
  }
};

// Chat completion
const chatCompletion = async (messages, options = {}) => {
  try {
    const client = getOpenAI();
    if (!client) return generateMockChatResponse(messages);

    const completion = await executeWithRetry(() =>
      client.chat.completions.create({
        model: options.model || 'gpt-3.5-turbo',
        messages,
        temperature: options.temperature || 0.7,
        max_tokens: options.maxTokens || 1000,
      })
    );

    if (!completion) return generateMockChatResponse(messages);

    return {
      success: true,
      message: completion.choices[0].message.content,
      usage: completion.usage,
    };
  } catch (error) {
    console.error('OpenAI chat error:', error.message);
    return generateMockChatResponse(messages);
  }
};

// Generate embeddings
const generateEmbeddings = async (text) => {
  try {
    const client = getOpenAI();
    if (!client) return { success: false, message: 'OpenAI not configured' };

    const response = await executeWithRetry(() =>
      client.embeddings.create({
        model: 'text-embedding-ada-002',
        input: text,
      })
    );

    if (!response) return { success: false, message: 'Embedding generation failed' };

    return { success: true, embedding: response.data[0].embedding };
  } catch (error) {
    console.error('Embedding generation error:', error.message);
    return { success: false, message: error.message };
  }
};

// Analyze sentiment
const analyzeSentiment = async (text) => {
  try {
    const client = getOpenAI();
    if (!client) {
      return {
        sentiment: 'neutral',
        score: 0.5,
        explanation: 'Mock sentiment analysis',
      };
    }

    const completion = await executeWithRetry(() =>
      client.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: 'You are a sentiment analysis AI. Analyze the sentiment of the given text and return a JSON with: sentiment (positive/negative/neutral), score (0-1), and explanation.',
          },
          { role: 'user', content: text },
        ],
        temperature: 0.3,
      })
    );

    if (!completion) {
      return { sentiment: 'neutral', score: 0.5, explanation: 'Could not get AI response' };
    }

    const response = completion.choices[0].message.content;
    try {
      return JSON.parse(response.replace(/```json|```/g, '').trim());
    } catch {
      return { sentiment: 'neutral', score: 0.5, explanation: 'Could not parse AI response' };
    }
  } catch (error) {
    console.error('Sentiment analysis error:', error.message);
    return { sentiment: 'neutral', score: 0.5, explanation: error.message };
  }
};

// Mock chat response for when OpenAI is not available
const generateMockChatResponse = (messages) => {
  const lastMessage = messages[messages.length - 1]?.content || '';
  return {
    success: true,
    message: `I understand you're asking about: "${lastMessage.substring(0, 100)}". As an AI assistant for AI Enterprise Hub, I can help with business analytics, document generation, skill evaluation, and more. Please configure your OpenAI API key for full AI capabilities.`,
    usage: { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 },
  };
};

module.exports = {
  initializeOpenAI,
  chatCompletion,
  generateEmbeddings,
  analyzeSentiment,
};