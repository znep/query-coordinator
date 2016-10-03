const _ = require('lodash');
const $ = require('jquery');
const utils = require('socrata-utils');
const SvgPieChart = require('./views/SvgPieChart');
const SvgVisualization = require('./views/SvgVisualization');
const SoqlDataProvider = require('./dataProviders/SoqlDataProvider');
const VifHelpers = require('./helpers/VifHelpers');
const SoqlHelpers = require('./dataProviders/SoqlHelpers');
const I18n = require('./I18n');
const getSoqlVifValidator = require('./dataProviders/SoqlVifValidator.js').getSoqlVifValidator;

const WINDOW_RESIZE_RERENDER_DELAY = 200;
const MAX_ROWS_BEFORE_FORCED_OTHER_GROUP = 11;

$.fn.socrataSvgPieChart = function(originalVif) {
  originalVif = VifHelpers.migrateVif(originalVif);
  const $element = $(this);
  const visualization = new SvgPieChart(
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
      visualization.invalidateSize,
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
      messages = I18n.translate('visualizations.common.error_generic')
    }

    visualization.renderError(messages);
  }

  function updateData(newVif) {

    $element.trigger('SOCRATA_VISUALIZATION_DATA_LOAD_START');
    visualization.showBusyIndicator();

    $.fn.socrataSvgPieChart.validateVif(newVif).then(() => {
      const processSeries = (series, seriesIndex) => {
        const type = _.get(series, 'dataSource.type');

        switch (type) {

          case 'socrata.soql':
            return makeSocrataDataRequest(newVif, seriesIndex);

          default:
            return Promise.reject(
              `Invalid/unsupported series dataSource.type: "${series.dataSource.type}".`
            );
        }
      };

      const processData = (dataResponses) => {
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

        if (onlyNullOrZeroValues) {
          visualization.renderError(
            I18n.translate('visualizations.common.error_no_data')
          );
        } else {
          visualization.render(newVif, dataResponses);
        }
      };

      const dataRequests = newVif.series.map(processSeries);

      Promise.all(dataRequests).then(processData);
    })['catch'](handleError);
  }

  function makeSocrataDataRequest(vifToRender, seriesIndex) {
    const dimensionAlias = SoqlHelpers.dimensionAlias();
    const measureAlias = SoqlHelpers.measureAlias();
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

    const orderClause = SoqlHelpers.orderByClauseFromSeries(
      vifToRender,
      seriesIndex
    );

    const aggregationClause = SoqlHelpers.aggregationClause(
      vifToRender,
      seriesIndex,
      'dimension'
    );

    const isUnaggregatedQuery = (
      _.isNull(series.dataSource.dimension.aggregationFunction) &&
      _.isNull(series.dataSource.measure.aggregationFunction)
    );

    const limit = _.get(
      vifToRender,
      `series[${seriesIndex}].dataSource.limit`,
      MAX_ROWS_BEFORE_FORCED_OTHER_GROUP + 1
    );

    // We only want to follow the showOtherCategory code path if that property
    // is set to true AND there is a defined limit.
    const showOtherCategory = (
      _.get(vifToRender, 'configuration.showOtherCategory', false) &&
      _.isNumber(_.get(vifToRender, `series[${seriesIndex}].dataSource.limit`, null))
    );

    let queryString;
    if (isUnaggregatedQuery) {
      queryString = `
        SELECT
          ${dimension} AS ${dimensionAlias},
          ${measure} AS ${measureAlias}
        ${whereClause}
        ORDER BY ${orderClause}
        NULL LAST
        LIMIT ${limit}`;
    } else {

      queryString = `
        SELECT
          ${dimension} AS ${dimensionAlias},
          ${measure} AS ${measureAlias}
        ${whereClause}
        GROUP BY ${aggregationClause}
        ORDER BY ${orderClause}
        NULL LAST
        LIMIT ${limit}`;
    }

    return soqlDataProvider.
      query(queryString.replace(/[\n\s]+/g, ' '), dimensionAlias, measureAlias).
      then(queryResponse => {
        const queryResponseRowCount = queryResponse.rows.length;
        const queryResponseUniqueDimensionCount = _.uniq(
          queryResponse.rows.map((row) => row[0])
        ).length;

        if (queryResponseRowCount !== queryResponseUniqueDimensionCount) {
          const error = new Error();

          error.errorMessages = [
            I18n.translate('visualizations.common.error_duplicated_dimension_value')
          ];

          throw error;
        }

        const otherCategoryName = I18n.translate(
          'visualizations.common.other_category'
        );
        const dimensionIndex = queryResponse.columns.indexOf(dimensionAlias);
        const measureIndex = queryResponse.columns.indexOf(measureAlias);
        let valueAsNumber;

        queryResponse.columns[dimensionIndex] = 'dimension';
        queryResponse.columns[measureIndex] = 'measure';

        queryResponse.rows.forEach(row => {
          try {
            valueAsNumber = typeof row[measureIndex] === 'undefined' ? null : Number(row[measureIndex]);
          } catch (error) {
            console.error(`Could not convert measure value to number: ${row[measureIndex]}`);
            valueAsNumber = null;
          }

          row[measureIndex] = valueAsNumber;
        });

        const otherCategoryFilters = queryResponse.rows.
          filter(row => !_.isUndefined(row[0])).
          map(row => {
            return {
              arguments: {
                operator: '!=',
                operand: row[0]
              },
              columnName: dimension.replace(/`/g, ''),
              function: 'binaryOperator'
            };
          });

        const otherCategoryVifToRender = _.cloneDeep(vifToRender);
        const originalVifFilters = _.get(otherCategoryVifToRender, `series[${seriesIndex}].dataSource.filters`, []);

        _.set(otherCategoryVifToRender, `series[${seriesIndex}].dataSource.filters`,
          originalVifFilters.concat(otherCategoryFilters));

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
          whereClauseFilteringOwnColumn(otherCategoryVifToRender, seriesIndex);

        let otherCategoryQueryString;

        if (isUnaggregatedQuery) {
          otherCategoryQueryString = `
            SELECT
              '${otherCategoryName}' AS ${dimensionAlias},
              SUM(${measure}) AS ${measureAlias}
            WHERE ${otherCategoryWhereClauseComponents}
            ORDER BY ${orderClause}
            NULL LAST`;
        } else {
          otherCategoryQueryString = `
            SELECT
              '${otherCategoryName}' AS ${dimensionAlias},
              ${measure} AS ${measureAlias}
            WHERE ${otherCategoryWhereClauseComponents}
            GROUP BY ${aggregationClause}`;
        }

        return soqlDataProvider.
          query(otherCategoryQueryString.replace(/[\n\s]+/g, ' '), dimensionAlias, measureAlias).
          then(otherCategoryQueryResponse => {
            // If the limit is higher than the number of total rows then
            // (other) category will come back with no result; in this
            // case there is no need to modify the original queryResponse.
            if (
              otherCategoryQueryResponse.rows.length > 0 &&
              _.get(otherCategoryQueryResponse, 'rows.0.1') !== undefined
            ) {

              if (isUnaggregatedQuery) {
                queryResponse.rows.push(otherCategoryQueryResponse.rows[0]);
              } else {
                queryResponse.rows.push(
                  [
                    otherCategoryQueryResponse.rows[0][0],
                    otherCategoryQueryResponse.rows.reduce(
                      (sum, row) => (_.isUndefined(row[1])) ? sum : parseFloat(row[1]) + sum,
                      0
                    )
                  ]
                );
              }
            }

            return queryResponse;
          }).
          catch(() => {
            const error = new Error();

            error.errorMessages = [
              I18n.translate(
                'visualizations.common.error_other_category_query_failed'
              )
            ];

            throw error;
          });
      });
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
$.fn.socrataSvgPieChart.validateVif = (vif) =>
  getSoqlVifValidator(vif).then(validator =>
    validator.
      requireAtLeastOneSeries().
      toPromise()
  );

module.exports = $.fn.socrataSvgPieChart;
