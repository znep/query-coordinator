import AirbrakeJS from 'airbrake-js';
import _ from 'lodash';

let airbrake;

function init() {
  airbrake = new AirbrakeJS({
    projectId: 126728, // Publishing airbrake project (should we change this?)
    projectKey: serverConfig.airbrakeKey
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
