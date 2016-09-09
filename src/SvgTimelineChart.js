const _ = require('lodash');
const $ = require('jquery');
const utils = require('socrata-utils');
const moment = require('moment');
const SvgTimelineChart = require('./views/SvgTimelineChart');
const SoqlDataProvider = require('./dataProviders/SoqlDataProvider');
const SoqlHelpers = require('./dataProviders/SoqlHelpers');
const VifHelpers = require('./helpers/VifHelpers');
const I18n = require('./I18n');
const getSoqlVifValidator = require('./dataProviders/SoqlVifValidator.js').getSoqlVifValidator;

const VALID_PRECISION_VALUES = ['YEAR', 'MONTH', 'DAY'];
const MAX_POINT_COUNT = 1000;
const MAX_LEGAL_JAVASCRIPT_DATE_STRING = '9999-01-01';

const PRECISION_BASE_QUERY = 'SELECT min({0}) AS {1}, max({0}) AS {2} WHERE {0} < \'{3}\'';
const UNAGGREGATED_BASE_QUERY = 'SELECT {0} AS {1}, {2} AS {3} {4} LIMIT {5}';
const AGGREGATED_BASE_QUERY = 'SELECT {0}({1}) AS {2}, {3} AS {4} {5} GROUP BY {2} LIMIT {6}';
const SOQL_DATE_GUARDS = '{0} IS NOT NULL AND {0} < \'{1}\' AND (1=1)';
const WINDOW_RESIZE_RERENDER_DELAY = 200;

/**
 * Instantiates a Socrata ColumnChart Visualization from the
 * `socrata-visualizations` package.
 *
 * @param vif - https://docs.google.com/document/d/15oKmDfv39HrhgCJRTKtYadG8ZQvFUeyfx4kR_NZkBgc
 */
