/**
 * Personalization Engine
 * Learns user preferences, computes category affinity, and builds personalized profiles.
 * Uses conversation history, skills, certificates, and previous recommendations.
 * Follows SOLID principles — this module is solely responsible for personalization.
 */
const User = require('../../../../models/User');
const Skill = require('../../../../models/Skill');
const Certificate = require('../../../../models/Certificate');
const Recommendation = require('../../../../models/Recommendation');
const RecommendationFeedback = require('../../../../models/RecommendationFeedback');
const memoryManager = require('../../orchestrator/memoryManager');
const { clamp } = require('./recommendationUtils');

class PersonalizationEngine {
  constructor() {
    this.stats = {
      totalProfilesBuilt: 0,
      totalAffinityComputations: 0,
    };
  }

  /**
   * Build a comprehensive user profile for personalization.
   * Combines user data, skills, certificates, conversation history, and feedback.
   * @param {string} userId - User ID
   * @returns {Promise<Object>} - { success, profile }
   */
  async buildUserProfile(userId) {
    this.stats.totalProfilesBuilt += 1;

    try {
      const [user, skills, certificates, history, feedback] = await Promise.all([
        User.findById(userId).select('name email role department'),
        Skill.find({ user: userId }).select('name category proficiencyLevel tags'),
        Certificate.find({ user: userId, status: 'active' }).select('title category skills'),
        memoryManager.getConversationHistory(userId, { limit: 50 }),
        RecommendationFeedback.find({ user: userId }).select('type recommendation'),
      ]);

      if (!user) {
        return { success: false, message: 'User not found' };
      }

      // Extract skill names and categories
      const skillNames = skills.map((s) => s.name);
      const skillCategories = [...new Set(skills.map((s) => s.category).filter(Boolean))];
      const skillTags = [...new Set(skills.flatMap((s) => s.tags || []))];

      // Extract certificate data
      const certificateTitles = certificates.map((c) => c.title);
      const certificateCategories = [...new Set(certificates.map((c) => c.category).filter(Boolean))];
      const certificateSkills = [...new Set(certificates.flatMap((c) => c.skills || []))];

      // Extract conversation topics (keywords from history)
      const conversationTopics = this._extractTopics(history);

      // Extract feedback preferences
      const feedbackPreferences = this._extractFeedbackPreferences(feedback);

      const profile = {
        userId: user._id.toString(),
        name: user.name,
        email: user.email,
        role: user.role,
        department: user.department || '',
        skills: skillNames,
        skillCategories,
        skillTags,
        certificates: certificateTitles,
        certificateCategories,
        certificateSkills,
        conversationTopics,
        interests: [...new Set([...skillCategories, ...certificateCategories, ...conversationTopics])],
        categories: [...new Set([...skillCategories, ...certificateCategories])],
        feedbackPreferences,
        hasProfile: true,
      };

      return { success: true, profile };
    } catch (error) {
      console.error('Personalization Engine - build profile error:', error.message);
      return { success: false, message: error.message };
    }
  }

  /**
   * Compute category affinity scores for a user.
   * Higher scores indicate stronger preference for a category.
   * @param {string} userId - User ID
   * @returns {Promise<Object>} - { success, affinity }
   */
  async computeCategoryAffinity(userId) {
    this.stats.totalAffinityComputations += 1;

    try {
      const [skills, certificates, recommendations, feedback] = await Promise.all([
        Skill.find({ user: userId }).select('category proficiencyLevel'),
        Certificate.find({ user: userId, status: 'active' }).select('category'),
        Recommendation.find({ user: userId }).select('category status'),
        RecommendationFeedback.find({ user: userId }).select('type recommendation'),
      ]);

      const affinity = {};

      // Skill-based affinity (weight: 0.4)
      const skillWeight = 0.4;
      for (const skill of skills) {
        if (!skill.category) continue;
        const levelBoost = skill.proficiencyLevel === 'expert' ? 1.0
          : skill.proficiencyLevel === 'advanced' ? 0.8
          : skill.proficiencyLevel === 'intermediate' ? 0.6
          : 0.4;
        affinity[skill.category] = (affinity[skill.category] || 0) + (skillWeight * levelBoost);
      }

      // Certificate-based affinity (weight: 0.3)
      const certWeight = 0.3;
      for (const cert of certificates) {
        if (!cert.category) continue;
        affinity[cert.category] = (affinity[cert.category] || 0) + certWeight;
      }

      // Recommendation interaction affinity (weight: 0.3)
      const recWeight = 0.3;
      const feedbackMap = new Map();
      for (const fb of feedback) {
        feedbackMap.set(fb.recommendation.toString(), fb.type);
      }

      for (const rec of recommendations) {
        if (!rec.category) continue;
        const fbType = feedbackMap.get(rec._id.toString());
        let boost = recWeight * 0.5; // Base for delivered
        if (fbType === 'like' || fbType === 'saved' || fbType === 'clicked') {
          boost = recWeight * 1.0;
        } else if (fbType === 'dislike' || fbType === 'ignore') {
          boost = recWeight * 0.1;
        }
        affinity[rec.category] = (affinity[rec.category] || 0) + boost;
      }

      // Normalize affinity scores to [0, 1]
      const maxAffinity = Math.max(...Object.values(affinity), 0.01);
      const normalized = {};
      for (const [category, score] of Object.entries(affinity)) {
        normalized[category] = clamp(score / maxAffinity, 0, 1);
      }

      return { success: true, affinity: normalized };
    } catch (error) {
      console.error('Personalization Engine - affinity error:', error.message);
      return { success: false, message: error.message };
    }
  }

