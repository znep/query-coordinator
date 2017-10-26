var _ = require('lodash');
var $ = require('jquery');
var React = require('react');
var ReactDOM = require('react-dom');
var utils = require('common/js_utils');

var DistributionChartView = require('./views/DistributionChart').default;
var DistributionChartHelpers = require('./views/DistributionChartHelpers');
var SoqlDataProvider = require('./dataProviders/SoqlDataProvider');
var SoqlHelpers = require('./dataProviders/SoqlHelpers');

/**
 * Creates a new DistributionChart
 * @class
 * @param {Element} element
 * @param {Object} vif
 */
var DistributionChart = module.exports = function(element, vif) {
  this.element = element;

  this.props = {
    vif: vif,
    data: null,
    scale: null,
    width: null,
    height: null,
    onFlyout: this.onFlyout.bind(this),
    onFilter: this.onFilter.bind(this)
  };

  this.updateVif(vif);
  this.updateDimensions();
};

/**
 * Sets the vif property and reinitializes the data providers. Should be called before calling
 * updateData.
 * @param {Object} vif
 */
DistributionChart.prototype.updateVif = function(vif) {
  this.props = this.props || {};
  this.props.vif = vif;

  var dataProviderOptions = _.pick(vif, 'domain', 'datasetUid');
  this.columnDomainDataProvider = new SoqlDataProvider(dataProviderOptions);
  this.unfilteredDataProvider = new SoqlDataProvider(dataProviderOptions);
  this.filteredDataProvider = new SoqlDataProvider(dataProviderOptions);
};

/**
 * Updates the dimensions of the distribution chart to occupy the full width and height of the
 * parent element.  This is called when SOCRATA_VISUALIZATION_INVALIDATE_SIZE is triggered on the
 * element.
 */
DistributionChart.prototype.updateDimensions = function() {
  var bounds = this.element.getBoundingClientRect();
  this.props.width = bounds.width;
  this.props.height = bounds.height;
};

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
 * On success, the "data" and "scale" properties will contain the data and the d3 scale,
 * respectively.  The data takes the form of an object with "unfiltered" and "filtered" keys.  Each
 * is an array of buckets.  Each bucket has three entries: "start", indicating the lower bound of
 * the bucket's range, "end", indicating the upper bound of the bucket's range, and "value",
 * indicating the value on the y-axis for that bucket.
 *
 * @returns Promise
 */
DistributionChart.prototype.updateData = function() {

  // We're able to automatically detect a bucketType, but it's also possible to explicitly override
  // this. This override is stored in the vif's configuration.
  var bucketTypeOverride = _.get(this.props.vif, 'configuration.bucketType');

  $(this.element).trigger('SOCRATA_VISUALIZATION_DATA_LOAD_START');

  // First, fetch the min and max of the column
  return this.fetchColumnDomain().

    // Then transform this into an object with information about the bucketType and bucketSize,
    // also passing in an override bucketType from the vif in the event it has been explicitly set.
    then(_.partial(DistributionChartHelpers.getBucketingOptions, _, bucketTypeOverride)).

    // Make the appropriate query to fetch bucketed data once bucketing scheme is known
    then((bucketingOptions) =>
      this.fetchBucketedData(_.merge({ forceIncludeZero: true }, bucketingOptions))
    ).

    // Update data and scale on props
    then(function(data) {
      $(this.element).trigger('SOCRATA_VISUALIZATION_DATA_LOAD_COMPLETE');
      this.props.data = data;
      this.props.scale = DistributionChartHelpers.getScaleForData(data);
    }.bind(this)).
    catch(this.handleError);
};

/**
 * Creates a ReactElement for the DistributionChart and renders it into this.element using the
 * current data, dimensions, and callbacks.  If no data has been fetched, an empty SVG element will
 * be rendered.  Calling this function multiple times will only render the diff.
 */
DistributionChart.prototype.render = function() {
  var distributionChart = React.createElement(DistributionChartView, this.props);
  ReactDOM.render(distributionChart, this.element);
};

/**
 * Using the current data providers and vif, fetches the min and max of the column.  Returns a
 * Promise which will resolve with an object containing "min" and "max" keys.
 * @returns Promise
 */
DistributionChart.prototype.fetchColumnDomain = function() {
  var columnNames = ['min', 'max'];
  var queryTemplate = '$query=SELECT min({column}) as `min`, max({column}) as `max`';
  var columnDomainQuery = queryTemplate.format({
    column: this.props.vif.columnName
  });

  var columnDomainRequest = this.columnDomainDataProvider.getRows(columnNames, columnDomainQuery);

  // Convert the SoqlDataProvider response into an object containing min and max keys.
  return columnDomainRequest.
    then(function(data) {
      return _.map(_.head(data.rows), parseFloat);
    }).
    then(_.partial(_.zipObject, columnNames)).
    catch(this.handleError);
};

/**
 * Given a set of bucketingOptions, makes the SoQL requests to bucket the data appropriately and
 * returns a Promise containing the results.  The Promise will resolve with an array: the first
 * element contains the results of the request for the unfiltered data, the second element contains
 * the results of the request for the filtered data.
 * @param {Object} bucketingOptions
 * @param {String} bucketingOptions.bucketType - Either "linear" or "logarithmic"
 * @param {Number} bucketingOptions.bucketSize - If bucketType is "linear", the size of each bucket.
 * @returns Promise
 */
