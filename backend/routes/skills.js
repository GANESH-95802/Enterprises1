const express = require('express');
const router = express.Router();
const Skill = require('../models/Skill');
const createCRUDController = require('../controllers/crudController');
const { protect } = require('../middleware/auth');

const skillController = createCRUDController(Skill, 'user');

router.use(protect);

router.post('/', skillController.create);
router.get('/', skillController.getAll);
router.get('/:id', skillController.getById);
router.put('/:id', skillController.update);
router.delete('/:id', skillController.delete);

module.exports = router;