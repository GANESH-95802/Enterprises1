/**
 * Document Comparison Service (Phase 3C — Document Intelligence)
 * Compares two or more documents for similarity, common sections, and differences.
 * Uses the existing Embedding Client and AiEmbedding model for semantic comparison.
 * Follows SOLID principles — this module is solely responsible for document comparison.
 */
const embeddingClient = require('../../clients/embeddingClient');
const DocumentAnalysis = require('../../../../models/DocumentAnalysis');

class DocumentComparisonService {
  constructor() {
    this.stats = {
      totalComparisons: 0,
      totalFailures: 0,
    };
  }

  /**
   * Compare two documents by their analysis records.
   * @param {string} userId - User ID
   * @param {string} sourceId - First DocumentAnalysis ID
   * @param {string} targetId - Second DocumentAnalysis ID
   * @returns {Promise<Object>} - { success, data }
   */
  async compare(userId, sourceId, targetId) {
    try {
      const [source, target] = await Promise.all([
        DocumentAnalysis.findOne({ _id: sourceId, user: userId }),
        DocumentAnalysis.findOne({ _id: targetId, user: userId }),
      ]);

      if (!source) return { success: false, message: 'Source document not found' };
      if (!target) return { success: false, message: 'Target document not found' };

      // Compare summaries (extractive text if available, otherwise summary text)
      const sourceText = this._getComparableText(source);
      const targetText = this._getComparableText(target);

      // Compute similarity using the Embedding Client
      const semanticResult = await this._computeSemanticSimilarity(sourceText, targetText);

      // Compute keyword and section overlap
      const commonSections = this._findCommonSections(source, target);
      const differences = this._findDifferences(source, target);

      // Compute overall similarity score
      const similarity = Math.round(semanticResult.similarity * 100) / 100;

      // Update comparison metadata on both documents
      await this._updateComparisonMetadata(userId, source, target, {
        sourceId: target._id,
        fileName: target.fileName,
        similarity,
        commonSections,
        differences,
      });

      this.stats.totalComparisons += 1;

      return {
        success: true,
        data: {
          source: {
            analysisId: source._id,
            fileName: source.fileName,
            fileType: source.fileType,
            classification: source.classification,
          },
          target: {
            analysisId: target._id,
            fileName: target.fileName,
            fileType: target.fileType,
            classification: target.classification,
          },
          similarity,
          semanticSimilarity: semanticResult.semanticSimilarity,
          keywordSimilarity: semanticResult.keywordSimilarity,
          commonSections,
          differences,
          method: 'hybrid',
          comparedAt: new Date().toISOString(),
        },
      };
    } catch (error) {
      this.stats.totalFailures += 1;
      console.error('Document Comparison - error:', error.message);
      return { success: false, message: error.message };
    }
  }

