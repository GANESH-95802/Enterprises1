const AiCache = require('../../../models/AiCache');

/**
 * Cost Tracker Middleware
 * Tracks AI API costs and token usage.
 * Estimates costs based on provider pricing.
 */
const PROVIDER_RATES = {
  gemini: {
    input: 0.00025 / 1000,   // $0.00025 per 1K input tokens
    output: 0.0005 / 1000,   // $0.0005 per 1K output tokens
  },
  openai: {
    input: 0.0015 / 1000,    // $0.0015 per 1K input tokens (gpt-3.5-turbo)
    output: 0.002 / 1000,    // $0.002 per 1K output tokens
  },
};

// In-memory cost tracking
const costStore = {
  daily: new Map(), // key: YYYY-MM-DD, value: { cost, tokens }
  monthly: new Map(), // key: YYYY-MM, value: { cost, tokens }
};

const getDateKey = (date = new Date()) => date.toISOString().slice(0, 10);
const getMonthKey = (date = new Date()) => date.toISOString().slice(0, 7);

const costTracker = (req, res, next) => {
  const originalJson = res.json;
  res.json = function (body) {
    res.locals.responseBody = body;
    return originalJson.call(this, body);
  };

  res.on('finish', () => {
    try {
      const body = res.locals.responseBody;
      if (!body || !body.data) return;

      const provider = body.data.provider || 'unknown';
      const usage = body.data.usage;

      if (!usage) return;

      // Extract token counts
      const inputTokens = usage.prompt_tokens || usage.promptTokenCount || 0;
      const outputTokens = usage.completion_tokens || usage.candidatesTokenCount || 0;
      const totalTokens = usage.total_tokens || (inputTokens + outputTokens) || 0;

      // Calculate cost
      const rates = PROVIDER_RATES[provider] || { input: 0, output: 0 };
      const cost = (inputTokens * rates.input) + (outputTokens * rates.output);

      // Track in-memory
      const today = getDateKey();
      const month = getMonthKey();

      if (!costStore.daily.has(today)) {
        costStore.daily.set(today, { cost: 0, tokens: 0 });
      }
      if (!costStore.monthly.has(month)) {
        costStore.monthly.set(month, { cost: 0, tokens: 0 });
      }

      const dayStats = costStore.daily.get(today);
      const monthStats = costStore.monthly.get(month);

      dayStats.cost += cost;
      dayStats.tokens += totalTokens;
      monthStats.cost += cost;
      monthStats.tokens += totalTokens;

      // Attach cost info to response for visibility
      body.data.cost = {
        estimatedCost: parseFloat(cost.toFixed(6)),
        provider,
        tokens: totalTokens,
      };
    } catch (error) {
      console.error('Cost tracker error:', error.message);
    }
  });

  next();
};

// Get current cost statistics
costTracker.getStats = () => {
  const today = getDateKey();
  const month = getMonthKey();
  return {
    today: costStore.daily.get(today) || { cost: 0, tokens: 0 },
    thisMonth: costStore.monthly.get(month) || { cost: 0, tokens: 0 },
  };
};

// Reset cost tracking
costTracker.reset = () => {
  costStore.daily.clear();
  costStore.monthly.clear();
};

module.exports = costTracker;