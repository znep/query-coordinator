import _ from 'lodash';
import AirbrakeJs from 'airbrake-js';

let airbrake;

function init() {
  airbrake = new AirbrakeJs({
    projectId: 126027,
    projectKey: window.serverConfig.airbrakeKey
  });

  airbrake.addFilter((notice) => {
    const browser = _.get(notice, 'context.userAgentInfo.browserName');
    const browserVersion = _.toNumber(_.get(notice, 'context.userAgentInfo.browserVersion'));

    if (browser === 'Internet Explorer' && browserVersion < 11) {
      return null;
    }

    return notice;
  });

  airbrake.addReporter((notice) => {
    console.log('Airbrake error: ', notice);
  });
}

export default {
  init
};
