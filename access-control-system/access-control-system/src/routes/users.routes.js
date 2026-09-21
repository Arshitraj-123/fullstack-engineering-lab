const express = require('express');
const controller = require('../controllers/users.controller');
const authenticate = require('../middleware/authenticate');
const authorize = require('../middleware/authorize');

const router = express.Router();

router.get('/', authenticate, authorize('admin'), controller.listUsers);

module.exports = router;
