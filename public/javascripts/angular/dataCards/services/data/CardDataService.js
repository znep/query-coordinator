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
      var aggregationOperand = aggregationClauseData.fieldName || '*';

      return '{0}({1})'.format(aggregationFunction, aggregationOperand);
    }

    var serviceDefinition = {
      getData: function(fieldName, datasetId, whereClauseFragment, aggregationClauseData, options) {
        Assert(_.isString(fieldName), 'fieldName should be a string');
        Assert(_.isString(datasetId), 'datasetId should be a string');
        Assert(!whereClauseFragment || _.isString(whereClauseFragment), 'whereClauseFragment should be a string if present.');
        Assert(_.isObject(aggregationClauseData), 'aggregationClauseData object must be provided');
        options = _.defaults({}, options);

        datasetId = DeveloperOverrides.dataOverrideForDataset(datasetId) || datasetId;

        var whereClause;

        if (_.isEmpty(whereClauseFragment)) {
          whereClause = '';
        } else {
          whereClause = 'WHERE ' + whereClauseFragment;
        }

        var aggregationClause = buildAggregationClause(aggregationClauseData);

        fieldName = SoqlHelpers.replaceHyphensWithUnderscores(fieldName);

        var queryTemplate;
        if (fieldName === 'name') {
          queryTemplate = 'select {0}, {2} as value {1} group by {0} order by {2} desc limit 200';
        } else {
          queryTemplate = 'select {0} as name, {2} as value {1} group by {0} order by {2} desc limit 200';
        }
        // TODO: Implement some method for paging/showing data that has been truncated.
        var params = {
          $query: queryTemplate.format(fieldName, whereClause, aggregationClause)
        };
        var url = '/api/id/{0}.json?'.format(datasetId);
        var config = httpConfig.call(this);

        return http.get(url + $.param(params), config).then(function(response) {
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
        fieldName = SoqlHelpers.replaceHyphensWithUnderscores(fieldName);
        var params = {
          $query: "SELECT min({0}) AS start, max({0}) AS end WHERE {0} < '{1}'".
            format(fieldName, MAX_LEGAL_JAVASCRIPT_DATE_STRING)
        };
        var url = '/api/id/{0}.json?'.format(datasetId);
        var config =  httpConfig.call(this);

        return http.get(url + $.param(params), config).then(function(response) {

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

        var whereClause = "WHERE {0} IS NOT NULL AND {0} < '{1}'".
          format(fieldName, MAX_LEGAL_JAVASCRIPT_DATE_STRING);
        if (!_.isEmpty(whereClauseFragment)) {
          whereClause += ' AND ' + whereClauseFragment;
        }

        var aggregationClause = buildAggregationClause(aggregationClauseData);
        var dateTruncFunction = 'date_trunc_{0}'.format(dateTrunc);
        if (_.isObject(soqlMetadata)) {
          soqlMetadata.dateTruncFunctionUsed = dateTruncFunction;
        }

        fieldName = SoqlHelpers.replaceHyphensWithUnderscores(fieldName);
        var params = {
          $query: (
            'SELECT {2}({0}) AS truncated_date, {3} AS value {1} ' +
            'GROUP BY truncated_date'
          ).format(fieldName, whereClause, dateTruncFunction, aggregationClause)
        };
        var url = '/api/id/{0}.json?'.format(datasetId);
        var config = httpConfig.call(this);

        return http.get(url + $.param(params), config).then(function(response) {
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
        var url = '/resource/{0}.geojson?$limit=5000'.format(shapeFileId);
        var config = httpConfig.call(this, { headers: { 'Accept': 'application/vnd.geo+json' } });
        return http.get(url, config).
          then(function(response) {
            return response.data;
          });
      },

      getRowCount: function(datasetId, whereClause) {
        datasetId = DeveloperOverrides.dataOverrideForDataset(datasetId) || datasetId;
        var params = {
          $query: 'select count(0)'
        };
        if (whereClause) {
          params.$query += ' where {0}'.format(whereClause);
        }
        var url = '/api/id/{0}.json?'.format(datasetId);
        var config = httpConfig.call(this);

        return http.get(url + $.param(params), config).
          then(function(response) {
            if (_.isEmpty(response.data)) {
              throw new Error('The response from the server contained no data.');
            }
            // Apparently the server could respond with an empty object instead of a an object with
            // a count... so default to 0
            return parseInt(response.data[0].count_0, 10) || 0;
          });
      },

      getSampleData: function(fieldName, datasetId, whereClauseFragment, aggregationClauseData, options) {
        return serviceDefinition.getData(fieldName, datasetId, whereClauseFragment, aggregationClauseData, options);
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
        var url = '/api/id/{0}.json?'.format(datasetId);
        var config = httpConfig.call(this, { timeout: timeout });

        return http.get(url + $.param(params), config).then(function(response) {
          return response.data;
        });
      },

      requesterLabel: function() {
        return 'card-data-service';
      },

      getFeatureExtent: function(fieldName, datasetId) {

        var url;
        var config;

        datasetId = DeveloperOverrides.dataOverrideForDataset(datasetId) || datasetId;
        url = '/resource/{0}.json?$select=extent({1})'.format(datasetId, fieldName);
        config = httpConfig.call(this);

        return http.get(url, config).then(function(response) {

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
        datasetId = DeveloperOverrides.dataOverrideForDataset(datasetId) || datasetId;

        // http://dataspace-demo.test-socrata.com/resource/vtvh-wqgq.json?$select=extent(point)
        var extentUrl = '/resource/{0}.json?$select=extent({1})'.format(datasetId, datasetSourceColumn);

        var config = httpConfig.call(this);
        var self = this;

        return http.get(extentUrl, config).then(function(response) {
          if (response.status === 200) {
            shapeFileId = DeveloperOverrides.dataOverrideForDataset(shapeFileId) || shapeFileId;

            var jsonPayload = response.data[0];
            var extentKey = _.keys(jsonPayload)[0];
            var extents = response.data[0][extentKey].coordinates[0][0];

            var bottomLeft = extents[0].join(' ');
            var topLeft = extents[1].join(' ');
            var topRight = extents[2].join(' ');
            var bottomRight = extents[3].join(' ');

            //  /resource/bwdd-ss8w.geojson?$select=*&$where=intersects(
            //  the_geom,
            //  'MULTIPOLYGON(((-71.153911%2042.398355,-71.153911%2042.354528,-71.076298%2042.354528,-71.076298%2042.398355,-71.153911%2042.398355)))')
            var multiPolygon = "'MULTIPOLYGON((({0},{1},{2},{3},{0})))'".
              format(bottomLeft, topLeft, topRight, bottomRight);

            var shapeFileUrl = '/resource/{0}.geojson?$select=*&$where=intersects(the_geom,{1})&$limit=5000'.
              format(shapeFileId, multiPolygon);

            var config = httpConfig.call(self, {
              headers: {
                'Accept': 'application/vnd.geo+json'
              }
            });
            return http.get(shapeFileUrl, config).
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
      }
    };

    return serviceDefinition;
  }

  angular.
    module('dataCards.services').
    factory('CardDataService', CardDataService);

})();
