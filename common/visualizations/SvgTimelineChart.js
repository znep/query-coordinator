// Vendor Imports
const _ = require('lodash');
const $ = require('jquery');
const moment = require('moment');
// Project Imports
const VifHelpers = require('./helpers/VifHelpers');
const SvgTimelineChart = require('./views/SvgTimelineChart');
import { InlineDataProvider } from 'common/visualizations/dataProviders';
import MetadataProvider, { getDisplayableColumns }
  from 'common/visualizations/dataProviders/MetadataProvider';
const ColumnFormattingHelpers = require('./helpers/ColumnFormattingHelpers');
const SoqlHelpers = require('./dataProviders/SoqlHelpers');
const TimeDataManager = require('./dataProviders/TimeDataManager');
const CategoricalDataManager = require('./dataProviders/CategoricalDataManager');
const I18n = require('common/i18n').default;
const { getSoqlVifValidator } = require('./dataProviders/SoqlVifValidator.js');

// Constants
const WINDOW_RESIZE_RERENDER_DELAY = 200;

$.fn.socrataSvgTimelineChart = function(originalVif, options) {

  originalVif = VifHelpers.migrateVif(originalVif);

  const $element = $(this);
  const visualization = new SvgTimelineChart($element, originalVif, options);

  let rerenderOnResizeTimeout;

  /**
   * Event handling
   */

  function attachApiEvents() {

    // Destroy on (only the first) 'SOCRATA_VISUALIZATION_DESTROY' event.
    $element.one(
      'SOCRATA_VISUALIZATION_DESTROY',
      function() {

        clearTimeout(rerenderOnResizeTimeout);
        visualization.destroy();
        detachInteractionEvents();
        detachApiEvents();
      }
    );

    $(window).on('resize', handleWindowResize);

    $element.on(
      'SOCRATA_VISUALIZATION_INVALIDATE_SIZE',
      visualization.invalidateSize
    );
    $element.on('SOCRATA_VISUALIZATION_RENDER_VIF', handleRenderVif);
  }

  function attachInteractionEvents() {

    $element.on('SOCRATA_VISUALIZATION_TIMELINE_CHART_FLYOUT', handleFlyout);
  }

  function detachApiEvents() {

    $(window).off('resize', handleWindowResize);

    $element.off(
      'SOCRATA_VISUALIZATION_INVALIDATE_SIZE',
      visualization.invalidateSize
    );
    $element.off('SOCRATA_VISUALIZATION_RENDER_VIF', handleRenderVif);
  }

  function detachInteractionEvents() {

    $element.off('SOCRATA_VISUALIZATION_TIMELINE_CHART_FLYOUT', handleFlyout);
  }

  function handleWindowResize() {

    clearTimeout(rerenderOnResizeTimeout);

    rerenderOnResizeTimeout = setTimeout(
      visualization.invalidateSize,
      // Add some jitter in order to make sure multiple visualizations are
      // unlikely to all attempt to rerender themselves at the exact same
      // moment.
      WINDOW_RESIZE_RERENDER_DELAY + Math.floor(Math.random() * 10)
    );
  }

  function handleFlyout(event) {
    const payload = event.originalEvent.detail;

    $element[0].dispatchEvent(
      new window.CustomEvent(
        'SOCRATA_VISUALIZATION_FLYOUT',
        {
          detail: payload,
          bubbles: true
        }
      )
    );
  }

  function handleRenderVif(event) {
    const newVif = event.originalEvent.detail;

    updateData(VifHelpers.migrateVif(newVif));
  }

  function handleError(error) {
    let messages;

    if (window.console && console.error) {
      console.error(error);
    }

    if (error.errorMessages) {
      messages = error.errorMessages;
    } else {
      messages = I18n.t('shared.visualizations.charts.common.error_generic');
    }

    visualization.renderError(messages);
  }

  async function updateData(newVif) {
    $element.trigger('SOCRATA_VISUALIZATION_DATA_LOAD_START');
    visualization.showBusyIndicator();
    detachInteractionEvents();

    const dataSourceType = _.get(newVif, 'series[0].dataSource.type'); // Validator ensures uniform type.
    const inline = dataSourceType === 'socrata.inline';

    try {
      await $.fn.socrataSvgTimelineChart.validateVif(newVif);

      let columns = null;
      let newData;

      const dimensionColumnName = _.get(newVif, 'series[0].dataSource.dimension.columnName');

      if (inline) {
        newData = inlineDataQuery(visualization, newVif);
      } else {
        const domain = _.get(newVif, 'series[0].dataSource.domain');
        const datasetUid = _.get(newVif, 'series[0].dataSource.datasetUid');
        const precision = _.get(newVif, 'series[0].dataSource.precision');
        const datasetMetadataProvider = new MetadataProvider({ domain, datasetUid });

        const datasetMetadata = await datasetMetadataProvider.getDatasetMetadata();

        if (visualization.shouldDisplayFilterBar()) {
          columns = await datasetMetadataProvider.getDisplayableFilterableColumns(datasetMetadata);
        }

        const displayableColumns = getDisplayableColumns(datasetMetadata);
        const columnFormats = ColumnFormattingHelpers.getColumnFormats(displayableColumns);
        const isCalendarDate = isDimensionCalendarDate(dimensionColumnName, columnFormats);

        newData = await(
          isCalendarDate && (precision !== 'none') ?
            TimeDataManager.getData(newVif) :
            CategoricalDataManager.getData(newVif)
        );

        newData.columnFormats = columnFormats;
      }

      renderVisualization(newVif, newData, columns);
    } catch (error) {
      handleError(error);
    }
  }

  function isDimensionCalendarDate(dimensionColumnName, columnFormats) {
    const columnFormat = columnFormats[dimensionColumnName];
    return !_.isUndefined(columnFormat) && (columnFormat.dataTypeName === 'calendar_date');
  }

  function renderVisualization(vifToRender, dataToRender, columnsToRender) {
    const underTwoRows = dataToRender.rows.length < 2;
    const overMaxRowCount =
      dataToRender.rows.length > TimeDataManager.MAX_ROW_COUNT;
    const dimensionIndex = dataToRender.columns.indexOf('dimension');
    const allSeriesMeasureValues = dataToRender.rows.map((row) => {
      return row.slice(dimensionIndex + 1);
    });
    const onlyNullOrZeroValues = _.chain(allSeriesMeasureValues).
      flatten().
      compact().
      isEmpty().
      value();

    $element.trigger('SOCRATA_VISUALIZATION_DATA_LOAD_COMPLETE');
    visualization.hideBusyIndicator();

    if (underTwoRows) {

      visualization.renderError(
        I18n.t(
          'shared.visualizations.charts.timeline_chart.error_two_or_more_rows_required'
        )
      );
    } else if (overMaxRowCount) {

      visualization.renderError(
        I18n.t(
          'shared.visualizations.charts.timeline_chart.error_exceeded_max_row_count'
        ).format(TimeDataManager.MAX_ROW_COUNT)
      );
    } else if (onlyNullOrZeroValues) {

      visualization.renderError(
        I18n.t('shared.visualizations.charts.common.error_no_data')
      );
    } else {

      attachInteractionEvents();
      visualization.render(vifToRender, dataToRender, columnsToRender);
    }
  }

  /**
   * Actual execution starts here
   */

  attachApiEvents();
  updateData(originalVif);

  return this;
};

