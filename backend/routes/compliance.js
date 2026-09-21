const express = require('express');
const router = express.Router();
const Compliance = require('../models/Compliance');
const createCRUDController = require('../controllers/crudController');
const { protect } = require('../middleware/auth');

const complianceController = createCRUDController(Compliance, 'business assignedTo');

router.use(protect);

router.post('/', complianceController.create);
router.get('/', complianceController.getAll);
router.get('/:id', complianceController.getById);
router.put('/:id', complianceController.update);
router.delete('/:id', complianceController.delete);

module.exports = router;