DistributionChart.prototype.fetchBucketedData = function(bucketingOptions) {
  var bucketingFunction;
  var bucketingArguments;

  if (bucketingOptions.bucketType === 'linear') {
    bucketingFunction = 'signed_magnitude_linear';
    bucketingArguments = [bucketingOptions.bucketSize];
  } else {
    bucketingFunction = 'signed_magnitude_10';
    bucketingArguments = [];
  }

  var queryParameters = {
    bucketingFunction: bucketingFunction,
    bucketingArguments: [''].concat(bucketingArguments).join(', '),
    column: this.props.vif.columnName,
    columnAlias: '__magnitude__',
    value: SoqlHelpers.aggregationClause(this.props.vif),
    valueAlias: '__value__',
    whereClause: ''
  };

  var queryTemplate = [
    'select {bucketingFunction}({column}{bucketingArguments}) as {columnAlias}, ',
    '{value} as {valueAlias} ',
    '{whereClause} group by {columnAlias} order by {columnAlias} limit 200'
  ].join('');

  var filteredWhereClause = SoqlHelpers.whereClauseNotFilteringOwnColumn(this.props.vif);
  if (filteredWhereClause.length > 0) {
    filteredWhereClause = 'where ' + filteredWhereClause;
  }

  var columnNames = [queryParameters.columnAlias, queryParameters.valueAlias];
  var unfilteredDataQuery = queryTemplate.format(queryParameters);
  var filteredDataQuery = queryTemplate.format(_.assign(queryParameters, {
    whereClause: filteredWhereClause
  }));

  var unfilteredRequest = this.unfilteredDataProvider.query(
    unfilteredDataQuery,
    queryParameters.columnAlias,
    queryParameters.valueAlias
  );

  var filteredRequest = this.filteredDataProvider.query(
    filteredDataQuery,
    queryParameters.columnAlias,
    queryParameters.valueAlias
  );

  return Promise.all([unfilteredRequest, filteredRequest]).
    then(_.bind(this.transformBucketedData, this, bucketingOptions, _));
};

/**
 * Given an object specifying bucketingOptions and an array of unfiltered and filtered responses,
 * transforms the data into an object with "unfiltered" and "filtered" keys.  Each is an array of
 * buckets.  Also adjusts the length of the filtered array to be equal to the length of the
 * unfiltered array.
 * @param {Object} bucketingOptions
 * @param {Array} responses
 * @throws
 * @returns Object
 */
DistributionChart.prototype.transformBucketedData = function(bucketingOptions, responses) {

  // Give semantic names to the repsonse array elements
  responses = _.zipObject(['unfiltered', 'filtered'], responses);

  // Transform the array of arrays into an array of objects, each with 'magnitude' and 'value' keys.
  var data = _.mapValues(responses, function(response) {
    return _.chain(response.rows).
      map(function(pair) {
        return _.map(pair, parseFloat);
      }).
      map(_.partial(_.zipObject, ['magnitude', 'value'])).
      value();
  });

  var unfilteredData = DistributionChartHelpers.bucketData(data.unfiltered, bucketingOptions);
  var filteredData = DistributionChartHelpers.bucketData(data.filtered, bucketingOptions);

  if (_.isEmpty(unfilteredData) || !_.isArray(unfilteredData)) {
    throw new Error('Cannot render distribution chart: unfiltered data is empty');
  }

  if (!_.isArray(filteredData)) {
    throw new Error('Cannot render distribution chart: filtered data is empty');
  }

  // While the filtered data doesn't have the same number of buckets as the unfiltered,
  // add the missing buckets to the filtered data and give them a value of zero.
  var i = 0;
  var noDatum = function(index) {
    return $.grep(filteredData, function(e) {
      return e.start === unfilteredData[index].start;
    }).length === 0;
  };

  while (unfilteredData.length !== filteredData.length && i < unfilteredData.length) {
    var unfilteredDatum = unfilteredData[i];

    // If the filtered array doesn't contain an object with the same 'start' index as the
    // current unfiltered object, create new bucket and insert it into the filtered array.
    // Note that splice is mutating filteredData here.

    if (noDatum(i)) {
      var newBucket = {
        start: unfilteredDatum.start,
        end: unfilteredDatum.end,
        value: 0
      };

      filteredData.splice(i, 0, newBucket);
    }

    i++;
  }

  return {
    unfiltered: unfilteredData,
    filtered: filteredData
  };
};

