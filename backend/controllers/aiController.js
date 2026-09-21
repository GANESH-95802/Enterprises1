const aiService = require('../services/aiService');

// @desc    Predict sales
// @route   POST /api/ai/predict-sales
const predictSales = async (req, res, next) => {
  try {
    const { salesHistory } = req.body;
    const prediction = await aiService.predictSales(salesHistory);
    res.json({ success: true, data: prediction });
  } catch (error) {
    next(error);
  }
};

// @desc    Generate document
// @route   POST /api/ai/generate-document
const generateDocument = async (req, res, next) => {
  try {
    const { type, data } = req.body;
    const document = await aiService.generateDocument(type, data);
    res.json({ success: true, data: document });
  } catch (error) {
    next(error);
  }
};

// @desc    Explain medical report
// @route   POST /api/ai/explain-medical
const explainMedical = async (req, res, next) => {
  try {
    const { reportData } = req.body;
    const explanation = await aiService.explainMedicalReport(reportData);
    res.json({ success: true, data: explanation });
  } catch (error) {
    next(error);
  }
};

// @desc    Analyze image
// @route   POST /api/ai/analyze-image
const analyzeImage = async (req, res, next) => {
  try {
    const { image, mimeType } = req.body;
    const analysis = await aiService.analyzeImage(image, mimeType);
    res.json({ success: true, data: analysis });
  } catch (error) {
    next(error);
  }
};

// @desc    Evaluate skill
// @route   POST /api/ai/evaluate-skill
const evaluateSkill = async (req, res, next) => {
  try {
    const { skillData } = req.body;
    const evaluation = await aiService.evaluateSkill(skillData);
    res.json({ success: true, data: evaluation });
  } catch (error) {
    next(error);
  }
};

// @desc    Get recommendations
// @route   POST /api/ai/recommendations
const getRecommendations = async (req, res, next) => {
  try {
    const { userData } = req.body;
    const recommendations = await aiService.getRecommendations(userData);
    res.json({ success: true, data: recommendations });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  predictSales,
  generateDocument,
  explainMedical,
  analyzeImage,
  evaluateSkill,
  getRecommendations,
};