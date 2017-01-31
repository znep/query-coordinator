import AirbrakeJs from 'airbrake-js';

export const init = () => {
  new AirbrakeJs({
    projectId: 126027,
    projectKey: window.serverConfig.airbrakeKey
  }).addReporter(function(notice) {
    console.warn('Airbrake error: ', notice);
  });
};
