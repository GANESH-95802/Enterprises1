const express = require('express');
const router = express.Router();
const { register, login, getProfile, updateProfile } = require('../controllers/authController');
const { protect } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const { registerValidation, loginValidation, profileUpdateValidation } = require('../validators/auth');

router.post('/register', registerValidation, validate, register);
router.post('/login', loginValidation, validate, login);
router.get('/profile', protect, getProfile);
router.put('/profile', protect, profileUpdateValidation, validate, updateProfile);

module.exports = router;
