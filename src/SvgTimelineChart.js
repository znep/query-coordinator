var _ = require('lodash');
var $ = require('jquery');
var utils = require('socrata-utils');
var moment = require('moment');
var TimelineChart = require('./views/TimelineChart');
var SvgTimelineChart = require('./views/SvgTimelineChart');
var SoqlDataProvider = require('./dataProviders/SoqlDataProvider');
var SoqlHelpers = require('./dataProviders/SoqlHelpers');
var VifHelpers = require('./helpers/VifHelpers');

var MAX_ROW_COUNT = 1000;
var MAX_LEGAL_JAVASCRIPT_DATE_STRING = '9999-01-01';
var SOQL_DATA_PROVIDER_DIMENSION_ALIAS = '__dimension_alias__';
var SOQL_DATA_PROVIDER_MEASURE_ALIAS = '__measure_alias__';
var PRECISION_BASE_QUERY = 'SELECT min({0}) AS {1}, max({0}) AS {2} WHERE {0} < \'{3}\'';
var UNAGGREGATED_BASE_QUERY = 'SELECT {0} AS {1}, {2} AS {3} {4} LIMIT {5}';
var AGGREGATED_BASE_QUERY = 'SELECT {0}({1}) AS {2}, {3} AS {4} {5} GROUP BY {2} LIMIT {6}';
var SOQL_DATE_GUARDS = '{0} IS NOT NULL AND {0} < \'{1}\' AND (1=1)';

var WINDOW_RESIZE_RERENDER_DELAY = 200;

/**
 * Instantiates a Socrata ColumnChart Visualization from the
 * `socrata-visualizations` package.
 *
 * @param vif - https://docs.google.com/document/d/15oKmDfv39HrhgCJRTKtYadG8ZQvFUeyfx4kR_NZkBgc
 */