  /**
   * Find similar documents to a given analysis record.
   * @param {string} userId - User ID
   * @param {string} analysisId - DocumentAnalysis ID
   * @param {Object} options - { limit, minScore }
   * @returns {Promise<Object>} - { success, data }
   */
  async findSimilar(userId, analysisId, options = {}) {
    try {
      const source = await DocumentAnalysis.findOne({ _id: analysisId, user: userId });
      if (!source) return { success: false, message: 'Document not found' };

      const sourceText = this._getComparableText(source);
      const limit = Math.min(options.limit || 10, 20);
      const minScore = options.minScore || 0.2;

      // Find other analyzed documents for the user
      const candidates = await DocumentAnalysis.find({
        user: userId,
        status: 'analyzed',
        _id: { $ne: analysisId },
      })
        .select('fileName fileType classification summary extraction checksum analysis')
        .limit(50)
        .lean();

      const results = [];
      for (const candidate of candidates) {
        // Skip identical checksum (same document)
        if (source.checksum && candidate.checksum && source.checksum === candidate.checksum) {
          continue;
        }

        const candidateText = this._getComparableText(candidate);
        const similarityResult = await this._computeSemanticSimilarity(sourceText, candidateText);

        if (similarityResult.similarity >= minScore) {
          results.push({
            documentId: candidate._id,
            fileName: candidate.fileName,
            fileType: candidate.fileType,
            classification: candidate.classification,
            similarity: Math.round(similarityResult.similarity * 100) / 100,
            commonSections: this._findCommonSectionsData(source, candidate),
          });
        }
      }

      // Sort by similarity descending
      results.sort((a, b) => b.similarity - a.similarity);

      // Update the comparison metadata on the source document
      const topResults = results.slice(0, limit);
      source.comparison = {
        similarDocuments: topResults.map((r) => ({
          documentId: r.documentId,
          fileName: r.fileName,
          similarity: r.similarity,
          commonSections: r.commonSections,
          differences: [],
        })),
        comparedAt: new Date(),
      };
      await source.save().catch(() => {});

      this.stats.totalComparisons += 1;

      return {
        success: true,
        data: {
          documentId: source._id,
          fileName: source.fileName,
          similarDocuments: topResults,
          totalSimilar: topResults.length,
          totalScanned: candidates.length,
          timestamp: new Date().toISOString(),
        },
      };
    } catch (error) {
      this.stats.totalFailures += 1;
      console.error('Document Comparison - findSimilar error:', error.message);
      return { success: false, message: error.message };
    }
  }

  /**
   * Get comparable text from an analysis record.
   * @param {Object} record - DocumentAnalysis document
   * @returns {string} - Text for comparison
   */
  _getComparableText(record) {
    // Prefer summary text + keywords + section headings
    const parts = [];

    if (record.summary?.text) parts.push(record.summary.text);
    if (record.summary?.keyPoints) parts.push(...record.summary.keyPoints);
    if (record.summary?.keywords) parts.push(...record.summary.keywords);

    if (record.extraction?.entities?.names) parts.push(...record.extraction.entities.names);
    if (record.extraction?.entities?.organizations) parts.push(...record.extraction.entities.organizations);
    if (record.extraction?.entities?.email) parts.push(...record.extraction.entities.email);

    if (record.extraction?.structuredData?.sections) {
      parts.push(...record.extraction.structuredData.sections);
    }

    if (record.extraction?.formData) {
      parts.push(Object.entries(record.extraction.formData).map(([k, v]) => `${k}: ${v}`).join(' '));
    }

    if (record.analysis?.topics?.length > 0) {
      parts.push(...record.analysis.topics);
    }

    return parts.filter(Boolean).join(' ') || (record.summary?.text || '');
  }

  /**
   * Compute semantic similarity between two texts using the Embedding Client.
   * @param {string} sourceText - Source text
   * @param {string} targetText - Target text
   * @returns {Promise<Object>} - { similarity, semanticSimilarity, keywordSimilarity }
   */
  async _computeSemanticSimilarity(sourceText, targetText) {
    // Compute keyword-based similarity (Jaccard)
    const sourceKeywords = new Set(this._extractComparisonKeywords(sourceText));
    const targetKeywords = new Set(this._extractComparisonKeywords(targetText));

    let keywordSimilarity = 0;
    if (sourceKeywords.size > 0 && targetKeywords.size > 0) {
      const intersection = new Set([...sourceKeywords].filter((k) => targetKeywords.has(k)));
      const union = new Set([...sourceKeywords, ...targetKeywords]);
      keywordSimilarity = intersection.size / union.size;
    }

    // Compute semantic similarity via Embedding Client
    let semanticSimilarity = 0;
    try {
      const embeddings = await embeddingClient.generateEmbeddings([
        sourceText.substring(0, 1000),
        targetText.substring(0, 1000),
      ]);

      if (embeddings.success && embeddings.embeddings.length >= 2) {
        semanticSimilarity = embeddingClient.cosineSimilarity(
          embeddings.embeddings[0],
          embeddings.embeddings[1]
        );
        semanticSimilarity = Math.max(0, Math.min(1, (semanticSimilarity + 1) / 2));
      }
    } catch (error) {
      console.warn('Semantic comparison fallback to keyword-only:', error.message);
    }

    // Hybrid similarity: weight semantic and keyword
    const hasSemantic = semanticSimilarity > 0;
    const similarity = hasSemantic
      ? semanticSimilarity * 0.7 + keywordSimilarity * 0.3
      : keywordSimilarity;

    return {
      similarity: Math.max(0, Math.min(1, similarity)),
      semanticSimilarity: Math.round(semanticSimilarity * 100) / 100,
      keywordSimilarity: Math.round(keywordSimilarity * 100) / 100,
    };
  }

