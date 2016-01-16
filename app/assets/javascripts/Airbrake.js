(function() {

  'use strict';

  var storyteller = window.storyteller;

  /**
   * @class Airbrake
   * @description
   * A small wrapper class for airbrake-client-js. Exposes a `.notify`
   * method for elected errors. This class will notify on unexpected
   * errors that surface through the window error event.
   * @param {Object} options - Class and airbrake-client-js options.
   * @param {String} options.environment - Describes the expected environment, such as 'development'.
   * @param {String} options.projectKey - A valid Airbrake project key.
   * @param {String} options.projectId - A valid Airbrake project id.
   */
  function Airbrake(options) {
    var _self = this;
    var _airbrake;
    var _environment = options.environment;
    var _airbrakeOptions = _.omit(options, 'environment');

    setup();
    attachEvents();

    function setup() {
      if (_airbrakeOptions.projectKey !== null) {
        _airbrake = new airbrakeJs.Client(_airbrakeOptions);
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

      ga('send', 'exception', {
        'exDescription': 'Airbrake notification: {0}'.format(error.message),
        'exFatal': false
      });
    };
  }

  storyteller.Airbrake = Airbrake;
})();
