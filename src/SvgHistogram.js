const _ = require('lodash');
const $ = require('jquery');
const utils = require('socrata-utils');
const DistributionChartHelpers = require('./views/DistributionChartHelpers');
const SvgHistogram = require('./views/SvgHistogram');
const SvgVisualization = require('./views/SvgVisualization');
const SoqlDataProvider = require('./dataProviders/SoqlDataProvider');
const VifHelpers = require('./helpers/VifHelpers');
const SoqlHelpers = require('./dataProviders/SoqlHelpers');
const translate = require('./authoringWorkflow/I18n').translate;

const SOQL_DATA_PROVIDER_DIMENSION_ALIAS = '__DIMENSION_ALIAS__';
const SOQL_DATA_PROVIDER_MEASURE_ALIAS = '__MEASURE_ALIAS__';
const UNAGGREGATED_BASE_QUERY = 'SELECT {0} AS {1}, {2} AS {3} {4} ORDER BY {0} {5} NULL LAST LIMIT {6}';
const AGGREGATED_BASE_QUERY = 'SELECT {0} AS {1}, {2} AS {3} {4} GROUP BY {5} ORDER BY {2} {6} NULL LAST LIMIT {7}';
const WINDOW_RESIZE_RERENDER_DELAY = 200;

/**
 * Requests the data required to render the chart, transforms it, and returns a Promise that
 * asynchronously signals success or failure.
 *
 * There are two ways this function will bucket the data: linearly and logarithmically.  Linear
 * buckets all have the same width, and logarithmic buckets have sizes of increasing powers of 10.
 * The bucketing scheme will be automatically determined using a heuristic, but can be overriden by
 * passing in the configuration option "bucketType" in the vif.  The bucketing methods correspond to
 * signed_magnitude_10 and signed_magnitude_linear SoQL functions.
 *
 * On success, the "bucketedData" property will contain the bucketed data, which is an array of buckets.
 * Each bucket has three entries: "start", indicating the lower bound of
 * the bucket's range, "end", indicating the upper bound of the bucket's range, and "value",
 * indicating the value on the y-axis for that bucket.
 *
 * @returns Promise
 */
function getData(vif, seriesIndex) {

  // We're able to automatically detect a bucketType, but it's also possible to explicitly override
  // this. This override is stored in the vif's configuration.
  var bucketTypeOverride = _.get(vif, 'configuration.bucketType');

  // First, fetch the min and max of the column
  return fetchDomain(vif, seriesIndex).

    // Then transform this into an object with information about the bucketType and bucketSize,
    // also passing in an override bucketType from the vif in the event it has been explicitly set.
    then((domain) => DistributionChartHelpers.getBucketingOptions(domain, bucketTypeOverride)).

    // Make the appropriate query to fetch bucketed data once bucketing scheme is known
    then((bucketingOptions) => fetchBucketedData(bucketingOptions, vif, seriesIndex));
};

function dataProvider(vif, seriesIndex) {
  var series = vif.series[seriesIndex];
  return new SoqlDataProvider({
    datasetUid: series.dataSource.datasetUid,
    domain: series.dataSource.domain
  });
}

/**
 * Using the current data providers and vif, fetches the min and max of the column.  Returns a
 * Promise which will resolve with an object containing "min" and "max" keys.
 * @returns Promise
 */
function fetchDomain(vif, seriesIndex) {
  var columnNames = [ 'min', 'max' ];
  var queryTemplate = '$query=SELECT min({column}) as `min`, max({column}) as `max`';
  var columnDomainQuery = queryTemplate.format({
    column: SoqlHelpers.dimension(vif, seriesIndex)
  });

  return dataProvider(vif, seriesIndex). //TODO negative domain.
    getRows(columnNames, columnDomainQuery).
    // Convert the SoqlDataProvider response into an object containing min and max keys.
    then((response) => _.map(_.head(response.rows), parseFloat)).
    then((values) => _.zipObject(columnNames, values));
};

/**
 * Given a set of bucketingOptions, makes the SoQL requests to bucket the data appropriately and
 * returns a Promise containing the results.  The Promise will resolve with an object:
 * {
 *   bucketingOptions: Pass-through of bucketingOptions parameter.
 *   bucketedData: Array of buckets.
 * }
 * @param {Object} bucketingOptions
 * @param {String} bucketingOptions.bucketType - Either "linear" or "logarithmic"
 * @param {Number} bucketingOptions.bucketSize - If bucketType is "linear", the size of each bucket.
 * @returns Promise
 */
