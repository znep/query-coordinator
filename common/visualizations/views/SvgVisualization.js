// Vendor Imports
const $ = require('jquery');
const _ = require('lodash');
const utils = require('common/js_utils');
const I18n = require('common/i18n').default;
const React = require('react');
const ReactDOM = require('react-dom');
const { FilterBar, SocrataIcon } = require('common/components');

// Project Imports
const VifHelpers = require('../helpers/VifHelpers');
const SvgHelpers = require('../helpers/SvgHelpers');
const CustomColorPaletteManager = require('../dataProviders/CustomColorPaletteManager');
const MetadataProvider = require('../dataProviders/MetadataProvider');

// Constants
import {
  DEFAULT_PRIMARY_COLOR,
  DEFAULT_SECONDARY_COLOR,
  DEFAULT_HIGHLIGHT_COLOR,
  COLOR_PALETTES,
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

function SvgVisualization($element, vif, options) {
  const DEFAULT_UNIT_ONE = I18n.t('shared.visualizations.charts.common.unit.one');
  const DEFAULT_UNIT_OTHER = I18n.t('shared.visualizations.charts.common.unit.other');

  const self = this;
  // See: http://stackoverflow.com/a/4819886
  const mobile = (
    'ontouchstart' in window || // works on most browsers
    navigator.maxTouchPoints // works on IE10/11 and Surface
  );

  let currentVif;
  let currentOptions;
  let currentColumns;

  // NOTE: Initialization occurs at the bottom of the file!

  /**
   * Public methods
   */

  this.getVif = function() {
    return currentVif;
  };

  this.getColumns = function() {
    return currentColumns;
  };

  this.getOptions = function() {
    return currentOptions;
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
    self.renderFilterBar();
    self.hidePanningNotice();

    if (shouldRenderViewSourceDataLink) {
      self.showViewSourceDataLink();
    } else {
      self.hideViewSourceDataLink();
    }
  };

  this.updateColumns = function(columnsToRender) {
    currentColumns = columnsToRender;
    self.renderFilterBar();
  };

  this.updateOptions = function(optionsToRender) {
    currentOptions = optionsToRender;
    self.renderFilterBar();
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

  this.renderFilterBar = function() {
    const $filterBarContainer = self.$container.find('.socrata-visualization-filter-bar-container');
    const filters = _.get(this.getVif(), 'series[0].dataSource.filters', []);
    const allHidden = _.every(filters, (filter) => filter.isHidden);

    if (!this.getColumns() || !this.shouldDisplayFilterBar() || filters.length === 0 || allHidden) {
      ReactDOM.unmountComponentAtNode($filterBarContainer[0]);
      self.$container.removeClass('socrata-visualization-filter-bar');
      return;
    }

    self.$container.addClass('socrata-visualization-filter-bar');

    const props = {
      columns: this.getColumns(),
      filters,
      isReadOnly: true,
      onUpdate: (newFilters) => {
        const newVif = _.cloneDeep(this.getVif());
        _.set(newVif, 'series[0].dataSource.filters', newFilters);

        this.emitEvent('SOCRATA_VISUALIZATION_VIF_UPDATED', newVif);
        this.emitEvent('SOCRATA_VISUALIZATION_RENDER_VIF', newVif);
      }
    };

    ReactDOM.render(React.createElement(FilterBar, props), $filterBarContainer[0]);
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
      'socrata-visualization-left-axis-title',
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
      'socrata-visualization-bottom-axis-title',
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
      'socrata-visualization-top-axis-title',
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
      'socrata-visualization-right-axis-title',
      (element) => {
        const left = chartMaxX - (AXIS_LABEL_MARGIN - AXIS_LABEL_TEXT_MARGIN);
        element.attr('transform', `translate(${left}, ${chartMidY}) rotate(90)`);
      }
    );
  };

  function createAxisLabelGroup(containerSvg, className) {
    const group = containerSvg.append('g');

    group.
      append('text').
      attr('class', className).
      attr('text-anchor', 'middle').
      attr('font-family', AXIS_LABEL_FONT_FAMILY).
      attr('font-size', AXIS_LABEL_FONT_SIZE).
      attr('fill', AXIS_LABEL_COLOR);

    group.
      on('mouseover', showFlyout).
      on('mouseout', hideFlyout);

    return group;
  }

  function updateAxisLabel(parentElement, axisLabelElement, title, className, nodeUpdateFn) {
    let element = axisLabelElement;

    if (title) {
      if (element === null) {
        element = createAxisLabelGroup(parentElement, className);
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
          I18n.t('shared.visualizations.charts.common.validation.errors.multiple_errors'))
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

  this.removeLegendBar = function() {

    self.$container.removeClass('socrata-visualization-legend-bar');
    self.$container.find('.socrata-visualization-legend-bar-container').empty();
  };

  this.renderLegendBar = function(measureLabels, getColor) {

    self.$container.addClass('socrata-visualization-legend-bar');

    // Empty legend bar
    //
    const $legendBarContainer = self.$container.find('.socrata-visualization-legend-bar-container');
    $legendBarContainer.empty();

    // Inner container
    //
    const $innerContainer = $('<div>', { 'class': 'socrata-visualization-legend-bar-inner-container' });
    $legendBarContainer.append($innerContainer);

    // Button
    //
    const $button = $('<button>', { 'class': 'socrata-legend-button' }).
      append($('<label>').text(I18n.t('shared.visualizations.charts.common.show_legend'))).
      append($('<span>', { 'class': 'socrata-icon-arrow-up'} )).
      append($('<span>', { 'class': 'socrata-icon-close-2'} ));

    $innerContainer.append($button);

    // Menu
    //
    const $ul = $('<ul>', { 'class': 'socrata-legend-menu' });

    measureLabels.forEach((label, i) => {

      const color = getColor(i);
      $ul.append(
        $('<li>').
          text(label).
          append($('<span>', { 'style': `background-color:${color}`}))
      );
    });

    $innerContainer.append($ul);

    // Set menu max height so it may scroll
    //
    const containerHeight = self.$container.find('.socrata-visualization-container').height();
    $ul.css({ 'max-height': containerHeight + 2 }); // slid up 1px and down 1px to cover borders
  };

  this.attachLegendBarEventHandlers = function() {

    self.$container.find('.socrata-legend-button').off('click').on('click', function(event) { // note: using function because we are using $(this)

      event.stopPropagation();

      const menu = self.$container.find('.socrata-legend-menu').
        toggle().
        scrollTop(0);

      const isVisible = menu.is(':visible');

      const labelText = isVisible ?
        I18n.t('shared.visualizations.charts.common.hide_legend') :
        I18n.t('shared.visualizations.charts.common.show_legend');

      $(this).find('label').text(labelText);
      $(this).find('.socrata-icon-arrow-up').toggle();
      $(this).find('.socrata-icon-close-2').toggle();

      if (isVisible) {
        $('body').on('click', self.hideLegendMenu);
      }
    });

    self.$container.find('.socrata-legend-menu').click((event) => event.stopPropagation);
  };

  this.hideLegendMenu = function() {

    self.$container.find('.socrata-legend-button label').text(I18n.t('shared.visualizations.charts.common.show_legend'));
    self.$container.find('.socrata-legend-button .socrata-icon-arrow-up').show();
    self.$container.find('.socrata-legend-button .socrata-icon-close-2').hide();
    self.$container.find('.socrata-legend-menu').hide();

    $('body').off('click', self.hideLegendMenu);
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

        let href = `https://${domain}/d/${linkableDatasetUid}`;

        if (self.isEmbedded()) {
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

  this.getMeasureAggregationBySeriesIndex = function(seriesIndex) {
    const actualSeriesIndex = defaultToSeriesIndexZeroIfGroupingIsEnabled(
      self.getVif(),
      seriesIndex
    );

    return _.chain(self.getVif()).
      get(`series[${actualSeriesIndex}]dataSource.measure.aggregationFunction`).
      toLower().
      value();
  };

  this.getUnitOneBySeriesIndex = function(seriesIndex) {
    const actualSeriesIndex = defaultToSeriesIndexZeroIfGroupingIsEnabled(
      self.getVif(),
      seriesIndex
    );
    const hasSumAggregation = _.isEqual(self.getMeasureAggregationBySeriesIndex(seriesIndex), 'sum');
    const unitOne = _.get(self.getVif(), `series[${actualSeriesIndex}]unit.one`);

    if (_.isString(unitOne) && !_.isEmpty(unitOne)) {
      return unitOne;
    } else if (hasSumAggregation) {
      return I18n.t('shared.visualizations.charts.common.sum_aggregation_unit');
    } else {
      return DEFAULT_UNIT_ONE;
    }
  };

  this.getUnitOtherBySeriesIndex = function(seriesIndex) {
    const actualSeriesIndex = defaultToSeriesIndexZeroIfGroupingIsEnabled(
      self.getVif(),
      seriesIndex
    );
    const hasSumAggregation = _.isEqual(self.getMeasureAggregationBySeriesIndex(seriesIndex), 'sum');
    const unitOther = _.get(self.getVif(), `series[${actualSeriesIndex}]unit.other`);

    if (_.isString(unitOther) && !_.isEmpty(unitOther)) {
      return unitOther;
    } else if (hasSumAggregation) {
      return I18n.t('shared.visualizations.charts.common.sum_aggregation_unit');
    } else {
      return DEFAULT_UNIT_OTHER;
    }
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

  this.getColor = function(dimensionIndex, measureIndex, measureLabels) {
    const isGrouping = !_.isNull(
      _.get(
        self.getVif(),
        'series[0].dataSource.dimension.grouping.columnName',
        null
      )
    );

    const usingColorPalette = _.get(
      self.getVif(),
      `series[${(isGrouping) ? 0 : dimensionIndex}].color.palette`,
      false
    );

    function getColorFromPalette() {
      const palette = usingColorPalette === 'custom' ?
        self.getColorPaletteByColumnTitles(measureLabels) :
        self.getColorPaletteBySeriesIndex(0);

      return palette[measureIndex];
    }

    function getPrimaryColorOrNone() {
      const primaryColor = (isGrouping) ?
        self.getPrimaryColorBySeriesIndex(0) :
        self.getPrimaryColorBySeriesIndex(measureIndex);

      return (primaryColor !== null) ?
        primaryColor :
        'none';
    }

    return (usingColorPalette) ?
      getColorFromPalette() :
      getPrimaryColorOrNone();
  }

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

  this.getColorPaletteByColumnTitles = function(displayedColumnTitles) {
    const currentVizType = _.get(self.getVif(), 'series[0].type');
    const columnName = currentVizType === 'pieChart' ?
      _.get(self.getVif(), 'series[0].dataSource.dimension.columnName') :
      _.get(self.getVif(), 'series[0].dataSource.dimension.grouping.columnName');

    const currentPalette = _.get(self.getVif(), `series[0].color.customPalette.${columnName}`);

    return CustomColorPaletteManager.getDisplayedColorsFromCustomPalette(
      displayedColumnTitles,
      currentPalette
    );
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
        I18n.t(
          'shared.visualizations.charts.common.validation.errors.' +
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
        I18n.t(
          'shared.visualizations.charts.common.validation.errors.' +
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

  this.getShowLegend = function(defaultValue = false) {
    return _.get(
      self.getVif(),
      'configuration.showLegend',
      defaultValue
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

  this.isEmbedded = function() {
    return self.$container.closest('.socrata-visualization-embed').length > 0;
  };

  this.shouldDisplayFilterBar = function() {
    return _.get(self.getOptions(), 'displayFilterBar', false);
  };

  this.getPositionsForRange = function(groupedDataToRender, minValue, maxValue) {
    const positions = getPositions(groupedDataToRender);
    return adjustPositionsToFitRange(positions, minValue, maxValue);
  };

  this.getStackedPositionsForRange = function(groupedDataToRender, minValue, maxValue) {
    const positions = getStackedPositions(groupedDataToRender);
    return adjustPositionsToFitRange(positions, minValue, maxValue);
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
              $('<div>', {'class': 'socrata-visualization-filter-bar-container'}),
              $('<div>', {'class': 'socrata-visualization-container'}),
              $('<div>', {'class': 'socrata-visualization-legend-bar-container'}),
              $('<div>', {'class': 'socrata-visualization-info'}).
                append([
                  $('<div>', {'class': 'socrata-visualization-view-source-data'}).append(
                    $('<a>', {'href': '', 'target': '_blank'}).append([
                      $('<span>').append(I18n.t('shared.visualizations.charts.common.view_source_data')),
                      $('<span>', {'class': 'socrata-visualization-view-source-data-icon'})
                    ])
                  ),
                  $('<div>', {'class': 'socrata-visualization-panning-notice'}).text(
                    I18n.t('shared.visualizations.charts.common.panning_notice')
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

    ReactDOM.render(
      React.createElement(SocrataIcon, { name: 'external' }),
      self.$element.find('.socrata-visualization-view-source-data-icon')[0]
    );
  }

  function attachEvents() {
    const $visualization = self.$element.find('.socrata-visualization');

    // Destroy on (only the first) 'SOCRATA_VISUALIZATION_DESTROY' event.
    self.$element.one('SOCRATA_VISUALIZATION_DESTROY', function() {
      self.$element.find('.socrata-visualization').remove();
      detachEvents();
    });

    // The download button is not currently rendered anywhere, but may be in the future
    $visualization.on('click', '.socrata-visualization-download-button', handleDownload);

    $visualization.on('mouseover', '.socrata-visualization-title', showFlyout);
    $visualization.on('mouseout', '.socrata-visualization-title', hideFlyout);

    $visualization.on('mouseover', '.socrata-visualization-description', showFlyout);
    $visualization.on('mouseout', '.socrata-visualization-description', hideFlyout);
  }

  function detachEvents() {
    const $visualization = self.$element.find('.socrata-visualization');

    self.$element.off('click', '.socrata-visualization-download-button', handleDownload);

    $visualization.off('mouseover', '.socrata-visualization-title', showFlyout);
    $visualization.off('mouseout', '.socrata-visualization-title', hideFlyout);

    $visualization.off('mouseover', '.socrata-visualization-description', showFlyout);
    $visualization.off('mouseout', '.socrata-visualization-description', hideFlyout);
  }

  function getTextContent(context, event) {
    const element = context instanceof Element ? context : event.originalEvent.target;
    const content = element.querySelector('text')
      ? element.querySelector('text').textContent
      : element.getAttribute('data-full-text');

    return [ element, content ];
  }

  function showFlyout(event) {
    const [ element, content ] = getTextContent(this, event);

    if (content) {
      const customEvent = new window.CustomEvent('SOCRATA_VISUALIZATION_FLYOUT', {
        detail: {
          element,
          content:  $('<div>', {'class': 'socrata-flyout-title'}).text(content),
          rightSideHint: false,
          belowTarget: false,
          dark: true
        },
        bubbles: true
      });

      self.$element[0].dispatchEvent(customEvent);
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

  function getPositions(groupedDataToRender) {

    const positions = [];

    groupedDataToRender.forEach(row => {

      const group = [];

      row.forEach((o, i) => {

        if (i == 0)
          return; // skip the dimension label

        const value = o || 0;

        if (value >= 0) {
          group.push({ start: 0, end: value });
        } else {
          group.push({ start: value, end: 0 });
        }
      });

      positions.push(group);
    });

    return positions;
  }

  function getStackedPositions(groupedDataToRender) {

    const positions = [];

    groupedDataToRender.forEach(row => {

      const group = [];
      var positiveOffset = 0;
      var negativeOffset = 0;

      row.forEach((o, i) => {

        if (i == 0) {
          return; // skip the dimension label
        }

        const value = o || 0;

        if (value >= 0) {
          group.push({ start: positiveOffset, end: positiveOffset + value });
          positiveOffset += value;
        } else {
          group.push({ start: negativeOffset + value, end: negativeOffset });
          negativeOffset += value;
        }
      });

      positions.push(group);
    });

    return positions;
  }

  function adjustPositionsToFitRange(positions, minValue, maxValue) {

    positions.forEach(group => {
      group.forEach(position => {
        position.start = _.clamp(position.start, minValue, maxValue);
        position.end = _.clamp(position.end, minValue, maxValue);
      });
    });

    return positions;
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
  this.updateOptions(options);
}

module.exports = SvgVisualization;
