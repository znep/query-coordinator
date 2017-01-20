// Vendor Imports
const $ = require('jquery');
const _ = require('lodash');
const utils = require('socrata-utils');
// Project Imports
const VifHelpers = require('../helpers/VifHelpers');
const I18n = require('../I18n');
const MetadataProvider = require('../dataProviders/MetadataProvider');
// Constants
const DEFAULT_TYPE_VARIANTS = {
  columnChart: 'column', // others: 'bar'
  timelineChart: 'area' // others: 'line'
};
const DEFAULT_PRIMARY_COLOR = '#71abd9';
const DEFAULT_SECONDARY_COLOR = '#71abd9';
const DEFAULT_HIGHLIGHT_COLOR = '#cccccc';
const DEFAULT_UNIT_ONE = '';
const DEFAULT_UNIT_OTHER = '';
const COLOR_PALETTES = {
  categorical: ['#a6cee3', '#5b9ec9', '#2d82af', '#7eba98', '#98d277', '#52af43', '#6f9e4c', '#dc9a88', '#f16666', '#e42022', '#f06c45', '#fdbb69', '#fe982c', '#f78620', '#d9a295', '#b294c7', '#7d54a6', '#9e8099', '#f0eb99', '#dbb466'],
  alternate1: ['#e41a1c', '#9e425a', '#596a98', '#3b87a2', '#449b75', '#4daf4a', '#6b886d', '#896191', '#ac5782', '#d56b41', '#ff7f00', '#ffb214', '#ffe528', '#eddd30', '#c9992c', '#a65628', '#c66764', '#e678a0', '#e485b7', '#be8fa8'],
  alternate2: ['#66c2a5', '#9aaf8d', '#cf9c76', '#f68d67', '#cf948c', '#a89bb0', '#969dca', '#b596c7', '#d58ec4', '#dd95b2', '#c6b18b', '#afcc64', '#b7d84c', '#d6d83f', '#f6d832', '#f8d348', '#efcc6b', '#e6c58e', '#d5be9d', '#c4b8a8'],
  accent: ['#7fc97f', '#96bf9e', '#adb5bd', '#c4afcb', '#dbb6af', '#f3bd92', '#fdcd8a', '#fee491', '#fefb98', '#c0d0a0', '#769aa8', '#4166ad', '#853f9b', '#c91889', '#e8106e', '#d63048', '#c45121', '#a75d2b', '#866148', '#666666'],
  dark: ['#1b9e77', '#5d874e', '#a07125', '#d45f0a', '#b16548', '#8e6b86', '#8068ae', '#a850a0', '#d03792', '#d33b79', '#a66753', '#79932e', '#7fa718', '#aca80e', '#d9aa04', '#d69d08', '#bf8b12', '#a9781b', '#927132', '#7c6b4c']
};

