const chatbotService = require('../services/ai/chatbotService');

// @desc    Send message to AI chatbot
// @route   POST /api/chatbot/message
const sendMessage = async (req, res, next) => {
  try {
    const { message, conversationHistory } = req.body;
    
    if (!message || !message.trim()) {
      res.status(400);
      throw new Error('Message is required');
    }

    const response = await chatbotService.processMessage(
      req.user._id,
      message.trim(),
      conversationHistory || []
    );
    
    res.json({ success: true, data: response });
  } catch (error) {
    next(error);
  }
};

// @desc    Generate enterprise report
// @route   POST /api/chatbot/generate-report
const generateReport = async (req, res, next) => {
  try {
    const { reportType, filters } = req.body;
    
    if (!reportType) {
      res.status(400);
      throw new Error('Report type is required');
    }

    const report = await chatbotService.generateEnterpriseReport(
      req.user._id,
      reportType,
      filters || {}
    );
    
    res.json({ success: true, data: report });
  } catch (error) {
    next(error);
  }
};

// @desc    Get quick enterprise insights
// @route   GET /api/chatbot/insights
const getInsights = async (req, res, next) => {
  try {
    const insights = await chatbotService.getQuickInsights();
    res.json({ success: true, data: insights });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  sendMessage,
  generateReport,
  getInsights,
};