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
const WINDOW_RESIZE_RERENDER_DELAY = 200;

$.fn.socrataSvgColumnChart = function(originalVif) {
  originalVif = VifHelpers.migrateVif(originalVif);
  const $element = $(this);
  const visualization = new SvgColumnChart(
    $element,
    originalVif
  );
  let rerenderOnResizeTimeout;

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
    const newVif = event.originalEvent.detail;

    updateData(
      VifHelpers.migrateVif(newVif)
    );
  }

  function handleError(error) {
    let messages;

    if (window.console && console.error) {
      console.error(error);
    }

    if (error.errorMessages) {
      messages = error.errorMessages;
    } else {
      messages = I18n.translate('visualizations.common.error_generic');
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
            const overMaxRowCount = dataResponses.
              some(
                function(dataResponse) {
                  return dataResponse.rows.length > MAX_COLUMN_COUNT;
                }
              );

            const allSeriesMeasureValues = dataResponses.map((dataResponse) => {
              const measureIndex = dataResponse.columns.indexOf('measure');
              return dataResponse.rows.map((row) => row[measureIndex]);
            });

            const onlyNullOrZeroValues = _(allSeriesMeasureValues).
              flatten().
              compact().
              isEmpty();

            $element.trigger('SOCRATA_VISUALIZATION_DATA_LOAD_COMPLETE');
            visualization.hideBusyIndicator();

            if (overMaxRowCount) {
              visualization.renderError(
                I18n.translate(
                  'visualizations.column_chart.error_exceeded_max_column_count'
                ).format(MAX_COLUMN_COUNT)
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
    })['catch'](handleError);
  }

  function makeSocrataDataRequest(vifToRender, seriesIndex) {
    const series = vifToRender.series[seriesIndex];
    const soqlDataProvider = new SoqlDataProvider({
      datasetUid: series.dataSource.datasetUid,
      domain: series.dataSource.domain
    });
    const dimension = SoqlHelpers.dimension(vifToRender, seriesIndex);
    const measure = SoqlHelpers.measure(vifToRender, seriesIndex);
    const whereClauseComponents = SoqlHelpers.whereClauseFilteringOwnColumn(
      vifToRender,
      seriesIndex
    );
    const whereClause = (whereClauseComponents.length > 0) ?
        'WHERE {0}'.format(whereClauseComponents) :
        '';
    const aggregationClause = SoqlHelpers.aggregationClause(
      vifToRender,
      seriesIndex,
      'dimension'
    );

    const orderClause = SoqlHelpers.orderByClauseFromSeries(vifToRender, seriesIndex);

    const limit = _.get(
      vifToRender,
      `series[${seriesIndex}].dataSource.limit`,
      MAX_COLUMN_COUNT
    );

    // We only want to follow the showOtherCategory code path if that property
    // is set to true AND there is a defined limit.
    const showOtherCategory =
      _.get(vifToRender, 'configuration.showOtherCategory', false) &&
      _.isNumber(
        _.get(vifToRender, `series[${seriesIndex}].dataSource.limit`, null)
      );

    const isUnaggregatedQuery =
      series.dataSource.dimension.aggregationFunction === null &&
      series.dataSource.measure.aggregationFunction === null;

    let queryString;

    if (isUnaggregatedQuery) {
      queryString = `
        SELECT 
          ${dimension} as ${SOQL_DATA_PROVIDER_DIMENSION_ALIAS},
          ${measure} as ${SOQL_DATA_PROVIDER_MEASURE_ALIAS}
        ${whereClause}
        ORDER BY ${orderClause}
        NULL LAST
        LIMIT ${limit}
      `;
    } else {
      queryString = `
        SELECT 
          ${dimension} as ${SOQL_DATA_PROVIDER_DIMENSION_ALIAS},
          ${measure} as ${SOQL_DATA_PROVIDER_MEASURE_ALIAS}
        ${whereClause}
        GROUP BY ${aggregationClause}
        ORDER BY ${orderClause}
        NULL LAST
        LIMIT ${limit}
      `;
    }

    const processQueryResponse = (queryResponse) => {
      const dimensionIndex = queryResponse.
        columns.
        indexOf(SOQL_DATA_PROVIDER_DIMENSION_ALIAS);
      const measureIndex = queryResponse.
        columns.
        indexOf(SOQL_DATA_PROVIDER_MEASURE_ALIAS);
        let valueAsNumber;

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
    };

    const queryForOthersCategory = (queryResponse) => {
      if (showOtherCategory) {

        const otherCategoryName = I18n.translate(
          'visualizations.common.other_category'
        );

        // Note that we can't just use the multiple argument version of the
        // binaryOperator filter since it joins arguments with OR, and we need
        // to join all of the terms with AND.
        const otherCategoryFilters = queryResponse.rows.
          filter((row) => !_.isUndefined(row[0])).
          map((row) => {

          return {
            arguments: {
              operator: '!=',
              operand: row[0]
            },
            // Note that the SoqlHelpers.dimension() method returns the name
            // of the dimension with backticks (for SoQL quoting), but if we
            // try to include the backticks in the filter's columnName
            // property it will double-quote the dimension in the actual
            // query string, which causes the query to fail. In this case we
            // actually want to remove the backticks added by the dimension
            // method, since the field will be quoted by the query mechanism
            // when the where clause is compiled.
            columnName: dimension.replace(/`/g, ''),
            function: 'binaryOperator'
          };
        });

        const otherCategoryVifToRender = _.cloneDeep(vifToRender);
        const originalVifFilters = _.get(
          otherCategoryVifToRender,
          `series[${seriesIndex}].dataSource.filters`,
          []
        );

        _.set(
          otherCategoryVifToRender,
          `series[${seriesIndex}].dataSource.filters`,
          originalVifFilters.concat(otherCategoryFilters)
        );

        // If one of the categories was 'null', then we also need to add an
        // 'is not null' filter so that null values do not end up in the other
        // category. We can tell if there was a 'null' category because we
        // will have filtered it out of the collection from which we derive
        // otherCategoryFilters. If the length of otherCategoryFilters is not
        // equal to the length of the original query response rows, then we
        // must have filtered a null value.
        if (queryResponse.rows.length !== otherCategoryFilters.length) {
          otherCategoryVifToRender.series[seriesIndex].dataSource.filters.
            push({
              arguments: {
                isNull: false
              },
              // See note above about SoqlHelpers.dimension() returning the
              // name of the dimension with backticks.
              columnName: dimension.replace(/`/g, ''),
              function: 'isNull'
            });
        }

        const otherCategoryWhereClauseComponents = SoqlHelpers.
          whereClauseFilteringOwnColumn(
            otherCategoryVifToRender,
            seriesIndex
          );

        const otherCategoryAggregationClause = SoqlHelpers.aggregationClause(
          otherCategoryVifToRender,
          seriesIndex,
          'measure'
        );

        let otherCategoryQueryString;

        if (isUnaggregatedQuery) {
          otherCategoryQueryString = `
            SELECT 
              '${otherCategoryName}' as ${SOQL_DATA_PROVIDER_DIMENSION_ALIAS},
              COUNT(*) AS ${SOQL_DATA_PROVIDER_MEASURE_ALIAS}
            WHERE  ${otherCategoryWhereClauseComponents}
          `;
        } else {
          otherCategoryQueryString = `
            SELECT 
              '${otherCategoryName}' as ${SOQL_DATA_PROVIDER_DIMENSION_ALIAS},
              ${otherCategoryAggregationClause} as ${SOQL_DATA_PROVIDER_MEASURE_ALIAS}
            WHERE  ${otherCategoryWhereClauseComponents}
          `;
        }

        // Since we're using values from first query as filters, we have to url
        // encode query string. Characters like `&` comes with surprises
        const uriEncodedQueryString = encodeURIComponent(
          otherCategoryQueryString.replace(/[\n\s]+/g, ' ')
        );

        return soqlDataProvider.
          query(
            uriEncodedQueryString,
            SOQL_DATA_PROVIDER_DIMENSION_ALIAS,
            SOQL_DATA_PROVIDER_MEASURE_ALIAS
          ).
          then((otherCategoryQueryResponse) => {
            // If the limit is higher than the number of total rows then
            // otherCategoryQueryResponse will come back with no rows; in this
            // case there is no need to modify the original queryResponse.
            if (otherCategoryQueryResponse.rows.length > 0) {
              queryResponse.rows.push(otherCategoryQueryResponse.rows[0]);
            }

            return queryResponse;
          });

      } else {
        return Promise.resolve(queryResponse);
      }
    };

    return soqlDataProvider.
      query(
        queryString.replace(/[\n\s]+/g, ' '),
        SOQL_DATA_PROVIDER_DIMENSION_ALIAS,
        SOQL_DATA_PROVIDER_MEASURE_ALIAS
      ).
      then(queryForOthersCategory).
      then(processQueryResponse);
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
