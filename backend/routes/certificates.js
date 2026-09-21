const express = require('express');
const router = express.Router();
const Certificate = require('../models/Certificate');
const createCRUDController = require('../controllers/crudController');
const { protect } = require('../middleware/auth');

const certificateController = createCRUDController(Certificate, 'user verifiedBy');

router.use(protect);

router.post('/', certificateController.create);
router.get('/', certificateController.getAll);
router.get('/:id', certificateController.getById);
router.put('/:id', certificateController.update);
router.delete('/:id', certificateController.delete);

module.exports = router;