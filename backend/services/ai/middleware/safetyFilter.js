/**
 * Safety Filter Middleware
 * Filters unsafe content from AI inputs and outputs.
 * Blocks prompt injection attempts and harmful content.
 */
const BLOCKED_PATTERNS = [
  /ignore\s+(all\s+)?previous\s+instructions/i,
  /disregard\s+(all\s+)?previous\s+instructions/i,
  /you\s+are\s+now\s+(an?\s+)?(unrestricted|jailbroken|dan)/i,
  /system\s+prompt\s*:/i,
  /reveal\s+(your\s+)?(system\s+)?prompt/i,
  /bypass\s+(the\s+)?(safety|security|filter)/i,
  /<script[\s>]/i,
  /javascript\s*:/i,
  /onerror\s*=/i,
  /onload\s*=/i,
];

const BLOCKED_WORDS = [
  'hack', 'exploit', 'malware', 'ransomware', 'phishing',
  'sql injection', 'xss', 'csrf', 'ddos',
];

const MAX_INPUT_LENGTH = 10000;
const MAX_OUTPUT_LENGTH = 50000;

const containsBlockedContent = (text) => {
  if (!text) return false;

  // Check blocked patterns
  for (const pattern of BLOCKED_PATTERNS) {
    if (pattern.test(text)) return true;
  }

  // Check blocked words (word boundary)
  const lower = text.toLowerCase();
  for (const word of BLOCKED_WORDS) {
    if (lower.includes(word)) return true;
  }

  return false;
};

const safetyFilter = (req, res, next) => {
  // Filter request body
  const bodyText = JSON.stringify(req.body || {});
  if (bodyText.length > MAX_INPUT_LENGTH) {
    return res.status(413).json({
      success: false,
      message: 'Request too large for AI processing',
    });
  }

  if (containsBlockedContent(bodyText)) {
    return res.status(400).json({
      success: false,
      message: 'Request contains blocked content',
    });
  }

  // Filter query parameters
  const queryText = JSON.stringify(req.query || {});
  if (containsBlockedContent(queryText)) {
    return res.status(400).json({
      success: false,
      message: 'Request contains blocked content',
    });
  }

  // Filter response
  const originalJson = res.json;
  res.json = function (body) {
    // Check response for unsafe content
    if (body && body.data && body.data.message) {
      const responseText = String(body.data.message);
      if (responseText.length > MAX_OUTPUT_LENGTH) {
        body.data.message = responseText.substring(0, MAX_OUTPUT_LENGTH) + '... (truncated)';
      }
      if (containsBlockedContent(responseText)) {
        body.data.message = 'Response was filtered for safety. Please rephrase your query.';
        body.data.filtered = true;
      }
    }
    return originalJson.call(this, body);
  };

  next();
};

module.exports = safetyFilter;