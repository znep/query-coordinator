import _ from 'lodash';
import moment from 'moment-timezone';
import jstz from 'jstz';

const getLocale = () => _.get(window.blist, 'locale', _.get(window.serverConfig, 'locale', 'en'));

const getTimezone = () => _.get(window.blist, 'configuration.userTimeZoneName', jstz.determine().name());

// Parses an ISO8601 date and returns a Moment instance.
// The timezone is set to the user's configured timezone (window.blist.configuration.userTimeZoneName)
// with the browser's timezone as a fallback.
export const parseISO8601Date = (dateString) => moment(dateString, moment.ISO_8601).tz(getTimezone());

// Formats an ISO8601 date to something pretty like January 1, 1970.
// If there are any changes made to the formatting logic below, make corresponding changes to:
// frontend/public/javascripts/common/locale.js:dateLocalize()
// And frontend/public/javascripts/screens/all-screens.js
// On or about ~L230:$('.dateLocalize').each(function() { ...
export default function formatDate(date) {
  const locale = _.defaultTo(serverConfig.locale, 'en');
  const dateFormat = (locale === 'en') ? 'MMMM D, YYYY' : 'LL';

  return parseISO8601Date(date).locale(getLocale()).format(dateFormat);
}
