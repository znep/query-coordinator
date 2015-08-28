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

  var utils = root.socrata.utils;

  root.socrata.visualizations = root.socrata.visualizations || {};

  function Visualization(element, config) {

    var _defaultConfig = {
      localization: {},
      axisLabels: {
        top: false,
        right: false,
        bottom: false,
        left: false
      }
    }
    var _config =_.merge(_defaultConfig, config);

    utils.assertIsOneOfTypes(_config.axisLabels.top, 'boolean', 'string');
    utils.assertIsOneOfTypes(_config.axisLabels.right, 'boolean', 'string');
    utils.assertIsOneOfTypes(_config.axisLabels.bottom, 'boolean', 'string');
    utils.assertIsOneOfTypes(_config.axisLabels.left, 'boolean', 'string');

    this.element = element;

    /**
     * Public methods
     */

    this.renderAxisLabels = function(container) {

      var axisLabels = _config.axisLabels;

      var topAxisLabel = $(
        '<div>',
        {
          'class': 'top-axis-label'
        }
      );

      var rightAxisLabel = $(
        '<div>',
        {
          'class': 'right-axis-label'
        }
      );

      var bottomAxisLabel = $(
        '<div>',
        {
          'class': 'bottom-axis-label'
        }
      );

      var leftAxisLabel = $(
        '<div>',
        {
          'class': 'left-axis-label'
        }
      );

      if (axisLabels.top) {

        mapContainer.addClass('top-axis-label');
        topAxisLabel.
          text(axisLabels.top);
      }

      if (axisLabels.right) {

        mapContainer.addClass('right-axis-label');
        rightAxisLabel.
          text(axisLabels.right);
      }

      if (axisLabels.bottom) {

        mapContainer.addClass('bottom-axis-label');
        bottomAxisLabel.
          text(axisLabels.bottom);
      }

      if (axisLabels.left) {

        mapContainer.addClass('left-axis-label');
        leftAxisLabel.
          text(axisLabels.left);
      }
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
