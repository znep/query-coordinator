var utils = require('socrata-utils');
var $ = require('jquery');
var _ = require('lodash');

function Visualization(element, vif) {

  var _defaultVIF = {
    configuration: {
      axisLabels: {
        top: false,
        right: false,
        bottom: false,
        left: false
      },
      localization: {},
      interactive: true
    }
  };
  var _vif = _.merge(_defaultVIF, vif);

  utils.assertIsOneOfTypes(_vif.configuration.axisLabels.top, 'boolean', 'string');
  utils.assertIsOneOfTypes(_vif.configuration.axisLabels.right, 'boolean', 'string');
  utils.assertIsOneOfTypes(_vif.configuration.axisLabels.bottom, 'boolean', 'string');
  utils.assertIsOneOfTypes(_vif.configuration.axisLabels.left, 'boolean', 'string');

  this.element = element;

  if (_vif.configuration.interactive) {
    element.addClass('filterable');
  }

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
      new window.CustomEvent(
        name,
        { detail: payload, bubbles: true }
      )
    );
  };

  /**
   * Private methods
   */

  function _logWarning(message) {
    if (window.console && window.console.warn) {
      window.console.warn(message);
    }
  }
}

module.exports = Visualization;
