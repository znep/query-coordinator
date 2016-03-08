import $ from 'jQuery';
import _ from 'lodash';
import Airbrake from 'airbrake';

import Environment from '../StorytellerEnvironment';
import StorytellerUtils from '../StorytellerUtils';

/**
 * @class ExceptionNotifier
 * @description
 * A small wrapper class for airbrake-client-js. Exposes a `.notify`
 * method for elected errors. This class will notify on unexpected
 * errors that surface through the window error event.
 * @param {Object} options - Class and airbrake-client-js options.
 * @param {String} options.environment - Describes the expected environment, such as 'development'.
 * @param {String} options.projectKey - A valid Airbrake project key.
 * @param {String} options.projectId - A valid Airbrake project id.
 */
export var exceptionNotifier = new ExceptionNotifier(Environment.AIRBRAKE);
export default function ExceptionNotifier(options) {
  var _self = this;
  var _airbrake;
  var _options = options || {};
  var _environment = _options.ENVIRONMENT_NAME;
  var _airbrakeOptions = _.omit(_options, 'ENVIRONMENT_NAME');

  setup();
  attachEvents();

  function setup() {
    if (typeof _airbrakeOptions.PROJECT_ID === 'string') {
      _airbrake = new Airbrake({
        projectId: _airbrakeOptions.PROJECT_ID,
        projectKey: _airbrakeOptions.API_KEY
      });

      _airbrake.addFilter(function(notice) {
        notice.context.environment = _environment;
        return notice;
      });
    }
  }

  function attachEvents() {
    $(window).error(function(event) {
      _self.notify(event.originalEvent.error);
    });
  }

  /**
   * @function notify
   * @description
   * Exposes an error through Airbrake, if it is available.
   * In either case, it will `console.error` the argument passed
   * into this function.
   * Additionally, an exception is sent to Google Analytics for tracking.
   * @param {Any} error - Anything that should be logged in Airbrake/console.
   */
  this.notify = function(error) {
    if (!_.isUndefined(_airbrake)) {
      _airbrake.notify(error);
    }

    console.error(error);

    if (typeof window.ga === 'function') {
      var message = error.message || error;

      window.ga('send', 'exception', {
        'exDescription': StorytellerUtils.format('Airbrake notification: {0}', message),
        'exFatal': false
      });
    }
  };
}
