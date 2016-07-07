// @flow
import AirbrakeJS from 'airbrake-js';
import _ from 'lodash';

declare var serverConfig: any;

let airbrake;

function init() {
  airbrake = new AirbrakeJS({
    projectId: 126728,
    projectKey: serverConfig.airbrakeKey
  });

  airbrake.addReporter(function(notice) {
    console.log('Airbrake error: ', notice);
  });
}

function notify(error: any) {
  if (_.isUndefined(airbrake)) {
    console.error('Not reporting airbrake error: ', error);
  } else {
    airbrake.notify(error);
  }
}

export default {
  init,
  notify
};
