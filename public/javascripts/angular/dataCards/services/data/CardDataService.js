angular.module('dataCards.services').factory('CardDataService', function($q, $http, DeveloperOverrides, SoqlHelpers) {

  // The implementation of the SoQL spec is incomplete at the moment, causing it to choke
  // when it encounters a column name containing a hyphen. The spec states that quoting
  // the column name with backticks should ensure the entire field name is used rather
  // than the column name being truncated at the hyphen, but this is not currently working
  // as intended.
  // Instead, since hyphens are supposed to be rewritten to underscores internally anyway,
  // we can avoid the quoting/truncation issue by rewriting hyphens to underscores before
  // making the request from the front-end.
  var self = {
    getData: function(fieldName, datasetId, whereClauseFragment) {
      datasetId = DeveloperOverrides.dataOverrideForDataset(datasetId) || datasetId;
      if (fieldName == 'location') {
        return $q.when([]);
      }
      if (_.isEmpty(whereClauseFragment)) {
        var whereClause = '';
      } else {
        var whereClause = 'where ' + whereClauseFragment;
      }
      fieldName = SoqlHelpers.replaceHyphensWithUnderscores(fieldName);
      // TODO: Implement some method for paging/showing data has been truncated.
      var url = '/api/id/{1}.json?$query=select {0} as name, count(*) as value {2} group by {0} order by count(*) desc limit 200'.format(fieldName, datasetId, whereClause);
      return $http.get(url, { cache: true }).then(function(response) {
        return _.map(response.data, function(item) {
          return { name: item.name, value: Number(item.value) };
        });
      });
    },
    getTimelineDomain: function(fieldName, datasetId, whereClauseFragment) {
      datasetId = DeveloperOverrides.dataOverrideForDataset(datasetId) || datasetId;
      var whereClause = 'WHERE date_trunc IS NOT NULL';
      if (!_.isEmpty(whereClauseFragment)) {
        whereClause += ' and ' + whereClauseFragment;
      }
      fieldName = SoqlHelpers.replaceHyphensWithUnderscores(fieldName);
      var url = '/api/id/{1}.json?$query=SELECT min({0}) as start, max({0}) as end'.format(fieldName, datasetId, whereClause);
      return $http.get(url, { cache: true }).then(function(response) {
        return _.transform(response.data[0], function(result, date, key) {
          result[key] = moment(date);
        });
      });
    },
    getTimelineData: function(fieldName, datasetId, whereClauseFragment, precision) {
      datasetId = DeveloperOverrides.dataOverrideForDataset(datasetId) || datasetId;
      var whereClause = 'WHERE date_trunc IS NOT NULL';
      if (!_.isEmpty(whereClauseFragment)) {
        whereClause += ' and ' + whereClauseFragment;
      }
      fieldName = SoqlHelpers.replaceHyphensWithUnderscores(fieldName);
      var url = '/api/id/{1}.json?$query=SELECT date_trunc_{3}({0}) AS date_trunc, count(*) AS value {2} GROUP BY date_trunc'.format(fieldName, datasetId, whereClause, SoqlHelpers.timeIntervalToDateTrunc[precision]);
      return $http.get(url, { cache: true }).then(function(response) {
        if (_.isEmpty(response.data)) {
          return [];
        }
        var data = _.map(response.data, function(d) {
          d.date_trunc = moment(d.date_trunc);
          return d;
        });
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
            item = { date: moment(timeStart).add(i, precision), value: 0 };
          }
          return item;
        });
      });
    },

    // This now appears here rather than cardVizualizationChoropleth.js in order to
    // prepare for live GeoJSON data.
    getChoroplethRegions: function(shapeFileId) {
      shapeFileId = DeveloperOverrides.dataOverrideForDataset(shapeFileId) || shapeFileId;
      var url = '/api/resources/{0}/rows.geojson'.format(shapeFileId);
      return $http.get(
        url,
        {cache: true, headers: {'Accept': 'application/vnd.geo+json'}}
      ).
      then(function(response) {
        return response.data;
      });
    },

    // This is distinct from getData in order to allow for (eventual)
    // paginated queries to get total counts across all rows rather than the hard
    // 1,000-row limit on SoQL queries.
    getChoroplethAggregates: function(fieldName, datasetId, whereClauseFragment) {
      datasetId = DeveloperOverrides.dataOverrideForDataset(datasetId) || datasetId;
      if (_.isEmpty(whereClauseFragment)) {
        var whereClause = '';
      } else {
        var whereClause = 'where ' + whereClauseFragment;
      }
      fieldName = SoqlHelpers.replaceHyphensWithUnderscores(fieldName);
      var url = ('/api/id/{1}.json?$query=' +
                 'select {0} as name, ' +
                 'count(*) as value ' +
                 '{2} ' + // where clause
                 'group by {0} ' +
                 'order by count(*) desc').format(fieldName, datasetId, whereClause);
      return $http.get(url, { cache: true }).then(function(response) {
        return _.map(response.data, function(item) {
          return { name: item.name, value: Number(item.value) };
        });
      });
    },

    getRowCount: function(datasetId, whereClause) {
      datasetId = DeveloperOverrides.dataOverrideForDataset(datasetId) || datasetId;
      var url = '/api/id/{0}.json?$query=select count(0)'.format(datasetId);
      if (whereClause) {
        url += ' where {0}'.format(whereClause);
      }
      return $http.get(url, { cache: true }).then(function(response) {
        if (_.isEmpty(response.data)) {
          throw new Error('The response from the server contained no data.');
        }
        return response.data[0].count_0;
      });
    },

    getRows: function(datasetId, offset, limit, order, timeout, whereClause) {
      if (!order) order = '';
      datasetId = DeveloperOverrides.dataOverrideForDataset(datasetId) || datasetId;
      var url = '/api/id/{0}.json?$offset={1}&$limit={2}&$order={3}'.
        format(datasetId, offset, limit, order);
      if (whereClause) {
        url += '&$where={0}'.format(whereClause);
      }
      return $http.get(url, { cache: true, timeout: timeout }).then(function(response) {
        return response.data;
      });
    }
  };
  return self;
});
