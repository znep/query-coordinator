var _ = require('lodash');
var $ = require('jquery');
var utils = require('socrata-utils');
var SvgColumnChart = require('./views/SvgColumnChart');
var SvgVisualization = require('./views/SvgVisualization');
var SoqlDataProvider = require('./dataProviders/SoqlDataProvider');
var VifHelpers = require('./helpers/VifHelpers');
var SoqlHelpers = require('./dataProviders/SoqlHelpers');

var MAX_ROW_COUNT = 1000;
var SOQL_DATA_PROVIDER_DIMENSION_ALIAS = '__DIMENSION_ALIAS__';
var SOQL_DATA_PROVIDER_MEASURE_ALIAS = '__MEASURE_ALIAS__';
var UNAGGREGATED_BASE_QUERY = 'SELECT {0} AS {1}, {2} AS {3} {4} ORDER BY {0} {5} NULL LAST LIMIT {6}';
var AGGREGATED_BASE_QUERY = 'SELECT {0} AS {1}, {2} AS {3} {4} GROUP BY {5} ORDER BY {2} {6} NULL LAST LIMIT {7}';
var WINDOW_RESIZE_RERENDER_DELAY = 200;

$.fn.socrataSvgColumnChart = function(vif) {
  var $element = $(this);
  var visualization = new SvgColumnChart(
    $element,
    VifHelpers.migrateVif(vif)
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

    if (window.console && console.error) {
      console.error(error);
    }

    visualization.renderError(
      'An error was encountered when rendering this chart. ' +
      'Please try again in a few minutes.'
    );
  }

  function updateData(newVif) {
    var dataRequests = [];

    $element.trigger('SOCRATA_VISUALIZATION_DATA_LOAD_START');

    dataRequests = newVif.
      series.
      map(
        function(series, seriesIndex) {

          switch (series.dataSource.type) {

            case 'socrata.soql':
              return makeSocrataDataRequest(newVif, seriesIndex);

            default:
              return Promise.reject(
                'Invalid series dataSource.type: "{0}".'.
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

          overMaxRowCount = dataResponses.
            some(
              function(dataResponse) {
                return dataResponse.rows.length > MAX_ROW_COUNT;
              }
            );

          if (overMaxRowCount) {

            visualization.renderError(
              (
                'For optimal performance and legibility column charts are ' +
                'limited to {0} columns. Try using filters to render a more ' +
                'specific chart.'
              ).
                format(MAX_ROW_COUNT)
            );
          } else {
            visualization.render(newVif, dataResponses);
          }
        }
      )
      ['catch'](handleError);
  }

  function makeSocrataDataRequest(vifToRender, seriesIndex) {
    var series = vifToRender.series[seriesIndex];
    var soqlDataProvider = new SoqlDataProvider({
      datasetUid: series.dataSource.datasetUid,
      domain: series.dataSource.domain
    });
    var dimension = SoqlHelpers.dimension(vifToRender, seriesIndex);
    var measure = SoqlHelpers.measure(vifToRender, seriesIndex);
    var ascendingValue = _.get(series, 'dataSource.configuration.ascending');
    var ascending = (!_.isUndefined(ascendingValue)) ?
      Boolean(ascendingValue) :
      true;
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
        (ascending) ? 'ASC' : 'DESC',
        MAX_ROW_COUNT + 1
      );
    } else {

      queryString = AGGREGATED_BASE_QUERY.format(
        dimension,
        SOQL_DATA_PROVIDER_DIMENSION_ALIAS,
        measure,
        SOQL_DATA_PROVIDER_MEASURE_ALIAS,
        whereClause,
        aggregationClause,
        (ascending) ? 'ASC' : 'DESC',
        MAX_ROW_COUNT + 1
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
      )
      ['catch'](
        function(error) {

          if (window.console && console.error) {
            console.error(error);
          }

          return Promise.resolve(
            {
              columns: [],
              rows: []
            }
          );
        }
      );
  }

  /**
   * Actual execution starts here
   */

  attachEvents();
  updateData(
    VifHelpers.migrateVif(vif)
  );

  return this;
};

module.exports = $.fn.socrataSvgColumnChart;
