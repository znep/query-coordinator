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

const warnOnce = _.once(() => {
  if (window.console && console.info) {
    console.info('Airbrake not initialized.');
  }
});

// If airbrake has been initialized, provide it to the callback.
// If it has not been initialized, prints a warning once.
function getAirbrake(callback) {
  if (airbrake) {
    callback(airbrake);
  } else {
    warnOnce();
  }
}

// Convenience function - if airbrake has been initialized, call notify
// on it with the given payload. If not, warn once.
function notify(payload) {
  getAirbrake((ab) => {
    ab.notify(payload);
  });
}

export default {
  init,
  getAirbrake,
  notify
};
