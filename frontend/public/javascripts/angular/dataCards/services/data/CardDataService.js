const moment = require('moment');

// The implementation of the SoQL spec is incomplete at the moment, causing it to choke
// when it encounters a column name containing a hyphen. The spec states that quoting
// the column name with backticks should ensure the entire field name is used rather
// than the column name being truncated at the hyphen, but this is not currently working
// as intended.
// Instead, since hyphens are supposed to be rewritten to underscores internally anyway,
// we can avoid the quoting/truncation issue by rewriting hyphens to underscores before
// making the request from the front-end.
module.exports = function CardDataService(
  $q,
  http,
  JJV,
  DeveloperOverrides,
  SoqlHelpers,
  ServerConfig,
  $log,
  Constants,
  $window
) {

  // Note this does not include the time portion ('23:59:59') on purpose since SoQL will
  // complain about a type mismatch if the column happens to be a date but not a datetime.
  var MAX_LEGAL_JAVASCRIPT_DATE_STRING = Constants.MAX_LEGAL_JAVASCRIPT_DATE_STRING;

  // It is important to use this value both for fetching the shape file regions
  // as well as the aggregated data for those regions, otherwise we can end up
  // drawing regions on the map that appear as though they have no data.
  function shapefileRegionQueryLimit() {
    return ServerConfig.getScalarValue(
      'shapefileRegionQueryLimit',
      Constants.DEFAULT_SHAPE_FILE_REGION_QUERY_LIMIT
    );
  }

  function httpConfig(config) {
    return _.extend({
      requester: this,
      cache: true
    }, config);
  }

  function buildAggregationClause(aggregationClauseData) {
    $window.socrata.utils.assert(_.isString(aggregationClauseData['function']),
      'aggregation function string should be present');
    var aggregationFunction = aggregationClauseData['function'];
    var aggregationOperand = _.isString(aggregationClauseData.fieldName) ?
      SoqlHelpers.formatFieldName(aggregationClauseData.fieldName) : '*';

    return `${aggregationFunction}(${aggregationOperand})`;
  }

  JJV.addSchema('extent', {
    type: 'object',
    properties: {
      southwest: {
        type: 'array',
        minItems: 2,
        maxItems: 2
      },
      northeast: {
        type: 'array',
        minItems: 2,
        maxItems: 2
      }
    },
    required: ['southwest', 'northeast']
  });

  function buildWhereClause(whereClauseFragment) {
    $window.socrata.utils.assert(!whereClauseFragment || _.isString(whereClauseFragment),
      'whereClauseFragment should be a string if present.');
    if (_.isEmpty(whereClauseFragment)) {
      return '';
    } else {
      return 'WHERE ' + whereClauseFragment;
    }
  }

  var serviceDefinition = {
    getData: function(fieldName, datasetId, whereClauseFragment, aggregationClauseData, options) {
      $window.socrata.utils.assert(_.isString(fieldName), 'fieldName should be a string');
      $window.socrata.utils.assert(_.isString(datasetId), 'datasetId should be a string');
      $window.socrata.utils.assert(_.isObject(aggregationClauseData),
        'aggregationClauseData object must be provided');
      options = _.defaults(options || {}, { limit: 200 });

      datasetId = DeveloperOverrides.dataOverrideForDataset(datasetId) || datasetId;

      var whereClause = buildWhereClause(whereClauseFragment);
      var aggregationClause = buildAggregationClause(aggregationClauseData);
      var nullLast = (options.nullLast === true) ? 'null last' : '';
      var orderBy = options.orderBy || `${aggregationClause} desc`;

      var nameAlias = SoqlHelpers.getFieldNameAlias('name');
      var valueAlias = SoqlHelpers.getFieldNameAlias('value');

      // Wrap field name in ticks and replace dashes with underscores
      fieldName = SoqlHelpers.formatFieldName(fieldName);

      var queryTemplate = 'select {0} as {4}, {2} as {5} {1} group by {0} order by {7} {6} limit {3}';
      var url = $.baseUrl(`/api/id/${datasetId}.json`);
      // TODO: Implement some method for paging/showing data that has been truncated.
      var query = queryTemplate.format(
        fieldName,
        whereClause,
        aggregationClause,
        options.limit,
        nameAlias,
        valueAlias,
        nullLast,
        orderBy
      );

      url.searchParams.set('$query', query);

      // These two flags are needed to make queries on the NBE copy of OBE derived views.
      // They should be noops for any view based on an NBE view (i.e. every other data lens)
      url.searchParams.set('$$read_from_nbe', true);
      url.searchParams.set('$$version', 2.1);

      var config = httpConfig.call(this);

      return http.get(url.href, config).then(function(response) {
        return {
          headers: response.headers(),
          data: _.map(response.data, function(item) {
            var name = options.namePhysicalDatatype === 'number' ? parseFloat(item[nameAlias]) : item[nameAlias];
            return {
              name: name,
              value: parseFloat(item[valueAlias])
            };
          })
        };
      });
    },

    // Similar to getData but only returns values from the column, does not perform any aggregation.
    // This is only used for the Distribution Chart's initial group by query to determine if there
    // the column is a low-cardinality column.
    getColumnValues: function(fieldName, datasetId, whereClauseFragment, options) {
      $window.socrata.utils.assert(_.isString(fieldName), 'fieldName should be a string');
      $window.socrata.utils.assert(_.isString(datasetId), 'datasetId should be a string');
      options = _.defaults(options || {}, { limit: 200 });

      datasetId = DeveloperOverrides.dataOverrideForDataset(datasetId) || datasetId;

      var whereClause = buildWhereClause(whereClauseFragment);

      var nameAlias = SoqlHelpers.getFieldNameAlias('name');

      // Wrap field name in ticks and replace dashes with underscores
      fieldName = SoqlHelpers.formatFieldName(fieldName);

      var queryTemplate = 'select {0} as {3} {1} group by {0} limit {2}';
      var url = $.baseUrl(`/api/id/${datasetId}.json`);
      // TODO: Implement some method for paging/showing data that has been truncated.
      var query = queryTemplate.format(
        fieldName,
        whereClause,
        options.limit,
        nameAlias
      );

      url.searchParams.set('$query', query);

      // These two flags are needed to make queries on the NBE copy of OBE derived views.
      // They should be noops for any view based on an NBE view (i.e. every other data lens)
      url.searchParams.set('$$read_from_nbe', true);
      url.searchParams.set('$$version', 2.1);

      var config = httpConfig.call(this);

      return http.get(url.href, config).then(function(response) {
        return {
          headers: response.headers(),
          data: response.data
        };
      });
    },

    getMagnitudeData: function(fieldName, datasetId, whereClauseFragment, aggregationClauseData) {
      $window.socrata.utils.assert(_.isString(fieldName), 'fieldName should be a string');
      $window.socrata.utils.assert(_.isString(datasetId), 'datasetId should be a string');
      $window.socrata.utils.assert(_.isObject(aggregationClauseData),
        'aggregationClauseData object must be provided');

      datasetId = DeveloperOverrides.dataOverrideForDataset(datasetId) || datasetId;

      var whereClause = buildWhereClause(whereClauseFragment);
      var aggregationClause = buildAggregationClause(aggregationClauseData);

      fieldName = SoqlHelpers.formatFieldName(fieldName);

      var magnitudeAlias = SoqlHelpers.getFieldNameAlias('magnitude');
      var valueAlias = SoqlHelpers.getFieldNameAlias('value');

      var queryTemplate = 'select signed_magnitude_10({0}) as {3}, {2} as {4} {1} group by {3} order by {3} limit 200';

      // TODO: Implement some method for paging/showing data that has been truncated.
      var url = $.baseUrl(`/api/id/${datasetId}.json`);
      var config = httpConfig.call(this);
      url.searchParams.set('$query',
        queryTemplate.format(fieldName, whereClause, aggregationClause, magnitudeAlias, valueAlias)
      );

      // These two flags are needed to make queries on the NBE copy of OBE derived views.
      // They should be noops for any view based on an NBE view (i.e. every other data lens)
      url.searchParams.set('$$read_from_nbe', true);
      url.searchParams.set('$$version', 2.1);

      return http.get(url.href, config).then(function(result) {
        var data = result.data;
        return {
          headers: result.headers(),
          data: _.map(data, function(item) {
            return {
              magnitude: parseFloat(item[magnitudeAlias]),
              value: parseFloat(item[valueAlias])
            };
          })
        };
      });
    },

    // Group data from fieldName into buckets of size options.bucketSize
    getBucketedData: function(fieldName, datasetId, whereClauseFragment, aggregationClauseData, options) {
      $window.socrata.utils.assert(_.isString(fieldName), 'fieldName should be a string');
      $window.socrata.utils.assert(_.isString(datasetId), 'datasetId should be a string');
      $window.socrata.utils.assert(_.isObject(options) && _.isFinite(options.bucketSize),
        'options.bucketSize is a required argument');

      datasetId = DeveloperOverrides.dataOverrideForDataset(datasetId) || datasetId;

      var whereClause = buildWhereClause(whereClauseFragment);
      var aggregationClause = buildAggregationClause(aggregationClauseData);

      var magnitudeAlias = SoqlHelpers.getFieldNameAlias('magnitude');
      var valueAlias = SoqlHelpers.getFieldNameAlias('value');

      // Wrap field name in ticks and replace dashes with underscores
      fieldName = SoqlHelpers.formatFieldName(fieldName);

      var queryTemplate = 'select signed_magnitude_linear({0}, {5}) as {3}, {2} as {4} {1} group by {3} order by {3}';
      var query = queryTemplate.format(
        fieldName,
        whereClause,
        aggregationClause,
        magnitudeAlias,
        valueAlias,
        options.bucketSize
      );

      var url = $.baseUrl(`/api/id/${datasetId}.json`);
      url.searchParams.set('$query', query);

      // These two flags are needed to make queries on the NBE copy of OBE derived views.
      // They should be noops for any view based on an NBE view (i.e. every other data lens)
      url.searchParams.set('$$read_from_nbe', true);
      url.searchParams.set('$$version', 2.1);

      var config = httpConfig.call(this);

      return http.get(url.href, config).then(function(response) {
        return {
          headers: response.headers(),
          data: _.map(response.data, function(item) {
            return {
              magnitude: parseFloat(item[magnitudeAlias]),
              value: parseFloat(item[valueAlias])
            };
          })
        };
      });
    },

    // This function's return value is undefined if the domain of the
    // dataset is undefined. The cardVisualizationTimelineChart checks for
    // undefined values and responds accordingly.
    getTimelineDomain: function(fieldName, datasetId) {
      $window.socrata.utils.assert(_.isString(fieldName), 'fieldName should be a string');
      $window.socrata.utils.assert(_.isString(datasetId), 'datasetId should be a string');

      datasetId = DeveloperOverrides.dataOverrideForDataset(datasetId) || datasetId;
      fieldName = SoqlHelpers.formatFieldName(fieldName);
      var startAlias = SoqlHelpers.getFieldNameAlias('start');
      var endAlias = SoqlHelpers.getFieldNameAlias('end');
      var url = $.baseUrl(`/api/id/${datasetId}.json`);
      url.searchParams.set('$query', `SELECT min(${fieldName}) AS ${startAlias}, max(${fieldName}) AS ${endAlias} WHERE ${fieldName} < '${MAX_LEGAL_JAVASCRIPT_DATE_STRING}'`);

      // These two flags are needed to make queries on the NBE copy of OBE derived views.
      // They should be noops for any view based on an NBE view (i.e. every other data lens)
      url.searchParams.set('$$read_from_nbe', true);
      url.searchParams.set('$$version', 2.1);

      var config = httpConfig.call(this);

      return http.get(url.href, config).then(function(response) {

        if (_.isEmpty(response.data)) {
          return $q.reject('Empty response from SODA.');
        }

        var firstRow = response.data[0];
        var domain;

        if (firstRow.hasOwnProperty(startAlias) && firstRow.hasOwnProperty(endAlias)) {

          var domainStartDate = firstRow[startAlias];
          var domainEndDate = firstRow[endAlias];
          var domainStart = moment(domainStartDate, moment.ISO_8601);
          var domainEnd = moment(domainEndDate, moment.ISO_8601);

          if (!domainStart.isValid()) {
            domainStart = null;
            $log.warn(`Invalid start date on ${fieldName} (${domainStartDate})`);
          }

          if (!domainEnd.isValid()) {
            domainEnd = null;
            $log.warn(`Invalid end date on ${fieldName} (${domainEndDate})`);
          }

          domain = {
            start: domainStart,
            end: domainEnd
          };

        }

        return domain;

      });
    },

    getTimelineData: function(
      fieldName,
      datasetId,
      whereClauseFragment,
      precision,
      aggregationClauseData
    ) {
      $window.socrata.utils.assert(_.isString(fieldName), 'fieldName should be a string');
      $window.socrata.utils.assert(_.isString(datasetId), 'datasetId should be a string');
      $window.socrata.utils.assert(!whereClauseFragment || _.isString(whereClauseFragment),
        'whereClauseFragment should be a string if present.');
      $window.socrata.utils.assert(_.isString(precision), 'precision should be a string');
      $window.socrata.utils.assert(_.isObject(aggregationClauseData),
        'aggregationClauseData object must be provided');

      var dateTrunc = SoqlHelpers.timeIntervalToDateTrunc[precision];
      $window.socrata.utils.assert(_.isDefined(dateTrunc), 'invalid precision name given');

      datasetId = DeveloperOverrides.dataOverrideForDataset(datasetId) || datasetId;

      var whereClause = `WHERE ${SoqlHelpers.formatFieldName(fieldName)} IS NOT NULL AND ${SoqlHelpers.formatFieldName(fieldName)} < '${MAX_LEGAL_JAVASCRIPT_DATE_STRING}'`;
      if (!_.isEmpty(whereClauseFragment)) {
        whereClause += ' AND ' + whereClauseFragment;
      }

      var dateAlias = SoqlHelpers.getFieldNameAlias('truncated_date');
      var valueAlias = SoqlHelpers.getFieldNameAlias('value');

      var aggregationClause = buildAggregationClause(aggregationClauseData);
      var dateTruncFunction = `date_trunc_${dateTrunc}`;

      fieldName = SoqlHelpers.formatFieldName(fieldName);

      var url = $.baseUrl(`/api/id/${datasetId}.json`);
      url.searchParams.set(
        '$query',
        `SELECT ${dateTruncFunction}(${fieldName}) AS ${dateAlias}, ${aggregationClause} AS ${valueAlias} ${whereClause} GROUP BY ${dateAlias}`
      );

      // These two flags are needed to make queries on the NBE copy of OBE derived views.
      // They should be noops for any view based on an NBE view (i.e. every other data lens)
      url.searchParams.set('$$read_from_nbe', true);
      url.searchParams.set('$$version', 2.1);

      var config = httpConfig.call(this);

      return http.get(url.href, config).then(function(response) {
        if (!_.isArray(response.data)) {
          return $q.reject('Invalid response from SODA, expected array.');
        }
        if (_.isEmpty(response.data)) {
          return [];
        }
        var data = _.map(response.data, function(d) {
          d[dateAlias] = moment(d[dateAlias], moment.ISO_8601);
          return d;
        });
        var invalidDate = _.find(data, function(datum) {
          return !datum[dateAlias].isValid();
        });
        if (invalidDate) {
          // _i is the original string given in the constructor. Potentially brittle, don't depend on it for anything important.
          return $q.reject('Bad date: ' + invalidDate[dateAlias]._i);
        }

        var dates = _.map(data, dateAlias);
        var timeStart = _.min(dates);
        var timeEnd = _.max(dates);
        var timeData = Array(timeEnd.diff(timeStart, precision));
        _.each(data, function(item) {
          var date = item[dateAlias];
          var timeSlot = date.diff(timeStart, precision);

          // Default to null in case we don't receive a value associated with
          // this date. If we do not, the result of Number(item.value) is NaN
          // and the timeline chart breaks because it tries to use NaN to
          // calculate the height of the chart.
          var itemValue = _.isDefined(item[valueAlias]) ?
            Number(item[valueAlias]) :
            null;

          timeData[timeSlot] = {
            date: date,
            value: itemValue
          };
        });

        // The purpose of the below is to make sure every date interval
        // between the start and end dates is present.
        return {
          headers: response.headers(),
          data: _.map(timeData, function(item, i) {
            if (_.isUndefined(item)) {
              item = { date: moment(timeStart, moment.ISO_8601).add(i, precision), value: null };
            }
            return item;
          })
        };
      });
    },

    // This now appears here rather than directives/choropleth.js in order to
    // prepare for live GeoJSON data.
    getChoroplethRegions: function(shapefileId) {
      shapefileId = DeveloperOverrides.dataOverrideForDataset(shapefileId) || shapefileId;
      var url = $.baseUrl(`/resource/${shapefileId}.geojson`);
      url.searchParams.set('$limit', shapefileRegionQueryLimit());
      var config = httpConfig.call(this, { headers: { Accept: 'application/vnd.geo+json' } });
      return http.get(url.href, config).
        then(function(response) {
          return response.data;
        });
    },

    getRowCount: function(datasetId, whereClause) {
      datasetId = DeveloperOverrides.dataOverrideForDataset(datasetId) || datasetId;
      var query = 'select count(0)';
      if (whereClause) {
        query += ` where ${whereClause}`;
      }
      var url = $.baseUrl(`/api/id/${datasetId}.json`);
      url.searchParams.set('$query', query);

      // These two flags are needed to make queries on the NBE copy of OBE derived views.
      // They should be noops for any view based on an NBE view (i.e. every other data lens)
      url.searchParams.set('$$read_from_nbe', true);
      url.searchParams.set('$$version', 2.1);

      var config = httpConfig.call(this);

      return http.get(url.href, config).
        then(function(response) {
          return _.isEmpty(response.data) ?
            0 :
            (parseInt(response.data[0].count_0, 10) || 0);
        });
    },

    // return search card suggestions, not available for data lenses based on derived views
    getSampleData: function(fieldName, datasetId) {
      var url = $.baseUrl(
        `/views/${datasetId}/columns/${fieldName}/suggest`
      );

      url.searchParams.set('size', 2);
      var config = httpConfig.call(this);

      return http.get(url.href, config).then(
        function(response) {
          return _.chain(response).get('data.options', []).map('text').value();
        },
        function(data) {
          $log.error(data);
          return [];
        }
      );
    },

    getRows: function(datasetId, offset, limit, order, timeout, whereClause) {
      if (!order) { order = ''; }
      datasetId = DeveloperOverrides.dataOverrideForDataset(datasetId) || datasetId;
      var params = {
        $offset: offset,
        $limit: limit,
        $order: order
      };
      if (whereClause) {
        params.$where = whereClause;
      }
      var url = $.baseUrl(`/api/id/${datasetId}.json`);
      url.searchParams.set('$offset', offset);
      url.searchParams.set('$limit', limit);
      url.searchParams.set('$order', order);
      if (whereClause) {
        url.searchParams.set('$where', whereClause);
      }

      // These two flags are needed to make queries on the NBE copy of OBE derived views.
      // They should be noops for any view based on an NBE view (i.e. every other data lens)
      url.searchParams.set('$$read_from_nbe', true);
      url.searchParams.set('$$version', 2.1);

      var config = httpConfig.call(this, { timeout: timeout });

      return http.get(url.href, config).then(
        function(response) {
          return response.data;
        },
        function() {
          return null;
        }
      );
    },

    requesterLabel: function() {
      return 'card-data-service';
    },

    getDefaultFeatureExtent: function() {
      var defaultFeatureExtent;
      var defaultFeatureExtentString = ServerConfig.get('feature_map_default_extent');
      if (_.isPresent(defaultFeatureExtentString)) {
        try {
          defaultFeatureExtent = JSON.parse(_.trim(defaultFeatureExtentString, '\''));
        } catch (error) {
          $log.warn(
            `Unable to parse feature_map_default_extent to JSON: ${defaultFeatureExtentString}
${error}`
          );
          return;
        }
        // In the event that the feature flag is set to "true" or "false", we
        // don't need to warn about validating the JSON
        if (!_.isObject(defaultFeatureExtent)) {
          return;
        }
        var errors = JJV.validate('extent', defaultFeatureExtent);
        if (errors) {
          $log.warn(
            `Unable to validate feature_map_default_extent to JSON: ${defaultFeatureExtentString}
${JSON.stringify(errors)}`
          );
          return;
        }
      }
      return defaultFeatureExtent;
    },

    getFeatureExtent: function(fieldName, datasetId) {

      var config;

      datasetId = DeveloperOverrides.dataOverrideForDataset(datasetId) || datasetId;
      var url = $.baseUrl(`/resource/${datasetId}.json`);
      url.searchParams.set('$select', `extent(${fieldName}) as extent`);

      // These two flags are needed to make queries on the NBE copy of OBE derived views.
      // They should be noops for any view based on an NBE view (i.e. every other data lens)
      url.searchParams.set('$$read_from_nbe', true);
      url.searchParams.set('$$version', 2.1);

      config = httpConfig.call(this);

      return http.get(url.href, config).then(function(response) {
        try {

          // The extent will be empty in the event that the dataset has only one row. Return
          // undefined here instead of erroring below. In this case the default extent will be
          // used by FeatureMapController.
          var datum = _.get(response, 'data[0]');
          if (_.isObject(datum) && _.isEmpty(datum)) {
            return undefined;
          }

          var coordinates = _.get(response, 'data[0].extent.coordinates[0][0]'.format(fieldName));
          if (_.isDefined(coordinates)) {
            return {
              southwest: [coordinates[0][1], coordinates[0][0]],
              northeast: [coordinates[2][1], coordinates[2][0]]
            };
          }

        } catch (e) {
          $log.warn('Invalid feature extent coordinates');
        }
        $log.error(`Undefined feature extent for dataset: ${datasetId} - ${fieldName}`);

      });

    },

    getChoroplethRegionsUsingSourceColumn: function(datasetId, datasetSourceColumn, shapefileId) {

      function validateExtentResponse(response) {

        if (!response.hasOwnProperty('data')) {
          throw new Error('response has no property "data".');
        }
        if (!response.data.length || response.data.length <= 0) {
          throw new Error('response.data has invalid length.');
        }
        if (!_.isObject(response.data[0])) {
          throw new Error('response.data[0] is not an object.');
        }

        var extentKeys = _.keys(response.data[0]);
        if (extentKeys.length <= 0) {
          throw new Error('response.data[0] object has no properties.');
        }

        var extent = response.data[0][extentKeys[0]];
        if (!extent.hasOwnProperty('type') || extent.type !== 'MultiPolygon') {
          throw new Error(`extent is not of type "MultiPolygon", (it was "${extent.type}").`);
        }
        if (!extent.hasOwnProperty('coordinates') ||
          !extent.coordinates.length ||
          extent.coordinates.length <= 0 ||
          !extent.coordinates[0].length ||
          extent.coordinates[0].length <= 0) {
          throw new Error('extent has no coordinates.');
        }

        var coordinates = extent.coordinates[0][0];
        if (coordinates.length !== 5) {
          throw new Error('extent coordinates are not valid.');
        }

        return {
          bottomLeft: coordinates[0].join(' '),
          topLeft: coordinates[1].join(' '),
          topRight: coordinates[2].join(' '),
          bottomRight: coordinates[3].join(' ')
        };
      }

      datasetId = DeveloperOverrides.dataOverrideForDataset(datasetId) || datasetId;

      var config = httpConfig.call(this);
      var self = this;

      var geoJsonUrl;
      var geoJsonConfig = httpConfig.call(self, {
        headers: {
          Accept: 'application/vnd.geo+json'
        }
      });

      // If the configuration specifying a custom polygon for the regions exists, and the feature flag
      // to use it is turned on, fetch all regions contained completely in this region and return.
      var useCustomBoundary = ServerConfig.get('use_data_lens_choropleth_custom_boundary');
      var customBoundary = ServerConfig.get('choroplethCustomBoundary');
      if (useCustomBoundary && customBoundary) {
        geoJsonUrl = $.baseUrl(`/resource/${shapefileId}.geojson`);
        geoJsonUrl.searchParams.set('$select', '*');
        geoJsonUrl.searchParams.set('$where', `within_polygon(the_geom,'${customBoundary}')`);
        geoJsonUrl.searchParams.set('$limit', shapefileRegionQueryLimit());

        return http.get(geoJsonUrl.href, geoJsonConfig).
          then(function(geoJsonResponse) {
            return geoJsonResponse.data;
          });
      }

      // Otherwise, fetch all regions that intersect the rectangle containing all the points in
      // the source location column.
      var url = $.baseUrl(`/resource/${datasetId}.json`);
      url.searchParams.set('$select', `extent(${datasetSourceColumn})`);

      // These two flags are needed to make queries on the NBE copy of OBE derived views.
      // They should be noops for any view based on an NBE view (i.e. every other data lens)
      url.searchParams.set('$$read_from_nbe', true);
      url.searchParams.set('$$version', 2.1);

      return http.get(url.href, config).then(function(response) {
        if (response.status === 200) {
          shapefileId = DeveloperOverrides.dataOverrideForDataset(shapefileId) || shapefileId;

          try {
            var extent = validateExtentResponse(response);
          } catch (e) {
            // If our dataset's extents failed validation, we need to check the cardinality of
            // the sourceColumn so we can display a nice error message telling them they have
            // an insufficient cardinality instead of the generic error message. Unfortunately
            // the cardinality on the column is an estimate and is not always guaranteed to
            // exist or be up-to-date, so for now we're verifying cardinality manually.
            //
            // We're doing this after the validation rather than returning early to avoid showing
            // an error message for a choropleth that would have rendered successfully but its
            // cardinality is wonky.
            //
            // TODO: Update this to use the column's cardinality once we're sure it's accurate
            var cardinalityUrl = $.baseUrl(`/resource/${datasetId}.json`);
            cardinalityUrl.searchParams.set('$select', datasetSourceColumn);
            cardinalityUrl.searchParams.set('$group', datasetSourceColumn);
            cardinalityUrl.searchParams.set('$limit', 2);

            // These two flags are needed to make queries on the NBE copy of OBE derived views.
            // They should be noops for any view based on an NBE view (i.e. every other data lens)
            cardinalityUrl.searchParams.set('$$read_from_nbe', true);
            cardinalityUrl.searchParams.set('$$version', 2.1);

            var cardinalityConfig = httpConfig.call(self);

            return http.get(cardinalityUrl.href, cardinalityConfig).then(function(points) {
              if (points.data.length > 1) {
                return $q.reject({
                  message: `Invalid extent response. ${e.message}`,
                  type: 'extentError'
                });
              } else {
                return $q.reject({
                  message: 'Invalid extent response. Source dataset has insufficient distinct points.',
                  type: 'cardinalityError'
                });
              }
            });
          }

          var multiPolygon = `'MULTIPOLYGON(((${extent.bottomLeft},${extent.topLeft},${extent.topRight},${extent.bottomRight},${extent.bottomLeft})))'`;

          geoJsonUrl = $.baseUrl(`/resource/${shapefileId}.geojson`);
          geoJsonUrl.searchParams.set('$select', '*');
          geoJsonUrl.searchParams.set('$where', `intersects(the_geom,${multiPolygon})`);
          geoJsonUrl.searchParams.set('$limit', shapefileRegionQueryLimit());

          return http.get(geoJsonUrl.href, geoJsonConfig).
            then(function(geoJsonResponse) {
              return geoJsonResponse.data;
            });

        } else if (response.status >= 400 && response.status < 500) {
          // TODO: Figure out how to handle error conditions.
        } else if (response.status >= 500 && response.status < 600) {
          // TODO: Figure out how to handle error conditions.
        } else {
          // TODO: Figure out how to handle error conditions.
        }
      });
    },

    getCuratedRegionMetadata: function(shapefileId) {
      var url = $.baseUrl('/api/curated_regions');
      url.searchParams.set('method', 'getByViewUid');
      url.searchParams.set('viewUid', shapefileId);
      var config = httpConfig.call(this);

      // Make request, unwrapping successful response, and handling
      // error case by still returning a resolved promise of null so
      // as not to break downstream promises
      return http.get(url.href, config).then(
        _.property('data'),
        _.constant(null)
      );
    },

    getShapefileDatasetMetadata: function(shapefileId) {
      var url = $.baseUrl(`/api/views/${shapefileId}.json`);
      var config = httpConfig.call(this);

      // Make request, unwrapping successful response, and handling
      // error case by still returning a resolved promise of null so
      // as not to break downstream promises
      return http.get(url.href, config).then(
        _.property('data'),
        _.constant(null)
      );
    },

    getChoroplethRegionMetadata: function(shapefileId) {
      // Request both curated region and shapefile metadata, and try to
      // extract the data first from the new curated region metadata,
      // falling back to legacy shapefile metadata, and finally to default values
      return $q.all({
        curatedRegionMetadata: serviceDefinition.getCuratedRegionMetadata(shapefileId),
        shapefileDatasetMetadata: serviceDefinition.getShapefileDatasetMetadata(shapefileId)
      }).then(function(responseHash) {
        var curatedRegionGeometryLabel = _.get(responseHash,
          'curatedRegionMetadata.geometryLabel',
          null
        );
        var shapefileGeometryLabel = _.get(responseHash,
          'shapefileDatasetMetadata.geometryLabel',
          null
        );
        var geometryLabel = curatedRegionGeometryLabel || shapefileGeometryLabel;

        var curatedRegionFeaturePk = _.get(responseHash,
          'curatedRegionMetadata.featurePk',
          null
        );
        var shapefileFeaturePk = _.get(responseHash,
          'shapefileDatasetMetadata.featurePk',
          null
        );

        var featurePk = curatedRegionFeaturePk || shapefileFeaturePk || Constants.INTERNAL_DATASET_FEATURE_ID;
        return {
          geometryLabel: geometryLabel,
          featurePk: featurePk
        };
      });
    },

    // Get the minimum and maximum value of a column
    getColumnDomain: function(fieldName, datasetId, whereClauseFragment) {
      $window.socrata.utils.assert(_.isString(fieldName), 'fieldName should be a string');
      $window.socrata.utils.assert(_.isString(datasetId), 'datasetId should be a string');

      datasetId = DeveloperOverrides.dataOverrideForDataset(datasetId) || datasetId;

      var whereClause = buildWhereClause(whereClauseFragment);

      // Wrap field name in ticks and replace dashes with underscores
      fieldName = SoqlHelpers.formatFieldName(fieldName);

      // Rollup?  Precomputation?  Backend should make this easier.
      var queryTemplate = 'select min({0}) as `min`, max({0}) as `max` {1}';
      var url = $.baseUrl(`/api/id/${datasetId}.json`);
      url.searchParams.set('$query', queryTemplate.format(fieldName, whereClause));

      // These two flags are needed to make queries on the NBE copy of OBE derived views.
      // They should be noops for any view based on an NBE view (i.e. every other data lens)
      url.searchParams.set('$$read_from_nbe', true);
      url.searchParams.set('$$version', 2.1);

      var config = httpConfig.call(this);

      return http.get(url.href, config).then(function(response) {

        // response.data comes back as [{min:, max:}]
        var data = response.data;
        return _.isEmpty(data) ? data : _.mapValues(data[0], parseFloat);
      });
    }
  };

  return serviceDefinition;
};