export function inlineDataQuery(visualization, vif) {
  if (visualization.shouldDisplayFilterBar()) {
    // We don't do client-side filtering, and we also can't fulfill the
    // queries getDisplayableFilterableColumns wants to do (specifically,
    // the columnStats query) to power the filtering UI.
    throw new Error('Filter bar not supported for visualizations using an inline data source.');
  }

  // Generate default columnFormats for each dimension column.
  const columnFormats = _(vif.series).map(
    (series) => _.get(series, 'dataSource.dimension.columnName')
  ).compact().map((fieldName) => [
    fieldName,
    {
      fieldName,
      dataTypeName: 'calendar_date',
      renderTypeName: 'calendar_date'
    }
  ]).fromPairs().value();

  const columns = ['dimension'];

  _.each(vif.series, (series) => {
    const { dataSource, label } = series;
    const { measure } = dataSource;
    const { asPercent, columnName } = measure;
    columnFormats[columnName] = {
      fieldName: columnName,
      name: label, // This is important - it sets the flyout label.
      dataTypeName: 'number',
      renderTypeName: asPercent ? 'percent' : 'number'
    };
    columns.push(columnName);
  });

  const inlineDataProvider = new InlineDataProvider(vif);
  // We bypass the TimeDataManager/CategoricalDataManager machinery
  // for the inline data provider case because:
  // a) InlineDataProvider would have to be taught how to do complex SoQL queries, and
  // b) the only user of inline data providers for SvgTimelineChart is KPIs, and it actively
  //    does not need the features TimeDataManager provides (it does its own aggregation).
  // To get away with this, we make a couple assumptions:
  // 1) Each series has exactly one numerical measure.
  // 2) Each series is time-dimensioned (no categorical data).
  // 3) There are no custom column formats.
  // 4) Precision is the same everywhere.
  return {
    columns,
    rows: inlineDataProvider.getRows(),
    columnFormats,
    precision: _.toLower(_.get(vif, 'series[0].dataSource.precision'))
  };
}


/**
 * Checks a VIF for compatibility with this visualization. The intent of this
 * function is to provide feedback while authoring a visualization, not to
 * provide feedback to a developer. As such, messages returned are worded to
 * make sense to a user.
 *
 * Returns a Promise.
 *
 * If the VIF is usable, the promise will resolve.
 * If the VIF is not usable, the promise will reject with an object:
 * {
 *   ok: false,
 *   errorMessages: Array<String>
 * }
 */
$.fn.socrataSvgTimelineChart.validateVif = (vif) =>
  getSoqlVifValidator(vif).then(validator =>
    validator.
      requireAtLeastOneSeries().
      toPromise()
  );

export default $.fn.socrataSvgTimelineChart;
