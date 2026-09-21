const express = require('express');
const router = express.Router();
const ConstructionProject = require('../models/ConstructionProject');
const createCRUDController = require('../controllers/crudController');
const { protect } = require('../middleware/auth');

const projectController = createCRUDController(ConstructionProject, 'business manager');

router.use(protect);

router.post('/', projectController.create);
router.get('/', projectController.getAll);
router.get('/:id', projectController.getById);
router.put('/:id', projectController.update);
router.delete('/:id', projectController.delete);

module.exports = router;