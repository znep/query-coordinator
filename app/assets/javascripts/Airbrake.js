(function() {

  'use strict';

  var storyteller = window.storyteller;

  function Airbrake(options) {
    var _self = this;
    var _airbrake;
    var _options = options;

    build();
    attachEvents();

    function build() {
      if (_options.projectKey !== null) {
        _airbrake = new airbrakeJs.Client(_options);
        _airbrake.addFilter(function(notice) {
          notice.context.environment = _options.environment;
          return notice;
        });
      }
    }

    function attachEvents() {
      $(window).error(function(event) {
        _self.notify(event.originalEvent.error);
      });
    }

    this.notify = function(error) {
      if (!_.isUndefined(_airbrake)) {
        _airbrake.notify(error);
      }

      console.error(error);
    };
  }


  storyteller.Airbrake = Airbrake;
})();