  /**
   * Extract keywords for comparison (tokenized, normalized)
   * @param {string} text - Text
   * @returns {Array<string>} - Keywords
   */
  _extractComparisonKeywords(text) {
    const stopWords = new Set([
      'the', 'a', 'an', 'and', 'or', 'but', 'if', 'then', 'else', 'for',
      'this', 'that', 'with', 'from', 'have', 'has', 'had', 'was', 'were',
      'is', 'are', 'be', 'been', 'being', 'of', 'in', 'on', 'at', 'to',
      'by', 'as', 'it', 'its', 'not', 'no', 'so', 'than', 'too', 'very',
      'just', 'can', 'could', 'would', 'should', 'will', 'shall', 'may',
      'might', 'must', 'about', 'into', 'over', 'after', 'before',
    ]);

    return (text.toLowerCase().match(/[a-z][a-z'-]{3,}/g) || [])
      .filter((word) => !stopWords.has(word));
  }

  /**
   * Find common sections between two documents.
   * @param {Object} source - Source document
   * @param {Object} target - Target document
   * @returns {Array<string>} - Common sections
   */
  _findCommonSections(source, target) {
    const sourceSections = this._collectSections(source);
    const targetSections = this._collectSections(target);

    return sourceSections.filter((section) =>
      targetSections.some((t) => this._sectionSimilar(section, t))
    ).slice(0, 15);
  }

  /**
   * Data variant for finding common sections (for lean objects)
   * @param {Object} source - Source document (lean or full)
   * @param {Object} candidate - Candidate document (lean or full)
   * @returns {Array<string>} - Common sections
   */
  _findCommonSectionsData(source, candidate) {
    const sourceSections = this._collectSections(source);
    const candidateSections = this._collectSections(candidate);

    return sourceSections.filter((section) =>
      candidateSections.some((c) => this._sectionSimilar(section, c))
    ).slice(0, 15);
  }

  /**
   * Collect section labels from a document.
   * @param {Object} record - DocumentAnalysis record
   * @returns {Array<string>} - Section labels
   */
  _collectSections(record) {
    const sections = [];

    if (record.classification?.type) sections.push(`type:${record.classification.type}`);
    if (record.classification?.category) sections.push(`category:${record.classification.category}`);
    if (record.classification?.labels) sections.push(...record.classification.labels.map((l) => `label:${l}`));
    if (record.summary?.keywords) sections.push(...record.summary.keywords.map((k) => `keyword:${k}`));
    if (record.extraction?.structuredData?.sections) {
      sections.push(...record.extraction.structuredData.sections.map((s) => `section:${s}`));
    }

    return [...new Set(sections)];
  }

  /**
   * Check if two section labels are similar.
   * @param {string} a - Section A
   * @param {string} b - Section B
   * @returns {boolean} - True if similar
   */
  _sectionSimilar(a, b) {
    return a === b || a.toLowerCase().includes(b.toLowerCase()) || b.toLowerCase().includes(a.toLowerCase());
  }

  /**
   * Find differences between two documents.
   * @param {Object} source - Source document
   * @param {Object} target - Target document
   * @returns {Array<string>} - Differences
   */
  _findDifferences(source, target) {
    const differences = [];

    // Classification differences
    if (source.classification?.type !== target.classification?.type) {
      differences.push(`Document type differs: ${source.classification?.type || 'unknown'} vs ${target.classification?.type || 'unknown'}`);
    }

    // Entity differences
    const sourceNames = new Set(source.extraction?.entities?.names || []);
    const targetNames = new Set(target.extraction?.entities?.names || []);
    const onlyInSource = [...sourceNames].filter((n) => !targetNames.has(n));
    const onlyInTarget = [...targetNames].filter((n) => !sourceNames.has(n));

    if (onlyInSource.length > 0) {
      differences.push(`Entities only in ${source.fileName}: ${onlyInSource.slice(0, 5).join(', ')}`);
    }
    if (onlyInTarget.length > 0) {
      differences.push(`Entities only in ${target.fileName}: ${onlyInTarget.slice(0, 5).join(', ')}`);
    }

    // Keyword differences
    const sourceKeywords = new Set(source.summary?.keywords || []);
    const targetKeywords = new Set(target.summary?.keywords || []);
    const keywordsOnlyInSource = [...sourceKeywords].filter((k) => !targetKeywords.has(k)).slice(0, 5);
    const keywordsOnlyInTarget = [...targetKeywords].filter((k) => !sourceKeywords.has(k)).slice(0, 5);

    if (keywordsOnlyInSource.length > 0) {
      differences.push(`Keywords only in ${source.fileName}: ${keywordsOnlyInSource.join(', ')}`);
    }
    if (keywordsOnlyInTarget.length > 0) {
      differences.push(`Keywords only in ${target.fileName}: ${keywordsOnlyInTarget.join(', ')}`);
    }

    // Field differences
    const sourceFields = Object.keys(source.extraction?.fields || {});
    const targetFields = Object.keys(target.extraction?.fields || {});
    const onlySourceFields = sourceFields.filter((f) => !targetFields.includes(f));
    const onlyTargetFields = targetFields.filter((f) => !sourceFields.includes(f));

    if (onlySourceFields.length > 0) {
      differences.push(`Fields only in ${source.fileName}: ${onlySourceFields.slice(0, 5).join(', ')}`);
    }
    if (onlyTargetFields.length > 0) {
      differences.push(`Fields only in ${target.fileName}: ${onlyTargetFields.slice(0, 5).join(', ')}`);
    }

    return differences.slice(0, 20);
  }

  /**
   * Update comparison metadata on documents.
   * @param {string} userId - User ID
   * @param {Object} source - Source document
   * @param {Object} target - Target document
   * @param {Object} comparisonData - Comparison result
   */
  async _updateComparisonMetadata(userId, source, target, comparisonData) {
    try {
      // Add to source's similarDocuments
      source.comparison = source.comparison || { similarDocuments: [], comparedAt: null };

      // Remove any stale entry for the target
      source.comparison.similarDocuments = source.comparison.similarDocuments.filter(
        (d) => String(d.documentId) !== String(comparisonData.sourceId)
      );

      source.comparison.similarDocuments.push({
        documentId: comparisonData.sourceId,
        fileName: comparisonData.fileName,
        similarity: comparisonData.similarity,
        commonSections: comparisonData.commonSections,
        differences: comparisonData.differences,
      });
      source.comparison.comparedAt = new Date();
      await source.save().catch(() => {});

      // Add to target's similarDocuments (bidirectional)
      target.comparison = target.comparison || { similarDocuments: [], comparedAt: null };
      target.comparison.similarDocuments = target.comparison.similarDocuments.filter(
        (d) => String(d.documentId) !== String(source._id)
      );
      target.comparison.similarDocuments.push({
        documentId: source._id,
        fileName: source.fileName,
        similarity: comparisonData.similarity,
        commonSections: comparisonData.commonSections,
        differences: comparisonData.differences,
      });
      target.comparison.comparedAt = new Date();
      await target.save().catch(() => {});
    } catch (error) {
      console.warn('Comparison metadata update warning:', error.message);
    }
  }

  /**
   * Get comparison service statistics
   */
  getStats() {
    return { ...this.stats };
  }
}

// Export singleton
const documentComparisonService = new DocumentComparisonService();

module.exports = documentComparisonService;
module.exports.DocumentComparisonService = DocumentComparisonService;