function fetchBucketedData(bucketingOptions, vif, seriesIndex) {

  var soqlDataProvider = dataProvider(vif, seriesIndex);
  var bucketingFunction;
  var bucketingArguments;

  var whereClauseComponents = SoqlHelpers.whereClauseFilteringOwnColumn(
    vif,
    seriesIndex
  );
  var whereClause = (whereClauseComponents.length > 0) ?
      'WHERE {0}'.format(whereClauseComponents) :
      '';

  if (bucketingOptions.bucketType === 'linear') {
    bucketingFunction = 'signed_magnitude_linear';
    //TODO this will jump to scientific notation and fail to parse in SOQL.
    bucketingArguments = [ bucketingOptions.bucketSize ];
  } else {
    bucketingFunction = 'signed_magnitude_10';
    bucketingArguments = [];
  }

  var queryParameters = {
    bucketingFunction: bucketingFunction,
    bucketingArguments: [''].concat(bucketingArguments).join(', '),
    column: SoqlHelpers.dimension(vif, seriesIndex),
    columnAlias: '__magnitude__',
    value: SoqlHelpers.aggregationClause(vif, seriesIndex, 'measure'),
    valueAlias: '__value__',
    whereClause
  };

  var queryTemplate = [
    'select {bucketingFunction}({column}{bucketingArguments}) as {columnAlias}, ',
    '{value} as {valueAlias} ',
    '{whereClause} group by {columnAlias} order by {columnAlias} limit 200'
  ].join('');

  var filteredWhereClause = SoqlHelpers.whereClauseNotFilteringOwnColumn(vif, seriesIndex);
  if (filteredWhereClause.length > 0) {
    filteredWhereClause = 'where ' + filteredWhereClause;
  }

  var filteredDataQuery = queryTemplate.format(_.assign(queryParameters, {
    whereClause: filteredWhereClause
  }));

  return soqlDataProvider.query(
    filteredDataQuery,
    queryParameters.columnAlias,
    queryParameters.valueAlias
  ).then((soqlData) => transformBucketedData(bucketingOptions, soqlData));
};

/**
 * Given an object specifying bucketingOptions and data response,
 * transforms the data into an object with the bucketed data (array of buckets).
 * @param {Object} bucketingOptions
 * @param {Object} response
 * @throws
 * @returns Object
 */
function transformBucketedData(bucketingOptions, response) {
  // Transform the array of arrays into an array of objects, each with 'magnitude' and 'value' keys.
  var data = _.chain(response.rows).
      map((pair) =>_.map(pair, parseFloat)).
      map((parsed) => _.zipObject([ 'magnitude', 'value' ], parsed)).
      value();

  var bucketedData = DistributionChartHelpers.bucketData(data, bucketingOptions);

  if (!_.isArray(bucketedData)) {
    throw new Error('Cannot render distribution chart: data is empty');
  }

  return {
    bucketedData: bucketedData,
    bucketingOptions: bucketingOptions
  };
};

$.fn.socrataSvgHistogram = function(vif) {
  var $element = $(this);
  var visualization = new SvgHistogram(
    $element,
    applyDistributionChartSpecificDefaults(VifHelpers.migrateVif(vif))
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
      visualization.getLocalization('error_column_chart_generic')
    );
  }

  function applyDistributionChartSpecificDefaults(vif) {
    return _.defaultsDeep(
      _.cloneDeep(vif),
      {
        configuration: {
          xAxisScalingMode: 'fit',
          columnXAxisPaddingPercent: 0
        }
      }
    );
  }

  function updateData(newVif) {
    var dataRequests = [];
    newVif = applyDistributionChartSpecificDefaults(newVif);

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
          $element.trigger('SOCRATA_VISUALIZATION_DATA_LOAD_COMPLETE');
          visualization.render(newVif, dataResponses);
        }
      )
      ['catch'](handleError);
  }

  function makeSocrataDataRequest(vifToRender, seriesIndex) {
    return getData(vifToRender, seriesIndex).then((data) => ({
      bucketType: data.bucketingOptions.bucketType,
      rows: data.bucketedData.map((row) =>
        [ row.start, row.end, row.value ]
      ),
      columns: [
        'bucket_start', 'bucket_end', 'measure'
      ]
    }));
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

module.exports = $.fn.socrataSvgHistogram
