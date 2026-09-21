const express = require('express');
const router = express.Router();
const Report = require('../models/Report');
const createCRUDController = require('../controllers/crudController');
const { protect } = require('../middleware/auth');

const reportController = createCRUDController(Report, 'business generatedBy');

router.use(protect);

router.post('/', reportController.create);
router.get('/', reportController.getAll);
router.get('/:id', reportController.getById);
router.put('/:id', reportController.update);
router.delete('/:id', reportController.delete);

module.exports = router;