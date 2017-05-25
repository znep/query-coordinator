import _ from 'lodash';
import AirbrakeJs from 'airbrake-js';

import ieFilter from './filters/ie';
import environmentFilter from './filters/environment';

let airbrake;

function init(projectId, projectKey) {
  if (projectId == undefined) {
    if (window.console && console.error) {
      console.error('`projectId` is required for airbrake.init()');
    }
  }

  if (projectKey == undefined) {
    if (window.console && console.error) {
      console.error('`projectKey` is required for airbrake.init()');
    }
  }

  airbrake = new AirbrakeJs({
    projectId,
    projectKey
  });

  // Default filters
  airbrake.addFilter(ieFilter);
  airbrake.addFilter(environmentFilter);

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
  if (window.console && console.error) {
    console.error('Airbrake notification:', payload);
  }

  getAirbrake((ab) => {
    ab.notify(payload);
  });
}

function addFilter(filterCallback) {
  getAirbrake((ab) => {
    ab.addFilter(filterCallback);
  });
}

export default {
  init,
  notify,
  addFilter
};
