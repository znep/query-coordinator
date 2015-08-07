(function(root) {

  'use strict';

  if (!root.socrata || !root.socrata.utils) {
    throw new Error(
      'The `socrata-utils` package is a required dependency for `socrata-visualizations`.'
    );
  }

  root.socrata.visualizations = root.socrata.visualizations || {};

  function DataProvider(config) {

    var _defaultConfig = {
      timeout: 5000
    };
    var _config = _.merge(_defaultConfig, config);


    /**
     * @param {String} property - The desired configuration property key.
     *
     * @return {*} - The configuration property value that was passed in
     *   at instantiation.
     */
    this.getConfigurationProperty = function(property) {

      if (!_.has(_config, property)) {

        throw new Error(
          'Configuration property `{0}` does not exist.'.format(property)
        );
      }

      return _config[property];
    };

    this.emitEvent = function(name, payload) {
      this.element[0].dispatchEvent(
        new root.CustomEvent(
          name,
          { detail: payload, bubbles: true }
        )
      );
    };

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

  root.socrata.visualizations.DataProvider = DataProvider;
})(window);
