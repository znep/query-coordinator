// Vendor Imports
const $ = require('jquery');
const _ = require('lodash');
const utils = require('socrata-utils');

// Project Imports
const VifHelpers = require('../helpers/VifHelpers');
const SvgHelpers = require('../helpers/SvgHelpers');
const I18n = require('../I18n');
const MetadataProvider = require('../dataProviders/MetadataProvider');

// Constants
import {
  DEFAULT_PRIMARY_COLOR,
  DEFAULT_SECONDARY_COLOR,
  DEFAULT_HIGHLIGHT_COLOR,
  DEFAULT_LEGEND_TEXT_ATTRIBUTES,
  COLOR_PALETTES,
  LEGEND_RECT_SIZE,
  LEGEND_RECT_LABEL_GAP,
  LEGEND_SEPARATOR_COLOR,
  LEGEND_SEPARATOR_WIDTH,
  LEGEND_CONTAINER_MARGIN,
  LEGEND_COLUMN_GAP,
  LEGEND_COLUMN_PADDING,
  LEGEND_MINIMUM_TEXT_WIDTH,
  MAX_LEGEND_COLUMNS,
  AXIS_LABEL_FONT_FAMILY,
  AXIS_LABEL_FONT_SIZE,
  AXIS_LABEL_COLOR,
  AXIS_LABEL_MARGIN,
  AXIS_LABEL_TEXT_MARGIN
} from './SvgStyleConstants';


