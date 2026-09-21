/**
 * Streaming Response Support
 * Provides streaming capability for assistant chat responses.
 * Uses Server-Sent Events (SSE) for real-time token delivery.
 */
const responseBuilder = require('../../orchestrator/responseBuilder');

/**
 * Initialize SSE stream
 */
const initStream = (res, options = {}) => {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'X-Accel-Buffering': 'no',
  });

  res.write(`data: ${JSON.stringify({
    type: 'connected',
    sessionId: options.sessionId || null,
    profile: options.profile || 'general',
    timestamp: new Date().toISOString(),
  })}\n\n`);

  return {
    sendChunk: (content) => {
      res.write(`data: ${JSON.stringify(responseBuilder.buildStreamChunk(content, {
        provider: options.provider || 'unknown',
      }))}\n\n`);
    },
    sendToolEvent: (toolCall) => {
      res.write(`data: ${JSON.stringify({
        type: 'tool_call',
        data: {
          toolName: toolCall.toolName,
          status: toolCall.status || 'started',
          timestamp: new Date().toISOString(),
        },
      })}\n\n`);
    },
    end: (summary = {}) => {
      res.write(`data: ${JSON.stringify({
        type: 'done',
        data: {
          provider: summary.provider || options.provider || 'unknown',
          model: summary.model || options.model || 'unknown',
          usage: summary.usage || null,
          timestamp: new Date().toISOString(),
        },
      })}\n\n`);
      res.end();
    },
    error: (message) => {
      res.write(`data: ${JSON.stringify({
        type: 'error',
        data: { message, timestamp: new Date().toISOString() },
      })}\n\n`);
      res.end();
    },
  };
};

/**
 * Handle OpenAI stream
 */
const handleOpenAIStream = async (stream, handlers = {}) => {
  try {
    let fullText = '';
    let usage = null;
    for await (const chunk of stream) {
      const content = chunk.choices?.[0]?.delta?.content;
      if (content) {
        fullText += content;
        if (handlers.onToken) handlers.onToken(content);
      }
      if (chunk.usage) usage = chunk.usage;
    }
    if (handlers.onDone) handlers.onDone({ text: fullText, usage });
  } catch (error) {
    console.error('OpenAI stream error:', error.message);
    if (handlers.onError) handlers.onError(error.message);
  }
};

/**
 * Handle Gemini stream
 */
const handleGeminiStream = async (stream, handlers = {}) => {
  try {
    let fullText = '';
    let usage = null;
    for await (const chunk of stream.stream) {
      const text = chunk.text?.();
      if (text) {
        fullText += text;
        if (handlers.onToken) handlers.onToken(text);
      }
      if (chunk.usageMetadata) usage = chunk.usageMetadata;
    }
    if (handlers.onDone) handlers.onDone({ text: fullText, usage });
  } catch (error) {
    console.error('Gemini stream error:', error.message);
    if (handlers.onError) handlers.onError(error.message);
  }
};

module.exports = {
  initStream,
  handleOpenAIStream,
  handleGeminiStream,
};