const User = require('../models/User');
const Business = require('../models/Business');
const Product = require('../models/Product');
const Customer = require('../models/Customer');
const Compliance = require('../models/Compliance');
const ConstructionProject = require('../models/ConstructionProject');
const HealthcareRecord = require('../models/HealthcareRecord');
const Skill = require('../models/Skill');
const Certificate = require('../models/Certificate');
const Report = require('../models/Report');

// @desc    Get dashboard statistics
// @route   GET /api/dashboard/stats
const getDashboardStats = async (req, res, next) => {
  try {
    const [
      totalUsers,
      totalBusinesses,
      totalProducts,
      totalCustomers,
      totalCompliance,
      totalProjects,
      totalHealthcare,
      totalSkills,
      totalCertificates,
      totalReports,
    ] = await Promise.all([
      User.countDocuments(),
      Business.countDocuments(),
      Product.countDocuments(),
      Customer.countDocuments(),
      Compliance.countDocuments(),
      ConstructionProject.countDocuments(),
      HealthcareRecord.countDocuments(),
      Skill.countDocuments(),
      Certificate.countDocuments(),
      Report.countDocuments(),
    ]);

    // Recent items
    const recentUsers = await User.find().sort('-createdAt').limit(5).select('name email role createdAt');
    const recentBusinesses = await Business.find().sort('-createdAt').limit(5).select('name category status createdAt');

    res.json({
      success: true,
      data: {
        counts: {
          users: totalUsers,
          businesses: totalBusinesses,
          products: totalProducts,
          customers: totalCustomers,
          compliance: totalCompliance,
          projects: totalProjects,
          healthcare: totalHealthcare,
          skills: totalSkills,
          certificates: totalCertificates,
          reports: totalReports,
        },
        recent: {
          users: recentUsers,
          businesses: recentBusinesses,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get revenue/activity chart data
// @route   GET /api/dashboard/charts
const getChartData = async (req, res, next) => {
  try {
    const { period = 'monthly' } = req.query;

    // Aggregate product sales by period
    const salesData = await Product.aggregate([
      { $unwind: '$salesHistory' },
      {
        $group: {
          _id: {
            year: { $year: '$salesHistory.date' },
            month: { $month: '$salesHistory.date' },
          },
          totalRevenue: { $sum: '$salesHistory.revenue' },
          totalQuantity: { $sum: '$salesHistory.quantity' },
        },
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
      { $limit: 12 },
    ]);

    // Status distributions
    const complianceStatus = await Compliance.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]);

    const projectStatus = await ConstructionProject.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]);

    const businessCategories = await Business.aggregate([
      { $group: { _id: '$category', count: { $sum: 1 } } },
    ]);

    res.json({
      success: true,
      data: {
        sales: salesData,
        complianceStatus,
        projectStatus,
        businessCategories,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { getDashboardStats, getChartData };