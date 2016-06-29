import AirbrakeJs from 'airbrake-js';

var airbrake;

function init() {
  airbrake = new AirbrakeJs({
    projectId: 126027,
    projectKey: window.serverConfig.airbrakeKey
  });

  airbrake.addReporter(function(notice) {
    console.log('Airbrake error: ', notice);
  });
}

export default {
  init
};
