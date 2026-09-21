/**
 * Recommendation Service
 * Orchestrates candidate gathering from enterprise data sources.
 * Collects candidates from skills, certificates, businesses, products, customers, and knowledge base.
 * Follows SOLID principles — this module is solely responsible for candidate sourcing.
 */
const Skill = require('../../../../models/Skill');
const Certificate = require('../../../../models/Certificate');
const Business = require('../../../../models/Business');
const Product = require('../../../../models/Product');
const Customer = require('../../../../models/Customer');
const AiKnowledgeDocument = require('../../../../models/AiKnowledgeDocument');
const Recommendation = require('../../../../models/Recommendation');
const retrievalService = require('../../rag/retrievalService');

class RecommendationService {
  constructor() {
    this.stats = {
      totalCandidateGathers: 0,
      totalCandidates: 0,
    };
  }

  /**
   * Gather recommendation candidates for a user based on type.
   * @param {string} userId - User ID
   * @param {string} type - Recommendation type
   * @param {Object} options - { limit, category, query }
   * @returns {Promise<Object>} - { success, candidates }
   */
  async gatherCandidates(userId, type = 'personalized', options = {}) {
    this.stats.totalCandidateGathers += 1;

    try {
      let candidates = [];

      switch (type) {
        case 'skill':
          candidates = await this._gatherSkillCandidates(userId);
          break;
        case 'certification':
          candidates = await this._gatherCertificationCandidates(userId);
          break;
        case 'career':
          candidates = await this._gatherCareerCandidates(userId);
          break;
        case 'course':
          candidates = await this._gatherCourseCandidates(userId);
          break;
        case 'job':
          candidates = await this._gatherJobCandidates(userId);
          break;
        case 'enterprise':
          candidates = await this._gatherEnterpriseCandidates(userId);
          break;
        case 'learning':
          candidates = await this._gatherLearningCandidates(userId);
          break;
        case 'personalized':
        default:
          candidates = await this._gatherPersonalizedCandidates(userId, options);
          break;
      }

      // Apply category filter if provided
      if (options.category && candidates.length > 0) {
        candidates = candidates.filter((c) => c.category === options.category);
      }

      // Apply limit
      const limit = Math.min(options.limit || 20, 50);
      candidates = candidates.slice(0, limit);

      this.stats.totalCandidates += candidates.length;

      return { success: true, candidates };
    } catch (error) {
      console.error('Recommendation Service - gather error:', error.message);
      return { success: false, message: error.message, candidates: [] };
    }
  }

  /**
   * Gather skill recommendation candidates.
   * Recommends skills based on user's existing skills and certificates.
   * @param {string} userId - User ID
   * @returns {Promise<Array<Object>>} - Skill candidates
   * @private
   */
  async _gatherSkillCandidates(userId) {
    const [skills, certificates] = await Promise.all([
      Skill.find({ user: userId }).select('name category proficiencyLevel tags'),
      Certificate.find({ user: userId, status: 'active' }).select('title category skills'),
    ]);

    const existingSkills = new Set(skills.map((s) => s.name.toLowerCase()));
    const skillCategories = new Set(skills.map((s) => s.category).filter(Boolean));
    const certSkills = certificates.flatMap((c) => c.skills || []);

    // Build skill candidates from certificate skills and related categories
    const candidates = [];

    // Skills from certificates not yet in user's skill set
    for (const skillName of certSkills) {
      if (!existingSkills.has(skillName.toLowerCase())) {
        candidates.push({
          title: skillName,
          name: skillName,
          description: `Skill associated with your certifications`,
          category: 'technical',
          tags: ['skill', 'certification'],
          source: 'certificate',
          sourceId: null,
          metadata: { fromCertificates: true },
          createdAt: new Date(),
        });
      }
    }

    // Related skills by category
    for (const category of skillCategories) {
      candidates.push({
        title: `Advanced ${category} Skills`,
        name: `Advanced ${category} Skills`,
        description: `Advance your ${category} skills to the next level`,
        category,
        tags: ['skill', 'advanced', category],
        source: 'skill',
        sourceId: null,
        metadata: { categoryBased: true },
        createdAt: new Date(),
      });
    }

    return candidates;
  }

