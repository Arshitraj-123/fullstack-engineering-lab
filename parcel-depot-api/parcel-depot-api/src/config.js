const path = require('path');

module.exports = {
  port: process.env.PORT || 3000,

  uploadDir: path.join(__dirname, '..', 'uploads'),

  maxFileSizeBytes: Number(process.env.MAX_FILE_SIZE_BYTES || 10 * 1024 * 1024), // 10 MB
  maxFilesPerRequest: Number(process.env.MAX_FILES_PER_REQUEST || 5),

  // Whitelist by extension. Anything not listed here is rejected, which
  // is a safer default than a blocklist (new dangerous extensions don't
  // silently become allowed).
  allowedExtensions: [
    '.png', '.jpg', '.jpeg', '.gif', '.webp',
    '.pdf', '.txt', '.csv', '.md', '.json',
    '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx',
    '.zip',
  ],
};