$.fn.socrataSvgTimelineChart = function(originalVif) {
  originalVif = _.cloneDeep(VifHelpers.migrateVif(originalVif));

  const $element = $(this);
  const visualization = new SvgTimelineChart($element, originalVif);

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

    $element.on('SOCRATA_VISUALIZATION_INVALIDATE_SIZE', visualization.invalidateSize);
    $element.on('SOCRATA_VISUALIZATION_RENDER_VIF', handleRenderVif);
  }

  function attachInteractionEvents() {

    $element.on('SOCRATA_VISUALIZATION_TIMELINE_CHART_FLYOUT', handleFlyout);
  }

  function detachApiEvents() {

    $(window).off('resize', handleWindowResize);

    $element.off('SOCRATA_VISUALIZATION_INVALIDATE_SIZE', visualization.invalidateSize);
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
      messages = I18n.translate('visualizations.common.error_generic')
    }

    visualization.renderError(messages);
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

  function updateData(newVif) {

    $.fn.socrataSvgTimelineChart.
      validateVif(newVif).
      then(() => {

        newVif = _.cloneDeep(newVif);

        $element.trigger('SOCRATA_VISUALIZATION_DATA_LOAD_START');
        detachInteractionEvents();
        visualization.showBusyIndicator();

        const dataRequests = newVif.series.
          map((series, seriesIndex) => {
            const type = series.dataSource.type;

            switch (type) {

              case 'socrata.soql':
                return makeSocrataDataRequest(newVif, seriesIndex);

              default:
                return Promise.reject(
                  `Invalid/unsupported series dataSource.type: "${type}".`
                );
            }
          });

        Promise.all(dataRequests).
          then(
            function(dataResponses) {
              const underTwoRows = dataResponses.
                some((dataResponse) => {
                  return dataResponse.rows.length < 2;
                });
              const overMaxRowCount = dataResponses.
                some((dataResponse) => {
                  return dataResponse.rows.length > MAX_POINT_COUNT;
                });
              const allSeriesMeasureValues = dataResponses.map((dataResponse) => {
                const measureIndex = dataResponse.columns.indexOf('measure');

                return dataResponse.rows.map((row) => row[measureIndex]);
              });
              const onlyNullOrZeroValues = _(allSeriesMeasureValues).
                flatten().
                compact().
                isEmpty();

              $element.trigger('SOCRATA_VISUALIZATION_DATA_LOAD_COMPLETE');
              attachInteractionEvents();
              visualization.hideBusyIndicator();

              if (underTwoRows) {

                visualization.renderError(
                  I18n.translate(
                    'visualizations.timeline_chart.error_two_or_more_rows_required'
                  )
                );
              } else if (overMaxRowCount) {

                visualization.renderError(
                  I18n.translate(
                    'visualizations.timeline_chart.error_exceeded_max_point_count'
                  ).format(MAX_POINT_COUNT)
                );
              } else if (onlyNullOrZeroValues) {

                visualization.renderError(
                  I18n.translate('visualizations.common.error_no_data')
                );
              } else {
                visualization.render(newVif, dataResponses);
              }
            }
          )
      }).
      catch(handleError);
  }

  function decorateVifWithComputedPrecision(vifToRender, seriesIndex) {
    const series = _.get(vifToRender, `series[${seriesIndex}]`);
    const dimension = SoqlHelpers.dimension(vifToRender, seriesIndex);
    // 'SELECT min({0}) AS {1}, max({0}) AS {2} WHERE {0} < \'{3}\''
    const queryString = PRECISION_BASE_QUERY.
      format(
        dimension,
        SoqlHelpers.dimensionAlias(),
        SoqlHelpers.measureAlias(),
        MAX_LEGAL_JAVASCRIPT_DATE_STRING
      );

    return new Promise(
      function(resolve, reject) {
        const soqlDataProviderConfig = {
          domain: _.get(series, 'dataSource.domain'),
          datasetUid: _.get(series, 'dataSource.datasetUid')
        };

        new SoqlDataProvider(soqlDataProviderConfig).
          getRows(
            [
              SoqlHelpers.dimensionAlias(),
              SoqlHelpers.measureAlias()
            ],
            `$query=${queryString}`
          ).
          then((response) => {
            const { columns, rows } = response;
            const startDateIndex = _.indexOf(
              columns,
              SoqlHelpers.dimensionAlias()
            );
            const endDateIndex = _.indexOf(
              columns,
              SoqlHelpers.measureAlias()
            );

            let domainStartDate = moment(
              rows[0][startDateIndex],
              moment.ISO_8601
            );
            let domainEndDate = moment(
              rows[0][endDateIndex],
              moment.ISO_8601
            );

            // Reject the response if the domain is somehow invalid, since
            // that means that we won't be able to render this series in
            // any case.
            if (!domainStartDate.isValid() || !domainEndDate.isValid()) {

              const domain = `[${domainStartDate}, ${domainEndDate}]`;

              reject(new Error(`Timeline domain is invalid: ${domain}`));
            }

            // Otherwise, return the precision as a string. Moment objects
            // are inherently mutable. Therefore, the .add() call in the
            // first condition will need to be accounted for in the second
            // condition. We're doing this instead of just cloning the
            // objects because moment.clone() is surprisingly slow
            // (something like 40ms).
            let precision;

            if (domainStartDate.add(1, 'years').isAfter(domainEndDate)) {
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

            _.set(
              vifToRender,
              `series[${seriesIndex}].dataSource.precision`,
              precision
            );

            visualization.updateVif(vifToRender);

            resolve(precision);
          }).
          catch(reject);
      }
    );
  }

  function computeDateTruncFunction(vifToRender, seriesIndex) {
    const precision = _.get(
      vifToRender,
      `series[${seriesIndex}].dataSource.precision`
    );

    let dateTruncFunction;

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
          `Encountered invalid precision "${precision}" when computing ` +
          `date_trunc function for vif: "${JSON.stringify(vifToRender)}".`
        );
        break;
    }

    return Promise.resolve(dateTruncFunction);
  }

  function incrementDateByPrecision(startDate, precision) {
    let year;
    let month;
    let restOfDatetime;
    let incrementedDate;

    switch (precision) {

      case 'YEAR':
        year = (parseInt(startDate.substring(0, 4), 10) + 1);
        restOfDatetime = startDate.substring(4, 23);

        incrementedDate = `${year}${restOfDatetime}`;
        break;

      case 'MONTH':
        year = parseInt(startDate.substring(0, 4), 10);
        month = parseInt(startDate.substring(5, 7), 10) + 1;

        if (month === 13) {
          month = 1;
          year++;
        }

        month = _.padStart(month.toString(), 2, '0');
        restOfDatetime = startDate.substring(7, 23);

        incrementedDate = `${year}-${month}${restOfDatetime}`;
        break;

      case 'DAY':
        incrementedDate = new Date(
          // Note that we need to append 'Z' to the date string here in order
          // for Firefox and IE to not apply a timezone offset based on the
          // user's timezone. In other words, if you instantiate a date object
          // from a floating timestamp in ISO-8601 format (e.g.
          // "2015-07-08T00:00:00.000"), Firefox and IE will return a UTC date
          // that has been shifted by your current timezone (in GMT-0700 it
          // gets changed to "2015-07-08T07:00:00.000Z"), whereas Chrome will
          // just display the original date in your current timezone while not
          // changing the date in terms of UTC.
          //
          // This adjustment does not happen if you pass a date string that is
          // explicitly in UTC, hence the 'Z' getting appended to startDate
          // below.
          new Date(startDate + 'Z').getTime() +
          (24 * 60 * 60 * 1000)
        ).
          toISOString().
          substring(0, 23);
        break;

      default:
        throw new Error(
          `Cannot increment date by invalid precision "${precision}".`
        );
        break;
    }

    return incrementedDate;
  }

  // This is necessary to get area variant series to correctly show
  // discontinuities in the data; otherwise intervals with no value (which are
  // not returned by the SoQL API and must be inferred) will not be rendered,
  // but rather interpolated over, which misrepresents the data.
  function forceDimensionMonotonicity(vifToRender, seriesIndex, queryResponse) {
    const precision = _.get(
      vifToRender,
      `series[${seriesIndex}].dataSource.precision`
    );
    const rows = queryResponse.rows;
    const dimensionIndex = queryResponse.columns.indexOf('dimension');
    const startDate = rows[0][dimensionIndex];
    const endDate = rows[rows.length - 1][dimensionIndex];
    const duration = moment.duration(
      moment(endDate, moment.ISO_8601).
        diff(
          moment(startDate, moment.ISO_8601)
        )
      );
    const monotonicRows = [
      [startDate, null]
    ];

    let monotonicRowCount;
    let i = 1;
    let lastRowStartDate;
    let nextRowStartDate;
    let lastRowVisited = 0;

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

    rows.forEach((row) => {

      for (let i = lastRowVisited; i < monotonicRows.length; i++) {

        if (monotonicRows[i][0] === row[0]) {
          monotonicRows[i][1] = row[1];
          lastRowVisited = 1;
          break;
        }
      }
    });

    return monotonicRows;
  }

  // This is necessary to get line variant series to render the last point in
  // the series with enough space on its right to be a target for the highlight
  // and flyout. It should only be used for line variant series.
  function addBlankRowAfterLastRow(dimensionIndex, rows) {
    const secondToLastRowDatetime = new Date(
      rows[rows.length - 2][dimensionIndex]
    );
    const lastRowDatetime = new Date(rows[rows.length - 1][dimensionIndex]);
    const lastRowIntervalInMilliseconds = (
      lastRowDatetime.getTime() - secondToLastRowDatetime.getTime()
    );
    const blankRow = [null, null];
    const dimensionValue = new Date(
      lastRowDatetime.getTime() +
      lastRowIntervalInMilliseconds
    ).
      toISOString().
      substring(0, 23);
    const measureValue = null;

    if (dimensionIndex === 0) {
      blankRow[0] = dimensionValue;
      blankRow[1] = measureValue;
    } else {
      blankRow[0] = measureValue;
      blankRow[1] = dimensionValue;
    }

    return rows.concat(
      [
        blankRow
      ]
    );
  }

  function makeSocrataDataRequest(vifToRender, seriesIndex) {
    const series = _.get(vifToRender, `series[${seriesIndex}]`);
    const seriesPrecision = _.get(series, 'dataSource.precision');

    let vifWithPrecisionPromise;

    if (_.includes(VALID_PRECISION_VALUES, seriesPrecision)) {
      vifWithPrecisionPromise = Promise.resolve(vifToRender);
    } else {

      vifWithPrecisionPromise = decorateVifWithComputedPrecision(
        vifToRender,
        seriesIndex
      );
    }

    return vifWithPrecisionPromise.
      then(() => computeDateTruncFunction(vifToRender, seriesIndex)).
      then((dateTruncFunction) => {
        const seriesVariant = visualization.
          getTypeVariantBySeriesIndex(seriesIndex);
        const dimension = SoqlHelpers.dimension(vifToRender, seriesIndex);
        const measure = SoqlHelpers.measure(vifToRender, seriesIndex);
        const whereClauseComponents = SoqlHelpers.
          whereClauseFilteringOwnColumn(vifToRender, seriesIndex);
        // '{0} IS NOT NULL AND {0} < \'{1}\' AND (1=1)'
        const dateGuardClauseComponent = SOQL_DATE_GUARDS.format(
          dimension,
          MAX_LEGAL_JAVASCRIPT_DATE_STRING
        );
        const whereClause = (whereClauseComponents.length > 0) ?
          `WHERE ${whereClauseComponents} AND ${dateGuardClauseComponent}` :
          `WHERE ${dateGuardClauseComponent}`;
        const soqlDataProvider = new SoqlDataProvider({
          datasetUid: _.get(series, 'dataSource.datasetUid'),
          domain: _.get(series, 'dataSource.domain')
        });

        let queryString;

        // If there is no aggregation, we do not select the dimension
        // with a `date_trunc` function, but rather just ask for the
        // actual values.
        if (
          series.dataSource.dimension.aggregationFunction === null &&
          series.dataSource.measure.aggregationFunction === null
        ) {

          // 'SELECT {0} AS {1}, {2} AS {3} {4} LIMIT {5}'
          queryString = UNAGGREGATED_BASE_QUERY.format(
            dimension,
            SoqlHelpers.dimensionAlias(),
            measure,
            SoqlHelpers.measureAlias(),
            whereClause,
            MAX_POINT_COUNT + 1
          );
        } else {

          // 'SELECT {0}({1}) AS {2}, {3} AS {4} {5} GROUP BY {2} LIMIT {6}'
          queryString = AGGREGATED_BASE_QUERY.format(
            dateTruncFunction,
            dimension,
            SoqlHelpers.dimensionAlias(),
            measure,
            SoqlHelpers.measureAlias(),
            whereClause,
            MAX_POINT_COUNT + 1
          );
        }

        return soqlDataProvider.
          query(
            queryString.replace(/\s+/, ' '),
            SoqlHelpers.dimensionAlias(),
            SoqlHelpers.measureAlias()
          ).
          then((queryResponse) => {
            const dimensionIndex = queryResponse.
              columns.
              indexOf(SoqlHelpers.dimensionAlias());
            const measureIndex = queryResponse.
              columns.
              indexOf(SoqlHelpers.measureAlias());

            queryResponse.columns[dimensionIndex] = 'dimension';
            queryResponse.columns[measureIndex] = 'measure';

            let valueAsNumber;

            queryResponse.rows.
              sort((a, b) => (a[0] <= b[0]) ? -1 : 1).
              forEach((row) => {
                const value = row[measureIndex];

                try {

                  if (_.isUndefined(value)) {
                    valueAsNumber = null;
                  } else {
                    valueAsNumber = Number(value);
                  }
                } catch (error) {

                  console.error(
                    `Could not convert measure value to number: ${value}`
                  );

                  valueAsNumber = null;
                }

                row[measureIndex] = valueAsNumber;
              });

            let rows;

            if (seriesVariant === 'area') {

              // If there are no values in a specific interval (according to
              // the date_trunc_* function) then we will not get a response row
              // for that interval.
              //
              // This complicates our ability to render gaps in the timeline
              // for these intervals, since d3 will just interpolate over them.
              //
              // The solution is to explicitly provide null values for
              // intervals with no values, which means that we need to expand
              // the result rows into an equivalent set in which the domain is
              // monotonically increasing.
              //
              // This is only necessary for (or relevant to) area charts,
              // however, since the normal interpolation behavior is actually
              // what we want for the 'line' variant (a simple line chart, not
              // an area chart).
              rows = forceDimensionMonotonicity(
                vifToRender,
                seriesIndex,
                queryResponse
              );
            } else {

              rows = addBlankRowAfterLastRow(
                dimensionIndex,
                queryResponse.rows
              );
            }

            return {
              columns: queryResponse.columns,
              rows: rows
            };
          });
      });
  }

  /**
   * Actual execution starts here
   */

  attachApiEvents();
  attachInteractionEvents();
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
$.fn.socrataSvgTimelineChart.validateVif = (vif) =>
  getSoqlVifValidator(vif).then(validator =>
    validator.
      requireAtLeastOneSeries().
      requireCalendarDateDimension().
      toPromise()
  );

module.exports = $.fn.socrataSvgTimelineChart;