  /**
   * Gather certification recommendation candidates.
   * Recommends certifications based on user's skills and existing certificates.
   * @param {string} userId - User ID
   * @returns {Promise<Array<Object>>} - Certification candidates
   * @private
   */
  async _gatherCertificationCandidates(userId) {
    const [skills, certificates] = await Promise.all([
      Skill.find({ user: userId }).select('name category proficiencyLevel'),
      Certificate.find({ user: userId, status: 'active' }).select('title category skills'),
    ]);

    const existingCerts = new Set(certificates.map((c) => c.title.toLowerCase()));
    const skillNames = skills.map((s) => s.name);
    const certCategories = new Set(certificates.map((c) => c.category).filter(Boolean));

    const candidates = [];

    // Certification recommendations based on skill categories
    const certByCategory = {
      technical: 'Professional Technical Certification',
      professional: 'Advanced Professional Certification',
      academic: 'Continuing Education Certification',
      compliance: 'Compliance & Regulatory Certification',
      management: 'Leadership & Management Certification',
    };

    for (const category of certCategories) {
      const title = certByCategory[category] || `${category.charAt(0).toUpperCase() + category.slice(1)} Certification`;
      if (!existingCerts.has(title.toLowerCase())) {
        candidates.push({
          title,
          name: title,
          description: `Earn a ${category} certification to validate your expertise`,
          category,
          tags: ['certification', category],
          source: 'certificate',
          sourceId: null,
          metadata: { skillBased: true, relatedSkills: skillNames.slice(0, 5) },
          createdAt: new Date(),
        });
      }
    }

    // Certification recommendations based on skills
    for (const skill of skills) {
      if (skill.proficiencyLevel === 'advanced' || skill.proficiencyLevel === 'expert') {
        const title = `${skill.name} Professional Certification`;
        if (!existingCerts.has(title.toLowerCase())) {
          candidates.push({
            title,
            name: title,
            description: `Validate your ${skill.name} expertise with a professional certification`,
            category: 'technical',
            tags: ['certification', skill.name.toLowerCase()],
            source: 'skill',
            sourceId: skill._id,
            metadata: { skillName: skill.name, proficiencyLevel: skill.proficiencyLevel },
            createdAt: new Date(),
          });
        }
      }
    }

    return candidates;
  }

  /**
   * Gather career recommendation candidates.
   * Recommends career paths based on user's skills and certificates.
   * @param {string} userId - User ID
   * @returns {Promise<Array<Object>>} - Career candidates
   * @private
   */
  async _gatherCareerCandidates(userId) {
    const [skills, certificates] = await Promise.all([
      Skill.find({ user: userId }).select('name category proficiencyLevel'),
      Certificate.find({ user: userId, status: 'active' }).select('title category'),
    ]);

    const skillCategories = new Set(skills.map((s) => s.category).filter(Boolean));
    const certCategories = new Set(certificates.map((c) => c.category).filter(Boolean));

    const careerPaths = {
      technical: [
        { title: 'Senior Software Engineer', description: 'Advance to a senior engineering role', tags: ['engineering', 'software'] },
        { title: 'Technical Lead', description: 'Lead technical teams and architecture decisions', tags: ['leadership', 'technical'] },
        { title: 'Solutions Architect', description: 'Design enterprise-scale solutions', tags: ['architecture', 'enterprise'] },
      ],
      management: [
        { title: 'Project Manager', description: 'Lead projects from planning to delivery', tags: ['management', 'projects'] },
        { title: 'Operations Manager', description: 'Oversee enterprise operations', tags: ['operations', 'management'] },
      ],
      finance: [
        { title: 'Financial Analyst', description: 'Analyze financial data for business decisions', tags: ['finance', 'analytics'] },
        { title: 'Finance Manager', description: 'Manage financial planning and reporting', tags: ['finance', 'management'] },
      ],
      healthcare: [
        { title: 'Healthcare Administrator', description: 'Manage healthcare operations', tags: ['healthcare', 'administration'] },
        { title: 'Clinical Data Analyst', description: 'Analyze clinical data for insights', tags: ['healthcare', 'analytics'] },
      ],
      education: [
        { title: 'Learning & Development Specialist', description: 'Design training programs', tags: ['education', 'training'] },
        { title: 'Instructional Designer', description: 'Create learning experiences', tags: ['education', 'design'] },
      ],
      construction: [
        { title: 'Construction Project Manager', description: 'Manage construction projects', tags: ['construction', 'management'] },
        { title: 'Site Supervisor', description: 'Oversee construction site operations', tags: ['construction', 'supervision'] },
      ],
    };

    const candidates = [];
    const allCategories = new Set([...skillCategories, ...certCategories]);

    for (const category of allCategories) {
      const paths = careerPaths[category] || [];
      for (const path of paths) {
        candidates.push({
          title: path.title,
          name: path.title,
          description: path.description,
          category,
          tags: path.tags,
          source: 'profile',
          sourceId: null,
          metadata: { careerPath: true },
          createdAt: new Date(),
        });
      }
    }

    return candidates;
  }

