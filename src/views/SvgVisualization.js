const utils = require('socrata-utils');
const VifHelpers = require('../helpers/VifHelpers');
const $ = require('jquery');
const _ = require('lodash');
const I18n = require('../I18n');
const MetadataProvider = require('../dataProviders/MetadataProvider');

const DEFAULT_TYPE_VARIANTS = {
  columnChart: 'column', // others: 'bar'
  timelineChart: 'area' // others: 'line'
};

const DEFAULT_PRIMARY_COLOR = '#71abd9';
const DEFAULT_SECONDARY_COLOR = '#71abd9';
const DEFAULT_HIGHLIGHT_COLOR = '#cccccc';
const DEFAULT_UNIT_ONE = '';
const DEFAULT_UNIT_OTHER = '';
const INFO_CLASSES_PATTERN = /(panning\-notice|view\-source\-data)/i;

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
      self.getVif(),
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
          messages.map((text) => $('<li>').text(text))
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
    const domain = _.get(self.getVif(), 'series[0].dataSource.domain');
    const datasetUid = _.get(self.getVif(), 'series[0].dataSource.datasetUid');
    const metadataProvider = new MetadataProvider({domain, datasetUid});
    const renderLink = (linkableDatasetUid) => {

      self.
        $container.
        addClass('socrata-visualization-view-source-data').
        find('.socrata-visualization-view-source-data a').
        attr('href', `https://${domain}/d/${linkableDatasetUid}`);
    };

    metadataProvider.getDatasetMigrationMetadata().
      then((migrationMetadata) => {
        renderLink(_.get(migrationMetadata, 'nbe_id', datasetUid));
      }).
      catch(() => {
        renderLink(datasetUid);
      });

    // Add the info class immediately so that visualizations can accurately
    // measure how much space they have to fill, but only add the
    // view-source-data class to show the link once the optional metadata
    // request has returned, if it is made.
    self.showInfo();
  };

  this.hideViewSourceDataLink = function() {

    self.$container.removeClass('socrata-visualization-view-source-data');
    self.hideInfo();
  };

  this.showPanningNotice = function() {

    self.$container.addClass('socrata-visualization-panning-notice');
    self.showInfo();
  };

  this.hidePanningNotice = function() {

    self.$container.removeClass('socrata-visualization-panning-notice');
    self.hideInfo();
  };

  this.showInfo = function() {
    // See comment at the top of the implementation of this.hideInfo.
    const containerClasses = self.$container.attr('class');
    const hasInfoClass = containerClasses.match(INFO_CLASSES_PATTERN) !== null;

    if (hasInfoClass) {
      self.$container.addClass('socrata-visualization-info');
    }
  };

  this.hideInfo = function() {
    // This function used to remove the 'info' class from the container based
    // on the following check:
    //
    //   _.some(<array of class names>, self.$container.hasClass)
    //
    // ...but the semantics of _.some were so confusing to me that I spent
    // fifteen minutes trying to get the right behavior for both the show/hide
    // case (we should SHOW the info bar if the above returns false).
    //
    // In order to potentially spare someone else that confusion, I rewrote it
    // as below.
    const containerClasses = self.$container.attr('class');
    const hasInfoClass = containerClasses.match(INFO_CLASSES_PATTERN) !== null;

    if (!hasInfoClass) {
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
    const typeComponents = _.get(
      self.getVif(),
      `series[${seriesIndex}].type`,
      ''
    ).split('.');

    return (typeComponents.length > 1) ?
      typeComponents[1] :
      DEFAULT_TYPE_VARIANTS[typeComponents[0]];
  };

  this.getUnitOneBySeriesIndex = function(seriesIndex) {
    const unitOne = _.get(
      self.getVif(),
      `series[${seriesIndex}].unit.one`
    );

    return (_.isString(unitOne)) ?
      unitOne :
      DEFAULT_UNIT_ONE;
  };

  this.getUnitOtherBySeriesIndex = function(seriesIndex) {
    const unitOther = _.get(
      self.getVif(),
      `series[${seriesIndex}].unit.other`
    );

    return (_.isString(unitOther)) ?
      unitOther :
      DEFAULT_UNIT_OTHER;
  };

  this.getPrimaryColorBySeriesIndex = function(seriesIndex) {
    const primaryColor = _.get(
      self.getVif(),
      `series[${seriesIndex}].color.primary`
    );

    return (!_.isUndefined(primaryColor)) ?
      primaryColor :
      DEFAULT_PRIMARY_COLOR;
  };

  this.getSecondaryColorBySeriesIndex = function(seriesIndex) {
    const secondaryColor = _.get(
      self.getVif(),
      `series[${seriesIndex}].color.secondary`
    );

    return (!_.isUndefined(secondaryColor)) ?
      secondaryColor :
      DEFAULT_SECONDARY_COLOR;
  };

  this.getHighlightColorBySeriesIndex = function(seriesIndex) {
    const highlightColor = _.get(
      self.getVif(),
      `series[${seriesIndex}].color.highlight`
    );

    return (!_.isUndefined(highlightColor)) ?
      highlightColor :
      DEFAULT_HIGHLIGHT_COLOR;
  };

  /**
   * Valid options: 'fit', 'pan'
   */
  this.getXAxisScalingModeBySeriesIndex = function(seriesIndex) {
    const chartType = _.get(
      self.getVif(),
      `series[${seriesIndex}].type`,
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

  /**
   * Valid options: 'fit', 'showZero'
   */
  this.getYAxisScalingMode = function() {

    return _.get(
      self.getVif(),
      'configuration.yAxisScalingMode',
      'showZero'
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
