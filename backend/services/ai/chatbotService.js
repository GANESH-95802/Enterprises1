const { chatCompletion } = require('./openaiService');
const User = require('../../models/User');
const Business = require('../../models/Business');
const Product = require('../../models/Product');

// System context for the AI chatbot
const SYSTEM_CONTEXT = `You are an AI Enterprise Assistant for AI Enterprise Hub. You help users with:
1. Business analytics and insights
2. Document generation and management
3. Skill development recommendations
4. Compliance and regulatory guidance
5. Project management assistance
6. Healthcare record explanations
7. General enterprise operations

You have access to the enterprise data and can provide insights based on it.
Always be professional, helpful, and concise. If you don't know something, say so honestly.
Format responses in markdown for better readability.`;

// Process user message with context
const processMessage = async (userId, message, conversationHistory = []) => {
  try {
    // Get user context
    const user = await User.findById(userId).select('name email role department');
    const businessCount = await Business.countDocuments();
    const productCount = await Product.countDocuments();

    const userContext = `Current User: ${user?.name || 'Unknown'} (${user?.role || 'user'})
Department: ${user?.department || 'N/A'}
Enterprise Stats: ${businessCount} businesses, ${productCount} products`;

    const messages = [
      { role: 'system', content: `${SYSTEM_CONTEXT}\n\n${userContext}` },
      ...conversationHistory.slice(-10), // Keep last 10 messages for context
      { role: 'user', content: message },
    ];

    const response = await chatCompletion(messages, {
      temperature: 0.7,
      maxTokens: 1500,
    });

    return {
      success: response.success,
      message: response.message,
      usage: response.usage,
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    console.error('Chatbot processing error:', error.message);
    return {
      success: false,
      message: 'I apologize, but I encountered an error processing your request. Please try again.',
      error: error.message,
      timestamp: new Date().toISOString(),
    };
  }
};

// Generate enterprise report
const generateEnterpriseReport = async (userId, reportType, filters = {}) => {
  try {
    const user = await User.findById(userId).select('name role');
    const businesses = await Business.find(filters).limit(10).select('name category status revenue');
    const products = await Product.find(filters).limit(10).select('name price category');

    const context = {
      reportType,
      requestedBy: user?.name || 'Unknown',
      date: new Date().toISOString(),
      data: {
        businesses: businesses.map(b => ({
          name: b.name,
          category: b.category,
          status: b.status,
          revenue: b.revenue,
        })),
        products: products.map(p => ({
          name: p.name,
          price: p.price,
          category: p.category,
        })),
      },
    };

    const messages = [
      {
        role: 'system',
        content: 'You are an enterprise report generator. Create professional, detailed reports based on the provided data.',
      },
      {
        role: 'user',
        content: `Generate a ${reportType} report with the following context:\n${JSON.stringify(context, null, 2)}`,
      },
    ];

    const response = await chatCompletion(messages, {
      temperature: 0.3,
      maxTokens: 2000,
    });

    return {
      success: response.success,
      report: response.message,
      metadata: {
        type: reportType,
        generatedBy: user?.name,
        date: new Date().toISOString(),
      },
    };
  } catch (error) {
    console.error('Report generation error:', error.message);
    return { success: false, message: error.message };
  }
};

// Quick insights based on enterprise data
const getQuickInsights = async () => {
  try {
    const [
      totalBusinesses,
      totalProducts,
      activeBusinesses,
      totalUsers,
    ] = await Promise.all([
      Business.countDocuments(),
      Product.countDocuments(),
      Business.countDocuments({ status: 'active' }),
      User.countDocuments(),
    ]);

    return {
      success: true,
      insights: {
        overview: {
          totalBusinesses,
          totalProducts,
          activeBusinesses,
          totalUsers,
          businessHealth: totalBusinesses > 0
            ? ((activeBusinesses / totalBusinesses) * 100).toFixed(1) + '%'
            : 'N/A',
        },
        recommendations: [
          totalProducts < totalBusinesses ? 'Consider expanding product offerings' : 'Product portfolio looks healthy',
          activeBusinesses < totalBusinesses * 0.7 ? 'Some businesses need attention' : 'Most businesses are active',
          'Review business analytics for growth opportunities',
          'Explore AI features for automation potential',
        ],
      },
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    console.error('Quick insights error:', error.message);
    return { success: false, message: error.message };
  }
};

module.exports = {
  processMessage,
  generateEnterpriseReport,
  getQuickInsights,
};