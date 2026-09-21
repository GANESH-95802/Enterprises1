/**
 * Environment configuration validation
 * Fails fast on missing critical configuration
 * Warns on optional but recommended configuration
 */

// Required environment variables — server cannot start without these
const REQUIRED_ENV_VARS = ['MONGO_URI', 'JWT_SECRET', 'NODE_ENV'];

// Optional but recommended environment variables
const RECOMMENDED_ENV_VARS = [
  { name: 'GEMINI_API_KEY', description: 'Google Gemini AI features will use mock data' },
  { name: 'OPENAI_API_KEY', description: 'OpenAI features (chatbot, embeddings) will use mock data' },
  { name: 'CORS_ORIGINS', description: 'Cross-origin requests will be restricted to defaults' },
];

// Validate that required env vars are present
const validateEnv = () => {
  const missing = REQUIRED_ENV_VARS.filter((v) => !process.env[v]);
  if (missing.length > 0) {
    console.error(
      `FATAL: Missing required environment variables: ${missing.join(', ')}`
    );
    process.exit(1);
  }

  // Additional validation: NODE_ENV must be one of the known values
  const validNodeEnv = ['development', 'production', 'test'];
  if (!validNodeEnv.includes(process.env.NODE_ENV)) {
    console.error(
      `FATAL: NODE_ENV must be one of: ${validNodeEnv.join(', ')}. Got: ${process.env.NODE_ENV}`
    );
    process.exit(1);
  }

  // Additional validation: JWT_SECRET should be strong enough for production
  if (process.env.NODE_ENV === 'production') {
    const jwtSecret = process.env.JWT_SECRET || '';
    const weakPatterns = [
      'your_jwt_secret_key_change_this',
      'your_super_secure_jwt_secret_key_at_least_32_chars',
      'secret',
      'password',
    ];
    const isWeak = weakPatterns.some((p) => jwtSecret.toLowerCase().includes(p.toLowerCase()));
    if (isWeak || jwtSecret.length < 32) {
      console.error(
        `FATAL: JWT_SECRET is too weak for production. Generate a strong secret with: node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"`
      );
      process.exit(1);
    }
  }

  // Warn about recommended but missing vars
  RECOMMENDED_ENV_VARS.forEach(({ name, description }) => {
    if (!process.env[name] || process.env[name] === `your_${name.toLowerCase()}_here`) {
      console.warn(`WARNING: ${name} is not configured. ${description}.`);
    }
  });

  return true;
};

// Validate that a string is a valid URL
const isValidUrl = (url) => {
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
};

module.exports = { validateEnv, isValidUrl };