  /**
   * Get session-aware context for recommendations.
   * Uses recent conversation history to boost relevant categories.
   * @param {string} userId - User ID
   * @param {string} sessionId - Session ID
   * @returns {Promise<Object>} - { success, sessionContext }
   */
  async getSessionContext(userId, sessionId = 'default') {
    try {
      const history = await memoryManager.getContextWindow(userId, sessionId);

      const topics = this._extractTopics(history);
      const recentMessages = history.slice(-5).map((m) => ({
        role: m.role,
        content: m.content.substring(0, 200),
        timestamp: m.timestamp,
      }));

      return {
        success: true,
        sessionContext: {
          sessionId,
          topics,
          recentMessages,
          messageCount: history.length,
          lastActivity: history.length > 0 ? history[history.length - 1].timestamp : null,
        },
      };
    } catch (error) {
      console.error('Personalization Engine - session context error:', error.message);
      return { success: false, message: error.message };
    }
  }

  /**
   * Get history-aware context for recommendations.
   * Analyzes past recommendations and their outcomes.
   * @param {string} userId - User ID
   * @returns {Promise<Object>} - { success, historyContext }
   */
  async getHistoryContext(userId) {
    try {
      const [recommendations, feedback] = await Promise.all([
        Recommendation.find({ user: userId })
          .sort({ createdAt: -1 })
          .limit(50)
          .select('type category title status score createdAt'),
        RecommendationFeedback.find({ user: userId })
          .sort({ createdAt: -1 })
          .limit(50)
          .select('type recommendation createdAt'),
      ]);

      const feedbackMap = new Map();
      for (const fb of feedback) {
        feedbackMap.set(fb.recommendation.toString(), fb.type);
      }

      const history = recommendations.map((rec) => ({
        id: rec._id,
        type: rec.type,
        category: rec.category,
        title: rec.title,
        status: rec.status,
        score: rec.score,
        feedback: feedbackMap.get(rec._id.toString()) || null,
        createdAt: rec.createdAt,
      }));

      // Compute engagement stats
      const total = history.length;
      const liked = history.filter((h) => h.feedback === 'like').length;
      const clicked = history.filter((h) => h.feedback === 'clicked').length;
      const saved = history.filter((h) => h.feedback === 'saved').length;
      const disliked = history.filter((h) => h.feedback === 'dislike').length;

      return {
        success: true,
        historyContext: {
          total,
          engagement: {
            liked,
            clicked,
            saved,
            disliked,
            engagementRate: total > 0 ? (liked + clicked + saved) / total : 0,
          },
          recent: history.slice(0, 10),
        },
      };
    } catch (error) {
      console.error('Personalization Engine - history context error:', error.message);
      return { success: false, message: error.message };
    }
  }

  /**
   * Extract topics from conversation history using keyword frequency.
   * @param {Array<Object>} history - Conversation messages
   * @returns {Array<string>} - Top topics
   * @private
   */
  _extractTopics(history = []) {
    const stopWords = new Set([
      'the', 'a', 'an', 'and', 'or', 'but', 'if', 'then', 'else', 'for', 'to',
      'of', 'in', 'on', 'at', 'by', 'with', 'from', 'as', 'is', 'are', 'was',
      'were', 'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did',
      'will', 'would', 'can', 'could', 'should', 'may', 'might', 'must', 'shall',
      'this', 'that', 'these', 'those', 'i', 'you', 'he', 'she', 'it', 'we', 'they',
      'my', 'your', 'his', 'her', 'its', 'our', 'their', 'me', 'him', 'us', 'them',
      'what', 'which', 'who', 'whom', 'how', 'why', 'when', 'where', 'not', 'no',
      'yes', 'please', 'help', 'want', 'need', 'like', 'get', 'make', 'use', 'know',
    ]);

    const frequency = new Map();

    for (const msg of history) {
      if (!msg.content) continue;
      const words = msg.content
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, ' ')
        .split(/\s+/)
        .filter((w) => w.length > 3 && !stopWords.has(w));

      for (const word of words) {
        frequency.set(word, (frequency.get(word) || 0) + 1);
      }
    }

    return [...frequency.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([word]) => word);
  }

  /**
   * Extract feedback preferences from feedback records.
   * @param {Array<Object>} feedback - Feedback records
   * @returns {Object} - Preference summary
   * @private
   */
  _extractFeedbackPreferences(feedback = []) {
    const prefs = {
      likes: 0,
      dislikes: 0,
      ignores: 0,
      saves: 0,
      clicks: 0,
      positiveRate: 0,
    };

    for (const fb of feedback) {
      if (prefs[`${fb.type}s`] !== undefined) {
        prefs[`${fb.type}s`] += 1;
      }
    }

    const total = feedback.length;
    if (total > 0) {
      prefs.positiveRate = (prefs.likes + prefs.saves + prefs.clicks) / total;
    }

    return prefs;
  }

  /**
   * Get personalization engine statistics
   */
  getStats() {
    return { ...this.stats };
  }
}

// Export singleton
const personalizationEngine = new PersonalizationEngine();

module.exports = personalizationEngine;
module.exports.PersonalizationEngine = PersonalizationEngine;