/**
 * The callback passed to the React component, called when a flyout is requested to be shown or
 * hidden.  The first argument is either null or an object containing configuration options for the
 * flyout.  If the payload is null then this is interpreted to mean the flyout should be hidden.
 * Otherwise, the contents of the payload are serialized into a string containing HTML and this,
 * along with certain other configuration data, are emitted as an event on this.element.
 * @param {null|Object} payload
 * @param {Number} payload.x - The x position of the flyout
 * @param {Number} payload.y - The y position of the flyout
 * @param {Number} payload.start - The lower bound of the buckets for the flyout
 * @param {Number} payload.end - The upper bound of the buckets for the flyout
 * @param {Number} payload.unfiltered - The sum of all the unfiltered values for all buckets in this flyout
 * @param {Number} payload.filtered - The sum of all the filtered values for all buckets in this flyout
 * @param {Number} payload.filtered - The sum of all the filtered values for all buckets in this flyout
 * @fires SOCRATA_VISUALIZATION_DISTRIBUTION_CHART_FLYOUT
 */
DistributionChart.prototype.onFlyout = function(payload) {
  var event;

  if (_.get(this.props.vif, 'configuration.isMobile')) {
    event = new window.CustomEvent('SOCRATA_VISUALIZATION_DISTRIBUTION_CHART_FLYOUT', {
      detail: payload,
      bubbles: true
    });

    return this.element.dispatchEvent(event);
  }

  var eventPayload;

  if (_.isNull(payload)) {
    eventPayload = null;
  } else {
    eventPayload = {};

    var start = utils.formatNumber(payload.start);
    var end = utils.formatNumber(payload.end);
    var unfilteredValue = utils.formatNumber(payload.unfiltered);
    var filteredValue = utils.formatNumber(payload.filtered);

    var title = '<div class="socrata-flyout-title">{0} to {1}</div>'.format(start, end);

    var unfiltered = [
      '<tr class="socrata-flyout-row">',
      '<td class="socrata-flyout-cell">Total</td>',
      '<td class="socrata-flyout-cell">{0}</td>'.format(unfilteredValue),
      '</tr>'
    ].join('');

    var filtered = payload.filtered ? [
      '<tr class="socrata-flyout-row">',
      '<td class="socrata-flyout-cell">Filtered</td>',
      '<td class="socrata-flyout-cell">{0}</td>'.format(filteredValue),
      '</tr>'
    ].join('') : '';

    var table = [
      '<table class="socrata-flyout-table">',
      unfiltered,
      filtered,
      '</table>'
    ].join('');

    eventPayload.element = this.element;
    eventPayload.content = title + table;
    eventPayload.rightSideHint = false;
    eventPayload.belowTarget = false;
    eventPayload.flyoutOffset = {
      left: this.element.offsetLeft + payload.x - window.pageXOffset,
      top: this.element.offsetTop + payload.y - window.pageYOffset
    };
  }

  event = new window.CustomEvent('SOCRATA_VISUALIZATION_DISTRIBUTION_CHART_FLYOUT', {
    detail: eventPayload,
    bubbles: true
  });

  return this.element.dispatchEvent(event);
};

/**
 * The callback passed to the React component, called when the visualization wishes to communicate
 * that the user has interacted with the chart in a way that should change the filter.  The payload
 * consists of either null or an object containing information about the new desired filter.  In
 * response, this function updates the "filters" entry of the vif.  All filters whose column matches
 * the vif's columnName are updated to reflect the state of the callback payload.  This new vif is
 * then emitted on the element.
 * @param {null|Object} payload
 * @param {Number} payload.start
 * @param {Number} payload.end
 * @fires SOCRATA_VISUALIZATION_VIF_UPDATED
 */
DistributionChart.prototype.onFilter = function(payload) {
  var newVif = _.cloneDeep(this.props.vif);

  newVif.filters = _.reject(newVif.filters, { columnName: newVif.columnName });

  if (!_.isNull(payload)) {
    newVif.filters.push({
      'columnName': newVif.columnName,
      'function': 'valueRange',
      'arguments': _.pick(payload, 'start', 'end')
    });
  }

  var event = new window.CustomEvent('SOCRATA_VISUALIZATION_VIF_UPDATED', {
    detail: newVif,
    bubbles: true
  });

  return this.element.dispatchEvent(event);
};

/**
 * The default error handler.  Logs the error to the console, if available.
 * @param {Error} error - The error.
 */
DistributionChart.prototype.handleError = function(error) {
  if (console && _.isFunction(console.error)) {
    console.error(error);
  }
};

/**
 * Extends jQuery and allows "socrataDistributionChart" to be called on jQuery objects.  The "this"
 * context of this function is the jQuery collection.  The first element of the collection, combined
 * with the additional "vif" parameter, is passed to the DistributionChart constructor.  Two events
 * handlers are also bound to the element to allow the host application to invalidate the dimensions
 * and update the vif as necessary.
 * @param {Object} vif
 * @returns {DistributionChart}
 */
$.fn.socrataDistributionChart = function(vif) {
  var distributionChart = new DistributionChart(this.get(0), vif);

  this.on('SOCRATA_VISUALIZATION_RENDER_VIF', function(event) {
    distributionChart.updateVif(event.originalEvent.detail);
    distributionChart.updateData().then(distributionChart.render.bind(distributionChart));
  });

  this.on('SOCRATA_VISUALIZATION_INVALIDATE_SIZE', function(event) {
    distributionChart.updateDimensions();
    distributionChart.render();
  });

  distributionChart.updateData().then(distributionChart.render.bind(distributionChart));

  return distributionChart;
};
