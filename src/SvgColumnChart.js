const _ = require('lodash');
const $ = require('jquery');
const utils = require('socrata-utils');
const SvgColumnChart = require('./views/SvgColumnChart');
const SvgVisualization = require('./views/SvgVisualization');
const SoqlDataProvider = require('./dataProviders/SoqlDataProvider');
const VifHelpers = require('./helpers/VifHelpers');
const SoqlHelpers = require('./dataProviders/SoqlHelpers');
const I18n = require('./I18n');
const getSoqlVifValidator = require('./dataProviders/SoqlVifValidator.js').getSoqlVifValidator;

const MAX_COLUMN_COUNT = 1000;
const SOQL_DATA_PROVIDER_DIMENSION_ALIAS = SoqlHelpers.dimensionAlias();
const SOQL_DATA_PROVIDER_MEASURE_ALIAS = SoqlHelpers.measureAlias();
const UNAGGREGATED_BASE_QUERY = 'SELECT {0} AS {1}, {2} AS {3} {4} ORDER BY {5} NULL LAST LIMIT {6}';
const AGGREGATED_BASE_QUERY = 'SELECT {0} AS {1}, {2} AS {3} {4} GROUP BY {5} ORDER BY {6} NULL LAST LIMIT {7}';
const WINDOW_RESIZE_RERENDER_DELAY = 200;

