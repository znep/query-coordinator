var _ = require('lodash');

function DataProvider(config) {

  var _defaultConfig = {
    timeout: 5000
  };
  var _config = _.merge(_defaultConfig, config);

  /**
   * Public methods
   */

  /**
   * @param {String} property - The desired configuration property key.
   *
   * @throws if the property key is not found.
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

  /**
   * @param {String} property - The desired configuration property key.
   * @param {*} default - The value to return if the configuration is not set.
   *
   * @return {*} - The configuration property value that was passed in
   *   at instantiation, or the default value if the value was not configured.
   */
  this.getOptionalConfigurationProperty = function(property, defaultValue) {

    if (!_.has(_config, property)) {
      return defaultValue;
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

  /**
   * Parse headers into a key => value mapping.
   *
   * @param {string} headers - Raw headers as a string.
   *
   * @return {Object} Parsed headers as key value object.
   */
  this.parseHeaders = function(headers) {

    var parsed = {};
    var key;
    var val;
    var colonIndex;

    if (!headers) {
      return parsed;
    }

    headers.
      split('\n').
      forEach(function(line) {
        colonIndex = line.indexOf(':');
        key = line.substr(0, colonIndex).trim().toLowerCase();
        val = line.substr(colonIndex + 1).trim();

        if (key) {
          parsed[key] = parsed[key] ? parsed[key] + ', ' + val : val;
        }
      }
    );

    return parsed;
  };

  /**
   * Private methods
   */
}

module.exports = DataProvider;
