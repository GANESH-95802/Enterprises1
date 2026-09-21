const { stripNoSQLInjection } = require('../utils/security');

const createCRUDController = (Model, populateFields = '') => ({
  // @desc    Create a document
  // @route   POST /api/:resource
  create: async (req, res, next) => {
    try {
      // Defense-in-depth: sanitize body against NoSQL injection
      const cleanBody = stripNoSQLInjection(req.body);
      const document = await Model.create({
        ...cleanBody,
        user: req.user._id,
      });
      res.status(201).json({ success: true, data: document });
    } catch (error) {
      next(error);
    }
  },

  // @desc    Get all documents
  // @route   GET /api/:resource
  getAll: async (req, res, next) => {
    try {
      const { page = 1, limit = 10, sort = '-createdAt', ...filters } = req.query;

      // Defense-in-depth: sanitize query filters against NoSQL injection
      const cleanFilters = stripNoSQLInjection(filters);

      // Build query
      let query = {};
      
      // Apply text search if provided
      if (cleanFilters.search) {
        query.$or = [
          { name: { $regex: cleanFilters.search, $options: 'i' } },
          { title: { $regex: cleanFilters.search, $options: 'i' } },
          { description: { $regex: cleanFilters.search, $options: 'i' } },
          { patientName: { $regex: cleanFilters.search, $options: 'i' } },
          { company: { $regex: cleanFilters.search, $options: 'i' } },
        ];
        delete cleanFilters.search;
      }

      // Apply status filter
      if (cleanFilters.status) {
        query.status = cleanFilters.status;
        delete cleanFilters.status;
      }

      // Apply category filter
      if (cleanFilters.category) {
        query.category = cleanFilters.category;
        delete cleanFilters.category;
      }

      // Apply other filters (only allow string/number values, no operators)
      Object.keys(cleanFilters).forEach((key) => {
        if (!['page', 'limit', 'sort'].includes(key)) {
          const value = cleanFilters[key];
          // Only allow primitive values (string, number, boolean) as filters
          if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
            query[key] = value;
          }
        }
      });

      // If not admin, filter by user/business
      if (req.user.role !== 'admin') {
        if (Model.modelName === 'User') {
          query._id = req.user._id;
        } else if (Model.modelName === 'Skill' || Model.modelName === 'Certificate') {
          query.user = req.user._id;
        } else {
          query.business = req.user.business;
        }
      }

      const skip = (parseInt(page) - 1) * parseInt(limit);

      const [documents, total] = await Promise.all([
        Model.find(query)
          .populate(populateFields)
          .sort(sort)
          .skip(skip)
          .limit(parseInt(limit)),
        Model.countDocuments(query),
      ]);

      res.json({
        success: true,
        data: documents,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit)),
        },
      });
    } catch (error) {
      next(error);
    }
  },

  // @desc    Get single document
  // @route   GET /api/:resource/:id
  getById: async (req, res, next) => {
    try {
      const document = await Model.findById(req.params.id).populate(populateFields);
      
      if (!document) {
        res.status(404);
        throw new Error('Resource not found');
      }
      
      res.json({ success: true, data: document });
    } catch (error) {
      next(error);
    }
  },

  // @desc    Update document
  // @route   PUT /api/:resource/:id
  update: async (req, res, next) => {
    try {
      // Defense-in-depth: sanitize body against NoSQL injection
      const cleanBody = stripNoSQLInjection(req.body);
      const document = await Model.findByIdAndUpdate(
        req.params.id,
        cleanBody,
        { new: true, runValidators: true }
      ).populate(populateFields);

      if (!document) {
        res.status(404);
        throw new Error('Resource not found');
      }

      res.json({ success: true, data: document });
    } catch (error) {
      next(error);
    }
  },

  // @desc    Delete document
  // @route   DELETE /api/:resource/:id
  delete: async (req, res, next) => {
    try {
      const document = await Model.findByIdAndDelete(req.params.id);

      if (!document) {
        res.status(404);
        throw new Error('Resource not found');
      }

      res.json({ success: true, message: 'Resource deleted successfully' });
    } catch (error) {
      next(error);
    }
  },
});

module.exports = createCRUDController;