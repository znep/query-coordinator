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

  function Visualization(element, vif) {

    var _defaultVIF = {
      configuration: {
        axisLabels: {
          top: false,
          right: false,
          bottom: false,
          left: false
        },
        localization: {}
      }
    }
    var _vif =_.merge(_defaultVIF, vif);

    utils.assertIsOneOfTypes(_vif.configuration.axisLabels.top, 'boolean', 'string');
    utils.assertIsOneOfTypes(_vif.configuration.axisLabels.right, 'boolean', 'string');
    utils.assertIsOneOfTypes(_vif.configuration.axisLabels.bottom, 'boolean', 'string');
    utils.assertIsOneOfTypes(_vif.configuration.axisLabels.left, 'boolean', 'string');

    this.element = element;

    /**
     * Public methods
     */

    this.renderAxisLabels = function(container) {

      var axisLabels = _vif.configuration.axisLabels;

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

        topAxisLabel.
          text(axisLabels.top);

        container.
          addClass('top-axis-label').
          append(topAxisLabel);
      }

      if (axisLabels.right) {

        rightAxisLabel.
          text(axisLabels.right);

        container.
          addClass('right-axis-label').
          append(rightAxisLabel);
      }

      if (axisLabels.bottom) {

        bottomAxisLabel.
          text(axisLabels.bottom);

        container.
          addClass('bottom-axis-label').
          append(bottomAxisLabel);
      }

      if (axisLabels.left) {

        leftAxisLabel.
          text(axisLabels.left);

        container.
          addClass('left-axis-label').
          append(leftAxisLabel);
      }

    };

    this.getLocalization = function(key) {

      var localizedString = '';

      if (_.has(_vif.configuration.localization, key)) {
        localizedString = _vif.configuration.localization[key];
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
