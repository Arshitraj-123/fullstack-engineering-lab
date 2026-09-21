(() => {
  const dropzone = document.getElementById('dropzone');
  const fileInput = document.getElementById('file-input');
  const progress = document.getElementById('upload-progress');
  const progressLabel = document.getElementById('conveyor-label');
  const errorSlip = document.getElementById('upload-error');
  const manifestGrid = document.getElementById('manifest-grid');
  const manifestEmpty = document.getElementById('manifest-empty');
  const manifestSummary = document.getElementById('manifest-summary');
  const template = document.getElementById('parcel-template');

  function formatBytes(bytes) {
    if (bytes < 1024) return `${bytes} B`;
    const units = ['KB', 'MB', 'GB'];
    let value = bytes / 1024;
    let unitIndex = 0;
    while (value >= 1024 && unitIndex < units.length - 1) {
      value /= 1024;
      unitIndex += 1;
    }
    return `${value.toFixed(1)} ${units[unitIndex]}`;
  }

  function formatDate(iso) {
    const d = new Date(iso);
    return d.toLocaleString(undefined, {
      month: 'short',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  function showError(message) {
    errorSlip.textContent = `REJECTED \u2014 ${message}`;
    errorSlip.classList.remove('is-hidden');
  }

  function clearError() {
    errorSlip.classList.add('is-hidden');
    errorSlip.textContent = '';
  }

  function setUploading(isUploading, label) {
    progress.classList.toggle('is-hidden', !isUploading);
    if (label) progressLabel.textContent = label;
  }

  async function fetchJson(url, options) {
    const res = await fetch(url, options);
    const body = res.status === 204 ? null : await res.json().catch(() => null);
    if (!res.ok) {
      const message = body && body.error ? body.error.message : `Request failed (${res.status})`;
      throw new Error(message);
    }
    return body;
  }

  function renderParcel(record) {
    const node = template.content.cloneNode(true);
    const article = node.querySelector('.parcel');
    article.dataset.id = record.id;
    node.querySelector('.parcel-id').textContent = `#${record.id.slice(0, 8).toUpperCase()}`;
    node.querySelector('.parcel-name').textContent = record.originalName;
    node.querySelector('.parcel-meta').textContent =
      `${formatBytes(record.size)} \u00b7 ${formatDate(record.uploadedAt)}`;

    const claimLink = node.querySelector('.btn-claim');
    claimLink.href = record.downloadUrl;

    const discardBtn = node.querySelector('.btn-discard');
    discardBtn.addEventListener('click', () => discardParcel(record.id));

    return node;
  }

  async function refreshManifest() {
    const res = await fetchJson('/api/files');
    manifestGrid.innerHTML = '';
    res.data.forEach((record) => manifestGrid.appendChild(renderParcel(record)));
    manifestEmpty.classList.toggle('is-hidden', res.data.length > 0);
    manifestSummary.textContent = `${res.count} parcel${res.count === 1 ? '' : 's'} \u00b7 ${formatBytes(res.totalBytes)} total`;
  }

  async function discardParcel(id) {
    try {
      await fetchJson(`/api/files/${id}`, { method: 'DELETE' });
      await refreshManifest();
    } catch (err) {
      showError(err.message);
    }
  }

  async function uploadFiles(fileList) {
    if (!fileList || fileList.length === 0) return;
    clearError();

    const formData = new FormData();
    Array.from(fileList).forEach((file) => formData.append('files', file));

    setUploading(true, `Scanning ${fileList.length} parcel${fileList.length === 1 ? '' : 's'}\u2026`);
    try {
      await fetchJson('/api/files', { method: 'POST', body: formData });
      await refreshManifest();
    } catch (err) {
      showError(err.message);
    } finally {
      setUploading(false);
      fileInput.value = '';
    }
  }

  dropzone.addEventListener('click', () => fileInput.click());
  fileInput.addEventListener('change', () => uploadFiles(fileInput.files));

  ['dragenter', 'dragover'].forEach((eventName) => {
    dropzone.addEventListener(eventName, (event) => {
      event.preventDefault();
      dropzone.classList.add('is-dragover');
    });
  });

  ['dragleave', 'drop'].forEach((eventName) => {
    dropzone.addEventListener(eventName, (event) => {
      event.preventDefault();
      dropzone.classList.remove('is-dragover');
    });
  });

  dropzone.addEventListener('drop', (event) => {
    uploadFiles(event.dataTransfer.files);
  });

  refreshManifest();
})();
