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
  function CardDataService($q, http, Assert, DeveloperOverrides, SoqlHelpers, ServerConfig, $log, Constants) {

    // Note this does not include the time portion ('23:59:59') on purpose since SoQL will
    // complain about a type mismatch if the column happens to be a date but not a datetime.
    var MAX_LEGAL_JAVASCRIPT_DATE_STRING = Constants['MAX_LEGAL_JAVASCRIPT_DATE_STRING'];

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

    var serviceDefinition = {
      getData: function(fieldName, datasetId, whereClauseFragment, aggregationClauseData, options) {
        Assert(_.isString(fieldName), 'fieldName should be a string');
        Assert(_.isString(datasetId), 'datasetId should be a string');
        Assert(!whereClauseFragment || _.isString(whereClauseFragment), 'whereClauseFragment should be a string if present.');
        Assert(_.isObject(aggregationClauseData), 'aggregationClauseData object must be provided');
        options = _.defaults({ limit: 200 }, options);

        datasetId = DeveloperOverrides.dataOverrideForDataset(datasetId) || datasetId;

        var whereClause;

        if (_.isEmpty(whereClauseFragment)) {
          whereClause = '';
        } else {
          whereClause = 'WHERE ' + whereClauseFragment;
        }

        var aggregationClause = buildAggregationClause(aggregationClauseData);

        fieldName = SoqlHelpers.formatFieldName(fieldName);

        var queryTemplate;
        if (fieldName === 'name') {
          queryTemplate = 'select {0}, {2} as value {1} group by {0} order by {2} desc limit {3}';
        } else {
          queryTemplate = 'select {0} as name, {2} as value {1} group by {0} order by {2} desc limit {3}';
        }
        var url = $.baseUrl('/api/id/{0}.json'.format(datasetId));
        // TODO: Implement some method for paging/showing data that has been truncated.
        var params = {
          $query: queryTemplate.format(fieldName, whereClause, aggregationClause, options.limit)
        };
        url.searchParams.set('$query', queryTemplate.format(fieldName, whereClause, aggregationClause, options.limit));
        var config = httpConfig.call(this);

        return http.get(url.href, config).then(function(response) {
          return _.map(response.data, function(item) {
            var name = options.namePhysicalDatatype === 'number' ? parseFloat(item.name) : item.name;
            return {
              name: name,
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
        var url = $.baseUrl('/api/id/{0}.json'.format(datasetId));
        url.searchParams.set('$query', "SELECT min({0}) AS start, max({0}) AS end WHERE {0} < '{1}'".
          format(fieldName, MAX_LEGAL_JAVASCRIPT_DATE_STRING));
        var config =  httpConfig.call(this);

        return http.get(url.href, config).then(function(response) {

          if (_.isEmpty(response.data)) {
            return $q.reject('Empty response from SODA.');
          }

          var firstRow = response.data[0];
          var domain;

          if (firstRow.hasOwnProperty('start') && firstRow.hasOwnProperty('end')) {

            var domainStartDate = firstRow.start;
            var domainEndDate = firstRow.end;
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

        var whereClause = "WHERE `{0}` IS NOT NULL AND `{0}` < '{1}'".
          format(fieldName, MAX_LEGAL_JAVASCRIPT_DATE_STRING);
        if (!_.isEmpty(whereClauseFragment)) {
          whereClause += ' AND ' + whereClauseFragment;
        }

        var aggregationClause = buildAggregationClause(aggregationClauseData);
        var dateTruncFunction = 'date_trunc_{0}'.format(dateTrunc);
        if (_.isObject(soqlMetadata)) {
          soqlMetadata.dateTruncFunctionUsed = dateTruncFunction;
        }

        fieldName = SoqlHelpers.formatFieldName(fieldName);

        var url = $.baseUrl('/api/id/{0}.json'.format(datasetId));
        url.searchParams.set(
          '$query',
          'SELECT {2}({0}) AS truncated_date, {3} AS value {1} GROUP BY truncated_date'.
            format(fieldName, whereClause, dateTruncFunction, aggregationClause)
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
            d.truncated_date = moment(d.truncated_date, moment.ISO_8601);
            return d;
          });
          var invalidDate = _.find(data, function(datum) {
            return !datum.truncated_date.isValid();
          });
          if (invalidDate) {
            // _i is the original string given in the constructor. Potentially brittle, don't depend on it for anything important.
            return $q.reject('Bad date: ' + invalidDate.truncated_date._i);
          }

          var dates = _.pluck(data, 'truncated_date');
          var timeStart = _.min(dates);
          var timeEnd = _.max(dates);
          var timeData = Array(timeEnd.diff(timeStart, precision));
          _.each(data, function(item, i) {
            var date = item.truncated_date;
            var timeSlot = date.diff(timeStart, precision);
            timeData[timeSlot] = { date: date, value: Number(item.value) };
          });
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
        url.searchParams.set('$limit', 5000);
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
            if (_.isEmpty(response.data)) {
              throw new Error('The response from the server contained no data.');
            }
            // Apparently the server could respond with an empty object instead of a an object with
            // a count... so default to 0
            return parseInt(response.data[0].count_0, 10) || 0;
          });
      },

      getSampleData: function(fieldName, datasetId) {
        var url = $.baseUrl('/api/id/{0}.json'.format(datasetId));
        url.searchParams.set('$query', 'select {0} as name LIMIT 10'.format(SoqlHelpers.formatFieldName(fieldName)));
        var config = httpConfig.call(this);

        return http.get(url.href, config).then(function(response) {
          return _.filter(response.data, function(item) {
            return _.isPresent(item.name);
          });
        });
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

      getFeatureExtent: function(fieldName, datasetId) {

        var config;

        datasetId = DeveloperOverrides.dataOverrideForDataset(datasetId) || datasetId;
        var url = $.baseUrl('/resource/{0}.json'.format(datasetId));
        url.searchParams.set('$select', 'extent({0})'.format(fieldName));
        config = httpConfig.call(this);

        return http.get(url.href, config).then(function(response) {

          if (_.isEmpty(response.data)) {
            return $q.reject('Empty response.');
          }

          try {

            var coordinates = response.data[0]['extent_{0}'.format(fieldName)].coordinates[0][0];

            return {
              southwest: [ coordinates[0][1], coordinates[0][0] ],
              northeast: [ coordinates[2][1], coordinates[2][0] ]
            };

          } catch (e) {
            return $q.reject('Invalid coordinates.');
          }

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
            url.searchParams.set('$limit', 5000);

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
      }
    };

    return serviceDefinition;
  }

  angular.
    module('dataCards.services').
    factory('CardDataService', CardDataService);

})();
