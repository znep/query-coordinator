const $ = require('jquery');
const _ = require('lodash');
const React = require('react');
const ReactDOM = require('react-dom');

const utils = require('common/js_utils');
const I18n = require('common/i18n').default;
const { FilterBar, SocrataIcon } = require('common/components');
const spandexSubscriber = require('common/spandex/subscriber').default;

const ColumnFormattingHelpers = require('../helpers/ColumnFormattingHelpers');
const VifHelpers = require('../helpers/VifHelpers');
const SvgHelpers = require('../helpers/SvgHelpers');
const DataTypeFormatter = require('./DataTypeFormatter');
const { MetadataProvider, SoqlDataProvider } = require('../dataProviders');

import {
  AXIS_LABEL_COLOR,
  AXIS_LABEL_FONT_FAMILY,
  AXIS_LABEL_FONT_SIZE,
  AXIS_LABEL_MARGIN,
  AXIS_LABEL_TEXT_MARGIN,
  DEFAULT_HIGHLIGHT_COLOR,
  SERIES_TYPE_FLYOUT
} from './SvgConstants';

const DEFAULT_TYPE_VARIANTS = {
  columnChart: 'column', // others: 'bar'
  timelineChart: 'area' // others: 'line'
};

function SvgVisualization($element, vif, options) {
  // These constants need to be defined inside the function
  // because I18n does not get hydrated in embeds until after
  // they were getting set. By moving them into the function,
  // I18n has time to get hydrated. Relates to EN-18831
  const DEFAULT_UNIT_ONE = I18n.t('shared.visualizations.charts.common.unit.one');
  const DEFAULT_UNIT_OTHER = I18n.t('shared.visualizations.charts.common.unit.other');
  const noValueLabel = I18n.t('shared.visualizations.charts.common.no_value');

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
    const dataSource = _.get(this.getVif(), 'series[0].dataSource', {});

    const $filterBarContainer = self.$container.find('.socrata-visualization-filter-bar-container');
    const filters = dataSource.filters || [];
    const allHidden = _.every(filters, (filter) => filter.isHidden);

    if (!this.getColumns() || !this.shouldDisplayFilterBar() || filters.length === 0 || allHidden) {
      ReactDOM.unmountComponentAtNode($filterBarContainer[0]);
      self.$container.removeClass('socrata-visualization-filter-bar');
      return;
    }

    self.$container.addClass('socrata-visualization-filter-bar');

    /**
     * This code is basically duplicated from the following files:
     * - frontend/public/javascripts/visualizationCanvas/components/FilterBar.js
     * - common/authoring_workflow/components/FilterBar.js
     */
    const isValidTextFilterColumnValue = (column, searchTerm) => {
      const soqlDataProvider = new SoqlDataProvider(_.pick(dataSource, ['datasetUid', 'domain']), true);
      return soqlDataProvider.match(column.fieldName, searchTerm);
    };

    const props = {
      columns: this.getColumns(),
      filters,
      isReadOnly: true,
      isValidTextFilterColumnValue,
      spandex: _.pick(dataSource, ['datasetUid', 'domain']),
      onUpdate: (newFilters) => {
        const newVif = _.cloneDeep(this.getVif());
        _.each(newVif.series, (series) => {
          _.set(series, 'dataSource.filters', newFilters);
        });

        this.emitEvent('SOCRATA_VISUALIZATION_VIF_UPDATED', newVif);
        this.emitEvent('SOCRATA_VISUALIZATION_RENDER_VIF', newVif);
      }
    };

    ReactDOM.render(
      // EN-20390 - Don't poke spandex for now until we can figure out a more sustainable approach
      // React.createElement(spandexSubscriber()(FilterBar), props),
      React.createElement(FilterBar, props),
      $filterBarContainer[0]
    );
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
    const secondaryYAxisBox = containerSvg.select('.y.secondaryAxis').node();

    const xAxisHeight = xAxisBox ? xAxisBox.getBBox().height : 0;
    const yAxisWidth = yAxisBox ? yAxisBox.getBBox().width : 0;
    const secondaryYAxisWidth = secondaryYAxisBox ? secondaryYAxisBox.getBBox().width : 0;

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
        const left = chartMaxX + secondaryYAxisWidth + AXIS_LABEL_TEXT_MARGIN;
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

    $message.data('vif', self.getVif());

    self.
      $container.
      removeClass('socrata-visualization-busy').
      addClass('socrata-visualization-error');
  };

  this.removeLegendBar = function() {

    self.$container.removeClass('socrata-visualization-legend-bar');
    self.$container.find('.socrata-visualization-legend-bar-container').empty();
  };

  this.renderLegendBar = function(items) {

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
      append($('<span>', { 'class': 'socrata-icon-arrow-up' })).
      append($('<span>', { 'class': 'socrata-icon-close-2 legend-button-display-none' }));

    $innerContainer.append($button);

    // Menu
    //
    const $ul = $('<ul>', { 'class': 'socrata-legend-menu' });

    items.forEach((item) => {

      // WARNING do not use this value with .html() below, which would create an XSS potential.
      const itemLabelText = _.unescape(item.label);
      if (item.dashed) {
        $ul.append(
          $('<li>').
            text(itemLabelText).
            append($('<span>', { 'class': 'dashed', 'style': `border-top-color:${item.color}` }))
        );
      } else {
        $ul.append(
          $('<li>').
            text(itemLabelText).
            append($('<span>', { 'style': `background-color:${item.color}` }))
        );
      }
    });

    $innerContainer.append($ul);

    if (this.getShowLegendOpened()) {
      this.toggleShowLegend($button, $ul);
    }

    // Set menu max height so it may scroll
    //
    const containerHeight = self.$container.find('.socrata-visualization-container').height();
    $ul.css({ 'max-height': containerHeight + 2 }); // slid up 1px and down 1px to cover borders
  };

  this.attachLegendBarEventHandlers = function() {

    const toggle = this.toggleShowLegend;
    self.$container.find('.socrata-legend-button').off('click').on('click', function(event) { // note: using function because we are using $(this)

      event.stopPropagation();

      const $menu = self.$container.find('.socrata-legend-menu');
      toggle($(this), $menu);
    });
  };

  this.toggleShowLegend = ($button, $menu) => {
    $menu.toggle().scrollTop(0);

    const isVisible = $menu.is(':visible');
    const labelText = isVisible ?
      I18n.t('shared.visualizations.charts.common.hide_legend') :
      I18n.t('shared.visualizations.charts.common.show_legend');

    $button.find('label').text(labelText);
    $button.find('.socrata-icon-arrow-up').toggleClass('legend-button-display-none');
    $button.find('.socrata-icon-close-2').toggleClass('legend-button-display-none');
  };

  this.getLegendItems = function({ measures, referenceLines }) {
    const referenceLinesWithLabels = _.filter(referenceLines, (line) => !_.isEmpty(line.label));
    const referenceLineItems = referenceLinesWithLabels.map((line) => {
      return {
        label: line.label,
        color: line.color,
        dashed: true
      };
    });

    let measureItems = [];

    if (measures) {
      const measuresWithLabels = _.filter(measures, (measure) => !_.isEmpty(measure.labelHtml));
      measureItems = measuresWithLabels.map((measure) => {
        const color = measure.getColor(vif);
        return {
          label: measure.labelHtml,
          color,
          dashed: false
        };
      });
    }

    return [...referenceLineItems, ...measureItems];
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
    const viewSourceDataOverride = _.get(self.getVif(), 'origin.url');
    const renderLink = function(href) {
      if (self.isEmbedded()) {
        href += '?referrer=embed';
      }

      self.
        $container.
        addClass('socrata-visualization-view-source-data').
        find('.socrata-visualization-view-source-data a').
        attr('href', href);

      // Add the info class immediately so that visualizations can accurately
      // measure how much space they have to fill, but only add the
      // view-source-data class to show the link once the optional metadata
      // request has returned, if it is made.
      self.sourceDataLinkVisible = true;
      self.showInfo();
    };

    if (!_.isEmpty(viewSourceDataOverride)) {
      renderLink(viewSourceDataOverride);
    } else if (_.get(self.getVif(), 'series[0].dataSource.type') === 'socrata.soql') {

      const domain = _.get(self.getVif(), 'series[0].dataSource.domain');
      const datasetUid = _.get(self.getVif(), 'series[0].dataSource.datasetUid');
      const metadataProvider = new MetadataProvider({ domain, datasetUid }, true);

      metadataProvider.getDatasetMigrationMetadata().
        then(function(migrationMetadata) {
          const nbeUid = _.get(migrationMetadata, 'nbe_id', datasetUid);
          renderLink(`https://${domain}/d/${nbeUid}`);
        }).
        catch(function() {
          renderLink(`https://${domain}/d/${datasetUid}`);
        });
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

  this.isGroupingOrHasMultipleNonFlyoutSeries = () => {
    return self.isGrouping() || self.hasMultipleNonFlyoutSeries();
  };

  this.hasMultipleNonFlyoutSeries = () => {
    const series = _.get(self.getVif(), 'series', []);
    const nonFlyoutSeries = _.filter(series, (item) => item.type !== SERIES_TYPE_FLYOUT);

    return nonFlyoutSeries.length > 1;
  };

  this.isGrouping = () => {
    const dimensionGroupingColumnName = _.get(
      self.getVif(),
      'series[0].dataSource.dimension.grouping.columnName',
      null
    );

    return !_.isEmpty(dimensionGroupingColumnName);
  };

  this.hasFlyoutSeries = () => {
    const series = _.get(self.getVif(), 'series', []);
    return _.findIndex(series, (item) => item.type === SERIES_TYPE_FLYOUT) != -1;
  };

  this.isInRange = (value, minValue, maxValue) => (value >= minValue) && (value <= maxValue);
  this.isOneHundredPercentStacked = () => _.get(self.getVif(), 'series[0].stacked.oneHundredPercent', false);
  this.isStacked = () => _.get(self.getVif(), 'series[0].stacked', false);

  this.hasErrorBars = () =>
    !_.isUndefined(_.get(self.getVif(), 'series[0].errorBars.lowerBoundColumnName')) &&
    !_.isUndefined(_.get(self.getVif(), 'series[0].errorBars.upperBoundColumnName'));

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

  this.getLineStyleBySeriesIndex = function(seriesIndex) {
    const actualSeriesIndex = defaultToSeriesIndexZeroIfGroupingIsEnabled(
      self.getVif(),
      seriesIndex
    );
    return _.merge(
      {
        points: 'none',
        pattern: 'solid'
      },
      _.get(self.getVif(), ['series', actualSeriesIndex, 'lineStyle'])
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

  this.getMeasureAxisMinValue = () => {
    const value = _.get(self.getVif(), 'configuration.measureAxisMinValue', null);
    return validateAxisValue(value, 'measure_axis_min_value_should_be_numeric');
  };

  this.getMeasureAxisMaxValue = () => {
    const value = _.get(self.getVif(), 'configuration.measureAxisMaxValue', null);
    return validateAxisValue(value, 'measure_axis_max_value_should_be_numeric');
  };

  this.getDimensionAxisMinValue = () => {
    // TODO: When more than just time-series Timeline Charts are supported,
    // add validation relative to expected dimension axis data type.
    return _.get(self.getVif(), 'configuration.dimensionAxisMinValue', null);
  };

  this.getDimensionAxisMaxValue = () => {
    // TODO: When more than just time-series Timeline Charts are supported,
    // add validation relative to expected dimension axis data type.
    return _.get(self.getVif(), 'configuration.dimensionAxisMaxValue', null);
  };

  this.getSecondaryMeasureAxisMinValue = () => {
    const value = _.get(self.getVif(), 'configuration.secondaryMeasureAxisMinValue', null);
    return validateAxisValue(value, 'measure_axis_min_value_should_be_numeric');
  };

  this.getSecondaryMeasureAxisMaxValue = () => {
    const value = _.get(self.getVif(), 'configuration.secondaryMeasureAxisMaxValue', null);
    return validateAxisValue(value, 'measure_axis_max_value_should_be_numeric');
  };

  function validateAxisValue(value, key) {
    const check = isFinite(value) && parseFloat(value);

    if (value !== null && (check === false || isNaN(check))) {
      throw new Error(I18n.t('shared.visualizations.charts.common.validation.errors.' + key));
    } else {
      return value;
    }
  }

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

  this.getShowLegendOpened = () => {
    return _.get(self.getVif(), 'configuration.showLegendOpened', false);
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

  this.getPositionsForRange = (groupedDataToRender, minValue, maxValue) => {
    const positions = getPositions(groupedDataToRender);
    return adjustPositionsToFitRange(positions, minValue, maxValue);
  };

  this.getStackedPositionsForRange = (groupedDataToRender, minValue, maxValue) => {
    const positions = getStackedPositions(groupedDataToRender);
    return adjustPositionsToFitRange(positions, minValue, maxValue);
  };

  this.getOneHundredPercentStackedPositions = (groupedDataToRender) => {

    return groupedDataToRender.map((row) => {
      const values = row.slice(1); // first index is the dimension name
      const sumOfAbsoluteValues = values.reduce((sum, value) => sum + Math.abs((value || 0)), 0);

      let positiveOffset = 0;
      let negativeOffset = 0;

      return values.map((o) => {

        if (sumOfAbsoluteValues === 0) {
          return { start: 0, end: 0, percent: 0 };
        }

        const percent = (o || 0) / sumOfAbsoluteValues;
        let position;

        if (percent >= 0) {
          position = { start: positiveOffset, end: positiveOffset + percent, percent: (percent * 100) };
          positiveOffset += percent;
        } else {
          position = { start: negativeOffset + percent, end: negativeOffset, percent: (percent * 100) };
          negativeOffset += percent;
        }

        return position;
      });
    });
  };

  this.getMaxOneHundredPercentStackedValue = (positions) => {
    const sumOfPositivePercents = positions.map(                  // for each row of positions
      (row) => _.filter(row, (position) => position.percent > 0). // filter for positions with positive percents
        reduce((sum, position) => sum + position.percent, 0));    // sum the positive percents

    return d3.max(sumOfPositivePercents) / 100;
  };

  this.getMinOneHundredPercentStackedValue = (positions) => {
    const sumOfNegativePercents = positions.map(                  // for each row of positions
      (row) => _.filter(row, (position) => position.percent < 0). // filter for positions with negative percents
        reduce((sum, position) => sum + position.percent, 0));    // sum the negative percents

    return d3.min(sumOfNegativePercents) / 100;
  };

  this.getDataToRenderOfSeriesType = (dataToRender, seriesType) => {
    const clonedDataToRender = _.cloneDeep(dataToRender);

    // Get indices of anything that is not our seriesType
    //
    const series = _.get(self.getVif(), 'series');
    const indicesToExcise = series.reduce((indices, seriesItem, index) => {
      if (seriesItem.type !== seriesType) {
        indices.push(index + 1);
      }
      return indices;
    }, []);

    // Excise from columns
    //
    for (var j = indicesToExcise.length - 1; j >= 0; j--) {
      clonedDataToRender.columns.splice(indicesToExcise[j], 1);
    }

    // Excise from seriesIndices
    //
    for (var k = indicesToExcise.length - 1; k >= 0; k--) {
      clonedDataToRender.seriesIndices.splice(indicesToExcise[k], 1);
    }

    // Excise from rows
    //
    clonedDataToRender.rows = clonedDataToRender.rows.map((row) => {
      for (var i = indicesToExcise.length - 1; i >= 0; i--) {
        row.splice(indicesToExcise[i], 1);
      }

      return row;
    });

    return clonedDataToRender;
  };

  this.getDataToRenderByExcisingSeriesType = (dataToRender, seriesType) => {
    const clonedDataToRender = _.cloneDeep(dataToRender);

    // Get indices of anything that is not our seriesType
    //
    const series = _.get(self.getVif(), 'series');
    const indicesToExcise = series.reduce((indices, seriesItem, index) => {
      if (seriesItem.type === seriesType) {
        indices.push(index + 1);
      }
      return indices;
    }, []);

    // Excise from columns
    //
    for (var j = indicesToExcise.length - 1; j >= 0; j--) {
      clonedDataToRender.columns.splice(indicesToExcise[j], 1);
    }

    // Excise from seriesIndices
    //
    for (var k = indicesToExcise.length - 1; k >= 0; k--) {
      clonedDataToRender.seriesIndices.splice(indicesToExcise[k], 1);
    }

    // Excise from rows
    //
    clonedDataToRender.rows = clonedDataToRender.rows.map((row) => {
      for (var i = indicesToExcise.length - 1; i >= 0; i--) {
        row.splice(indicesToExcise[i], 1);
      }

      return row;
    });

    return clonedDataToRender;
  };

  this.addSeriesIndices = (dataToRender) => {

    dataToRender.seriesIndices = [null]; // first column is dimension

    for (var i = 0; i < dataToRender.columns.length - 1; i++) {
      dataToRender.seriesIndices.push(i);
    }
  };

  this.getValueHtml = ({ dataToRender, seriesIndex, value, percent }) => {

    if (_.isNil(value)) {
      return noValueLabel;
    }

    const column = _.get(self.getVif(), `series[${seriesIndex}].dataSource.measure.columnName`);
    let valueHTML = ColumnFormattingHelpers.formatValueHTML(value, column, dataToRender, true);

    if (value === 1) {
      valueHTML += ` ${_.escape(self.getUnitOneBySeriesIndex(seriesIndex))}`;
    } else {
      valueHTML += ` ${_.escape(self.getUnitOtherBySeriesIndex(seriesIndex))}`;
    }

    if (!isNaN(percent)) {
      const percentSymbol = I18n.t('shared.visualizations.charts.common.percent_symbol');
      valueHTML += ` (${Math.round(percent)}${percentSymbol})`;
    }

    return valueHTML;
  };

  this.getFlyoutMeasuresTable = ({ dataToRender, flyoutDataToRender, measures, dimensionIndex }) => {
    if (self.isGrouping()) {
      return null;
    }

    const flyoutDataRow = flyoutDataToRender.rows[dimensionIndex];

    if (flyoutDataRow.length <= 1) {
      return null;
    }

    const $flyoutTable = $('<table>', { 'class': 'socrata-flyout-table socrata-flyout-measures-table' });

    for (var i = 1; i < flyoutDataRow.length; i++) {
      const flyoutSeriesIndex = flyoutDataToRender.seriesIndices[i];
      const flyoutMeasure = measures[flyoutSeriesIndex];

      const flyoutValue = self.getValueHtml({
        dataToRender,
        seriesIndex: flyoutSeriesIndex,
        value: flyoutDataRow[i]
      });

      const $flyoutLabelCell = $('<td>', { 'class': 'socrata-flyout-cell' }).
        html(flyoutMeasure.labelHtml);

      const $flyoutValueCell = $('<td>', { 'class': 'socrata-flyout-cell' }).
        text(flyoutValue);

      const $flyoutValueRow = $('<tr>', { 'class': 'socrata-flyout-row' });

      $flyoutValueRow.append([
        $flyoutLabelCell,
        $flyoutValueCell
      ]);

      $flyoutTable.append($flyoutValueRow);
    }

    return $flyoutTable;
  };

  this.getReferenceLines = () => {
    return _.filter(
      _.get(self.getVif(), 'referenceLines', []),
      (referenceLine) => _.isFinite(referenceLine.value));
  };

  this.getSeriesIndexByMeasureIndex = (measureIndex) => {
    const columnName = _.get(self.getVif(), 'series[0].dataSource.dimension.grouping.columnName');
    return _.isEmpty(columnName) ? measureIndex : 0;
  };

  this.showReferenceLineFlyout = (element, referenceLines, isPercent, flyoutOffset) => {
    const index = parseInt(element.getAttribute('data-reference-line-index'), 10);
    const referenceLine = referenceLines[index];

    const $table = $('<table>', { 'class': 'socrata-flyout-table' });
    const $titleRow = $('<tr>', { 'class': 'socrata-flyout-title' }).
      append($('<td>', { 'colspan': 2 }).text(referenceLine.label));

    let value = DataTypeFormatter.renderNumberCellHTML(
      referenceLine.value,
      { format: { forceHumane: true } }
    );

    value = isPercent ? `${value}%` : value;

    const $valueRow = $('<tr>', { 'class': 'socrata-flyout-row' });

    if (_.isEmpty(referenceLine.label)) {
      $valueRow.
        append($('<td>', { 'class': 'socrata-flyout-cell' }).text(value));
    } else {
      $valueRow.
        append($('<td>')).
        append($('<td>', { 'class': 'socrata-flyout-cell' }).text(value));

      $table.append($titleRow);
    }

    $table.append($valueRow);

    const payload = {
      element,
      content: $table,
      rightSideHint: false,
      belowTarget: false,
      dark: true,
      flyoutOffset
    };

    this.emitEvent(
      'SOCRATA_VISUALIZATION_FLYOUT',
      payload
    );
  };

  /**
   * Private methods
   */

  function renderTemplate() {

    self.
      $element.
        append(
          $('<div>', { 'class': 'socrata-visualization' }).
            append([
              $('<div>', { 'class': 'socrata-visualization-title-container' }).
                append(
                  $('<div>', { 'class': 'socrata-visualization-title' })
                ),
              $('<div>', { 'class': 'socrata-visualization-description-container' }).
                append(
                  $('<div>', { 'class': 'socrata-visualization-description' })
                ),
              $('<div>', { 'class': 'socrata-visualization-filter-bar-container' }),
              $('<div>', { 'class': 'socrata-visualization-container', 'aria-hidden': 'true' }),
              $('<div>', { 'class': 'socrata-visualization-legend-bar-container' }),
              $('<div>', { 'class': 'socrata-visualization-info' }).
                append([
                  $('<div>', { 'class': 'socrata-visualization-view-source-data' }).append(
                    $('<a>', { 'href': '', 'target': '_blank' }).append([
                      $('<span>').append(I18n.t('shared.visualizations.charts.common.view_source_data')),
                      $('<span>', { 'class': 'socrata-visualization-view-source-data-icon' })
                    ])
                  ),
                  $('<div>', { 'class': 'socrata-visualization-panning-notice' }).text(
                    I18n.t('shared.visualizations.charts.common.panning_notice')
                  )
                ]),
              $('<div>', { 'class': 'socrata-visualization-error-container error light' }).
                append([
                  $('<span>', { 'class': 'socrata-visualization-error-message text' })
                ]),
              $('<div>', { 'class': 'socrata-visualization-busy-indicator-container' }).
                append([
                  $('<span>', { 'class': 'socrata-visualization-busy-indicator' })
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

    return [element, content];
  }

  function showFlyout(event) {
    const [element, content] = getTextContent(this, event);

    if (content) {
      const customEvent = new window.CustomEvent('SOCRATA_VISUALIZATION_FLYOUT', {
        detail: {
          element,
          content:  $('<div>', { 'class': 'socrata-flyout-title' }).text(content),
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
    return self.isGrouping() ? 0 : seriesIndex;
  }

  function getPositions(groupedDataToRender) {

    return groupedDataToRender.map(row => {
      const values = row.slice(1); // first index is the dimension name

      return values.map((o) => {
        const value = o || 0;
        return (value >= 0) ? { start: 0, end: value } : { start: value, end: 0 };
      });
    });
  }

  function getStackedPositions(groupedDataToRender) {

    return groupedDataToRender.map(row => {
      const values = row.slice(1); // first index is the dimension name

      let positiveOffset = 0;
      let negativeOffset = 0;

      return values.map((o) => {
        const value = o || 0;
        let position;

        if (value >= 0) {
          position = { start: positiveOffset, end: positiveOffset + value };
          positiveOffset += value;
        } else {
          position = { start: negativeOffset + value, end: negativeOffset };
          negativeOffset += value;
        }

        return position;
      });
    });
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
