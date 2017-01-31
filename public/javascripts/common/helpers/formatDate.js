import moment from 'moment';

// TODO Might want to move this up a level the directory tree.

// Formats an ISO8601 date to something pretty like January 1, 1970.
export default function formatDate(date) {
  const locale = _.defaultTo(serverConfig.locale, 'en');
  return moment(date, moment.ISO_8601).locale(locale).format('MMMM D, YYYY');
}
