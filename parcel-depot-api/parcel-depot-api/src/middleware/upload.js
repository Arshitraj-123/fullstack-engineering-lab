const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const multer = require('multer');
const config = require('../config');
const ApiError = require('../utils/ApiError');

if (!fs.existsSync(config.uploadDir)) {
  fs.mkdirSync(config.uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, config.uploadDir);
  },
  filename: (req, file, cb) => {
    // Never trust the client's filename for the name on disk — it can
    // contain path traversal sequences or collide with an existing file.
    // The original name is preserved separately, only for display.
    const ext = path.extname(file.originalname).toLowerCase();
    const storedName = `${crypto.randomUUID()}${ext}`;
    cb(null, storedName);
  },
});

function fileFilter(req, file, cb) {
  const ext = path.extname(file.originalname).toLowerCase();
  if (!config.allowedExtensions.includes(ext)) {
    cb(ApiError.badRequest(`File type "${ext || 'unknown'}" is not allowed`));
    return;
  }
  cb(null, true);
}

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: config.maxFileSizeBytes,
    files: config.maxFilesPerRequest,
  },
});

module.exports = upload;
