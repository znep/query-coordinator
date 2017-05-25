import _ from 'lodash';

// Adds information about the environment on the context object
export default function environmentFilter(notice) {
  if (_.has(window.serverConfig, 'airbrakeEnvironment')) {
    notice.context.environment = window.serverConfig.airbrakeEnvironment;
  }

  return notice;
}
