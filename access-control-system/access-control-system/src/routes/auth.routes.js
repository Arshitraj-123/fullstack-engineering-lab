const express = require('express');
const controller = require('../controllers/auth.controller');
const authenticate = require('../middleware/authenticate');

const router = express.Router();

router.post('/register', controller.register);
router.post('/login', controller.login);
router.post('/refresh', controller.refresh);
router.post('/logout', controller.logout);
router.get('/me', authenticate, controller.me);

module.exports = router;
