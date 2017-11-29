export function parseDate(dateStr) {
  if (!dateStr) {
    return null;
  }
  if (typeof dateStr === 'string' && dateStr.indexOf('Z') === -1) {
    return new Date(`${dateStr}Z`);
  }
  return new Date(dateStr);
}
