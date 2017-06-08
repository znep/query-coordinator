import _ from 'lodash';

// We dont want to send any airbrake notices for any IE < 11
export default function ieFilter(notice) {
  const browser = _.get(notice, 'context.userAgentInfo.browserName');
  const browserVersion = _.toNumber(_.get(notice, 'context.userAgentInfo.browserVersion'));

  if (browser === 'Internet Explorer' && browserVersion < 11) {
    return null;
  }

  return notice;
}
