import _ from 'lodash';
import AirbrakeJs from 'airbrake-js';

let airbrake;

function init(projectId, projectKey) {
  airbrake = new AirbrakeJs({
    projectId,
    projectKey
  });

  airbrake.addFilter((notice) => {
    const browser = _.get(notice, 'context.userAgentInfo.browserName');
    const browserVersion = _.toNumber(_.get(notice, 'context.userAgentInfo.browserVersion'));

    if (browser === 'Internet Explorer' && browserVersion < 11) {
      return null;
    }

    if (_.has(window.serverConfig, 'airbrakeEnvironment')) {
      notice.context.environment = window.serverConfig.airbrakeEnvironment;
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
