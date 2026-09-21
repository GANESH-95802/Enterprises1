/**
 * Summarization Service (Phase 3C — Document Intelligence)
 * Generates document summaries, key points, keywords, and sentiment analysis.
 * Uses extractive summarization leveraging the SentenceRank algorithm and
 * the existing OpenAI service for AI-powered summaries when available.
 * Follows SOLID principles — this module is solely responsible for document summarization.
 */
const openaiService = require('../../openaiService');
const embeddingClient = require('../../clients/embeddingClient');

class SummarizationService {
  constructor() {
    this.stats = {
      totalSummarized: 0,
      totalFailures: 0,
      aiSummaries: 0,
      extractiveSummaries: 0,
    };
    this.maxSummarySentences = 8;
    this.maxKeyPoints = 6;
    this.maxKeywords = 15;
  }

  /**
   * Summarize a document.
   * @param {string} text - Document text
   * @param {Object} options - { maxSentences, maxKeyPoints, useAI }
   * @returns {Promise<Object>} - { success, summary }
   */
  async summarize(text, options = {}) {
    try {
      if (!text || text.trim().length === 0) {
        this.stats.totalFailures += 1;
        return { success: false, message: 'No text content available for summarization' };
      }

      // Clean and normalize text
      const cleaned = this._cleanText(text);
      const sentences = this._splitSentences(cleaned);

      if (sentences.length === 0) {
        this.stats.totalFailures += 1;
        return { success: false, message: 'No sentences found in document' };
      }

      const maxSentences = Math.min(options.maxSentences || this.maxSummarySentences, 15);
      const maxKeyPoints = Math.min(options.maxKeyPoints || this.maxKeyPoints, 10);

      // Try AI-powered summarization if requested
      const useAI = options.useAI !== false;
      if (useAI && openaiService.getOpenAI && openaiService.getOpenAI()) {
        const aiResult = await this._summarizeWithAI(cleaned, maxSentences, maxKeyPoints);
        if (aiResult.success) {
          this.stats.totalSummarized += 1;
          this.stats.aiSummaries += 1;
          return aiResult;
        }
      }

      // Fallback to extractive summarization
      const extractResult = await this._summarizeExtractive(cleaned, sentences, maxSentences, maxKeyPoints);
      this.stats.totalSummarized += 1;
      this.stats.extractiveSummaries += 1;
      return extractResult;
    } catch (error) {
      this.stats.totalFailures += 1;
      console.error('Summarization Service - error:', error.message);
      return { success: false, message: error.message };
    }
  }

  /**
   * Summarize using the AI provider (OpenAI chat completions)
   * @param {string} text - Cleaned document text
   * @param {number} maxSentences - Max summary sentences
   * @param {number} maxKeyPoints - Max key points
   * @returns {Promise<Object>} - { success, summary }
   */
  async _summarizeWithAI(text, maxSentences, maxKeyPoints) {
    try {
      // Truncate to fit token limits
      const truncated = text.substring(0, 6000);

      const messages = [
        {
          role: 'system',
          content: 'You are a document summarization AI. Return a JSON object with: "summary" (a concise paragraph of ' +
            `${maxSentences} sentences), "keyPoints" (an array of ${maxKeyPoints} key points), ` +
            '"keywords" (an array of up to 15 important keywords), "sentiment" (positive/negative/neutral), ' +
            '"sentimentScore" (0-1), and "length" (number of characters).',
        },
        { role: 'user', content: truncated },
      ];

      const result = await openaiService.chatCompletion(messages, {
        temperature: 0.3,
        maxTokens: 1000,
      });

      if (!result.success) {
        return { success: false };
      }

      let parsed;
      try {
        parsed = JSON.parse(result.message.replace(/```json|```/g, '').trim());
      } catch (parseError) {
        // Fallback: extract summary from the raw response
        parsed = {
          summary: result.message.trim(),
          keyPoints: [],
          keywords: [],
          sentiment: 'neutral',
          sentimentScore: 0.5,
        };
      }

      // Compute keywords if not provided
      const keywords = parsed.keywords && parsed.keywords.length > 0
        ? parsed.keywords.slice(0, this.maxKeywords)
        : this._extractKeywords(text, this.maxKeywords);

      const sentimentScore = parsed.sentimentScore !== undefined
        ? Math.max(0, Math.min(1, parseFloat(parsed.sentimentScore)))
        : 0.5;

      return {
        success: true,
        summary: {
          text: parsed.summary || '',
          keyPoints: Array.isArray(parsed.keyPoints) ? parsed.keyPoints.slice(0, maxKeyPoints) : [],
          keywords,
          sentiment: parsed.sentiment || 'neutral',
          sentimentScore,
          length: (parsed.summary || '').length,
          method: 'ai',
        },
      };
    } catch (error) {
      console.warn('AI summarization failed, falling back to extractive:', error.message);
      return { success: false };
    }
  }

