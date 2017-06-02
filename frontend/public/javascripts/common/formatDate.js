import _ from 'lodash';
import moment from 'moment';

// Formats an ISO8601 date to something pretty like January 1, 1970.
export default function formatDate(date) {
  const locale = _.defaultTo(serverConfig.locale, 'en');
  const dateFormat = (locale === 'en') ? 'MMMM D, YYYY' : 'LL';
  return moment(date, moment.ISO_8601).locale(locale).format(dateFormat);
}
