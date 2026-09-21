const express = require('express');
const router = express.Router();
const {
  sendMessage,
  generateReport,
  getInsights,
} = require('../controllers/chatbotController');
const { protect } = require('../middleware/auth');

router.use(protect);

router.post('/message', sendMessage);
router.post('/generate-report', generateReport);
router.get('/insights', getInsights);

module.exports = router;