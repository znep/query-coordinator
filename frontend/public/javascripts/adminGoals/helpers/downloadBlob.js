/**
 * Opens a file save dialog for the given blob data. Useful
 * for the files created on the fly.
 *
 * @param {String} fileName
 * @param {Blob} blob
 */
export default function downloadBlob(fileName, blob) {
  const blobUrl = URL.createObjectURL(blob);

  const a = document.createElement('a');
  a.style.display = 'none';

  document.body.appendChild(a);
  a.href = blobUrl;
  a.download = fileName;
  a.click();

  URL.revokeObjectURL(blobUrl);
  document.body.removeChild(a);
}
