const express = require('express');
const router = express.Router();
const Product = require('../models/Product');
const createCRUDController = require('../controllers/crudController');
const { protect } = require('../middleware/auth');

const productController = createCRUDController(Product, 'business');

router.use(protect);

router.post('/', productController.create);
router.get('/', productController.getAll);
router.get('/:id', productController.getById);
router.put('/:id', productController.update);
router.delete('/:id', productController.delete);

module.exports = router;