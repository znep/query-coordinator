(function(window) {

  'use strict';

  if (!window.socrata || window.socrata.utils) {
    throw new Error(
      '`socrata-utils` is a required dependency for `socrata-visualizations`'
    );
  }

  window.socrata.visualizations = window.socrata.visualizations || {};

  function Visualization(element, config) {

    var _config;

    _config = config;
    _config.localization = _config.localization || {};

    this.element = element;

    this.getConfig = function() {
      return _config;
    };

    this.getLocalization = function(key) {

      var localizedString = '';

      if (_.has(_config.localization, key)) {
        localizedString = _config.localization[key];
      } else {
        _logWarning('No localized string found for key `{0}`.'.format(key));
      }

      return localizedString;
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

  window.socrata.visualizations.Visualization = Visualization;
})(window);
