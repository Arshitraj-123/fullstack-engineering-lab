const fs = require('fs');
const path = require('path');
const os = require('os');
const request = require('supertest');
const createApp = require('../src/app');
const filesStore = require('../src/data/filesStore');
const config = require('../src/config');

const app = createApp();

function tempFile(name, content) {
  const filePath = path.join(os.tmpdir(), name);
  fs.writeFileSync(filePath, content);
  return filePath;
}

beforeEach(() => {
  filesStore.reset();
  // Clean any files left in the real upload dir between tests
  for (const name of fs.readdirSync(config.uploadDir)) {
    if (name !== '.gitkeep') {
      fs.unlinkSync(path.join(config.uploadDir, name));
    }
  }
});

describe('POST /api/files', () => {
  it('uploads a single allowed file', async () => {
    const filePath = tempFile('note.txt', 'hello depot');
    const res = await request(app).post('/api/files').attach('files', filePath);

    expect(res.status).toBe(201);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0].originalName).toBe('note.txt');
    expect(res.body.data[0].downloadUrl).toMatch(/^\/api\/files\/.+\/download$/);
  });

  it('uploads multiple files in one request', async () => {
    const a = tempFile('a.txt', 'aaa');
    const b = tempFile('b.txt', 'bbb');
    const res = await request(app).post('/api/files').attach('files', a).attach('files', b);

    expect(res.status).toBe(201);
    expect(res.body.data).toHaveLength(2);
  });

  it('rejects a disallowed file extension', async () => {
    const filePath = tempFile('script.exe', 'not really an exe');
    const res = await request(app).post('/api/files').attach('files', filePath);

    expect(res.status).toBe(400);
    expect(res.body.error.message).toMatch(/not allowed/i);
  });

  it('rejects a file over the size limit', async () => {
    const bigPath = path.join(os.tmpdir(), 'big.txt');
    fs.writeFileSync(bigPath, Buffer.alloc(config.maxFileSizeBytes + 1024, 'x'));

    const res = await request(app).post('/api/files').attach('files', bigPath);

    expect(res.status).toBe(413);
    fs.unlinkSync(bigPath);
  });

  it('rejects a request with no file attached', async () => {
    const res = await request(app).post('/api/files');
    expect(res.status).toBe(400);
  });
});

describe('GET /api/files', () => {
  it('lists uploaded files with a running byte total', async () => {
    const filePath = tempFile('list-me.txt', 'contents');
    await request(app).post('/api/files').attach('files', filePath);

    const res = await request(app).get('/api/files');
    expect(res.status).toBe(200);
    expect(res.body.count).toBe(1);
    expect(res.body.totalBytes).toBeGreaterThan(0);
  });
});

describe('GET /api/files/:id', () => {
  it('404s for an unknown id', async () => {
    const res = await request(app).get('/api/files/does-not-exist');
    expect(res.status).toBe(404);
  });

  it('returns metadata for a known file', async () => {
    const filePath = tempFile('meta.txt', 'meta contents');
    const upload = await request(app).post('/api/files').attach('files', filePath);
    const id = upload.body.data[0].id;

    const res = await request(app).get(`/api/files/${id}`);
    expect(res.status).toBe(200);
    expect(res.body.data.originalName).toBe('meta.txt');
  });
});

describe('GET /api/files/:id/download', () => {
  it('streams the original file back with the original name', async () => {
    const filePath = tempFile('download-me.txt', 'download contents');
    const upload = await request(app).post('/api/files').attach('files', filePath);
    const id = upload.body.data[0].id;

    const res = await request(app).get(`/api/files/${id}/download`);
    expect(res.status).toBe(200);
    expect(res.headers['content-disposition']).toMatch(/download-me\.txt/);
    expect(res.headers['x-content-type-options']).toBe('nosniff');
    expect(res.text).toBe('download contents');
  });
});

describe('DELETE /api/files/:id', () => {
  it('deletes the metadata and the file on disk', async () => {
    const filePath = tempFile('delete-me.txt', 'bye');
    const upload = await request(app).post('/api/files').attach('files', filePath);
    const { id, } = upload.body.data[0];

    const del = await request(app).delete(`/api/files/${id}`);
    expect(del.status).toBe(204);

    const getAfter = await request(app).get(`/api/files/${id}`);
    expect(getAfter.status).toBe(404);
  });

  it('404s when deleting an unknown id', async () => {
    const res = await request(app).delete('/api/files/does-not-exist');
    expect(res.status).toBe(404);
  });
});
