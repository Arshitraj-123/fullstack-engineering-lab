const express = require('express');
const controller = require('../controllers/books.controller');

const router = express.Router();

router.get('/', controller.listBooks);
router.post('/', controller.createBook);

router.get('/:id', controller.getBook);
router.put('/:id', controller.replaceBook);
router.patch('/:id', controller.updateBook);
router.delete('/:id', controller.deleteBook);

router.post('/:id/checkout', controller.checkoutBook);
router.post('/:id/return', controller.returnBook);

module.exports = router;
