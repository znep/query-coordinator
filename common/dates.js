import _ from 'lodash';
import moment from 'moment';
import momentTimezone from 'moment-timezone';
import jstz from 'jstz';

// Formats an ISO8601 date to something pretty like January 1, 1970.
export function formatDate(date, format, fallback) {
  const dateFormat = _.defaultTo(format, 'MMMM D, YYYY');
  const momentDate = moment(date, moment.ISO_8601);
  return momentDate.isValid() ? momentDate.format(dateFormat) : fallback;
}

export function formatToSoqlDate(date) {
  return date.format('YYYY-MM-DDTHH:mm:ss');
}

export function formatToInclusiveSoqlDateRange(value, options = {}) {
  let { start, end } = value;

  start = moment(start).startOf('day');
  end = moment(end).endOf('day');

  if (options.asUTC) {
    start = start.utc();
    end = end.utc();
  }

  start = formatToSoqlDate(start);
  end = formatToSoqlDate(end);

  return { start, end };
}

const getLocale = () => _.get(window.blist, 'locale', _.get(window.serverConfig, 'locale', 'en'));
const getTimezone = () => _.get(window.blist, 'configuration.userTimeZoneName', jstz.determine().name());

// Formats an ISO8601 date to something pretty like January 1, 1970.
// If there are any changes made to the formatting logic below, make corresponding changes to:
// frontend/public/javascripts/common/locale.js:dateLocalize()
// And frontend/public/javascripts/screens/all-screens.js
// On or about ~L230:$('.dateLocalize').each(function() { ...
export function formatDateWithLocale(date) {
  const locale = _.defaultTo((window.serverConfig || {}).locale, 'en');
  const dateFormat = (locale === 'en') ? 'MMMM D, YYYY' : 'LL';

  return momentTimezone(date, momentTimezone.ISO_8601).
    tz(getTimezone()).
    locale(getLocale()).
    format(dateFormat);
}

// Where rawdate is seconds-since-epoch (how core returns
// timestamps to us)
export function formatRawDateAsISO8601(rawdate) {
  return moment(rawdate * 1000).
    tz(getTimezone()).
    toISOString();
}
