# Parcel Depot API

A file upload API built with **Node.js**, **Express**, and **Multer** —
validated file types and size limits, disk storage with safe generated
filenames, metadata listing, download, and delete — with a loading-dock
themed UI ("Receiving Dock") to exercise it from a browser.

## Why this design

- **Extension whitelist, not a blocklist.** `src/config.js` lists exactly
  which extensions are accepted (images, PDF, text/CSV/Markdown, common
  Office formats, ZIP). A blocklist has to predict every dangerous
  extension in advance; a whitelist just has to be accurate about what's
  actually needed.
- **Never trust the client's filename for the name on disk.**
  `src/middleware/upload.js` generates a random UUID-based filename for
  every stored file (`multer.diskStorage`'s `filename` callback). The
  client's original name is kept only as display metadata, which closes
  off path-traversal and filename-collision attacks in one move.
- **Downloads are never sniffed or rendered.** `X-Content-Type-Options:
  nosniff` plus `res.download()`'s `Content-Disposition: attachment`
  mean a browser will never try to execute or render an uploaded file
  (e.g. an uploaded `.html` or `.svg`) — it always offers it as a file to
  save instead.
- **Metadata vs. bytes are separate concerns.** `src/data/filesStore.js`
  is an in-memory manifest (id, original name, stored name, size, mime
  type, timestamp); the actual bytes live on disk under `uploads/`,
  written by Multer. Swapping the manifest for a real database wouldn't
  touch how files are stored or served.
- **Multer's own errors get the same JSON shape as everything else.**
  `src/middleware/errorHandler.js` translates `MulterError` (file too
  large, too many files) into the API's normal `{ error: { message } }`
  format instead of leaking Multer's internal error text.

## Run it

```bash
npm install
npm start
```

Open `http://localhost:3000` for the Receiving Dock UI, or use the API
directly (see below).

For auto-restart on file changes:

```bash
npm run dev
```

## Run the tests

```bash
npm test
```

11 tests cover single and multi-file upload, extension rejection, the
size-limit rejection, listing with a running byte total, fetching
metadata, downloading (byte-for-byte, with the safety headers asserted),
and deletion (including the disk file actually being removed).

## The UI

- **Receiving Dock (drop zone):** drag-and-drop or click-to-browse, with
  a caution-stripe accent bar and a live "conveyor belt" progress
  indicator while files upload.
- **Manifest:** every uploaded file renders as a kraft-paper parcel tag —
  tracking number, filename, size/timestamp, a decorative barcode, and a
  red "RECEIVED" ink stamp — with **Claim** (download) and **Discard**
  (delete) actions.
- Rejected uploads (bad extension, too large, etc.) show as a "REJECTED"
  slip rather than a generic browser alert.

## Endpoints

| Method | Path                     | Description                                            |
| ------ | ------------------------ | -------------------------------------------------------- |
| POST   | `/api/files`               | Upload 1&ndash;5 files (multipart field name `files`)      |
| GET    | `/api/files`               | List all uploaded files, with a running byte total          |
| GET    | `/api/files/:id`            | Get metadata for one file                                    |
| GET    | `/api/files/:id/download`   | Download the original file                                    |
| DELETE | `/api/files/:id`            | Delete a file (disk + metadata)                                |
| GET    | `/api/health`               | Liveness check                                                   |

Successful responses are shaped as `{ "data": ... }` (list adds `count`
and `totalBytes`). Errors are shaped as `{ "error": { "message": ... } }`.

### Example requests

```bash
# Upload one or more files
curl -X POST http://localhost:3000/api/files \
  -F "files=@report.pdf" \
  -F "files=@diagram.png"

# List everything received so far
curl http://localhost:3000/api/files

# Download a file (replace <id> with a real id from the list above)
curl -OJ http://localhost:3000/api/files/<id>/download

# Delete a file
curl -X DELETE http://localhost:3000/api/files/<id>
```

## Configuration

Edit `src/config.js` (or set the matching environment variables) to
change the size limit (`MAX_FILE_SIZE_BYTES`, default 10 MB), the max
files per request (`MAX_FILES_PER_REQUEST`, default 5), or the allowed
extensions list.

## Project structure

```
server.js                     # entry point
src/app.js                    # express app assembly (used by both server.js and tests)
src/config.js                 # size/count limits, allowed extensions
src/routes/files.routes.js
src/controllers/files.controller.js
src/data/filesStore.js        # in-memory manifest (bytes live on disk under uploads/)
src/middleware/upload.js      # multer: disk storage, extension whitelist, limits
src/middleware/notFound.js
src/middleware/errorHandler.js  # includes MulterError translation
src/utils/ApiError.js
public/index.html             # Receiving Dock UI
public/styles.css
public/app.js
tests/files.test.js           # jest + supertest suite (11 tests)
uploads/                      # uploaded files land here (gitignored except .gitkeep)
```