  /**
   * Gather course recommendation candidates.
   * Recommends courses based on user's skills and interests.
   * @param {string} userId - User ID
   * @returns {Promise<Array<Object>>} - Course candidates
   * @private
   */
  async _gatherCourseCandidates(userId) {
    const [skills, certificates] = await Promise.all([
      Skill.find({ user: userId }).select('name category proficiencyLevel'),
      Certificate.find({ user: userId, status: 'active' }).select('title category'),
    ]);

    const skillNames = skills.map((s) => s.name);
    const skillCategories = new Set(skills.map((s) => s.category).filter(Boolean));
    const certCategories = new Set(certificates.map((c) => c.category).filter(Boolean));

    const courseByCategory = {
      technical: 'Advanced Technical Training',
      management: 'Leadership Development Course',
      finance: 'Financial Management Course',
      healthcare: 'Healthcare Professional Development',
      education: 'Instructional Design Course',
      construction: 'Construction Management Course',
      creative: 'Creative Skills Workshop',
      language: 'Professional Language Course',
      soft: 'Soft Skills Development',
    };

    const candidates = [];
    const allCategories = new Set([...skillCategories, ...certCategories]);

    for (const category of allCategories) {
      const title = courseByCategory[category] || `${category.charAt(0).toUpperCase() + category.slice(1)} Skills Course`;
      candidates.push({
        title,
        name: title,
        description: `Comprehensive course to advance your ${category} skills`,
        category,
        tags: ['course', category],
        source: 'skill',
        sourceId: null,
        metadata: { relatedSkills: skillNames.slice(0, 5) },
        createdAt: new Date(),
      });
    }

    return candidates;
  }

  /**
   * Gather job recommendation candidates.
   * Recommends jobs based on user's skills and career interests.
   * @param {string} userId - User ID
   * @returns {Promise<Array<Object>>} - Job candidates
   * @private
   */
  async _gatherJobCandidates(userId) {
    const [skills, certificates] = await Promise.all([
      Skill.find({ user: userId }).select('name category proficiencyLevel'),
      Certificate.find({ user: userId, status: 'active' }).select('title category'),
    ]);

    const skillNames = skills.map((s) => s.name);
    const skillCategories = new Set(skills.map((s) => s.category).filter(Boolean));
    const certCategories = new Set(certificates.map((c) => c.category).filter(Boolean));

    const jobByCategory = {
      technical: 'Senior Technical Specialist',
      management: 'Operations Manager',
      finance: 'Financial Analyst',
      healthcare: 'Healthcare Specialist',
      education: 'Training Coordinator',
      construction: 'Construction Project Coordinator',
      creative: 'Creative Director',
      language: 'International Business Specialist',
      soft: 'Client Relations Manager',
    };

    const candidates = [];
    const allCategories = new Set([...skillCategories, ...certCategories]);

    for (const category of allCategories) {
      const title = jobByCategory[category] || `${category.charAt(0).toUpperCase() + category.slice(1)} Professional`;
      candidates.push({
        title,
        name: title,
        description: `Job opportunity matching your ${category} expertise`,
        category,
        tags: ['job', category],
        source: 'profile',
        sourceId: null,
        metadata: { requiredSkills: skillNames.slice(0, 5) },
        createdAt: new Date(),
      });
    }

    return candidates;
  }

