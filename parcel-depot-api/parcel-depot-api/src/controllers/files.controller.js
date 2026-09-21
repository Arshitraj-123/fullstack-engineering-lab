const fs = require('fs');
const path = require('path');
const config = require('../config');
const ApiError = require('../utils/ApiError');
const filesStore = require('../data/filesStore');

function toPublic(record) {
  return {
    id: record.id,
    originalName: record.originalName,
    mimeType: record.mimeType,
    size: record.size,
    uploadedAt: record.uploadedAt,
    downloadUrl: `/api/files/${record.id}/download`,
  };
}

function uploadFiles(req, res) {
  const uploaded = req.files || [];
  if (uploaded.length === 0) {
    throw ApiError.badRequest('No files were attached. Use the "files" form field.');
  }

  const records = uploaded.map((file) =>
    filesStore.create({
      originalName: file.originalname,
      storedName: file.filename,
      mimeType: file.mimetype,
      size: file.size,
    })
  );

  res.status(201).json({ data: records.map(toPublic) });
}

function listFiles(req, res) {
  const records = filesStore.findAll();
  const totalBytes = records.reduce((sum, record) => sum + record.size, 0);
  res.status(200).json({ data: records.map(toPublic), count: records.length, totalBytes });
}

function getFile(req, res) {
  const record = filesStore.findById(req.params.id);
  if (!record) {
    throw ApiError.notFound(`No file found with id ${req.params.id}`);
  }
  res.status(200).json({ data: toPublic(record) });
}

function downloadFile(req, res) {
  const record = filesStore.findById(req.params.id);
  if (!record) {
    throw ApiError.notFound(`No file found with id ${req.params.id}`);
  }

  const filePath = path.join(config.uploadDir, record.storedName);
  if (!fs.existsSync(filePath)) {
    throw ApiError.notFound('File metadata exists but the file is missing on disk');
  }

  // nosniff + an explicit attachment disposition mean a browser will
  // never try to render an uploaded file (e.g. HTML/SVG) as a page.
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.download(filePath, record.originalName);
}

function deleteFile(req, res) {
  const record = filesStore.remove(req.params.id);
  if (!record) {
    throw ApiError.notFound(`No file found with id ${req.params.id}`);
  }

  const filePath = path.join(config.uploadDir, record.storedName);
  fs.unlink(filePath, () => {}); // best-effort; metadata is already gone

  res.status(204).send();
}

module.exports = { uploadFiles, listFiles, getFile, downloadFile, deleteFile };