function SvgVisualization($element, vif) {
  const self = this;
  // See: http://stackoverflow.com/a/4819886
  const mobile = (
    'ontouchstart' in window || // works on most browsers
    navigator.maxTouchPoints // works on IE10/11 and Surface
  );

  let currentVif;

  // NOTE: Initialization occurs at the bottom of the file!

  /**
   * Public methods
   */

  this.getVif = function() {
    return currentVif;
  };

  this.updateVif = function(vifToRender) {
    const shouldRenderViewSourceDataLink = _.get(
      vifToRender,
      'configuration.viewSourceDataLink',
      true
    );

    currentVif = _.merge(
      VifHelpers.getDefaultVif(),
      VifHelpers.migrateVif(vifToRender)
    );

    self.renderTitle();
    self.renderDescription();
    self.renderAxisLabels();
    self.hidePanningNotice();

    if (shouldRenderViewSourceDataLink) {
      self.showViewSourceDataLink();
    } else {
      self.hideViewSourceDataLink();
    }
  };

  this.renderTitle = function() {
    const $title = self.$container.find('.socrata-visualization-title');
    const titleText = _.get(self.getVif(), 'title', null);

    if (titleText) {

      $title.
        attr('data-full-text', titleText).
        text(titleText);
      self.$container.addClass('socrata-visualization-title');
    } else {

      $title.
        removeAttr('data-full-text').
        text('');
      self.$container.removeClass('socrata-visualization-title');
    }
  };

  this.renderDescription = function() {
    const $description = self.$container.find('.socrata-visualization-description');
    const descriptionText = _.get(self.getVif(), 'description', null);

    if (descriptionText) {

      $description.
        attr('data-full-text', descriptionText).
        text(descriptionText);
      self.$container.addClass('socrata-visualization-description');
    } else {

      $description.
        removeAttr('data-full-text').
        text('');
      self.$container.removeClass('socrata-visualization-description');
    }
  };

  this.renderAxisLabels = function() {
    const $topAxisTitle = self.$container.find('.socrata-visualization-top-axis-title');
    const $rightAxisTitle = self.$container.find('.socrata-visualization-right-axis-title');
    const $bottomAxisTitle = self.$container.find('.socrata-visualization-bottom-axis-title');
    const $leftAxisTitle = self.$container.find('.socrata-visualization-left-axis-title');
    const axisLabels = _.get(
      self.getVif(),
      'configuration.axisLabels',
      {}
    );
    const outerHeight = self.
      $container.
      find('.socrata-visualization-container').
      outerHeight(true);
    const maxWidth = outerHeight * 0.9;

    if (axisLabels.top) {

      $topAxisTitle.
        attr('data-full-text', axisLabels.top).
        text(axisLabels.top).
        css('max-width', maxWidth);

      self.$container.addClass('socrata-visualization-top-axis-title');
    } else {

      $topAxisTitle.
        removeAttr('data-full-text').
        text('').
        css('max-width', maxWidth);

      self.$container.removeClass('socrata-visualization-top-axis-title');
    }

    if (axisLabels.right) {

      $rightAxisTitle.
        attr('data-full-text', axisLabels.right).
        text(axisLabels.right).
        css('max-width', maxWidth);

      self.$container.addClass('socrata-visualization-right-axis-title');
    } else {

      $rightAxisTitle.
        removeAttr('data-full-text').
        text('').
        css('max-width', maxWidth);

      self.$container.removeClass('socrata-visualization-right-axis-title');
    }

    if (axisLabels.bottom) {

      $bottomAxisTitle.
        attr('data-full-text', axisLabels.bottom).
        text(axisLabels.bottom).
        css('max-width', maxWidth);

      self.$container.addClass('socrata-visualization-bottom-axis-title');
    } else {

      $bottomAxisTitle.
        removeAttr('data-full-text').
        text('').
        css('max-width', maxWidth);

      self.$container.removeClass('socrata-visualization-bottom-axis-title');
    }

    if (axisLabels.left) {

      $leftAxisTitle.
        attr('data-full-text', axisLabels.left).
        text(axisLabels.left).
        css('max-width', maxWidth);

      self.$container.addClass('socrata-visualization-left-axis-title');
    } else {

      $leftAxisTitle.
        removeAttr('data-full-text').
        text('').
        css('max-width', maxWidth);

      self.$container.removeClass('socrata-visualization-left-axis-title');
    }
  };

  this.renderError = function(messages) {
    const $message = self.$container.find('.socrata-visualization-error-message');

    if (!messages || _.isString(messages) || messages.length === 1) {
      $message.text(messages || 'Error');
    } else {

      $message.
        empty().
        append($('<h1>').text(
          I18n.translate('visualizations.common.validation.errors.multiple_errors'))
        ).
        append($('<ul>').append(
          messages.map(function(text) { return $('<li>').text(text); })
        ));
    }

    self.
      $container.
      removeClass('socrata-visualization-busy').
      addClass('socrata-visualization-error');
  };

  this.clearError = function() {

    self.$container.find('.socrata-visualization-error-message').text('');
    self.$container.removeClass('socrata-visualization-error');
  };

  this.showBusyIndicator = function() {

    self.$container.addClass('socrata-visualization-busy');
  };

  this.hideBusyIndicator = function() {

    self.$container.removeClass('socrata-visualization-busy');
  };

  this.showViewSourceDataLink = function() {

    if (_.get(self.getVif(), 'series[0].dataSource.type') === 'socrata.soql') {

      const domain = _.get(self.getVif(), 'series[0].dataSource.domain');
      const datasetUid = _.get(self.getVif(), 'series[0].dataSource.datasetUid');
      const metadataProvider = new MetadataProvider({domain, datasetUid});
      const renderLink = function(linkableDatasetUid) {

        self.
          $container.
          addClass('socrata-visualization-view-source-data').
          find('.socrata-visualization-view-source-data a').
          attr('href', `https://${domain}/d/${linkableDatasetUid}`);
      };

      metadataProvider.getDatasetMigrationMetadata().
        then(function(migrationMetadata) {
          renderLink(_.get(migrationMetadata, 'nbe_id', datasetUid));
        }).
        catch(function() {
          renderLink(datasetUid);
        });

      // Add the info class immediately so that visualizations can accurately
      // measure how much space they have to fill, but only add the
      // view-source-data class to show the link once the optional metadata
      // request has returned, if it is made.
      self.sourceDataLinkVisible = true;
      self.showInfo();
    }
  };

  this.hideViewSourceDataLink = function() {

    if (_.get(self.getVif(), 'series[0].dataSource.type') === 'socrata.soql') {

      self.$container.removeClass('socrata-visualization-view-source-data');
      self.sourceDataLinkVisible = false;
      self.hideInfo();
    }
  };

  this.showPanningNotice = function() {

    self.$container.addClass('socrata-visualization-panning-notice');
    self.panningNoticeVisible = true;
    self.showInfo();
  };

  this.hidePanningNotice = function() {

    self.$container.removeClass('socrata-visualization-panning-notice');
    self.panningNoticeVisible = false;
    self.hideInfo();
  };

  this.showInfo = function() {
    self.$container.addClass('socrata-visualization-info');
  };

  this.hideInfo = function() {
    const safeToHide = !self.panningNoticeVisible && !self.sourceDataLinkVisible;

    if (safeToHide) {
      self.$container.removeClass('socrata-visualization-info');
    }
  };

  this.isMobile = function() {
    return mobile;
  };

  this.getSeriesIndexByLabel = function(label) {
    const seriesLabels = _.get(self.getVif(), 'series', []).
      map(
        function(series) {

          return series.label;
        }
      );
    const seriesIndex = seriesLabels.indexOf(label);

    return (seriesIndex !== -1) ? seriesIndex : null;
  };

  this.getTypeVariantBySeriesIndex = function(seriesIndex) {
    const actualSeriesIndex = defaultToSeriesIndexZeroIfGroupingIsEnabled(
      self.getVif(),
      seriesIndex
    );
    const typeComponents = _.get(
      self.getVif(),
      `series[${actualSeriesIndex}].type`,
      ''
    ).split('.');

    return (typeComponents.length > 1) ?
      typeComponents[1] :
      DEFAULT_TYPE_VARIANTS[typeComponents[0]];
  };

  this.getUnitOneBySeriesIndex = function(seriesIndex) {
    const actualSeriesIndex = defaultToSeriesIndexZeroIfGroupingIsEnabled(
      self.getVif(),
      seriesIndex
    );
    const unitOne = _.get(
      self.getVif(),
      `series[${actualSeriesIndex}].unit.one`
    );

    return (_.isString(unitOne)) ?
      unitOne :
      DEFAULT_UNIT_ONE;
  };

  this.getUnitOtherBySeriesIndex = function(seriesIndex) {
    const actualSeriesIndex = defaultToSeriesIndexZeroIfGroupingIsEnabled(
      self.getVif(),
      seriesIndex
    );
    const unitOther = _.get(
      self.getVif(),
      `series[${actualSeriesIndex}].unit.other`
    );

    return (_.isString(unitOther)) ?
      unitOther :
      DEFAULT_UNIT_OTHER;
  };

  this.getPrimaryColorBySeriesIndex = function(seriesIndex) {
    const actualSeriesIndex = defaultToSeriesIndexZeroIfGroupingIsEnabled(
      self.getVif(),
      seriesIndex
    );
    const palette = _.get(
      self.getVif(),
      `series[${actualSeriesIndex}].color.palette`,
      null
    );

    // If a palette is defined (and is valid) then use the series index as an
    // index into the palette.
    if (
      palette !== null &&
      COLOR_PALETTES.hasOwnProperty(palette) &&
      _.isArray(COLOR_PALETTES[palette]) &&
      COLOR_PALETTES[palette].length >= seriesIndex
    ) {
      return COLOR_PALETTES[palette][seriesIndex];
    // Otherwise, look for an explicit primary color.
    } else {

      const primaryColor = _.get(
        self.getVif(),
        `series[${seriesIndex}].color.primary`
      );

      return (!_.isUndefined(primaryColor)) ?
        primaryColor :
        DEFAULT_PRIMARY_COLOR;
    }
  };

  this.getSecondaryColorBySeriesIndex = function(seriesIndex) {
    const actualSeriesIndex = defaultToSeriesIndexZeroIfGroupingIsEnabled(
      self.getVif(),
      seriesIndex
    );
    const secondaryColor = _.get(
      self.getVif(),
      `series[${actualSeriesIndex}].color.secondary`
    );

    return (!_.isUndefined(secondaryColor)) ?
      secondaryColor :
      DEFAULT_SECONDARY_COLOR;
  };

  this.getHighlightColorBySeriesIndex = function(seriesIndex) {
    const actualSeriesIndex = defaultToSeriesIndexZeroIfGroupingIsEnabled(
      self.getVif(),
      seriesIndex
    );
    const highlightColor = _.get(
      self.getVif(),
      `series[${actualSeriesIndex}].color.highlight`
    );

    return (!_.isUndefined(highlightColor)) ?
      highlightColor :
      DEFAULT_HIGHLIGHT_COLOR;
  };

  /**
   * Valid options: 'fit', 'pan', 'showZero'
   */
  this.getXAxisScalingModeBySeriesIndex = function(seriesIndex) {
    const actualSeriesIndex = defaultToSeriesIndexZeroIfGroupingIsEnabled(
      self.getVif(),
      seriesIndex
    );
    const chartType = _.get(
      self.getVif(),
      `series[${actualSeriesIndex}].type`,
      ''
    );
    const isTimeline = chartType.match(/^timeline/);
    const defaultXAxisScalingModeForChartType = (isTimeline) ? 'fit' : 'pan';

    return _.get(
      self.getVif(),
      'configuration.xAxisScalingMode',
      defaultXAxisScalingModeForChartType
    );
  };

  this.getColorPaletteBySeriesIndex = function(seriesIndex) {
    const actualSeriesIndex = defaultToSeriesIndexZeroIfGroupingIsEnabled(
      self.getVif(),
      seriesIndex
    );
    const colorPalette = _.get(
      self.getVif(),
      `series[${actualSeriesIndex}].color.palette`,
      null
    );

    return _.get(COLOR_PALETTES, colorPalette, COLOR_PALETTES.categorical);
  };

  /**
   * Valid options: 'fit', 'pan', 'showZero'
   */
  this.getYAxisScalingMode = function() {

    return _.get(
      self.getVif(),
      'configuration.yAxisScalingMode',
      'showZero'
    );
  };

  this.getMeasureAxisMinValue = function() {
    const value = _.get(
      self.getVif(),
      'configuration.measureAxisMinValue',
      null
    );
    const check = isFinite(value) && parseFloat(value);

    if (value !== null && (check === false || isNaN(check))) {
      throw new Error(
        I18n.translate(
          'visualizations.common.validation.errors.' +
          'measure_axis_min_value_should_be_numeric'
        )
      );
    } else {
      return value;
    }
  };

  this.getMeasureAxisMaxValue = function() {
    const value = _.get(
      self.getVif(),
      'configuration.measureAxisMaxValue',
      null
    );
    const check = isFinite(value) && parseFloat(value);

    if (value !== null && (check === false || isNaN(check))) {

      throw new Error(
        I18n.translate(
          'visualizations.common.validation.errors.' +
          'measure_axis_max_value_should_be_numeric'
        )
      );

    } else {
      return value;
    }
  };

  this.getShowDimensionLabels = function() {

    return _.get(
      self.getVif(),
      'configuration.showDimensionLabels',
      true
    );
  };

  this.getShowValueLabels = function() {

    return _.get(
      self.getVif(),
      'configuration.showValueLabels',
      true
    );
  };

  this.getShowValueLabelsAsPercent = function() {

    return _.get(
      self.getVif(),
      'configuration.showValueLabelsAsPercent',
      false
    );
  };

  this.emitEvent = function(name, payload) {

    self.$element[0].dispatchEvent(
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
          $('<div>', {'class': 'socrata-visualization'}).
            append([
              $('<div>', {'class': 'socrata-visualization-title-container'}).
                append(
                  $('<div>', {'class': 'socrata-visualization-title'})
                ),
              $('<div>', {'class': 'socrata-visualization-description-container'}).
                append(
                  $('<div>', {'class': 'socrata-visualization-description'})
                ),
              $('<div>', {'class': 'socrata-visualization-container'}).
                append([
                  $('<div>', {'class': 'socrata-visualization-top-axis-title'}),
                  $('<div>', {'class': 'socrata-visualization-right-axis-title'}),
                  $('<div>', {'class': 'socrata-visualization-bottom-axis-title'}),
                  $('<div>', {'class': 'socrata-visualization-left-axis-title'})
                ]),
              $('<div>', {'class': 'socrata-visualization-info'}).
                append([
                  $('<div>', {'class': 'socrata-visualization-view-source-data'}).append(
                    $('<a>', {'href': '', 'target': '_blank'}).append([
                      I18n.translate('visualizations.common.view_source_data'),
                      $('<span>', {'class': 'icon-external'})
                    ])
                  ),
                  $('<div>', {'class': 'socrata-visualization-panning-notice'}).text(
                    I18n.translate('visualizations.common.panning_notice')
                  )
                ]),
              $('<div>', {'class': 'socrata-visualization-error-container error light'}).
                append([
                  $('<span>', {'class': 'socrata-visualization-error-message text'})
                ]),
              $('<div>', {'class': 'socrata-visualization-busy-indicator-container'}).
                append([
                  $('<span>', {'class': 'socrata-visualization-busy-indicator'})
                ])
            ])
        );
  }

  function attachEvents() {

    // Destroy on (only the first) 'SOCRATA_VISUALIZATION_DESTROY' event.
    self.$element.one('SOCRATA_VISUALIZATION_DESTROY', function() {
      self.$element.find('.socrata-visualization').remove();
      detachEvents();
    });

    self.$element.on('mouseover', '.socrata-visualization-title', showFlyout);
    self.$element.on('mouseout', '.socrata-visualization-title', hideFlyout);

    self.$element.on('mouseover', '.socrata-visualization-description', showFlyout);
    self.$element.on('mouseout', '.socrata-visualization-description', hideFlyout);

    self.$element.on('mouseover', '.socrata-visualization-top-axis-title', showFlyout);
    self.$element.on('mouseout', '.socrata-visualization-top-axis-title', hideFlyout);

    self.$element.on('mouseover', '.socrata-visualization-right-axis-title', showFlyout);
    self.$element.on('mouseout', '.socrata-visualization-right-axis-title', hideFlyout);

    self.$element.on('mouseover', '.socrata-visualization-bottom-axis-title', showFlyout);
    self.$element.on('mouseout', '.socrata-visualization-bottom-axis-title', hideFlyout);

    self.$element.on('mouseover', '.socrata-visualization-left-axis-title', showFlyout);
    self.$element.on('mouseout', '.socrata-visualization-left-axis-title', hideFlyout);

    self.$element.on('click', '.socrata-visualization-download-button', handleDownload);
  }

  function detachEvents() {

    self.$element.off('mouseover', '.socrata-visualization-title', showFlyout);
    self.$element.off('mouseout', '.socrata-visualization-title', hideFlyout);

    self.$element.off('mouseover', '.socrata-visualization-description', showFlyout);
    self.$element.off('mouseout', '.socrata-visualization-description', hideFlyout);

    self.$element.off('mouseover', '.socrata-visualization-top-axis-title', showFlyout);
    self.$element.off('mouseout', '.socrata-visualization-top-axis-title', hideFlyout);

    self.$element.off('mouseover', '.socrata-visualization-right-axis-title', showFlyout);
    self.$element.off('mouseout', '.socrata-visualization-right-axis-title', hideFlyout);

    self.$element.off('mouseover', '.socrata-visualization-bottom-axis-title', showFlyout);
    self.$element.off('mouseout', '.socrata-visualization-bottom-axis-title', hideFlyout);

    self.$element.off('mouseover', '.socrata-visualization-left-axis-title', showFlyout);
    self.$element.off('mouseout', '.socrata-visualization-left-axis-title', hideFlyout);

    self.$element.off('click', '.socrata-visualization-download-button', handleDownload);
  }

  function showFlyout(event) {
    const element = event.originalEvent.target;
    const content = element.getAttribute('data-full-text');

    if (content) {

      let flyoutPayload = {
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
    const svg = $element.find('svg')[0];
    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement('canvas');

    canvas.width = $element.width();
    canvas.height = $element.height();

    let ctx = canvas.getContext('2d');
    let img = document.createElement('img');

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

  // If dimension grouping is enabled, there will only be one actual series in
  // the vif although there will appear to be multiple series in the data table
  // resulting from it. Many methods on this class return configuration
  // properties by series index. Accordingly, if dimension grouping is enabled
  // we want to read these configuration properties off of the only actual
  // series (at index zero) as opposed to one of the 'virtual' series that
  // appear to exist based on the data table.
  function defaultToSeriesIndexZeroIfGroupingIsEnabled(vifToCheck, seriesIndex) {
    const isGrouping = !_.isNull(
      _.get(
        vifToCheck,
        'series[0].dataSource.dimension.grouping.columnName',
        null
      )
    );

    return (isGrouping) ? 0 : seriesIndex;
  }

  /**
   * Initialization
   */

  utils.assertInstanceOf($element, $);

  this.$element = $element;

  renderTemplate();
  attachEvents();

  this.$container = self.$element.find('.socrata-visualization');

  this.updateVif(vif);
}

module.exports = SvgVisualization;
