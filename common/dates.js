import _ from 'lodash';
import moment from 'moment';

// Formats an ISO8601 date to something pretty like January 1, 1970.
export function formatDate(date, format, fallback) {
  const dateFormat = _.defaultTo(format, 'MMMM D, YYYY');
  const momentDate = moment(date, moment.ISO_8601);
  return momentDate.isValid() ? momentDate.format(dateFormat) : fallback;
}

export function formatToSoqlDate(date) {
  return date.format('YYYY-MM-DDTHH:mm:ss');
}

export function formatToInclusiveSoqlDateRange(value) {
  const start = formatToSoqlDate(moment(value.start).startOf('day'));
  const end = formatToSoqlDate(moment(value.end).endOf('day'));

  return { start, end };
}
