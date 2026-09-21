/**
 * Classification Service (Phase 3C — Document Intelligence)
 * Classifies documents into types (resume, invoice, form, contract, etc.)
 * using pattern-based keyword scoring with confidence estimation.
 * Follows SOLID principles — this module is solely responsible for document classification.
 */
class ClassificationService {
  constructor() {
    this.stats = {
      totalClassified: 0,
      totalFailures: 0,
    };

    // Classification patterns keyed by document type
    this.classificationPatterns = {
      resume: {
        keywords: [
          'resume', 'curriculum vitae', 'cv', 'work experience', 'education',
          'skills', 'objective', 'summary of qualifications', 'professional experience',
          'references', 'contact information', 'employment history', 'certifications',
        ],
        patterns: [
          /objective/i, /summary of qualifications/i, /professional (summary|experience)/i,
          /work history/i, /employment history/i, /technical skills/i,
        ],
        weight: 1.0,
      },
      invoice: {
        keywords: [
          'invoice', 'bill', 'payment due', 'total due', 'amount payable',
          'invoice number', 'due date', 'subtotal', 'tax', 'vendor',
          'customer', 'billing address', 'terms of payment',
        ],
        patterns: [
          /invoice[#\s:]?/i, /amount due/i, /total due/i, /payment (terms|method)/i,
          /subtotal/i, /tax\s*(?:\(|:)/i, /balance due/i,
        ],
        weight: 1.0,
      },
      form: {
        keywords: [
          'form', 'application', 'registration', 'questionnaire', 'survey',
          'please fill', 'instructions', 'section', 'signature', 'date of birth',
          'last name', 'first name',
        ],
        patterns: [
          /please (fill|complete|provide)/i, /form\s+(no|number)?\s*[:#]?/i,
          /field[#\s]?\d/i, /section\s+[a-z\d]/i, /signature[:\s]/i,
        ],
        weight: 0.8,
      },
      contract: {
        keywords: [
          'agreement', 'contract', 'terms and conditions', 'parties', 'hereby',
          'witnesseth', 'whereas', 'obligations', 'breach', 'termination',
          'indemnification', 'liability', 'governing law', 'effective date',
        ],
        patterns: [
          /this\s+(agreement|contract|understanding)/i, /terms?\s+and\s+conditions/i,
          /party\s+(1|2|one|two)/i, /indemnif/i, /governing\s+law/i,
          /hereby\s+agree/i, /in\s+witness/i,
        ],
        weight: 1.0,
      },
      report: {
        keywords: [
          'report', 'summary', 'findings', 'analysis', 'conclusion',
          'recommendations', 'executive summary', 'introduction',
          'methodology', 'results', 'appendix',
        ],
        patterns: [
          /executive\s+summary/i, /table\s+of\s+contents/i, /methodology/i,
          /findings/i, /conclusion/i, /recommendations/i,
        ],
        weight: 0.7,
      },
      email: {
        keywords: [
          'subject', 'dear', 'sincerely', 'regards', 'attachment', 're:',
          'fw:', 'from:', 'to:', 'cc:', 'bcc:',
        ],
        patterns: [
          /^(subject|from|to|cc|bcc):/m, /dear\s+(mr|mrs|ms|dr|prof)\.?/i,
          /(best|kind|warm)\s+regards/i, /sincerely/i,
        ],
        weight: 0.6,
      },
      letter: {
        keywords: [
          'dear', 'sincerely', 'yours truly', 'letter', 'regards',
          'address', 'date', 're:',
        ],
        patterns: [
          /dear\s+(mr|mrs|ms|dr|prof)\.?/i, /yours\s+(sincerely|truly|faithfully)/i,
          /(best|kind|warm)\s+regards/i, /sincerely/i,
        ],
        weight: 0.5,
      },
      presentation: {
        keywords: [
          'slide', 'agenda', 'presentation', 'overview', 'key points',
          'bullets', 'topics', 'outline', 'thank you',
        ],
        patterns: [
          /slide\s+\d+/i, /agenda/i, /key\s+(points|takeaways)/i,
          /thank\s+you/i, /q\s*&\s*a/i,
        ],
        weight: 0.5,
      },
      spreadsheet: {
        keywords: [
          'data', 'row', 'column', 'table', 'total', 'sum', 'average',
          'sheet', 'worksheet', 'header', 'formula',
        ],
        patterns: [
          /(column|row)\s+[a-z\d]/i, /sheet\s+\d+/i, /data\s+(table|set)/i,
          /sum\s*\(/i, /average\s*\(/i,
        ],
        weight: 0.5,
      },
      legal: {
        keywords: [
          'legal', 'lawsuit', 'court', 'plaintiff', 'defendant', 'complaint',
          'motion', 'judgment', 'statute', 'regulation', 'compliance',
          'attorney', 'counsel', 'filing',
        ],
        patterns: [
          /(plaintiff|defendant)/i, /case\s+no/i, /court\s+of/i,
          /legal\s+(notice|document|memo)/i, /statute\s+of/i,
        ],
        weight: 1.0,
      },
      technical: {
        keywords: [
          'specification', 'technical', 'architecture', 'system', 'server',
          'database', 'api', 'endpoint', 'deployment', 'configuration',
          'installation', 'requirements', 'integration', 'workflow',
        ],
        patterns: [
          /technical\s+(specification|document|manual)/i, /system\s+requirements/i,
          /installation\s+guide/i, /api\s+(reference|documentation)/i,
          /architecture\s+overview/i, /deployment\s+(guide|instructions)/i,
        ],
        weight: 0.8,
      },
      financial: {
        keywords: [
          'financial', 'revenue', 'expense', 'profit', 'loss', 'balance sheet',
          'income statement', 'cash flow', 'budget', 'forecast', 'equity',
          'assets', 'liabilities', 'earnings',
        ],
        patterns: [
          /balance\s+sheet/i, /income\s+statement/i, /cash\s+flow/i,
          /profit\s+(and|&)\s+loss/i, /financial\s+(statement|report)/i,
        ],
        weight: 1.0,
      },
      marketing: {
        keywords: [
          'marketing', 'campaign', 'advertisement', 'brand', 'audience',
          'engagement', 'conversion', 'promotion', 'strategy',
          'social media', 'content',
        ],
        patterns: [
          /marketing\s+(campaign|strategy|plan)/i, /target\s+audience/i,
          /brand\s+(awareness|identity)/i, /conversion\s+rate/i,
        ],
        weight: 0.7,
      },
      medical: {
        keywords: [
          'patient', 'diagnosis', 'treatment', 'prescription', 'medical',
          'doctor', 'clinical', 'symptoms', 'medication', 'dosage',
          'hospital', 'health',
        ],
        patterns: [
          /patient\s+(name|id|information)/i, /diagnosis/i, /prescription/i,
          /medical\s+(record|report|history)/i, /dosage/i,
        ],
        weight: 1.0,
      },
      academic: {
        keywords: [
          'abstract', 'introduction', 'methodology', 'results', 'discussion',
          'conclusion', 'references', 'citation', 'thesis', 'hypothesis',
          'study', 'research', 'bibliography', 'peer',
        ],
        patterns: [
          /abstract/i, /literature\s+review/i, /methodology/i,
          /references?\s*$/mi, /bibliography/i, /peer\s+review/i,
        ],
        weight: 0.8,
      },
    };
  }

  /**
   * Classify a document based on its text content.
   * @param {string} text - Document text
   * @param {Object} options - { fileName, id }
   * @returns {Promise<Object>} - { success, classification }
   */
  async classify(text, options = {}) {
    try {
      if (!text || text.trim().length === 0) {
        this.stats.totalFailures += 1;
        return {
          success: false,
          message: 'No text content available for classification',
        };
      }

      const normalizedText = text.toLowerCase();
      const length = normalizedText.length;
      const scores = {};
      const fileName = (options.fileName || '').toLowerCase();

      // Score each document type
      for (const [type, config] of Object.entries(this.classificationPatterns)) {
        let score = 0;
        let matchedKeywords = [];
        let matchedPatterns = [];

        // Keyword matching with TF boost
        for (const keyword of config.keywords) {
          const regex = new RegExp(keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
          const matches = normalizedText.match(regex);
          if (matches && matches.length > 0) {
            score += matches.length * config.weight;
            matchedKeywords.push(keyword);
          }
        }

        // Pattern matching (stronger signals)
        for (const pattern of config.patterns) {
          if (pattern.test(text)) {
            score += 3 * config.weight;
            matchedPatterns.push(pattern.source);
          }
        }

        // File name boost (strong signal)
        for (const keyword of config.keywords) {
          if (fileName.includes(keyword)) {
            score += 5 * config.weight;
            matchedKeywords.push(`filename:${keyword}`);
            break;
          }
        }

        scores[type] = score;
      }

      // Sort by score descending
      const sorted = Object.entries(scores).sort((a, b) => b[1] - a[1]);

      // Check if the top score is meaningful
      const topType = sorted[0];
      const secondType = sorted[1] || ['general', 0];
      const totalScore = sorted.reduce((sum, [, s]) => sum + s, 0) || 1;

      if (topType[1] === 0) {
        // No signals detected — fall back to general
        this.stats.totalClassified += 1;
        return {
          success: true,
          classification: {
            type: 'general',
            confidence: 0.2,
            category: 'general',
            subcategory: '',
            labels: [],
            method: 'pattern-based',
          },
        };
      }

      // Calculate confidence: top score relative to total, with margin over second
      const rawConfidence = topType[1] / totalScore;
      const margin = (topType[1] - secondType[1]) / Math.max(topType[1], 1);
      const confidence = Math.min(0.95, rawConfidence * 0.6 + margin * 0.4 + 0.15);

      // Determine category/subcategory
      const categories = {
        resume: 'hr', invoice: 'finance', form: 'admin', contract: 'legal',
        report: 'business', email: 'communication', letter: 'communication',
        presentation: 'business', spreadsheet: 'finance', legal: 'legal',
        technical: 'engineering', financial: 'finance', marketing: 'marketing',
        medical: 'healthcare', academic: 'education', general: 'general',
      };

      // Extract labels from matched keywords
      const labels = this._extractLabels(sorted.slice(0, 3));

      this.stats.totalClassified += 1;

      return {
        success: true,
        classification: {
          type: topType[0],
          confidence: Math.round(confidence * 100) / 100,
          category: categories[topType[0]] || 'general',
          subcategory: secondType[1] > 0 ? secondType[0] : '',
          labels,
          method: 'pattern-based',
        },
        scores: Object.fromEntries(sorted.slice(0, 5)),
      };
    } catch (error) {
      this.stats.totalFailures += 1;
      console.error('Classification Service - error:', error.message);
      return { success: false, message: error.message };
    }
  }

  /**
   * Extract descriptive labels from top classification scores
   * @param {Array<Array>} topTypes - Sorted type/score pairs
   * @returns {Array<string>} - Label array
   * @private
   */
  _extractLabels(topTypes) {
    const typeLabels = {
      resume: ['resume', 'job-application', 'candidate-profile'],
      invoice: ['invoice', 'billing', 'payment'],
      form: ['form', 'application', 'questionnaire'],
      contract: ['contract', 'agreement', 'legal-binding'],
      report: ['report', 'analysis', 'business-document'],
      email: ['email', 'correspondence'],
      letter: ['letter', 'correspondence'],
      presentation: ['presentation', 'slides'],
      spreadsheet: ['spreadsheet', 'tabular-data'],
      legal: ['legal', 'law'],
      technical: ['technical', 'engineering', 'documentation'],
      financial: ['financial', 'accounting'],
      marketing: ['marketing', 'advertising'],
      medical: ['medical', 'healthcare'],
      academic: ['academic', 'research', 'education'],
      general: ['general'],
    };

    return topTypes.flatMap(([type]) => typeLabels[type] || []);
  }

  /**
   * Get classification service statistics
   */
  getStats() {
    return { ...this.stats };
  }
}

// Export singleton
const classificationService = new ClassificationService();

module.exports = classificationService;
module.exports.ClassificationService = ClassificationService;