import _ from 'lodash';

// We dont want to send any airbrake notices for any IE < 11
export default function ieFilter(notice) {
  const userAgentString = _.get(notice, 'context.userAgent');

  // Regex based on http://www.useragentstring.com/pages/useragentstring.php?name=Internet+Explorer
  // which should match any 'MSIE XX' where XX isn't '11'
  // IE Edge doesn't seem to have 'MSIE' in its user agent string so it should also be ignored by this rule
  const notIE11 = /MSIE\s(?!11)/;

  if (notIE11.test(userAgentString)) {
    return null;
  }

  return notice;
}
