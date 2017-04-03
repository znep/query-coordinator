import $ from 'jquery';
import _ from 'lodash';
import Airbrake from 'airbrake-js';

import Environment from '../StorytellerEnvironment';

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
export const exceptionNotifier = new ExceptionNotifier(Environment.AIRBRAKE);

export default function ExceptionNotifier(options) {
  options = options || {};

  const self = this;
  const environment = options.ENVIRONMENT_NAME;
  const airbrake = setup();
  attachEvents();

  function setup() {
    const airbrakeOptions = _.omit(options, 'ENVIRONMENT_NAME');

    if (!_.isString(airbrakeOptions.PROJECT_ID)) {
      return null;
    }

    const instance = new Airbrake({
      projectId: airbrakeOptions.PROJECT_ID,
      projectKey: airbrakeOptions.API_KEY
    });

    instance.addFilter((notice) => {
      notice.context.environment = environment;
      return notice;
    });

    return instance;
  }

  function attachEvents() {
    $(window).error((event) => {
      self.notify(event.originalEvent.error);
    });
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
  this.notify = (error) => {
    const params = {};

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
    if (_.isFunction(_.get(error, 'error'))) {
      const { responseText, status, statusText } = error; // Really a jqXHR!
      const headers = error.getAllResponseHeaders();

      error = new Error(
        `Failed AJAX request (${status} ${statusText}): ${responseText}`
      );
      params.requestId = headers['X-Request-Id'];
    } else if (_.isPlainObject(error)) {
      error = new Error(JSON.stringify(error));
    } else if (!_.isError(error)) {
      error = new Error(error);
    }

    if (airbrake) {
      airbrake.notify({
        err: error,
        params: params
      });
    }

    console.error(error);

    if (_.isFunction(window.ga)) {
      window.ga('send', 'exception', {
        exDescription: `Airbrake notification: ${error.message}`,
        exFatal: false
      });
    }
  };
}