  /**
   * Extractive summarization using sentence ranking.
   * @param {string} text - Cleaned document text
   * @param {Array<string>} sentences - Split sentences
   * @param {number} maxSentences - Max summary sentences
   * @param {number} maxKeyPoints - Max key points
   * @returns {Object} - { success, summary }
   */
  async _summarizeExtractive(text, sentences, maxSentences, maxKeyPoints) {
    // Build sentence scoring using TF-IDF-like weighting
    const sentenceScores = this._scoreSentences(text, sentences);
    const rankedSentences = sentenceScores
      .sort((a, b) => b.score - a.score)
      .slice(0, maxSentences);

    // Keep original document order for the summary
    const selectedIndexes = new Set(rankedSentences.map((s) => s.index));
    const summaryText = sentences
      .filter((_, i) => selectedIndexes.has(i))
      .join(' ')
      .trim();

    // Key points are the top-ranked sentences
    const keyPoints = rankedSentences
      .sort((a, b) => a.index - b.index)
      .slice(0, maxKeyPoints)
      .map((s) => s.text);

    // Extract keywords
    const keywords = this._extractKeywords(text, this.maxKeywords);

    // Sentiment analysis using existing OpenAI service
    let sentiment = 'neutral';
    let sentimentScore = 0.5;
    try {
      const sentimentResult = await openaiService.analyzeSentiment(summaryText.substring(0, 1000) || text.substring(0, 1000));
      sentiment = sentimentResult.sentiment || 'neutral';
      sentimentScore = sentimentResult.score !== undefined ? parseFloat(sentimentResult.score) : 0.5;
    } catch {
      // Fallback deterministic sentiment from keyword lists
      sentiment = this._deterministicSentiment(summaryText);
      sentimentScore = sentiment === 'positive' ? 0.7 : sentiment === 'negative' ? 0.3 : 0.5;
    }

    const maxTextLength = Math.max(200, Math.floor(Math.min(text.length * 0.3, 5000)));

    return {
      success: true,
      summary: {
        text: summaryText.substring(0, maxTextLength) + (summaryText.length > maxTextLength ? '...' : ''),
        keyPoints,
        keywords,
        sentiment,
        sentimentScore,
        length: summaryText.length,
        method: 'extractive',
      },
    };
  }

