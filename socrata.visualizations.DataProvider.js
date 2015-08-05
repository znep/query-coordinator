(function(window) {

  'use strict';

  if (!window.socrata || !window.socrata.utils) {
    throw new Error(
      'The `socrata-utils` package is a required dependency for `socrata-visualizations`.'
    );
  }

  window.socrata.visualizations = window.socrata.visualizations || {};

  function DataProvider(config) {

    var _defaultConfig = {
      timeout: 5000
    };
    var _config;

    _config = _.merge(_defaultConfig, config);

    this.getConfig = function(property) {

      if (!_.has(_config, property)) {

        throw new Error(
          'Configuration property `{0}` does not exist.'.format(property)
        );
      }

      return _config[property];
    };

    this.emitEvent = function(name, payload) {
      this.element[0].dispatchEvent(
        new window.CustomEvent(
          name,
          { detail: payload, bubbles: true }
        )
      );
    };

    function _logWarning(message) {
      if (window.console && window.console.warn) {
        window.console.warn(message);
      }
    }

    function _logError(message) {
      if (window.console && window.console.error) {
        window.console.error(message);
      }
    }
  }

  window.socrata.visualizations.DataProvider = DataProvider;
})(window);
