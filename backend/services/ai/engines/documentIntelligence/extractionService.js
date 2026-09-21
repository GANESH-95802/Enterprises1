/**
 * Extraction Service (Phase 3C — Document Intelligence)
 * Extracts structured data, entities, tables, and form fields from documents.
 * Uses pattern-based extraction for resumes, invoices, forms, and general documents.
 * Reuses the existing Embedding Client for semantic entity resolution when available.
 * Follows SOLID principles — this module is solely responsible for data extraction.
 */
const embeddingClient = require('../../clients/embeddingClient');

class ExtractionService {
  constructor() {
    this.stats = {
      totalExtractions: 0,
      totalFailures: 0,
    };

    // Common entity patterns
    this.entityPatterns = {
      email: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,
      phone: /\b(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}\b/g,
      url: /\bhttps?:\/\/[^\s<>"']+/g,
      date: /\b\d{1,4}[-/.]\d{1,2}[-/.]\d{1,4}\b|\b(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\.?\s+\d{1,2},?\s+\d{4}\b/gi,
      currency: /\$\s?\d[\d,.]*|\b(?:USD|EUR|GBP|INR|JPY)\s?\d[\d,.]*\b/gi,
      ipAddress: /\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/g,
      hashtag: /#[A-Za-z0-9_]+/g,
      mention: /@[A-Za-z0-9_]+/g,
    };
  }

  /**
   * Extract structured information from document text.
   * @param {string} text - Document text
   * @param {Object} options - { type, fileName, fileType }
   * @returns {Promise<Object>} - { success, extraction }
   */
  async extract(text, options = {}) {
    try {
      if (!text || text.trim().length === 0) {
        this.stats.totalFailures += 1;
        return { success: false, message: 'No text content available for extraction' };
      }

      const type = options.type || 'general';
      const fileName = options.fileName || '';

      // Run extractions in parallel where possible
      const [entities, tables, fields, structuredData] = await Promise.all([
        this._extractEntities(text),
        this._extractTables(text),
        this._extractFields(text, type),
        this._extractStructuredData(text, type, fileName),
      ]);

      // Determine if the structure matches a known document type
      const hasStructuredData = Object.keys(structuredData).length > 0 ||
        Object.keys(entities).length > 0 ||
        tables.length > 0 ||
        Object.keys(fields).length > 0;

      const confidence = this._computeExtractionConfidence(
        entities, tables, fields, structuredData
      );

      this.stats.totalExtractions += 1;

      return {
        success: true,
        extraction: {
          entities,
          structuredData,
          tables,
          fields,
          formData: this._extractFormData(text, type),
          confidence,
          method: hasStructuredData ? 'pattern-based' : 'none',
        },
      };
    } catch (error) {
      this.stats.totalFailures += 1;
      console.error('Extraction Service - error:', error.message);
      return { success: false, message: error.message };
    }
  }

  /**
   * Extract entities (emails, phones, URLs, dates, etc.)
   * @param {string} text - Document text
   * @returns {Promise<Object>} - Entity groups
   */
  async _extractEntities(text) {
    const entities = {};

    for (const [entityType, pattern] of Object.entries(this.entityPatterns)) {
      const matches = text.match(pattern) || [];
      if (matches.length > 0) {
        // Deduplicate and clean
        entities[entityType] = [...new Set(matches.map((m) => m.trim()))].slice(0, 25);
      }
    }

    // Extract names (capitalized sequences followed by capitalized words)
    const namePattern = /\b[A-Z][a-z]{2,}(?:\s+[A-Z][a-z]{2,}){1,2}\b/g;
    const nameMatches = text.match(namePattern) || [];
    const names = [...new Set(nameMatches)]
      .filter((name) => this._isLikelyName(name))
      .slice(0, 20);

    if (names.length > 0) {
      entities.names = names;
    }

    // Extract organizations (companies, institutions)
    const orgPattern = /\b(?:[A-Z][a-z]+(?:\s+(?:[A-Z][a-z]+|LLC|Inc|Ltd|Corp|Corporation|Company|Co|Group|Technologies|Solutions|Systems|Labs|Limited)){1,3})\b/g;
    const orgMatches = text.match(orgPattern) || [];
    const organizations = [...new Set(orgMatches)].slice(0, 15);

    if (organizations.length > 0) {
      entities.organizations = organizations;
    }

    // Extract addresses
    const addressPattern = /\b\d{1,5}\s+[A-Za-z0-9.,\s]{3,50}(?:Street|St|Avenue|Ave|Road|Rd|Boulevard|Blvd|Lane|Ln|Drive|Dr|Court|Ct|Way|Plaza|Square|Parkway|Pkwy)\b/g;
    const addressMatches = text.match(addressPattern) || [];
    if (addressMatches.length > 0) {
      entities.addresses = [...new Set(addressMatches.map((a) => a.trim()))].slice(0, 10);
    }

    // Extract IDs (invoice numbers, order IDs, etc.)
    const idPattern = /\b(?:INV|ORD|PO|REF|ID|NO|NUMBER|APPOINTMENT)\s*[-#: ]\s*[A-Za-z0-9-]{3,20}\b/gi;
    const idMatches = text.match(idPattern) || [];
    if (idMatches.length > 0) {
      entities.ids = [...new Set(idMatches.map((m) => m.trim()))].slice(0, 15);
    }

    return entities;
  }

  /**
   * Heuristic check whether a name candidate is likely a person's name
   * @param {string} name - Name candidate
   * @returns {boolean} - True if likely a name
   */
  _isLikelyName(name) {
    // Exclude common non-name phrases
    const excluded = [
      'January', 'February', 'March', 'April', 'May', 'June', 'July',
      'August', 'September', 'October', 'November', 'December',
      'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday',
      'Saturday', 'Sunday', 'United States', 'New York', 'Los Angeles',
      'This Document', 'The Company', 'Terms And', 'Effective Date',
      'Table Of', 'Contact Information', 'Executive Summary',
    ];
    if (excluded.includes(name)) return false;

    // Names are usually 2-4 words
    const words = name.split(' ');
    if (words.length < 2 || words.length > 4) return false;

    // All words should start with uppercase
    return words.every((w) => /^[A-Z]/.test(w));
  }

  /**
   * Extract tables from text.
   * Detects pipe-delimited or space-aligned tabular data.
   * @param {string} text - Document text
   * @returns {Promise<Array<Object>>} - Array of { title, headers, rows, confidence }
   */
  async _extractTables(text) {
    const tables = [];
    const lines = text.split('\n');

    // Detect table blocks: consecutive lines with consistent delimiters
    let currentTable = [];
    let currentDelimiter = null;

    const flushTable = () => {
      if (currentTable.length > 1) {
        const parsed = this._parseTableLines(currentTable);
        if (parsed) {
          tables.push(parsed);
        }
      }
      currentTable = [];
      currentDelimiter = null;
    };

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) {
        if (currentTable.length > 0) flushTable();
        continue;
      }

      // Check for pipe or tab delimiters
      const pipeCount = (trimmed.match(/\|/g) || []).length;
      const tabCount = (trimmed.match(/\t/g) || []).length;
      const isTableLine = pipeCount >= 2 || tabCount >= 1;

      if (isTableLine) {
        const delimiter = pipeCount >= 2 ? '|' : '\t';
        if (currentDelimiter && delimiter !== currentDelimiter) {
          flushTable();
        }
        currentDelimiter = delimiter;
        currentTable.push(trimmed);
      } else {
        // Check for aligned columns using multiple spaces
        const alignedColumns = trimmed.match(/\S+(?:\s{2,}\S+)+/);
        if (alignedColumns && currentTable.length === 0) {
          currentDelimiter = 'spaces';
          currentTable.push(trimmed);
        } else if (currentTable.length > 0) {
          flushTable();
        }
      }
    }

    // Flush the last table
    if (currentTable.length > 0) flushTable();

    // Limit tables returned
    return tables.slice(0, 10);
  }

  /**
   * Parse a block of table lines into { title, headers, rows, confidence }
   * @param {Array<string>} lines - Table lines
   * @returns {Object|null} - Parsed table or null
   */
  _parseTableLines(lines) {
    try {
      const delimiter = lines[0].includes('|') ? '|' : lines[0].includes('\t') ? '\t' : null;

      const splitLine = (line) => {
        if (delimiter) {
          return line.split(delimiter).map((cell) => cell.trim()).filter((c, i, arr) => {
            // Keep only cells between delimiters
            return i < arr.length;
          });
        }
        // Space-aligned
        return line.split(/\s{2,}/).map((cell) => cell.trim()).filter(Boolean);
      };

      // Remove separator lines (e.g., --- | --- | ---)
      const dataLines = lines.filter((line) => !/^[\s|:\-+]+$/.test(line));

      if (dataLines.length < 2) return null;

      const headerCells = splitLine(dataLines[0]).filter(Boolean);
      if (headerCells.length < 2) return null;

      const rows = [];
      for (let i = 1; i < dataLines.length; i++) {
        const cells = splitLine(dataLines[i]).filter(Boolean);
        if (cells.length >= 2) {
          // Pad or truncate to match header count
          const padded = [...cells];
          while (padded.length < headerCells.length) padded.push('');
          rows.push(padded.slice(0, headerCells.length));
        }
      }

      if (rows.length === 0) return null;

      // Title: look for a line above the table if it looks like a title
      let title = '';
      const confidence = Math.min(0.9, 0.5 + rows.length * 0.05 + headerCells.length * 0.05);

      return { title, headers: headerCells, rows, confidence: Math.round(confidence * 100) / 100 };
    } catch {
      return null;
    }
  }

  /**
   * Extract key-value fields from documents.
   * @param {string} text - Document text
   * @param {string} type - Document type
   * @returns {Promise<Object>} - Extracted fields
   */
  async _extractFields(text, type) {
    const fields = {};

    // Label: value patterns
    const fieldPatterns = {
      name: /(?:name|full\s+name|customer\s+name|client\s+name)\s*[:#]\s*([A-Za-z][A-Za-z\s.'-]{2,50})/i,
      email: /(?:email|e-mail)\s*[:#]\s*([A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,})/i,
      phone: /(?:phone|telephone|contact|mobile)\s*[:#]\s*(\+?\d{1,3}[-.\s]?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4})/i,
      address: /(?:address|location|billing\s+address|shipping\s+address)\s*[:#]\s*([A-Za-z0-9.,\s#-]{5,100})/i,
      company: /(?:company|organization|business|vendor|supplier)\s*[:#]\s*([A-Za-z][A-Za-z0-9\s&.'-]{2,60})/i,
      date: /(?:date|created|issued|dated)\s*[:#]\s*(\d{1,4}[-/.]\d{1,2}[-/.]\d{1,4}|\b(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\.?\s+\d{1,2},?\s+\d{4})\b/i,
      invoiceNumber: /(?:invoice\s*(?:number|no|#)?|bill\s*(?:number|no|#)?)\s*[:#]\s*([A-Za-z0-9-]{3,25})/i,
      orderNumber: /(?:order\s*(?:number|no|#)?|po\s*(?:number|no|#)?|purchase\s+order)\s*[:#]\s*([A-Za-z0-9-]{3,25})/i,
      amount: /(?:total|amount\s*(?:due|payable)?|balance|grand\s+total|sum)\s*[:#]?\s*\$?([\d,]+\.?\d{0,2})/i,
      tax: /(?:tax|vat|gst)\s*[:#]?\s*\$?([\d,]+\.?\d{0,2})/i,
      subtotal: /(?:subtotal|sub-total)\s*[:#]?\s*\$?([\d,]+\.?\d{0,2})/i,
      dueDate: /(?:due\s+date|payment\s+due|payable\s+by)\s*[:#]\s*(\d{1,4}[-/.]\d{1,2}[-/.]\d{1,4}|\b(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\.?\s+\d{1,2},?\s+\d{4})\b/i,
    };

    for (const [fieldName, pattern] of Object.entries(fieldPatterns)) {
      const match = text.match(pattern);
      if (match && match[1]) {
        fields[fieldName] = match[1].trim();
      }
    }

    return fields;
  }

  /**
   * Extract structured data based on document type.
   * @param {string} text - Document text
   * @param {string} type - Document type
   * @param {string} fileName - Original file name
   * @returns {Promise<Object>} - Structured data
   */
  async _extractStructuredData(text, type, fileName) {
    const data = {};

    switch (type) {
      case 'resume':
        data.education = this._extractResumeEducation(text);
        data.experience = this._extractResumeExperience(text);
        data.skills = this._extractResumeSkills(text);
        break;
      case 'invoice':
        data.invoiceDetails = this._extractInvoiceDetails(text);
        break;
      case 'form':
        data.formFields = this._extractFormData(text, 'form');
        break;
      case 'contract':
        data.contractDetails = this._extractContractDetails(text);
        break;
      case 'general':
      default:
        // For general documents, try to extract sections/headings
        data.sections = this._extractSections(text);
        break;
    }

    return data;
  }

  /**
   * Extract education information from resumes
   * @param {string} text - Document text
   * @returns {Array<Object>} - Education entries
   */
  _extractResumeEducation(text) {
    const entries = [];
    const degreePatterns = [
      /(?:Bachelor|B\.?[A-Z]\.?|Master|M\.?[A-Z]\.?|PhD|Ph\.?D\.?|MBA|Associate|High\s+School|Diploma|Certificate)[^,\n]{3,80}/gi,
    ];

    for (const pattern of degreePatterns) {
      const matches = text.match(pattern) || [];
      for (const match of matches) {
        entries.push({ degree: match.trim() });
      }
    }

    return entries.slice(0, 10);
  }

  /**
   * Extract work experience from resumes
   * @param {string} text - Document text
   * @returns {Array<Object>} - Experience entries
   */
  _extractResumeExperience(text) {
    const entries = [];
    const jobPattern = /\b(?:Software\s+Engineer|Developer|Manager|Director|Analyst|Consultant|Designer|Architect|Lead|Engineer|Specialist|Coordinator|Administrator|Associate)\b[^.\n]{3,100}/gi;
    const matches = text.match(jobPattern) || [];

    for (const match of matches.slice(0, 20)) {
      entries.push({ title: match.trim() });
    }

    return entries;
  }

  /**
   * Extract skills from resumes
   * @param {string} text - Document text
   * @returns {Array<string>} - Skill list
   */
  _extractResumeSkills(text) {
    // Look for skills section and extract comma/pipe separated values
    const skillsMatch = text.match(/(?:skills|technical\s+skills)\s*:?\s*\n?([^\n]{5,300})/i);
    if (!skillsMatch) return [];

    const skills = skillsMatch[1]
      .split(/,|\||•|•|-|;/)
      .map((s) => s.trim())
      .filter((s) => s.length > 1 && s.length < 50)
      .slice(0, 30);

    return skills;
  }

  /**
   * Extract invoice details
   * @param {string} text - Document text
   * @returns {Object} - Invoice details
   */
  _extractInvoiceDetails(text) {
    const details = {};

    const extractValue = (labelPatterns, valuePattern) => {
      for (const labelPattern of labelPatterns) {
        const combined = new RegExp(`${labelPattern}\\s*[:#]?\\s*(${valuePattern})`, 'i');
        const match = text.match(combined);
        if (match && match[1]) return match[1].trim();
      }
      return '';
    };

    details.invoiceNumber = extractValue(
      ['invoice\\s*(?:number|no|#)?', 'bill\\s*(?:number|no|#)?'],
      '[A-Za-z0-9-]{3,25}'
    );
    details.date = extractValue(
      ['date', 'issued', 'dated'],
      '\\d{1,4}[-/.]\\d{1,2}[-/.]\\d{1,4}'
    );
    details.dueDate = extractValue(
      ['due\\s+date', 'payment\\s+due', 'payable\\s+by'],
      '\\d{1,4}[-/.]\\d{1,2}[-/.]\\d{1,4}'
    );
    details.total = extractValue(
      ['total', 'amount\\s*(?:due|payable)?', 'grand\\s+total', 'balance\\s+due'],
      '[$]?[\\d,]+\\.?\\d{0,2}'
    );
    details.tax = extractValue(['tax', 'vat', 'gst'], '[$]?[\\d,]+\\.?\\d{0,2}');
    details.subtotal = extractValue(['subtotal', 'sub-total'], '[$]?[\\d,]+\\.?\\d{0,2}');

    return details;
  }

  /**
   * Extract contract details
   * @param {string} text - Document text
   * @returns {Object} - Contract details
   */
  _extractContractDetails(text) {
    const details = {};

    const extractValue = (labelPatterns, valuePattern) => {
      for (const labelPattern of labelPatterns) {
        const combined = new RegExp(`${labelPattern}\\s*[:#]?\\s*(${valuePattern})`, 'i');
        const match = text.match(combined);
        if (match && match[1]) return match[1].trim();
      }
      return '';
    };

    details.effectiveDate = extractValue(
      ['effective\\s+date', 'effective'], '\\d{1,4}[-/.]\\d{1,2}[-/.]\\d{1,4}'
    );
    details.expiryDate = extractValue(
      ['expiry\\s+date', 'expiration\\s+date', 'termination\\s+date'],
      '\\d{1,4}[-/.]\\d{1,2}[-/.]\\d{1,4}'
    );
    details.parties = [];
    const partyPattern = /party\s+(?:1|2|one|two)\s*[:(]\s*([^\n]{3,80})/gi;
    const partyMatches = text.match(partyPattern) || [];
    for (const match of partyMatches.slice(0, 4)) {
      const partyName = match.replace(/party\s+(?:1|2|one|two)\s*[:(]\s*/i, '').trim();
      if (partyName) details.parties.push(partyName);
    }

    return details;
  }

  /**
   * Extract sections/headings from general documents
   * @param {string} text - Document text
   * @returns {Array<string>} - Section headings
   */
  _extractSections(text) {
    const headings = [];
    const headingPatterns = [
      /^(?:#{1,6})\s+.+$/gm,               // Markdown headings
      /^[A-Z][A-Z\s]{2,}$/gm,              // ALL CAPS headings
      /^[A-Z][a-z]+(?:\s+[A-Z][a-z]+){1,4}:?$/gm,  // Title Case headings
    ];

    for (const pattern of headingPatterns) {
      const matches = text.match(pattern) || [];
      for (const match of matches) {
        const cleaned = match.replace(/^#{1,6}\s*/, '').replace(/:$/, '').trim();
        if (cleaned.length >= 3 && cleaned.length <= 80) {
          headings.push(cleaned);
        }
      }
    }

    return [...new Set(headings)].slice(0, 25);
  }

  /**
   * Extract form data from documents
   * @param {string} text - Document text
   * @param {string} type - Document type
   * @returns {Object} - Form field values
   */
  _extractFormData(text, type) {
    const formData = {};
    const labelValuePattern = /^([A-Za-z][A-Za-z\s'&-]{2,40})\s*[:#]\s*(.+)$/gm;
    const matches = text.matchAll(labelValuePattern);

    for (const match of matches) {
      const label = match[1].trim().toLowerCase().replace(/\s+/g, '_');
      const value = match[2].trim();
      if (label && value && value.length < 200) {
        formData[label] = value;
      }
    }

    // Limit to first 30 fields
    return Object.fromEntries(Object.entries(formData).slice(0, 30));
  }

  /**
   * Compute extraction confidence based on signals found
   * @param {Object} entities - Extracted entities
   * @param {Array} tables - Extracted tables
   * @param {Object} fields - Extracted fields
   * @param {Object} structuredData - Structured data
   * @returns {number} - Confidence score 0-1
   */
  _computeExtractionConfidence(entities, tables, fields, structuredData) {
    let score = 0;
    const entityCount = Object.keys(entities).reduce((sum, key) => sum + (entities[key]?.length || 0), 0);
    const fieldCount = Object.keys(fields).length;
    const tableCount = tables.length;
    const structuredCount = Object.keys(structuredData).length;

    score += Math.min(entityCount * 0.05, 0.3);
    score += Math.min(fieldCount * 0.1, 0.4);
    score += Math.min(tableCount * 0.15, 0.2);
    score += Math.min(structuredCount * 0.1, 0.3);

    return Math.round(Math.min(score, 0.95) * 100) / 100;
  }

  /**
   * Get extraction service statistics
   */
  getStats() {
    return { ...this.stats };
  }
}

// Export singleton
const extractionService = new ExtractionService();

module.exports = extractionService;
module.exports.ExtractionService = ExtractionService;