$.fn.socrataSvgTimelineChart = function(vif) {
  var $element = $(this);
  var visualization = new SvgTimelineChart(
    $element,
    VifHelpers.migrateVif(vif)
  );
  var rerenderOnResizeTimeout;

  /**
   * Event handling
   */

  function attachEvents() {

    // Destroy on (only the first) 'SOCRATA_VISUALIZATION_DESTROY' event.
    $element.one(
      'SOCRATA_VISUALIZATION_DESTROY',
      function() {

        clearTimeout(rerenderOnResizeTimeout);
        visualization.destroy();
        detachEvents();
      }
    );

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
                'For optimal performance and legibility timeline charts are ' +
                'limited to {0} time measurements. Try using filters to ' +
                'render a more specific chart.'
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

  function decorateVifWithPrecision(vifToRender, seriesIndex) {
    var series = _.get(vifToRender, 'series[{0}]'.format(seriesIndex));
    var dimension = SoqlHelpers.dimension(vifToRender, seriesIndex);
    var queryString = PRECISION_BASE_QUERY.
      format(
        dimension,
        SOQL_DATA_PROVIDER_DIMENSION_ALIAS,
        SOQL_DATA_PROVIDER_MEASURE_ALIAS,
        MAX_LEGAL_JAVASCRIPT_DATE_STRING
      );
    var domain = _.get(series, 'dataSource.domain');
    var datasetUid = _.get(series, 'dataSource.datasetUid');

    return new Promise(
      function(resolve, reject) {

        new SoqlDataProvider({
          domain: domain,
          datasetUid: datasetUid
        }).
          getRows(
            [
              SOQL_DATA_PROVIDER_DIMENSION_ALIAS,
              SOQL_DATA_PROVIDER_MEASURE_ALIAS
            ],
            '$query=' + queryString
          ).
          then(
            function(response) {
              var columns = response.columns;
              var rows = response.rows;
              var startDateIndex = _.indexOf(
                columns,
                SOQL_DATA_PROVIDER_DIMENSION_ALIAS
              );
              var endDateIndex = _.indexOf(
                columns,
                SOQL_DATA_PROVIDER_MEASURE_ALIAS
              );
              var domainStartDate = moment(
                rows[0][startDateIndex],
                moment.ISO_8601
              );
              var domainEndDate = moment(
                rows[0][endDateIndex],
                moment.ISO_8601
              );
              var precision;
              var dateTruncFunction;

              // Reject the response if the domain is somehow invalid, since
              // that means that we won't be able to render this series in
              // any case.
              if (!domainStartDate.isValid() || !domainEndDate.isValid()) {

                reject(
                  new Error(
                    'Timeline domain is invalid: [{0}, {1}]'.
                      format(domainStartDate, domainEndDate)
                  )
                );
              }

              // Otherwise, return the precision as a string. Moment objects
              // are inherently mutable. Therefore, the .add() call in the
              // first condition will need to be accounted for in the second
              // condition. We're doing this instead of just cloning the
              // objects because moment.clone() is surprisingly slow
              // (something like 40ms).
              if (
                domainStartDate.add(1, 'years').isAfter(domainEndDate)
              ) {
                precision = 'DAY';
              // We're actually checking for 20 years but have already added
              // one to the original domain start date in the if block above.
              } else if (
                domainStartDate.add(19, 'years').isAfter(domainEndDate)
              ) {
                precision = 'MONTH';
              } else {
                precision = 'YEAR';
              }

              vifToRender.
                series[seriesIndex].
                  dataSource.
                    precision = precision;

              visualization.updateVif(vifToRender);

              resolve(precision);
            }
          )
          ['catch'](function(error) {
            reject(error);
          });
      }
    );
  }

  function computeDateTruncFunction(vifToRender, seriesIndex) {
    var precision = _.get(
      vifToRender,
      'series[{0}].dataSource.precision'.format(seriesIndex)
    );
    var dateTruncFunction;

    switch (precision) {

      case 'YEAR':
        dateTruncFunction = 'date_trunc_y';
        break;

      case 'MONTH':
        dateTruncFunction = 'date_trunc_ym';
        break;

      case 'DAY':
        dateTruncFunction = 'date_trunc_ymd';
        break;

      default:
        throw new Error(
          'Encountered invalid precision "{0}" when computing ' +
          'date trunc function for vif: "{1}".'.
            format(
              precision,
              JSON.stringify(vifToRender)
            )
        );
        break;
    }

    return Promise.resolve(dateTruncFunction);
  }

  function incrementDateByPrecision(startDate, precision) {
    var incrementedDate;
    var year;
    var month;

    switch (precision) {

      case 'YEAR':
        incrementedDate = '{0}{1}'.
          format(
            (parseInt(startDate.substring(0, 4), 10) + 1),
            startDate.substring(4, 23)
          );
        break;

      case 'MONTH':
        year = parseInt(startDate.substring(0, 4), 10);
        month = parseInt(startDate.substring(5, 7), 10) + 1;

        if (month === 13) {
          month = 1;
          year++;
        }

        incrementedDate = '{0}-{1}{2}'.
          format(
            year,
            '00'.substring(
              0, 2 - month.toString().length
            ) + month.toString(),
            startDate.substring(7, 23)
          );
        break;

      case 'DAY':
        incrementedDate = new Date(
          new Date(startDate).getTime() +
          (24 * 60 * 60 * 1000)
        ).
          toISOString().
          substring(0, 23);
        break;

      default:
        throw new Error(
          'Cannot increment date by invalid precision "{0}".'.
            format(precision)
        );
        break;
    }

    return incrementedDate;
  }

  function forceDimensionMonotonicity(vifToRender, seriesIndex, queryResponse) {
    var precision = _.get(
      vifToRender,
      'series[{0}].dataSource.precision'.format(seriesIndex)
    );
    var rows = queryResponse.rows;
    var dimensionIndex = queryResponse.columns.indexOf('dimension');
    var startDate = rows[0][dimensionIndex];
    var endDate = rows[rows.length - 1][dimensionIndex];
    var duration = moment.duration(
      moment(endDate, moment.ISO_8601).
        diff(
          moment(startDate, moment.ISO_8601)
        )
      );
    var monotonicRowCount;
    var monotonicRows = [
      [startDate, null]
    ];
    var i = 1;
    var lastRowStartDate;
    var nextRowStartDate;
    var lastRowVisited = 0;

    switch (precision) {
      case 'YEAR':
        monotonicRowCount = Math.ceil(duration.asYears() + 1);
        break;

      case 'MONTH':
        monotonicRowCount = Math.ceil(duration.asMonths() + 1);
        break;

      case 'DAY':
        monotonicRowCount = Math.ceil(duration.asDays() + 1);
        break;

      default:
        throw new Error(
          'Invalid precision: "{0}"'.format(precision)
        );
        break;
    }

    while (i <= monotonicRowCount) {
      lastRowStartDate = monotonicRows[i - 1][0];
      nextRowStartDate = incrementDateByPrecision(
        lastRowStartDate,
        precision
      );

      monotonicRows.push(
        [
          nextRowStartDate,
          null
        ]
      );

      i++;
    }

    rows.
      forEach(
        function(row) {

          for (var i = lastRowVisited; i < monotonicRows.length; i++) {

            if (monotonicRows[i][0] === row[0]) {
              monotonicRows[i][1] = row[1];
              lastRowVisited = 1;
              break;
            }
          }
        }
      );

    return monotonicRows;
  }

  function makeSocrataDataRequest(vifToRender, seriesIndex) {
    var series = vifToRender.series[seriesIndex];
    var seriesVariant = visualization.getTypeVariantBySeriesIndex(seriesIndex);
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
      'WHERE {0} AND {1}'.format(
        whereClauseComponents,
        SOQL_DATE_GUARDS.format(
          dimension,
          MAX_LEGAL_JAVASCRIPT_DATE_STRING
        )
      ) :
      'WHERE {0}'.format(
        SOQL_DATE_GUARDS.format(
          dimension,
          MAX_LEGAL_JAVASCRIPT_DATE_STRING
        )
      );
    var queryString;

    return decorateVifWithPrecision(vifToRender, seriesIndex).
      then(
        function() {
          return computeDateTruncFunction(vifToRender, seriesIndex);
        }
      ).
      then(
        function(dateTruncFunction) {

          // If there is no aggregation, we do not select the dimension
          // with a `date_trunc` function, but rather just ask for the
          // actual values.
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
              MAX_ROW_COUNT + 1
            );
          } else {

            queryString = AGGREGATED_BASE_QUERY.format(
              dateTruncFunction,
              dimension,
              SOQL_DATA_PROVIDER_DIMENSION_ALIAS,
              measure,
              SOQL_DATA_PROVIDER_MEASURE_ALIAS,
              whereClause,
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
                    sort(function(a, b) { return (a[0] <= b[0]) ? -1 : 1; }).
                    forEach(
                      function(row) {

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
                      }
                    );

                // If there are no values in a specific interval (according to
                // the date_trunc_* function) then we will not get a response
                // row for that interval.
                //
                // This complicates our ability to render gaps in the timeline
                // for these intervals, since d3 will just interpolate over
                // them. The solution is to explicitly provide null values for
                // intervals with no values, which means that we need to expand
                // the result rows into an equivalent set in which the domain
                // is monotonically increasing.
                //
                // This is only necessary for (or relevant to) area charts,
                // however, since the normal interpolation behavior is actually
                // what we want for the 'line' variant (a simple line chart,
                // not an area chart).
                return {
                  columns: queryResponse.columns,
                  rows: (seriesVariant === 'area') ?
                    forceDimensionMonotonicity(
                      vifToRender,
                      seriesIndex,
                      queryResponse
                    ) :
                    queryResponse.rows
                }
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

module.exports = $.fn.socrataSvgTimelineChart;
