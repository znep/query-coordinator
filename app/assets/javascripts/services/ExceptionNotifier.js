import $ from 'jQuery';
import _ from 'lodash';
import Airbrake from 'airbrake';

import Environment from '../StorytellerEnvironment';
import StorytellerUtils from '../StorytellerUtils';

/**
 * @class ExceptionNotifier
 *
 * @description
 * A small wrapper class for airbrake-client-js. Exposes a `.notify`
 * method for elected errors. This class will notify on unexpected
 * errors that surface through the window error event.
 *
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

    if (typeof _airbrakeOptions.PROJECT_ID !== 'string') {
      return;
    }

    _airbrake = new Airbrake({
      projectId: _airbrakeOptions.PROJECT_ID,
      projectKey: _airbrakeOptions.API_KEY
    });

    _airbrake.addFilter(function(notice) {
      notice.context.environment = _environment;
      return notice;
    });
  }

  function attachEvents() {

    $(window).error(
      function(event) {

        _self.notify(event.originalEvent.error);
      }
    );
  }

  /**
   * @function notify
   *
   * @description
   * Exposes an error through Airbrake, if it is available.
   * In either case, it will `console.error` the argument passed
   * into this function.
   *
   * Additionally, an exception is sent to Google Analytics for tracking.
   *
   * @param {Any} error - Anything that should be logged in Airbrake/console.
   */
  this.notify = function(error) {
    var message;

    // EN-5600 - Tons of Airbrake errors recently
    //
    // In some cases (such as using the format Promise.resolve($.ajax(...)) we
    // end up with this code handling an 'error' which is actually a jQuery XHR
    // object.
    //
    // This is problematic because jQuery XHR objects have a `.error` property
    // (which is what Airbrake looks for, and expects to be an actual instance
    // of an Error), but the jQuery XHR object's `.error` property is actually
    // a function. This results in the `.toString()` of that function being
    // logged to Airbrake every time a request fails unexpectedly, which is
    // both a relatively common occurrence and a totally useless error report.
    // See the ticket for an example of what this looks like.
    //
    // Here the existence of both `error` and `pipe` on the alleged error
    // object, when both are functions, is used as a proxy test that the object
    // in question is a jQuery XHR object (we can't check instanceof since it's
    // just a plain object).
    if (
      _.isFunction(_.get(error, 'error')) &&
      _.isFunction(_.get(error, 'pipe')) &&
      _.isFunction(_.get(error, 'getAllResponseHeaders'))
    ) {

      error = new Error(
        'Attempted to notify with a function not an error (usually this is ' +
        'because a jQuery AJAX call has failed). Parent jQuery XHR object: ' +
        '"{0}"; response headers: "{1}"'.
          format(
            JSON.stringify(error),
            error.getAllResponseHeaders()
          )
      );
    }

    if (!_.isUndefined(_airbrake)) {
      _airbrake.notify(error);
    }

    console.error(error);

    if (typeof window.ga === 'function') {
      message = error.message || error;

      window.ga(
        'send',
        'exception',
        {
          'exDescription': StorytellerUtils.format('Airbrake notification: {0}', message),
          'exFatal': false
        }
      );
    }
  };
}
