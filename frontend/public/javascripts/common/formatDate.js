import _ from 'lodash';
import moment from 'moment-timezone';
import jstz from 'jstz';

const getLocale = () => _.get(window.blist, 'locale', _.get(window.serverConfig, 'locale', 'en'));

const getTimezone = () => _.get(window.blist, 'configuration.userTimeZoneName', jstz.determine().name());

// Formats an ISO8601 date to something pretty like January 1, 1970.
// If there are any changes made to the formatting logic below, make corresponding changes to:
// frontend/public/javascripts/common/locale.js:dateLocalize()
// And frontend/public/javascripts/screens/all-screens.js
// On or about ~L230:$('.dateLocalize').each(function() { ...
export default function formatDate(date) {
  const locale = _.defaultTo(serverConfig.locale, 'en');
  const dateFormat = (locale === 'en') ? 'MMMM D, YYYY' : 'LL';

  return moment(date, moment.ISO_8601).tz(getTimezone()).locale(getLocale()).format(dateFormat);
}
