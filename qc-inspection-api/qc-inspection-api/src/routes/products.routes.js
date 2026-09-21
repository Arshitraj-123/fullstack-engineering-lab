const express = require('express');
const controller = require('../controllers/products.controller');

const router = express.Router();

router.get('/', controller.listProducts);
router.post('/', controller.createProduct);
router.get('/:id', controller.getProduct);
router.put('/:id', controller.replaceProduct);
router.patch('/:id', controller.patchProduct);
router.delete('/:id', controller.deleteProduct);

module.exports = router;
