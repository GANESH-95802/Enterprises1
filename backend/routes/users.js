const express = require('express');
const router = express.Router();
const User = require('../models/User');
const createCRUDController = require('../controllers/crudController');
const { protect, authorize } = require('../middleware/auth');

const userController = createCRUDController(User, '');

// All user routes require authentication
router.use(protect);

router.get('/', authorize('admin'), userController.getAll);
router.get('/:id', userController.getById);
router.put('/:id', authorize('admin'), userController.update);
router.delete('/:id', authorize('admin'), userController.delete);

module.exports = router;