  /**
   * Gather enterprise recommendation candidates.
   * Recommends enterprise resources based on user's business context.
   * @param {string} userId - User ID
   * @returns {Promise<Array<Object>>} - Enterprise candidates
   * @private
   */
  async _gatherEnterpriseCandidates(userId) {
    const [businesses, products, customers, knowledgeDocs] = await Promise.all([
      Business.find({ owner: userId, status: 'active' }).select('name category description'),
      Product.find({ isActive: true }).select('name category description tags'),
      Customer.find({ status: 'active' }).select('name company tags'),
      AiKnowledgeDocument.find({ user: userId, status: 'indexed' }).select('title category tags'),
    ]);

    const candidates = [];

    // Business recommendations
    for (const business of businesses) {
      candidates.push({
        title: business.name,
        name: business.name,
        description: business.description || `Business in ${business.category}`,
        category: business.category,
        tags: ['business', business.category],
        source: 'business',
        sourceId: business._id,
        metadata: { type: 'business' },
        createdAt: business.createdAt,
      });
    }

    // Product recommendations
    for (const product of products) {
      candidates.push({
        title: product.name,
        name: product.name,
        description: product.description || `Product in ${product.category}`,
        category: product.category,
        tags: ['product', ...(product.tags || [])],
        source: 'product',
        sourceId: product._id,
        metadata: { type: 'product', price: product.price },
        createdAt: product.createdAt,
      });
    }

    // Customer recommendations
    for (const customer of customers) {
      candidates.push({
        title: customer.name,
        name: customer.name,
        description: customer.company ? `Customer at ${customer.company}` : 'Enterprise customer',
        category: 'customer',
        tags: ['customer', ...(customer.tags || [])],
        source: 'customer',
        sourceId: customer._id,
        metadata: { type: 'customer' },
        createdAt: customer.createdAt,
      });
    }

    // Knowledge document recommendations
    for (const doc of knowledgeDocs) {
      candidates.push({
        title: doc.title,
        name: doc.title,
        description: `Knowledge base document in ${doc.category}`,
        category: doc.category,
        tags: ['knowledge', ...(doc.tags || [])],
        source: 'knowledge',
        sourceId: doc._id,
        metadata: { type: 'knowledge-document' },
        createdAt: doc.createdAt,
      });
    }

    return candidates;
  }

  /**
   * Gather learning recommendation candidates.
   * Combines course, skill, and certification recommendations.
   * @param {string} userId - User ID
   * @returns {Promise<Array<Object>>} - Learning candidates
   * @private
   */
  async _gatherLearningCandidates(userId) {
    const [courseCandidates, skillCandidates, certCandidates] = await Promise.all([
      this._gatherCourseCandidates(userId),
      this._gatherSkillCandidates(userId),
      this._gatherCertificationCandidates(userId),
    ]);

    return [...courseCandidates, ...skillCandidates, ...certCandidates];
  }

  /**
   * Gather personalized recommendation candidates.
   * Combines all sources with knowledge base retrieval.
   * @param {string} userId - User ID
   * @param {Object} options - { query, limit }
   * @returns {Promise<Array<Object>>} - Personalized candidates
   * @private
   */
  async _gatherPersonalizedCandidates(userId, options = {}) {
    const [enterpriseCandidates, learningCandidates, careerCandidates] = await Promise.all([
      this._gatherEnterpriseCandidates(userId),
      this._gatherLearningCandidates(userId),
      this._gatherCareerCandidates(userId),
    ]);

    let candidates = [...enterpriseCandidates, ...learningCandidates, ...careerCandidates];

    // Add knowledge base retrieval if query is provided
    if (options.query) {
      const retrieval = await retrievalService.retrieve(userId, options.query, {
        limit: 5,
      });
      if (retrieval.success && retrieval.results.length > 0) {
        for (const result of retrieval.results) {
          candidates.push({
            title: result.metadata?.documentTitle || 'Knowledge Base Document',
            name: result.metadata?.documentTitle || 'Knowledge Base Document',
            description: result.content.substring(0, 300),
            category: result.metadata?.category || 'knowledge',
            tags: ['knowledge', 'rag'],
            source: 'knowledge',
            sourceId: result.sourceId,
            metadata: { type: 'knowledge-chunk', score: result.score },
            createdAt: result.createdAt,
          });
        }
      }
    }

    return candidates;
  }

  /**
   * Get recommendation service statistics
   */
  getStats() {
    return { ...this.stats };
  }
}

// Export singleton
const recommendationService = new RecommendationService();

module.exports = recommendationService;
module.exports.RecommendationService = RecommendationService;