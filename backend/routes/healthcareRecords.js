const express = require('express');
const router = express.Router();
const HealthcareRecord = require('../models/HealthcareRecord');
const createCRUDController = require('../controllers/crudController');
const { protect } = require('../middleware/auth');

const healthcareController = createCRUDController(HealthcareRecord, 'business');

router.use(protect);

router.post('/', healthcareController.create);
router.get('/', healthcareController.getAll);
router.get('/:id', healthcareController.getById);
router.put('/:id', healthcareController.update);
router.delete('/:id', healthcareController.delete);

module.exports = router;