  /**
   * Score sentences based on term frequency and position
   * @param {string} text - Document text
   * @param {Array<string>} sentences - Sentences
   * @returns {Array<Object>} - Array of { index, text, score }
   */
  _scoreSentences(text, sentences) {
    // Build word frequency map
    const wordFreq = {};
    const stopWords = new Set([
      'the', 'a', 'an', 'and', 'or', 'but', 'if', 'then', 'else', 'for',
      'this', 'that', 'with', 'from', 'have', 'has', 'had', 'was', 'were',
      'is', 'are', 'be', 'been', 'being', 'of', 'in', 'on', 'at', 'to',
      'by', 'as', 'it', 'its', 'not', 'no', 'so', 'than', 'too', 'very',
      'just', 'can', 'could', 'would', 'should', 'will', 'shall', 'may',
      'might', 'must', 'about', 'into', 'over', 'after', 'before', 'do',
      'does', 'did', 'done', 'what', 'which', 'who', 'whom', 'whose',
      'when', 'where', 'why', 'how', 'all', 'any', 'both', 'each', 'few',
      'more', 'most', 'other', 'some', 'such', 'only', 'own', 'same',
    ]);

    const words = text.toLowerCase().match(/[a-z][a-z'-]{2,}/g) || [];
    for (const word of words) {
      if (stopWords.has(word)) continue;
      wordFreq[word] = (wordFreq[word] || 0) + 1;
    }

    // Second pass: compute sentence scores
    const numSentences = sentences.length;
    const scores = sentences.map((sentence, index) => {
      const sentenceWords = sentence.toLowerCase().match(/[a-z][a-z'-]{2,}/g) || [];
      let score = 0;

      // Term frequency weighting
      for (const word of sentenceWords) {
        if (stopWords.has(word)) continue;
        // Normalize frequency by document size
        score += Math.log1p(wordFreq[word] || 0);
      }

      // Position weighting: sentences near the beginning are more important
      const positionBoost = 1 + (1 - index / numSentences) * 0.5;

      // Length normalization: prefer medium-length sentences
      const lengthFactor = sentenceWords.length >= 8 && sentenceWords.length <= 40 ? 1.2 : 0.8;

      // Capitalized words signal importance (names, acronyms)
      const capitalized = (sentence.match(/\b[A-Z][a-z]{2,}\b/g) || []).length;
      score += capitalized * 0.3;

      score *= positionBoost * lengthFactor;

      return { index, text: sentence.trim(), score };
    });

    return scores;
  }

  /**
   * Extract keywords using term frequency with stop word removal
   * @param {string} text - Document text
   * @param {number} limit - Max keywords
   * @returns {Array<string>} - Top keywords
   */
  _extractKeywords(text, limit = 15) {
    const stopWords = new Set([
      'the', 'a', 'an', 'and', 'or', 'but', 'if', 'then', 'else', 'for',
      'this', 'that', 'with', 'from', 'have', 'has', 'had', 'was', 'were',
      'is', 'are', 'be', 'been', 'being', 'of', 'in', 'on', 'at', 'to',
      'by', 'as', 'it', 'its', 'not', 'no', 'so', 'than', 'too', 'very',
      'just', 'can', 'could', 'would', 'should', 'will', 'shall', 'may',
      'might', 'must', 'about', 'into', 'over', 'after', 'before', 'do',
      'does', 'did', 'done', 'what', 'which', 'who', 'whom', 'whose',
      'when', 'where', 'why', 'how', 'all', 'any', 'both', 'each', 'few',
      'more', 'most', 'other', 'some', 'such', 'only', 'own', 'same',
      'also', 'just', 'like', 'us', 'one', 'two', 'three', 'use', 'using',
      'used', 'may', 'would', 'could', 'should', 'will', 'shall', 'shall',
    ]);

    const wordFreq = {};
    const words = text.toLowerCase().match(/[a-z][a-z'-]{3,}/g) || [];

    for (const word of words) {
      if (stopWords.has(word)) continue;
      wordFreq[word] = (wordFreq[word] || 0) + 1;
    }

    return Object.entries(wordFreq)
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit)
      .map(([word]) => word);
  }

  /**
   * Deterministic sentiment analysis from keyword lists
   * @param {string} text - Text to analyze
   * @returns {string} - positive, negative, or neutral
   */
  _deterministicSentiment(text) {
    const positive = ['good', 'great', 'excellent', 'success', 'successful', 'growth',
      'improved', 'increase', 'profit', 'benefit', 'best', 'positive', 'strong'];
    const negative = ['bad', 'poor', 'failure', 'loss', 'decrease', 'decline',
      'risk', 'problem', 'issue', 'negative', 'weak', 'error', 'fail'];

    const lower = text.toLowerCase();
    let pos = 0, neg = 0;

    for (const word of positive) {
      if (lower.includes(word)) pos++;
    }
    for (const word of negative) {
      if (lower.includes(word)) neg++;
    }

    if (pos === neg) return 'neutral';
    return pos > neg ? 'positive' : 'negative';
  }

  /**
   * Clean text: normalize whitespace while preserving paragraph structure
   * @param {string} text - Raw text
   * @returns {string} - Cleaned text
   */
  _cleanText(text) {
    return text
      .replace(/\r\n/g, '\n')
      .replace(/[ \t]+/g, ' ')
      .replace(/\n{3,}/g, '\n\n')
      .replace(/[ \t]+$/gm, '')
      .replace(/\n+$/, '')
      .trim();
  }

  /**
   * Split text into sentences
   * @param {string} text - Cleaned text
   * @returns {Array<string>} - Sentences array
   */
  _splitSentences(text) {
    const sentenceEndings = /(?<=[.!?])\s+(?=[A-Z0-9"'])|(?<=\n)\s*(?=\S)/g;
    const parts = text.split(sentenceEndings);
    return parts.map((p) => p.trim()).filter(Boolean);
  }

  /**
   * Get summarization service statistics
   */
  getStats() {
    return { ...this.stats };
  }
}

// Export singleton
const summarizationService = new SummarizationService();

module.exports = summarizationService;
module.exports.SummarizationService = SummarizationService;