$.fn.socrataSvgColumnChart = function(originalVif) {
  originalVif = VifHelpers.migrateVif(originalVif);
  var $element = $(this);
  var visualization = new SvgColumnChart(
    $element,
    originalVif
  );
  var rerenderOnResizeTimeout;

  /**
   * Event handling
   */

  function attachEvents() {

    // Destroy on (only the first) 'SOCRATA_VISUALIZATION_DESTROY' event.
    $element.one('SOCRATA_VISUALIZATION_DESTROY', function() {
      clearTimeout(rerenderOnResizeTimeout);
      visualization.destroy();
      detachEvents();
    });

    $(window).on('resize', handleWindowResize);

    $element.on('SOCRATA_VISUALIZATION_INVALIDATE_SIZE', visualization.invalidateSize);
    $element.on('SOCRATA_VISUALIZATION_RENDER_VIF', handleRenderVif);
  }

  function detachEvents() {

    $(window).off('resize', handleWindowResize);

    $element.off('SOCRATA_VISUALIZATION_INVALIDATE_SIZE', visualization.invalidateSize);
    $element.off('SOCRATA_VISUALIZATION_RENDER_VIF', handleRenderVif);
  }

  function handleWindowResize() {

    clearTimeout(rerenderOnResizeTimeout);

    rerenderOnResizeTimeout = setTimeout(
      visualization.render(),
      // Add some jitter in order to make sure multiple visualizations are
      // unlikely to all attempt to rerender themselves at the exact same
      // moment.
      WINDOW_RESIZE_RERENDER_DELAY + Math.floor(Math.random() * 10)
    );
  }

  function handleRenderVif(event) {
    var newVif = event.originalEvent.detail;

    updateData(
      VifHelpers.migrateVif(newVif)
    );
  }

  function handleError(error) {
    var messages;

    if (window.console && console.error) {
      console.error(error);
    }

    if (error.errorMessages) {
      messages = error.errorMessages;
    } else {
      messages = I18n.translate('visualizations.common.error_generic')
    }

    visualization.renderError(messages);
  }

  function updateData(newVif) {

    $element.trigger('SOCRATA_VISUALIZATION_DATA_LOAD_START');
    visualization.showBusyIndicator();

    $.fn.socrataSvgColumnChart.validateVif(newVif).then(() => {
      const dataRequests = newVif.
        series.
        map(
          function(series, seriesIndex) {

            switch (series.dataSource.type) {

              case 'socrata.soql':
                return makeSocrataDataRequest(newVif, seriesIndex);

              default:
                return Promise.reject(
                  'Invalid/unsupported series dataSource.type: "{0}".'.
                    format(series.dataSource.type)
                );
            }
          }
        );

      Promise.
        all(dataRequests).
        then(
          function(dataResponses) {
            var overMaxRowCount;

            $element.trigger('SOCRATA_VISUALIZATION_DATA_LOAD_COMPLETE');
            visualization.hideBusyIndicator();

            overMaxRowCount = dataResponses.
              some(
                function(dataResponse) {
                  return dataResponse.rows.length > MAX_COLUMN_COUNT;
                }
              );

            if (overMaxRowCount) {

              visualization.renderError(
                I18n.translate(
                  'visualizations.column_chart.error_exceeded_max_column_count'
                ).format(MAX_COLUMN_COUNT)
              );
            } else {
              visualization.render(newVif, dataResponses);
            }
          }
        )
    })['catch'](handleError);
  }

  function makeSocrataDataRequest(vifToRender, seriesIndex) {
    var series = vifToRender.series[seriesIndex];
    var soqlDataProvider = new SoqlDataProvider({
      datasetUid: series.dataSource.datasetUid,
      domain: series.dataSource.domain
    });
    var dimension = SoqlHelpers.dimension(vifToRender, seriesIndex);
    var measure = SoqlHelpers.measure(vifToRender, seriesIndex);
    var whereClauseComponents = SoqlHelpers.whereClauseFilteringOwnColumn(
      vifToRender,
      seriesIndex
    );
    var whereClause = (whereClauseComponents.length > 0) ?
        'WHERE {0}'.format(whereClauseComponents) :
        '';
    var aggregationClause = SoqlHelpers.aggregationClause(
      vifToRender,
      seriesIndex,
      'dimension'
    );

    var orderClause = SoqlHelpers.orderByClauseFromSeries(vifToRender, seriesIndex);

    var ascending;
    var queryString;

    if (
      series.dataSource.dimension.aggregationFunction === null &&
      series.dataSource.measure.aggregationFunction === null
    ) {

      queryString = UNAGGREGATED_BASE_QUERY.format(
        dimension,
        SOQL_DATA_PROVIDER_DIMENSION_ALIAS,
        measure,
        SOQL_DATA_PROVIDER_MEASURE_ALIAS,
        whereClause,
        orderClause,
        MAX_COLUMN_COUNT + 1
      );
    } else {

      queryString = AGGREGATED_BASE_QUERY.format(
        dimension,
        SOQL_DATA_PROVIDER_DIMENSION_ALIAS,
        measure,
        SOQL_DATA_PROVIDER_MEASURE_ALIAS,
        whereClause,
        aggregationClause,
        orderClause,
        MAX_COLUMN_COUNT + 1
      );
    }

    return soqlDataProvider.
      query(
        queryString.replace(/\s+/, ' '),
        SOQL_DATA_PROVIDER_DIMENSION_ALIAS,
        SOQL_DATA_PROVIDER_MEASURE_ALIAS
      ).
      then(
        function(queryResponse) {
          var dimensionIndex = queryResponse.
            columns.
            indexOf(SOQL_DATA_PROVIDER_DIMENSION_ALIAS);
          var measureIndex = queryResponse.
            columns.
            indexOf(SOQL_DATA_PROVIDER_MEASURE_ALIAS);
          var valueAsNumber;

          queryResponse.columns[dimensionIndex] = 'dimension';
          queryResponse.columns[measureIndex] = 'measure';

          queryResponse.
            rows.
            forEach(function(row) {

              try {

                if (typeof row[measureIndex] === 'undefined') {
                  valueAsNumber = null;
                } else {
                  valueAsNumber = Number(row[measureIndex]);
                }
              } catch (error) {

                console.error(
                  'Could not convert measure value to number: {0}'.
                    format(row[measureIndex])
                );

                valueAsNumber = null;
              }

              row[measureIndex] = valueAsNumber;
            });

          return queryResponse;
        }
      );
  }

  /**
   * Actual execution starts here
   */

  attachEvents();
  updateData(originalVif);

  return this;
};

// Checks a VIF for compatibility with this visualization.
// The intent of this function is to provide feedback while
// authoring a visualization, not to provide feedback to a developer.
// As such, messages returned are worded to make sense to a user.
//
// Returns a Promise.
//
// If the VIF is usable, the promise will resolve.
// If the VIF is not usable, the promise will reject with an object:
// {
//   ok: false,
//   errorMessages: Array<String>
// }
$.fn.socrataSvgColumnChart.validateVif = (vif) =>
  getSoqlVifValidator(vif).then(validator =>
    validator.
      requireAtLeastOneSeries().
      toPromise()
  );

module.exports = $.fn.socrataSvgColumnChart;
