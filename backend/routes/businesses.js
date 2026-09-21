const express = require('express');
const router = express.Router();
const Business = require('../models/Business');
const createCRUDController = require('../controllers/crudController');
const { protect } = require('../middleware/auth');

const businessController = createCRUDController(Business, 'owner');

router.use(protect);

router.post('/', businessController.create);
router.get('/', businessController.getAll);
router.get('/:id', businessController.getById);
router.put('/:id', businessController.update);
router.delete('/:id', businessController.delete);

module.exports = router;