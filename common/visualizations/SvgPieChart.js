const _ = require('lodash');
const $ = require('jquery');
const utils = require('common/js_utils');
const SvgPieChart = require('./views/SvgPieChart');
const MetadataProvider = require('./dataProviders/MetadataProvider');
const SoqlDataProvider = require('./dataProviders/SoqlDataProvider');
const VifHelpers = require('./helpers/VifHelpers');
const SoqlHelpers = require('./dataProviders/SoqlHelpers');
const I18n = require('common/i18n').default;
const getSoqlVifValidator = require('./dataProviders/SoqlVifValidator.js').
  getSoqlVifValidator;

const MAX_ROWS_BEFORE_FORCED_OTHER_GROUP = 11;
const WINDOW_RESIZE_RERENDER_DELAY = 200;

$.fn.socrataSvgPieChart = function(originalVif, options) {
  originalVif = VifHelpers.migrateVif(originalVif);
  const $element = $(this);
  const visualization = new SvgPieChart($element, originalVif, options);
  let rerenderOnResizeTimeout;

  /**
   * Event handling
   */

  function attachApiEvents() {

    // Destroy on (only the first) 'SOCRATA_VISUALIZATION_DESTROY' event.
    $element.one('SOCRATA_VISUALIZATION_DESTROY', function() {
      clearTimeout(rerenderOnResizeTimeout);
      visualization.destroy();
      detachInteractionEvents();
      detachApiEvents();
    });

    $(window).on('resize', handleWindowResize);

    $element.on(
      'SOCRATA_VISUALIZATION_INVALIDATE_SIZE',
      visualization.invalidateSize
    );
    $element.on('SOCRATA_VISUALIZATION_RENDER_VIF', handleRenderVif);
  }

  function attachInteractionEvents() {
    $element.on('SOCRATA_VISUALIZATION_PIE_CHART_FLYOUT', handleFlyout);
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
    $element.off('SOCRATA_VISUALIZATION_PIE_CHART_FLYOUT', handleFlyout);
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
      messages = I18n.t('shared.visualizations.charts.common.error_generic')
    }

    visualization.renderError(messages);
  }

  function updateData(newVif) {
    $element.trigger('SOCRATA_VISUALIZATION_DATA_LOAD_START');
    visualization.showBusyIndicator();
    detachInteractionEvents();

    $.fn.socrataSvgPieChart.validateVif(newVif).then(() => {
      const datasetMetadataProvider = new MetadataProvider({
        domain: _.get(newVif, 'series[0].dataSource.domain'),
        datasetUid: _.get(newVif, 'series[0].dataSource.datasetUid')
      });

      const processSeries = (series, seriesIndex) => {
        const type = _.get(series, 'dataSource.type');

        switch (type) {

          case 'socrata.soql':
            return makeSocrataDataRequest(newVif, seriesIndex);

          default:
            return Promise.reject(
              'Invalid/unsupported series dataSource.type: ' +
              `"${series.dataSource.type}".`
            );
        }
      };

      const processData = (resolutions) => {
        const [ newColumns, ...dataResponses ] = resolutions;
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
            I18n.t('shared.visualizations.charts.common.error_no_data')
          );
        } else {

          attachInteractionEvents();
          visualization.render(newVif, dataResponses, newColumns);
        }
      };

      const dataRequests = newVif.series.map(processSeries);
      const displayableFilterableColumns = visualization.shouldDisplayFilterBar() ?
        datasetMetadataProvider.getDisplayableFilterableColumns() :
        Promise.resolve(null);

      Promise.
        all([
          displayableFilterableColumns,
          ...dataRequests
        ]).
        then(processData);
    }).
    catch(handleError);
  }

  function makeSocrataDataRequest(vifToRender, seriesIndex) {
    const series = vifToRender.series[seriesIndex];
    const soqlDataProvider = new SoqlDataProvider({
      datasetUid: series.dataSource.datasetUid,
      domain: series.dataSource.domain
    });
    const dimension = SoqlHelpers.dimension(vifToRender, seriesIndex);
    const dimensionAlias = SoqlHelpers.dimensionAlias();
    const measure = SoqlHelpers.measure(vifToRender, seriesIndex);
    const measureAlias = SoqlHelpers.measureAlias();
    const whereClauseComponents = SoqlHelpers.whereClauseFilteringOwnColumn(
      vifToRender,
      seriesIndex
    );
    const whereClause = (whereClauseComponents.length > 0) ?
      'WHERE {0}'.format(whereClauseComponents) :
      '';
    const groupByClause = SoqlHelpers.aggregationClause(
      vifToRender,
      seriesIndex,
      'dimension'
    );
    const orderClause = SoqlHelpers.orderByClauseFromSeries(
      vifToRender,
      seriesIndex
    );

    const showOtherCategory = _.get(vifToRender, 'configuration.showOtherCategory', true);
    const isUnaggregatedQuery = (
      _.isNull(series.dataSource.dimension.aggregationFunction) &&
      _.isNull(series.dataSource.measure.aggregationFunction)
    );

    const limitConf = _.get(vifToRender, `series[${seriesIndex}].dataSource.limit`);
    const isLimitInRange = _.inRange(limitConf, 2, MAX_ROWS_BEFORE_FORCED_OTHER_GROUP + 2);

    if (limitConf && !isLimitInRange) {
      const error = new Error();
      const errorMessage = I18n.
        t('shared.visualizations.charts.pie_chart.error_limit_out_of_bounds').
        format(2, MAX_ROWS_BEFORE_FORCED_OTHER_GROUP + 1);

      error.errorMessages = [errorMessage];

      throw error;
    }

    // If we a VIF-defined limit on the number of rows to show, but we also want to show the
    // remaining rows grouped in an other category, we need to request all of the rows so we can
    // figure out if we need to do any special handling when making our request for the other
    // category's count. Specifically, Core omits null values when combining a count and a where
    // statement, unless we say to do otherwise.
    const queryLimit = limitConf && !showOtherCategory ?
      limitConf :
      MAX_ROWS_BEFORE_FORCED_OTHER_GROUP + 2;
    const displayedValuesLimit = (limitConf || queryLimit);

    const processQueryResponse = (queryResponse) => {
      const dimensionIndex = queryResponse.columns.indexOf(dimensionAlias);
      const measureIndex = queryResponse.columns.indexOf(measureAlias);

      let valueAsNumber;

      queryResponse.columns[dimensionIndex] = 'dimension';
      queryResponse.columns[measureIndex] = 'measure';

      queryResponse.rows.forEach((row) => {
        try {

          if (_.isUndefined(row[measureIndex])) {
            valueAsNumber = null;
          } else {
            valueAsNumber = Number(row[measureIndex]);
          }
        } catch (error) {

          if (window.console && window.console.error) {

            console.error(
              `Could not convert measure value to number: ${row[measureIndex]}`
            );
          }

          valueAsNumber = null;
        }

        row[measureIndex] = valueAsNumber;
      });

      return queryResponse;
    };

    let queryString;

    if (isUnaggregatedQuery) {
      queryString = `
        SELECT
          ${dimension} AS ${dimensionAlias},
          ${measure} AS ${measureAlias}
        ${whereClause}
        ORDER BY ${orderClause}
        NULL LAST
        LIMIT ${queryLimit}`;
    } else {

      queryString = `
        SELECT
          ${dimension} AS ${dimensionAlias},
          ${measure} AS ${measureAlias}
        ${whereClause}
        GROUP BY ${groupByClause}
        ORDER BY ${orderClause}
        NULL LAST
        LIMIT ${queryLimit}`;
    }

    return soqlDataProvider.
      query(
        queryString,
        dimensionAlias,
        measureAlias
      ).
      then((queryResponse) => {
        const queryResponseRowCount = queryResponse.rows.length;
        const queryResponseUniqueDimensionCount = _.uniq(
          queryResponse.rows.map((row) => row[0])
        ).length;

        if (queryResponseRowCount !== queryResponseUniqueDimensionCount) {
          const error = new Error();

          error.errorMessages = [
            I18n.t(
              'shared.visualizations.charts.common.error_duplicated_dimension_value'
            )
          ];

          throw error;
        }

        // If the number of rows in the query is one more than the maximum that
        // we allow before grouping into an "other" category, then we need to do
        // a second query to count the things that are in the "other" category.
        if (showOtherCategory && queryResponseRowCount >= displayedValuesLimit) {

          const otherCategoryName = I18n.t(
            'shared.visualizations.charts.common.other_category'
          );

          const rowsInOtherCategory = queryResponse.rows.slice(displayedValuesLimit);
          // We need to check whether the rows that would have ended up in the other category
          // contain any nulls. By the time we get to here, queryResponse.rows looks like this:
          // [[value, count], [value, count]] (for example: [['1', '1'], [undefined, '1']]). While
          // the value is actually null, Core fails to return a value to accompany the null value's
          // count (remember, Core doesn't think that null should be meaningful), which then
          // becomes undefined when we parse Core's response.
          const hasNullValuesInOther = _.some(_.map(rowsInOtherCategory, _.first), _.isUndefined);

          // Removing the overflow elements in queryResponse.rows array. They will be included in
          // others category.
          queryResponse.rows = queryResponse.rows.slice(0, displayedValuesLimit);

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

          let otherCategoryWhereClauseComponents = SoqlHelpers.
            whereClauseFilteringOwnColumn(
              otherCategoryVifToRender,
              seriesIndex
            );

          // If the other request contained nulls, we need to select nulls explicitly to prevent
          // Core from omitting the null values.
          if (hasNullValuesInOther) {
            const nullValueWhere = SoqlHelpers.filterToWhereClauseComponent({
              columnName: dimension.replace(/`/g, ''),
              function: 'isNull',
              arguments: { isNull: true }
            });
            otherCategoryWhereClauseComponents += ` OR ${nullValueWhere}`;
          }

          const otherCategoryAggregationClause = SoqlHelpers.aggregationClause(
            otherCategoryVifToRender,
            seriesIndex,
            'measure'
          );

          let otherCategoryQueryString;

          if (isUnaggregatedQuery) {

            otherCategoryQueryString = `
              SELECT
                '${otherCategoryName}' AS ${dimensionAlias},
                COUNT(*) AS ${measureAlias}
              WHERE ${otherCategoryWhereClauseComponents}`;
          } else {

            otherCategoryQueryString = `
              SELECT
                '${otherCategoryName}' AS ${dimensionAlias},
                ${otherCategoryAggregationClause} AS ${measureAlias}
              WHERE ${otherCategoryWhereClauseComponents}`;
          }

          return soqlDataProvider.
            query(
              otherCategoryQueryString,
              SoqlHelpers.dimensionAlias(),
              SoqlHelpers.measureAlias()
            ).
            then((otherCategoryQueryResponse) => {

              // If the limit is higher than the number of total rows then
              // otherCategoryQueryResponse will come back with no rows; in this
              // case there is no need to modify the original queryResponse.
              if (otherCategoryQueryResponse.rows.length > 0) {
                queryResponse.rows.push(otherCategoryQueryResponse.rows[0]);
              }

              return queryResponse;
            }).
            catch(() => {
              const error = new Error();

              error.errorMessages = [
                I18n.t(
                  'shared.visualizations.charts.common.error_other_category_query_failed'
                )
              ];

              throw error;
            });
        } else {
          return Promise.resolve(queryResponse);
        }
      }).
      then(processQueryResponse).
      catch(handleError);
  }

  /**
   * Actual execution starts here
   */

  attachApiEvents();
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