const DEFAULT_TYPE_VARIANTS = {
  columnChart: 'column', // others: 'bar'
  timelineChart: 'area' // others: 'line'
};
const DEFAULT_UNIT_ONE = '';
const DEFAULT_UNIT_OTHER = '';

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

  let topAxisLabelElement = null;
  let rightAxisLabelElement = null;
  let bottomAxisLabelElement = null;
  let leftAxisLabelElement = null;

  /**
   * Render axis labels positioned according to given bounding  box
   *
   * @param containerSvg D3 wrapped container svg element
   * @param {{x: Number, y: Number, width: Number, height: Number}} viewportRect
   */
  this.renderAxisLabels = function(containerSvg, viewportRect) {
    const axisLabels = self.getAxisLabels();

    const axisLabelTextSizes = _.mapValues(
      axisLabels,
      (axisLabelText) => SvgHelpers.calculateTextSize(AXIS_LABEL_FONT_FAMILY, AXIS_LABEL_FONT_SIZE, axisLabelText)
    );

    const xAxisBox = containerSvg.select('.x.axis').node();
    const yAxisBox = containerSvg.select('.y.axis').node();

    const xAxisHeight = xAxisBox ? xAxisBox.getBBox().height : 0;
    const yAxisWidth = yAxisBox ? yAxisBox.getBBox().width : 0;

    const chartMidY = viewportRect.y + (viewportRect.height - xAxisHeight) / 2.0;
    const chartMidX = viewportRect.x + (viewportRect.width - yAxisWidth) / 2.0;
    const chartMaxX = viewportRect.x + viewportRect.width;
    const chartMaxY = viewportRect.y + viewportRect.height + xAxisHeight;

    // Render/Remove left axis title
    leftAxisLabelElement = updateAxisLabel(
      containerSvg,
      leftAxisLabelElement,
      axisLabels.left,
      (element) => {
        const left = axisLabelTextSizes.left.height + AXIS_LABEL_TEXT_MARGIN;
        element.attr('transform', `translate(${left}, ${chartMidY}) rotate(-90)`);
      }
    );

    // Render/Remove bottom axis title
    bottomAxisLabelElement = updateAxisLabel(
      containerSvg,
      bottomAxisLabelElement,
      axisLabels.bottom,
      (element) => {
        const top = chartMaxY + AXIS_LABEL_MARGIN - AXIS_LABEL_TEXT_MARGIN;
        element.attr('transform', `translate(${chartMidX}, ${top})`);
      }
    );

    // Render/Remove top axis title
    topAxisLabelElement = updateAxisLabel(
      containerSvg,
      topAxisLabelElement,
      axisLabels.top,
      (element) => {
        const top = axisLabelTextSizes.top.height + AXIS_LABEL_TEXT_MARGIN;
        element.attr('transform', `translate(${chartMidX}, ${top})`);
      }
    );

    // Render/Remove right axis title
    rightAxisLabelElement = updateAxisLabel(
      containerSvg,
      rightAxisLabelElement,
      axisLabels.right,
      (element) => {
        const left = chartMaxX - (AXIS_LABEL_MARGIN - AXIS_LABEL_TEXT_MARGIN);
        element.attr('transform', `translate(${left}, ${chartMidY}) rotate(90)`);
      }
    );
  };

  function createAxisLabelGroup(containerSvg) {
    const group = containerSvg.append('g');

    group.
      append('text').
      attr('text-anchor', 'middle').
      attr('font-family', AXIS_LABEL_FONT_FAMILY).
      attr('font-size', AXIS_LABEL_FONT_SIZE).
      attr('fill', AXIS_LABEL_COLOR);

    return group;
  }

  function updateAxisLabel(parentElement, axisLabelElement, title, nodeUpdateFn) {
    let element = axisLabelElement;

    if (title) {
      if (element === null) {
        element = createAxisLabelGroup(parentElement);
      }

      nodeUpdateFn(element);
      element.select('text').text(title);

      if (!element.parentElement) {
        parentElement.node().appendChild(element.node());
      }
    } else if (element && element.parentElement) {
      element.remove();
    }

    return element;
  }

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

  let legendLayout = null;

  this.renderLegend = function(svgElement, containerWidth, legendData, colorSelector, textAttributes) {
    textAttributes = textAttributes || DEFAULT_LEGEND_TEXT_ATTRIBUTES;

    if (legendLayout === null) {
      legendLayout = SvgHelpers.textBasedColumnLayout(textAttributes).
        margin(LEGEND_CONTAINER_MARGIN).
        columnPadding(LEGEND_COLUMN_PADDING).
        columnGap(LEGEND_COLUMN_GAP).
        maxColumns(MAX_LEGEND_COLUMNS).
        minimumTextWidth(LEGEND_MINIMUM_TEXT_WIDTH);
    }

    const columnsData = legendLayout(containerWidth, legendData);
    const columns = svgElement.selectAll('g').data(columnsData);

    renderLegendColumn(columns, colorSelector, textAttributes);
    renderLegendColumn(columns.enter().append('g'), colorSelector, textAttributes, true);
    columns.exit().remove();

    // Render separators
    const size = SvgHelpers.calculateElementSize(svgElement.node());
    const margin = legendLayout.margin();

    renderLegendSeparator(svgElement, 0, 0, containerWidth);
    renderLegendSeparator(svgElement, 0, size.height + margin.top + margin.bottom, containerWidth);

    return legendLayout;
  };

  function renderLegendColumn(group, colorSelector, textAttributes, append) {
    group.attr('transform', (d) => `translate(${d.x}, ${d.y})`);

    if (append) {
      group.append('rect').
        attr('x', 0).
        attr('y', 0).
        attr('width', LEGEND_RECT_SIZE).
        attr('height', LEGEND_RECT_SIZE).
        attr('fill', (d, i) => colorSelector(i));
    }

    const textRows = group.selectAll('text').data((d) => d.wrappedText);
    renderLegendColumnText(textRows, textAttributes);
    renderLegendColumnText(textRows.enter().append('text'), textAttributes);
    textRows.exit().remove();
  }

  function renderLegendColumnText(text, attributes) {
    text.
      attr('x', (d) => d.x + LEGEND_RECT_SIZE + LEGEND_RECT_LABEL_GAP).
      attr('y', (d) => d.y - 1).
      text((d) => d.text);

    _.forEach(attributes, (value, attr) => text.attr(_.kebabCase(attr), value));
  }

  function renderLegendSeparator(container, x, y, width) {
    container.append('line').
      attr('x1', x).
      attr('y1', y).
      attr('x2', width).
      attr('y2', y).
      style('stroke', LEGEND_SEPARATOR_COLOR).
      style('stroke-width', LEGEND_SEPARATOR_WIDTH);
  }

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

        let href = `https://${domain}/d/${linkableDatasetUid}`;

        if (self.$container.closest('.socrata-visualization-embed').length) {
          href += '?referrer=embed';
        }

        self.
          $container.
          addClass('socrata-visualization-view-source-data').
          find('.socrata-visualization-view-source-data a').
          attr('href', href);
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

  this.isMultiSeries = function() {
    const dimensionGroupingColumnName = _.get(
      self.getVif(),
      'series[0].dataSource.dimension.grouping.columnName',
      null
    );

    return (
      _.get(self.getVif(), 'series', []).length >= 2 ||
      !_.isEmpty(dimensionGroupingColumnName)
    );
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

  this.getShowLegend = function() {
    return _.get(
      self.getVif(),
      'configuration.showLegend',
      false
    );
  };

  this.getAxisLabels = () => {
    return _.get(
      self.getVif(),
      'configuration.axisLabels',
      {}
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
