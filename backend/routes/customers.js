const express = require('express');
const router = express.Router();
const Customer = require('../models/Customer');
const createCRUDController = require('../controllers/crudController');
const { protect } = require('../middleware/auth');

const customerController = createCRUDController(Customer, 'business');

router.use(protect);

router.post('/', customerController.create);
router.get('/', customerController.getAll);
router.get('/:id', customerController.getById);
router.put('/:id', customerController.update);
router.delete('/:id', customerController.delete);

module.exports = router;