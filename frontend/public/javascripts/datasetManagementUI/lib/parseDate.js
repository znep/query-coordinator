export function parseDate(dateStr) {
  if (dateStr && dateStr.indexOf('Z') !== -1) {
    return new Date(`${dateStr}Z`);
  }
  return new Date(dateStr);
}
