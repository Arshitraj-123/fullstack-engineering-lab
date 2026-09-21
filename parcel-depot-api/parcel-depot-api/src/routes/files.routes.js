const express = require('express');
const upload = require('../middleware/upload');
const controller = require('../controllers/files.controller');
const config = require('../config');

const router = express.Router();

router.post('/', upload.array('files', config.maxFilesPerRequest), controller.uploadFiles);
router.get('/', controller.listFiles);
router.get('/:id', controller.getFile);
router.get('/:id/download', controller.downloadFile);
router.delete('/:id', controller.deleteFile);

module.exports = router;
