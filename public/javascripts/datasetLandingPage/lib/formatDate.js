import moment from 'moment';

// Formats an ISO8601 date to something pretty like January 1, 1970.
export default function formatDate(date) {
  return moment(date, moment.ISO_8601).format('MMMM D, YYYY');
}
