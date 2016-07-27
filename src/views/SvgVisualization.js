const utils = require('socrata-utils');
const VifHelpers = require('../helpers/VifHelpers');
const $ = require('jquery');
const _ = require('lodash');
const I18n = require('../I18n');

const DEFAULT_TYPE_VARIANTS = {
  columnChart: 'column', // others: 'bar'
  timelineChart: 'area' // others: 'line'
};
const DEFAULT_PRIMARY_COLOR = '#00a1af';
const DEFAULT_SECONDARY_COLOR = '#00a1af';
const DEFAULT_HIGHLIGHT_COLOR = '#ccecef';
const DEFAULT_UNIT_ONE = '';
const DEFAULT_UNIT_OTHER = '';

function SvgVisualization($element, vif) {
  var self = this;
  var currentVif;
  // See: http://stackoverflow.com/a/4819886
  var mobile = (
    'ontouchstart' in window || // works on most browsers
    navigator.maxTouchPoints // works on IE10/11 and Surface
  );

  utils.assertInstanceOf($element, $);

  /**
   * Public methods
   */

  this.getVif = function() {
    return currentVif;
  };

  this.updateVif = function(vifToRender) {

    currentVif = _.merge(
      VifHelpers.getDefaultVif(),
      VifHelpers.migrateVif(vifToRender)
    );

    this.renderTitle();
    this.renderDescription();
    this.renderAxisLabels();
    this.hidePanningNotice();
  };

  this.renderTitle = function() {
    var $container = this.$element.find('.visualization');
    var $title = $container.find('.title');
    var titleText = this.getVif().title;

    if (titleText) {

      $title.
        attr('data-full-text', titleText).
        text(titleText);
      $container.addClass('title');
    } else {

      $title.
        removeAttr('data-full-text').
        text('');
      $container.removeClass('title');
    }
  };

  this.renderDescription = function() {
    var $container = this.$element.find('.visualization');
    var $description = $container.find('.description');
    var descriptionText = this.getVif().description;

    if (descriptionText) {

      $description.
        attr('data-full-text', descriptionText).
        text(descriptionText);
      $container.addClass('description');
    } else {

      $description.
        removeAttr('data-full-text').
        text('');
      $container.removeClass('description');
    }
  };

  this.renderAxisLabels = function() {
    var $container = this.$element.find('.visualization');
    var $topAxisLabel = $container.find('.top-axis-label');
    var $rightAxisLabel = $container.find('.right-axis-label');
    var $bottomAxisLabel = $container.find('.bottom-axis-label');
    var $leftAxisLabel = $container.find('.left-axis-label');
    var axisLabels = currentVif.configuration.axisLabels;
    var maxWidth = $container.
      find('.visualization-container').
      outerHeight(true) *
      0.9;

    if (axisLabels.top) {

      $topAxisLabel.
        attr('data-full-text', axisLabels.top).
        text(axisLabels.top).
        css('max-width', maxWidth);
      $container.addClass('top-axis-label');
    } else {

      $topAxisLabel.
        removeAttr('data-full-text').
        text('').
        css('max-width', maxWidth);
      $container.removeClass('top-axis-label');
    }

    if (axisLabels.right) {

      $rightAxisLabel.
        attr('data-full-text', axisLabels.right).
        text(axisLabels.right).
        css('max-width', maxWidth);
      $container.addClass('right-axis-label');
    } else {

      $rightAxisLabel.
        removeAttr('data-full-text').
        text('').
        css('max-width', maxWidth);
      $container.removeClass('right-axis-label');
    }

    if (axisLabels.bottom) {

      $bottomAxisLabel.
        attr('data-full-text', axisLabels.bottom).
        text(axisLabels.bottom).
        css('max-width', maxWidth);
      $container.addClass('bottom-axis-label');
    } else {

      $bottomAxisLabel.
        removeAttr('data-full-text').
        text('').
        css('max-width', maxWidth);
      $container.removeClass('bottom-axis-label');
    }

    if (axisLabels.left) {

      $leftAxisLabel.
        attr('data-full-text', axisLabels.left).
        text(axisLabels.left).
        css('max-width', maxWidth);
      $container.addClass('left-axis-label');
    } else {

      $leftAxisLabel.
        removeAttr('data-full-text').
        text('').
        css('max-width', maxWidth);
      $container.removeClass('left-axis-label');
    }
  };

  this.renderError = function(messages) {
    const $container = this.$element.find('.visualization');
    const $message = $container.find('.error-message');

    if (!messages || _.isString(messages) || messages.length === 1) {
      $message.text(messages || 'Error');
    } else {
      $message.
        empty().
        append($('<h1>').text(
          I18n.translate('visualizations.common.validation.errors.multiple_errors'))
        ).
        append($('<ul>').append(
          messages.map((text) => $('<li>').text(text))
        ));
    }
    $container.addClass('visualization-error');
  };

  this.clearError = function() {
    var $container = this.$element.find('.visualization');

    $container.find('.error-message').text('');
    $container.removeClass('visualization-error');
  };

  this.showPanningNotice = function() {
    var $container = this.$element.find('.visualization');

    $container.addClass('info panning-notice');
  };

  this.hidePanningNotice = function() {
    var $container = this.$element.find('.visualization');

    $container.removeClass('info panning-notice');
  };

  this.isMobile = function() {
    return mobile;
  };

  // NOTE: This is on the path to deprecation.
  // We should use I18n.js in most places.
  this.getLocalization = function(key) {
    var localizedString = '';

    if (_.has(currentVif.configuration.localization, key)) {
      localizedString = currentVif.configuration.localization[key];
    } else {
      logWarning('No localized string found for key `{0}`.'.format(key));
    }

    return localizedString;
  };

  this.getSeriesIndexByLabel = function(label) {
    var seriesLabels = currentVif.
      series.
        map(
          function(series) {

            return series.label;
          }
        );
    var seriesIndex = seriesLabels.indexOf(label);

    return (seriesIndex !== -1) ? seriesIndex : null;
  };

  this.getTypeVariantBySeriesIndex = function(seriesIndex) {
    var typeComponents = _.get(
      currentVif,
      'series[{0}].type'.format(seriesIndex),
      ''
    ).split('.');

    return (typeComponents.length > 1) ?
      typeComponents[1] :
      DEFAULT_TYPE_VARIANTS[typeComponents[0]];
  };

  this.getUnitOneBySeriesIndex = function(seriesIndex) {
    var unitOne = _.get(
      currentVif,
      'series[{0}].unit.one'.format(seriesIndex)
    );

    return (_.isString(unitOne)) ?
      unitOne :
      DEFAULT_UNIT_ONE;
  };

  this.getUnitOtherBySeriesIndex = function(seriesIndex) {
    var unitOther = _.get(
      currentVif,
      'series[{0}].unit.other'.format(seriesIndex)
    );

    return (_.isString(unitOther)) ?
      unitOther :
      DEFAULT_UNIT_OTHER;
  };

  this.getPrimaryColorBySeriesIndex = function(seriesIndex) {
    var primaryColor = _.get(
      currentVif,
      'series[{0}].color.primary'.format(seriesIndex)
    );

    return (!_.isUndefined(primaryColor)) ?
      primaryColor :
      DEFAULT_PRIMARY_COLOR;
  };

  this.getSecondaryColorBySeriesIndex = function(seriesIndex) {
    var secondaryColor = _.get(
      currentVif,
      'series[{0}].color.secondary'.format(seriesIndex)
    );

    return (!_.isUndefined(secondaryColor)) ?
      secondaryColor :
      DEFAULT_SECONDARY_COLOR;
  };

  this.getHighlightColorBySeriesIndex = function(seriesIndex) {
    var highlightColor = _.get(
      currentVif,
      'series[{0}].color.highlight'.format(seriesIndex)
    );

    return (!_.isUndefined(highlightColor)) ?
      highlightColor :
      DEFAULT_HIGHLIGHT_COLOR;
  };

  /**
   * Valid options: 'fit', 'pan'
   */
  this.getXAxisScalingModeBySeriesIndex = function(seriesIndex) {
    var chartType = _.get(
      currentVif,
      `series[${seriesIndex}].type`,
      ''
    );
    var defaultXAxisScalingModeForChartType = (chartType.match(/^timeline/)) ?
      'fit' :
      'pan';

    return _.get(
      currentVif,
      'configuration.xAxisScalingMode',
      defaultXAxisScalingModeForChartType
    );
  };

  /**
   * Valid options: 'fit', 'showZero'
   */
  this.getYAxisScalingMode = function() {

    return _.get(
      currentVif,
      'configuration.yAxisScalingMode',
      'showZero'
    );
  };

  this.emitEvent = function(name, payload) {

    this.$element[0].dispatchEvent(
      new window.CustomEvent(
        name,
        { detail: payload, bubbles: true }
      )
    );
  };

  /**
   * Private methods
   */

  function renderTemplate() {

    self.
      $element.
        append(
          $('<div>', {'class': 'visualization'}).
            append([
              $('<div>', {'class': 'title-container'}).
                append(
                  $('<div>', {'class': 'title'})
                ),
              $('<div>', {'class': 'description-container'}).
                append(
                  $('<div>', {'class': 'description'})
                ),
              $('<div>', {'class': 'visualization-container'}).
                append([
                  $('<div>', {'class': 'top-axis-label'}),
                  $('<div>', {'class': 'right-axis-label'}),
                  $('<div>', {'class': 'bottom-axis-label'}),
                  $('<div>', {'class': 'left-axis-label'})
                ]),
              $('<div>', {'class': 'info'}).
                append([
                  $('<div>', {'class': 'panning-notice'}).text(
                    'Not all values shown: click and drag to pan the chart'
                  )
                ]),
              $('<div>', {'class': 'error-container error light'}).
                append([
                  $('<span>', {'class': 'error-message text'})
                ])
            ])
        );
  }

  function attachEvents() {

    // Destroy on (only the first) 'SOCRATA_VISUALIZATION_DESTROY' event.
    self.$element.one('SOCRATA_VISUALIZATION_DESTROY', function() {
      self.$element.find('.visualization').remove();
      detachEvents();
    });

    self.$element.on('mouseover', '.title', showFlyout);
    self.$element.on('mouseout', '.title', hideFlyout);

    self.$element.on('mouseover', '.description', showFlyout);
    self.$element.on('mouseout', '.description', hideFlyout);

    self.$element.on('mouseover', '.top-axis-label', showFlyout);
    self.$element.on('mouseout', '.top-axis-label', hideFlyout);

    self.$element.on('mouseover', '.right-axis-label', showFlyout);
    self.$element.on('mouseout', '.right-axis-label', hideFlyout);

    self.$element.on('mouseover', '.bottom-axis-label', showFlyout);
    self.$element.on('mouseout', '.bottom-axis-label', hideFlyout);

    self.$element.on('mouseover', '.left-axis-label', showFlyout);
    self.$element.on('mouseout', '.left-axis-label', hideFlyout);

    self.$element.on('click', '.download-button', handleDownload);
  }

  function detachEvents() {

    self.$element.off('mouseover', '.title', showFlyout);
    self.$element.off('mouseout', '.title', hideFlyout);

    self.$element.off('mouseover', '.description', showFlyout);
    self.$element.off('mouseout', '.description', hideFlyout);

    self.$element.off('mouseover', '.top-axis-label', showFlyout);
    self.$element.off('mouseout', '.top-axis-label', hideFlyout);

    self.$element.off('mouseover', '.right-axis-label', showFlyout);
    self.$element.off('mouseout', '.right-axis-label', hideFlyout);

    self.$element.off('mouseover', '.bottom-axis-label', showFlyout);
    self.$element.off('mouseout', '.bottom-axis-label', hideFlyout);

    self.$element.off('mouseover', '.left-axis-label', showFlyout);
    self.$element.off('mouseout', '.left-axis-label', hideFlyout);

    self.$element.off('click', '.download-button', handleDownload);
  }

  function showFlyout(event) {
    var element = event.originalEvent.target;
    var content = element.getAttribute('data-full-text');
    var flyoutPayload;

    if (content) {

      flyoutPayload = {
        element: element,
        content:  $('<div>', {'class': 'socrata-flyout-title'}).text(content),
        rightSideHint: false,
        belowTarget: false,
        dark: true
      };

      self.$element[0].dispatchEvent(
        new window.CustomEvent(
          'SOCRATA_VISUALIZATION_FLYOUT',
          {
            detail: flyoutPayload,
            bubbles: true
          }
        )
      );
    }
  }

  function hideFlyout() {

    self.$element[0].dispatchEvent(
      new window.CustomEvent(
        'SOCRATA_VISUALIZATION_FLYOUT',
        {
          detail: null,
          bubbles: true
        }
      )
    );
  }

  function handleDownload() {
    var svg = $element.find('svg')[0];
    var svgData = new XMLSerializer().
      serializeToString(svg);
    var canvas = document.createElement('canvas');
    var ctx;
    var img;

    canvas.width = $element.width();
    canvas.height = $element.height();
    ctx = canvas.getContext('2d');

    img = document.createElement('img');
    img.setAttribute(
      'src',
      'data:image/svg+xml;base64,' +
      btoa(
        unescape(
          encodeURIComponent(svgData)
        )
      )
    );

    img.onload = function() {
      ctx.drawImage(img, 0, 0);
      window.open(canvas.toDataURL('image/png'));
    };
  }

  function logWarning(message) {
    if (window.console && window.console.warn) {
      window.console.warn(message);
    }
  }

  /**
   * Execution starts here.
   */

  this.$element = $element;

  renderTemplate();
  attachEvents();

  this.updateVif(vif);
}

module.exports = SvgVisualization;
