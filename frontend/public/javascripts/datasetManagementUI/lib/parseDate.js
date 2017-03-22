// TODO: make DSMAPI return timestamps with Zs on the end so we don't have to do this (EN-13126)
export function parseDate(dateStr) {
  return new Date(`${dateStr}Z`);
}
