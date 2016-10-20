import moment from 'moment';

// Formats an ISO8601 date to something pretty like January 1, 1970.
export function formatDate(date, fallback) {
  const momentDate = moment(date, moment.ISO_8601);
  return momentDate.isValid() ? momentDate.format('MMMM D, YYYY') : fallback;
}
