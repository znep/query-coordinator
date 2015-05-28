(function() {
  'use strict';

  // The implementation of the SoQL spec is incomplete at the moment, causing it to choke
  // when it encounters a column name containing a hyphen. The spec states that quoting
  // the column name with backticks should ensure the entire field name is used rather
  // than the column name being truncated at the hyphen, but this is not currently working
  // as intended.
  // Instead, since hyphens are supposed to be rewritten to underscores internally anyway,
  // we can avoid the quoting/truncation issue by rewriting hyphens to underscores before
  // making the request from the front-end.
  function CardDataService($q, http, JJV, Assert, DeveloperOverrides, SoqlHelpers, ServerConfig, $log, Constants) {

    // Note this does not include the time portion ('23:59:59') on purpose since SoQL will
    // complain about a type mismatch if the column happens to be a date but not a datetime.
    var MAX_LEGAL_JAVASCRIPT_DATE_STRING = Constants['MAX_LEGAL_JAVASCRIPT_DATE_STRING'];

    // It is important to use this value both for fetching the shape file regions
    // as well as the aggregated data for those regions, otherwise we can end up
    // drawing regions on the map that appear as though they have no data.
    function shapeFileRegionQueryLimit() {
      return ServerConfig.getScalarValue(
        'shapeFileRegionQueryLimit',
        Constants['DEFAULT_SHAPE_FILE_REGION_QUERY_LIMIT']
      );
    }

    function httpConfig(config) {
      return _.extend({
        requester: this,
        cache: true
      }, config);
    }

    function buildAggregationClause(aggregationClauseData) {
      Assert(_.isString(aggregationClauseData['function']), 'aggregation function string should be present');
      var aggregationFunction = aggregationClauseData['function'];
      var aggregationOperand = typeof aggregationClauseData.fieldName === "string" ?
        SoqlHelpers.formatFieldName(aggregationClauseData.fieldName) : '*';

      return '{0}({1})'.format(aggregationFunction, aggregationOperand);
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
      Assert(!whereClauseFragment || _.isString(whereClauseFragment), 'whereClauseFragment should be a string if present.');
      if (_.isEmpty(whereClauseFragment)) {
        return '';
      } else {
        return 'WHERE ' + whereClauseFragment;
      }
    }

    var serviceDefinition = {
      getData: function(fieldName, datasetId, whereClauseFragment, aggregationClauseData, options) {
        Assert(_.isString(fieldName), 'fieldName should be a string');
        Assert(_.isString(datasetId), 'datasetId should be a string');
        Assert(_.isObject(aggregationClauseData), 'aggregationClauseData object must be provided');
        options = _.defaults(options || {}, { limit: 200 });

        datasetId = DeveloperOverrides.dataOverrideForDataset(datasetId) || datasetId;

        var whereClause = buildWhereClause(whereClauseFragment);
        var aggregationClause = buildAggregationClause(aggregationClauseData);

        var nameAlias = SoqlHelpers.getFieldNameAlias('name');
        var valueAlias = SoqlHelpers.getFieldNameAlias('value');

        // Wrap field name in ticks and replace dashes with underscores
        fieldName = SoqlHelpers.formatFieldName(fieldName);

        var queryTemplate = 'select {0} as {4}, {2} as {5} {1} group by {0} order by {2} desc limit {3}';
        var url = $.baseUrl('/api/id/{0}.json'.format(datasetId));
        // TODO: Implement some method for paging/showing data that has been truncated.
        var query = queryTemplate.format(
          fieldName,
          whereClause,
          aggregationClause,
          options.limit,
          nameAlias,
          valueAlias
        );

        url.searchParams.set('$query', query);
        var config = httpConfig.call(this);

        return http.get(url.href, config).then(function(response) {
          return _.map(response.data, function(item) {
            var name = options.namePhysicalDatatype === 'number' ? parseFloat(item[nameAlias]) : item[nameAlias];
            return {
              name: name,
              value: parseFloat(item[valueAlias])
            };
          });
        });
      },

      getMagnitudeData: function(fieldName, datasetId, whereClauseFragment, aggregationClauseData) {
        Assert(_.isString(fieldName), 'fieldName should be a string');
        Assert(_.isString(datasetId), 'datasetId should be a string');
        Assert(_.isObject(aggregationClauseData), 'aggregationClauseData object must be provided');

        datasetId = DeveloperOverrides.dataOverrideForDataset(datasetId) || datasetId;

        var whereClause = buildWhereClause(whereClauseFragment);
        var aggregationClause = buildAggregationClause(aggregationClauseData);

        fieldName = SoqlHelpers.formatFieldName(fieldName);

        var queryTemplate = 'select signed_magnitude_10({0}) as magnitude, {2} as value {1} group by magnitude order by magnitude limit 200';

        // TODO: Implement some method for paging/showing data that has been truncated.
        var params = {
          $query: queryTemplate.format(fieldName, whereClause, aggregationClause)
        };
        var url = $.baseUrl('/api/id/{0}.json'.format(datasetId));
        var config = httpConfig.call(this);
        url.searchParams.set('$query', queryTemplate.format(fieldName, whereClause, aggregationClause));

        return http.get(url.href, config).
          then(function(result) {
            var data = result['data'];
            return _.map(data, function(item) {
              return {
                magnitude: parseFloat(item.magnitude),
                value: parseFloat(item.value)
              };
            });
          });
      },

      // This function's return value is undefined if the domain of the
      // dataset is undefined. The cardVisualizationTimelineChart checks for
      // undefined values and responds accordingly.
      getTimelineDomain: function(fieldName, datasetId) {
        Assert(_.isString(fieldName), 'fieldName should be a string');
        Assert(_.isString(datasetId), 'datasetId should be a string');

        datasetId = DeveloperOverrides.dataOverrideForDataset(datasetId) || datasetId;
        fieldName = SoqlHelpers.formatFieldName(fieldName);
        var startAlias = SoqlHelpers.getFieldNameAlias('start');
        var endAlias = SoqlHelpers.getFieldNameAlias('end');
        var url = $.baseUrl('/api/id/{0}.json'.format(datasetId));
        url.searchParams.set('$query', "SELECT min({0}) AS {2}, max({0}) AS {3} WHERE {0} < '{1}'".
          format(fieldName, MAX_LEGAL_JAVASCRIPT_DATE_STRING, startAlias, endAlias));
        var config =  httpConfig.call(this);

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
              $log.warn('Invalid start date on {0} ({1})'.format(fieldName, domainStartDate));
            }

            if (!domainEnd.isValid()) {
              domainEnd = null;
              $log.warn('Invalid end date on {0} ({1})'.format(fieldName, domainEndDate));
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
        aggregationClauseData,
        soqlMetadata
      ) {
        Assert(_.isString(fieldName), 'fieldName should be a string');
        Assert(_.isString(datasetId), 'datasetId should be a string');
        Assert(!whereClauseFragment || _.isString(whereClauseFragment), 'whereClauseFragment should be a string if present.');
        Assert(_.isString(precision), 'precision should be a string');
        Assert(_.isObject(aggregationClauseData), 'aggregationClauseData object must be provided');

        var dateTrunc = SoqlHelpers.timeIntervalToDateTrunc[precision];
        Assert(dateTrunc !== undefined, 'invalid precision name given');

        datasetId = DeveloperOverrides.dataOverrideForDataset(datasetId) || datasetId;

        var whereClause = "WHERE {0} IS NOT NULL AND {0} < '{1}'".
          format(SoqlHelpers.formatFieldName(fieldName), MAX_LEGAL_JAVASCRIPT_DATE_STRING);
        if (!_.isEmpty(whereClauseFragment)) {
          whereClause += ' AND ' + whereClauseFragment;
        }

        var dateAlias = SoqlHelpers.getFieldNameAlias('truncated_date');
        var valueAlias = SoqlHelpers.getFieldNameAlias('value');

        var aggregationClause = buildAggregationClause(aggregationClauseData);
        var dateTruncFunction = 'date_trunc_{0}'.format(dateTrunc);
        if (_.isObject(soqlMetadata)) {
          soqlMetadata.dateTruncFunctionUsed = dateTruncFunction;
        }

        fieldName = SoqlHelpers.formatFieldName(fieldName);

        var url = $.baseUrl('/api/id/{0}.json'.format(datasetId));
        url.searchParams.set(
          '$query',
          'SELECT {2}({0}) AS {4}, {3} AS {5} {1} GROUP BY {4}'.
            format(fieldName, whereClause, dateTruncFunction, aggregationClause, dateAlias, valueAlias)
        );

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

          var dates = _.pluck(data, dateAlias);
          var timeStart = _.min(dates);
          var timeEnd = _.max(dates);
          var timeData = Array(timeEnd.diff(timeStart, precision));
          _.each(data, function(item, i) {
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
          return _.map(timeData, function(item, i) {
            if (_.isUndefined(item)) {
              item = { date: moment(timeStart, moment.ISO_8601).add(i, precision), value: null };
            }
            return item;
          });
        });
      },

      // This now appears here rather than cardVizualizationChoropleth.js in order to
      // prepare for live GeoJSON data.
      getChoroplethRegions: function(shapeFileId) {
        shapeFileId = DeveloperOverrides.dataOverrideForDataset(shapeFileId) || shapeFileId;
        var url = $.baseUrl('/resource/{0}.geojson'.format(shapeFileId));
        url.searchParams.set('$limit', shapeFileRegionQueryLimit());
        var config = httpConfig.call(this, { headers: { 'Accept': 'application/vnd.geo+json' } });
        return http.get(url.href, config).
          then(function(response) {
            return response.data;
          });
      },

      getRowCount: function(datasetId, whereClause) {
        datasetId = DeveloperOverrides.dataOverrideForDataset(datasetId) || datasetId;
        var query = 'select count(0)';
        if (whereClause) {
          query += ' where {0}'.format(whereClause);
        }
        var url = $.baseUrl('/api/id/{0}.json'.format(datasetId));
        url.searchParams.set('$query', query);
        var config = httpConfig.call(this);

        return http.get(url.href, config).
          then(function(response) {
            return _.isEmpty(response.data) ?
              0 :
              (parseInt(response.data[0].count_0, 10) || 0);
          });
      },

      getSampleData: function(fieldName, datasetId) {
        var url = $.baseUrl(
          '/views/{0}/columns/{1}/suggest'.format(datasetId, fieldName)
        );

        url.searchParams.set('size', 2);
        var config = httpConfig.call(this);

        return http.get(url.href, config).then(
          function(response) {
            return _.chain(response).get('data.options', []).pluck('text').value();
          },
          function(data) {
            $log.error(data);
            return [];
          }
        );
      },

      getRows: function(datasetId, offset, limit, order, timeout, whereClause) {
        if (!order) order = '';
        datasetId = DeveloperOverrides.dataOverrideForDataset(datasetId) || datasetId;
        var params = {
          $offset: offset,
          $limit: limit,
          $order: order
        };
        if (whereClause) {
          params.$where = whereClause;
        }
        var url = $.baseUrl('/api/id/{0}.json'.format(datasetId));
        url.searchParams.set('$offset', offset);
        url.searchParams.set('$limit', limit);
        url.searchParams.set('$order', order);
        if (whereClause) {
          url.searchParams.set('$where', whereClause);
        }

        var config = httpConfig.call(this, { timeout: timeout });

        return http.get(url.href, config).then(function(response) {
          return response.data;
        });
      },

      requesterLabel: function() {
        return 'card-data-service';
      },

      getDefaultFeatureExtent: function() {
        var defaultFeatureExtent;
        var defaultFeatureExtentString = ServerConfig.get('featureMapDefaultExtent');
        if (_.isPresent(defaultFeatureExtentString)) {
          try {
            defaultFeatureExtent = JSON.parse(_.trim(defaultFeatureExtentString, "'"));
          } catch (error) {
            $log.warn(
              'Unable to parse featureMapDefaultExtent to JSON: {0}\n{1}'.
                format(defaultFeatureExtentString, error)
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
              'Unable to validate featureMapDefaultExtent to JSON: {0}\n{1}'.
                format(defaultFeatureExtentString, JSON.stringify(errors))
            );
            return;
          }
        }
        return defaultFeatureExtent;
      },

      getFeatureExtent: function(fieldName, datasetId) {

        var config;

        datasetId = DeveloperOverrides.dataOverrideForDataset(datasetId) || datasetId;
        var url = $.baseUrl('/resource/{0}.json'.format(datasetId));
        url.searchParams.set('$select', 'extent({0})'.format(fieldName));
        config = httpConfig.call(this);

        return http.get(url.href, config).then(function(response) {

          try {
            var coordinates = _.get(response, 'data[0].extent_{0}.coordinates[0][0]'.format(fieldName));
            if (_.isDefined(coordinates)) {
              return {
                southwest: [coordinates[0][1], coordinates[0][0]],
                northeast: [coordinates[2][1], coordinates[2][0]]
              };
            }

          } catch (e) {
            $log.warn('Invalid feature extent coordinates');
          }
          $log.error('Undefined feature extent for dataset: {0} - {1}'.format(datasetId, fieldName));

        });

      },

      getChoroplethRegionsUsingSourceColumn: function(datasetId, datasetSourceColumn, shapeFileId) {

        function validateExtentResponse(response) {

          if (!response.hasOwnProperty('data')) {
            throw new Error('response has no property "data".');
          }
          if (!response.data.length || response.data.length <= 0) {
            throw new Error('response.data has invalid length.');
          }
          if (typeof response.data[0] !== 'object') {
            throw new Error('response.data[0] is not an object.');
          }

          var extentKeys = _.keys(response.data[0]);
          if (extentKeys.length <= 0) {
            throw new Error('response.data[0] object has no properties.');
          }

          var extent = response.data[0][extentKeys[0]];
          if (!extent.hasOwnProperty('type') || extent.type !== 'MultiPolygon') {
            throw new Error('extent is not of type "MultiPolygon", (it was "{0}").'.format(extent.type));
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

        // http://dataspace-demo.test-socrata.com/resource/vtvh-wqgq.json?$select=extent(point)
        var url = $.baseUrl('/resource/{0}.json'.format(datasetId));
        url.searchParams.set('$select', 'extent({0})'.format(datasetSourceColumn));

        var config = httpConfig.call(this);
        var self = this;

        return http.get(url.href, config).then(function(response) {
          if (response.status === 200) {
            shapeFileId = DeveloperOverrides.dataOverrideForDataset(shapeFileId) || shapeFileId;

            try {
              var extent = validateExtentResponse(response);
            } catch(e) {
              return $q.reject('Invalid extent response. {0}'.format(e.message));
            }

            //  /resource/bwdd-ss8w.geojson?$select=*&$where=intersects(
            //  the_geom,
            //  'MULTIPOLYGON(((-71.153911%2042.398355,-71.153911%2042.354528,-71.076298%2042.354528,-71.076298%2042.398355,-71.153911%2042.398355)))')
            var multiPolygon = "'MULTIPOLYGON((({0},{1},{2},{3},{0})))'".
              format(
                extent.bottomLeft,
                extent.topLeft,
                extent.topRight,
                extent.bottomRight
              );

            var url = $.baseUrl('/resource/{0}.geojson'.format(shapeFileId));
            url.searchParams.set('$select', '*');
            url.searchParams.set('$where', 'intersects(the_geom,{0})'.format(multiPolygon));
            url.searchParams.set('$limit', shapeFileRegionQueryLimit());

            var config = httpConfig.call(self, {
              headers: {
                'Accept': 'application/vnd.geo+json'
              }
            });
            return http.get(url.href, config).
              then(function(response) {
                return response.data;
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

      getChoroplethGeometryLabel: function(shapeFileId) {
        var url = $.baseUrl('/metadata/v1/dataset/{0}.json'.format(shapeFileId));
        var config = httpConfig.call(this);

        return http.get(url.href, config).then(function(response) {
          var geometryLabel = null;

          if (response.status !== 200) {
            $log.warn(
              'Could not determine geometry label: request failed with status code {0}'.
                format(response.status)
            );
          } else if (!response.data.hasOwnProperty('geometryLabel')) {
            $log.warn(
              'Could not determine geometry label: dataset metadata does not include property ({0}).'.
                format(url)
            );
          } else {
            geometryLabel = response.data.geometryLabel;
          }

          return geometryLabel;
        });
      },

      // Get the minimum and maximum value of a column
      getColumnDomain: function(fieldName, datasetId, whereClauseFragment) {
        Assert(_.isString(fieldName), 'fieldName should be a string');
        Assert(_.isString(datasetId), 'datasetId should be a string');

        datasetId = DeveloperOverrides.dataOverrideForDataset(datasetId) || datasetId;

        var whereClause = buildWhereClause(whereClauseFragment);

        // Wrap field name in ticks and replace dashes with underscores
        fieldName = SoqlHelpers.formatFieldName(fieldName);

        // Rollup?  Precomputation?  Backend should make this easier.
        var queryTemplate = 'select min({0}) as `min`, max({0}) as `max` {1}';
        var url = $.baseUrl('/api/id/{0}.json'.format(datasetId));
        url.searchParams.set('$query', queryTemplate.format(fieldName, whereClause));
        var config = httpConfig.call(this);

        return http.get(url.href, config).then(function(response) {

          // response.data comes back as [{min:, max:}]
          return _.isEmpty(response.data) ? response.data : response.data[0];
        });
      },

      // Group data from fieldName into buckets of size options.bucketSize
      getBucketedData: function(fieldName, datasetId, whereClauseFragment, aggregationClauseData, options) {
        Assert(_.isString(fieldName), 'fieldName should be a string');
        Assert(_.isString(datasetId), 'datasetId should be a string');
        Assert(_.isNumber(options.bucketSize), 'options.bucketSize is a required argument');

        datasetId = DeveloperOverrides.dataOverrideForDataset(datasetId) || datasetId;

        var whereClause = buildWhereClause(whereClauseFragment);
        var aggregationClause = buildAggregationClause(aggregationClauseData);

        // Wrap field name in ticks and replace dashes with underscores
        fieldName = SoqlHelpers.formatFieldName(fieldName);

        var queryTemplate = 'select signed_magnitude_lin({0}) as magnitude, {2} as value {1} group by magnitude order by magnitude';
        var url = $.baseUrl('/api/id/{0}.json'.format(datasetId));
        url.searchParams.set('$query', queryTemplate.format(fieldName, whereClause, aggregationClause));
        var config = httpConfig.call(this);

        return http.get(url.href, config).then(function(response) {
          var data = repsonse.data;
          return _.map(data, function(item) {
            return {
              magnitude: parseFloat(item.magnitude),
              value: parseFloat(item.value)
            };
          });
        });
      }
    };

    return serviceDefinition;
  }

  angular.
    module('dataCards.services').
    factory('CardDataService', CardDataService);

})();
