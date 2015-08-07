(function(root) {

  'use strict';

  if (!root.socrata || !root.socrata.utils) {
    throw new Error(
      'The `socrata-utils` package is a required dependency for `socrata-visualizations`.'
    );
  }

  if (!_.has(root, 'jQuery')) {
    throw new Error('jQuery is a required dependency for `socrata.visualizations.Visualization.js`.');
  }

  root.socrata.visualizations = root.socrata.visualizations || {};

  function Visualization(element, config) {

    var _defaultConfig = {
      localization: {}
    }
    var _config =_.merge(_defaultConfig, config);

    this.element = element;

    /**
     * Public methods
     */

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

    this.emitEvent = function(name, payload) {
      this.element[0].dispatchEvent(
        new root.CustomEvent(
          name,
          { detail: payload, bubbles: true }
        )
      );
    };

    /**
     * Private methods
     */

    function _logWarning(message) {
      if (root.console && root.console.warn) {
        root.console.warn(message);
      }
    }

    function _logError(message) {
      if (root.console && root.console.error) {
        root.console.error(message);
      }
    }
  }

  root.socrata.visualizations.Visualization = Visualization;
})(window);
