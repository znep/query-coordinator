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
  function CardDataService($q, http, Assert, DeveloperOverrides, SoqlHelpers, ServerConfig, $log) {

    function httpConfig(config) {
      return _.extend({
        requester: this,
        cache: true
      }, config);
    }

    var serviceDefinition = {
      getData: function(fieldName, datasetId, whereClauseFragment) {
        Assert(_.isString(fieldName), 'fieldName should be a string');
        Assert(_.isString(datasetId), 'datasetId should be a string');
        Assert(!whereClauseFragment || _.isString(whereClauseFragment), 'whereClauseFragment should be a string if present.');

        datasetId = DeveloperOverrides.dataOverrideForDataset(datasetId) || datasetId;

        var whereClause;

        if (_.isEmpty(whereClauseFragment)) {
          whereClause = '';
        } else {
          whereClause = 'where ' + whereClauseFragment;
        }

        fieldName = SoqlHelpers.replaceHyphensWithUnderscores(fieldName);

        // TODO: Implement some method for paging/showing data that has been truncated.
        var params = {
          $query: ('select {0} as name, count(*) as value {1} ' +
                   'group by {0} order by count(*) desc limit 200').format(
                     fieldName, whereClause)
        };
        var url = '/api/id/' + datasetId + '.json?';
        var config = httpConfig.call(this);
        return http.get(url + $.param(params), config).then(function(response) {
          return _.map(response.data, function(item) {
            return { name: item.name, value: parseFloat(item.value) };
          });
        });
      },

      getTimelineDomain: function(fieldName, datasetId) {
        Assert(_.isString(fieldName), 'fieldName should be a string');
        Assert(_.isString(datasetId), 'datasetId should be a string');

        datasetId = DeveloperOverrides.dataOverrideForDataset(datasetId) || datasetId;
        fieldName = SoqlHelpers.replaceHyphensWithUnderscores(fieldName);
        var params = {
          $query: 'SELECT min({0}) as start, max({0}) as end'.format(fieldName)
        };
        var url = '/api/id/' + datasetId + '.json?';
        var config =  httpConfig.call(this);
        return http.get(url + $.param(params), config).then(function(response) {
          if (_.isEmpty(response.data)) {
            return $q.reject('Empty response from SODA.');
          }
          var firstRow = response.data[0];

          var domain = {
            start: moment(firstRow.start, moment.ISO_8601),
            end: moment(firstRow.end, moment.ISO_8601)
          };

          if (!domain.start.isValid()) {
            return $q.reject('Invalid date: ' + firstRow.start);
          } else if (!domain.end.isValid()) {
            return $q.reject('Invalid date: ' + firstRow.end);
          } else {
            return domain;
          }
        });
      },

      getTimelineData: function(fieldName, datasetId, whereClauseFragment, precision) {
        Assert(_.isString(fieldName), 'fieldName should be a string');
        Assert(_.isString(datasetId), 'datasetId should be a string');
        Assert(!whereClauseFragment || _.isString(whereClauseFragment), 'whereClauseFragment should be a string if present.');
        Assert(_.isString(precision), 'precision should be a string');

        var dateTrunc = SoqlHelpers.timeIntervalToDateTrunc[precision];
        Assert(dateTrunc !== undefined, 'invalid precision name given');

        datasetId = DeveloperOverrides.dataOverrideForDataset(datasetId) || datasetId;
        var whereClause = 'WHERE date_trunc IS NOT NULL';
        if (!_.isEmpty(whereClauseFragment)) {
          whereClause += ' and ' + whereClauseFragment;
        }
        fieldName = SoqlHelpers.replaceHyphensWithUnderscores(fieldName);
        var params = {
          $query: ('SELECT date_trunc_{2}({0}) AS date_trunc, count(*) AS value {1} ' +
                   'GROUP BY date_trunc').format(
                     fieldName, whereClause, dateTrunc)
        };
        var url = '/api/id/' + datasetId + '.json?';
        var config = httpConfig.call(this);
        return http.get(url + $.param(params), config).then(function(response) {

          if (!_.isArray(response.data)) {
            return $q.reject('Invalid response from SODA, expected array.');
          }
          if (_.isEmpty(response.data)) {
            return [];
          }
          var data = _.map(response.data, function(d) {
            d.date_trunc = moment(d.date_trunc, moment.ISO_8601);
            return d;
          });
          var invalidDate = _.find(data, function(datum) {
            return !datum.date_trunc.isValid();
          });
          if (invalidDate) {
            // _i is the original string given in the constructor. Potentially brittle, don't depend on it for anything important.
            return $q.reject('Bad date: ' + invalidDate.date_trunc._i);
          }
          var dates = _.pluck(data, 'date_trunc');
          var timeStart = _.min(dates);
          var timeEnd = _.max(dates);
          var timeData = Array(timeEnd.diff(timeStart, precision));
          _.each(data, function(item, i) {
            var date = item.date_trunc;
            var timeSlot = date.diff(timeStart, precision);
            timeData[timeSlot] = { date: date, value: Number(item.value) };
          });
          return _.map(timeData, function(item, i) {
            if (_.isUndefined(item)) {
              item = { date: moment(timeStart, moment.ISO_8601).add(i, precision), value: 0 };
            }
            return item;
          });
        });
      },

      // This now appears here rather than cardVizualizationChoropleth.js in order to
      // prepare for live GeoJSON data.
      getChoroplethRegions: function(shapeFileId) {
        shapeFileId = DeveloperOverrides.dataOverrideForDataset(shapeFileId) || shapeFileId;
        var url = '/resource/{0}.geojson'.format(shapeFileId);
        var config = httpConfig.call(this, {
          headers: {
            'Accept': 'application/vnd.geo+json'
          }
        });
        return http.get(url, config).
          then(function(response) {
            return response.data;
          });
      },

      // This is distinct from getData in order to allow for (eventual)
      // paginated queries to get total counts across all rows rather than the hard
      // 1,000-row limit on SoQL queries.
      getChoroplethAggregates: function(fieldName, datasetId, whereClauseFragment) {
        Assert(_.isString(fieldName), 'fieldName should be a string');
        Assert(_.isString(datasetId), 'datasetId should be a string');
        Assert(!whereClauseFragment || _.isString(whereClauseFragment), 'whereClauseFragment should be a string if present.');

        datasetId = DeveloperOverrides.dataOverrideForDataset(datasetId) || datasetId;
        var whereClause;
        if (_.isEmpty(whereClauseFragment)) {
          whereClause = '';
        } else {
          whereClause = 'where ' + whereClauseFragment;
        }
        fieldName = SoqlHelpers.replaceHyphensWithUnderscores(fieldName);
        var params = {
          $query: ('select {0} as name, count(*) as value {1} ' +
                   'group by {0} order by count(*) desc').format(
                     fieldName, whereClause),
        };
        var url = '/api/id/' + datasetId + '.json?';
        var config = httpConfig.call(this);
        return http.get(url + $.param(params), config).then(function(response) {
          if (!_.isArray(response.data)) return $q.reject('Invalid response from SODA, expected array.');
          return _.map(response.data, function(item) {
            return { name: item.name, value: parseFloat(item.value) };
          });
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
        var url = '/api/id/' + datasetId + '.json?';
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

      getSampleData: function(fieldName, datasetId) {
        return serviceDefinition.getData(fieldName, datasetId);
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
        var url = '/api/id/' + datasetId + '.json?';
        var config = httpConfig.call(this, { timeout: timeout });
        return http.get(url + $.param(params), config).then(function(response) {
          return response.data;
        });
      },
      requesterLabel: function() {
        return 'card-data-service';
      }
    };

    if (ServerConfig.get('enableBoundingBoxes')) {
      serviceDefinition['getChoroplethRegions'] = function(datasetId, datasetSourceColumn, shapeFileId) {
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
            var extents = response.data[0][extentKey].coordinates;
            // Beware, data from extent query comes back as long/lat but has to be formatted as lat/long here
            var upperLeftCorner = extents[0][0][1][1] + ',' + extents[0][0][1][0];
            var lowerRightCorner = extents[0][0][3][1] + ',' + extents[0][0][3][0];

            // https://dataspace.demo.socrata.com/resource/fdqy-yyme.geojson?$select=*&
            //   $where=within_box(the_geom,41.86956082699455,-87.73681640625,41.85319643776675,-87.71484375)
            var shapeFileUrl = '/resource/{0}.geojson?$select=*&$where=within_box(the_geom,{1},{2})'.
              format(shapeFileId, upperLeftCorner, lowerRightCorner);

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
    }

    return serviceDefinition;
  }

  angular.
    module('dataCards.services').
    factory('CardDataService', CardDataService);

})();
