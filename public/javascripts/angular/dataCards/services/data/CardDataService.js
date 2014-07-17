angular.module('dataCards.services').factory('CardDataService', function($q, $http, DeveloperOverrides) {

  // The implementation of the SoQL spec is incomplete at the moment, causing it to choke
  // when it encounters a column name containing a hyphen. The spec states that quoting
  // the column name with backticks should ensure the entire field name is used rather
  // than the column name being truncated at the hyphen, but this is not currently working
  // as intended.
  // Instead, since hyphens are supposed to be rewritten to underscores internally anyway,
  // we can avoid the quoting/truncation issue by rewriting hyphens to underscores before
  // making the request from the front-end.
  var replaceHyphensWithUnderscores = function(fragment) {
    if (typeof fragment !== 'string') {
      throw new Error('Cannot replace hyphens with underscores for non-string arguments.');
    }
    return fragment.replace(/\-/g, '_');
  }

  return {
    getData: function(fieldName, datasetId, whereClauseFragment) {
      datasetId = DeveloperOverrides.dataOverrideForDataset(datasetId) || datasetId;
      if (fieldName == 'location') {
        return $q.when([]);
      }
      if (_.isEmpty(whereClauseFragment)) {
        var whereClause = '';
      } else {
        var whereClause = 'where ' + replaceHyphensWithUnderscores(whereClauseFragment);
      }
      fieldName = replaceHyphensWithUnderscores(fieldName);
      // TODO: Implement some method for paging/showing data has been truncated.
      var url = '/api/id/{1}.json?$query=select {0} as name, count(*) as value {2} group by {0} order by count(*) desc limit 200'.format(fieldName, datasetId, whereClause);
      return $http.get(url, { cache: true }).then(function(response) {
        return _.map(response.data, function(item) {
          return { name: item.name, value: Number(item.value) };
        });
      });
    },

    // This now appears here rather than cardVizualizationChoropleth.js in order to
    // prepare for live GeoJSON data.
    getChoroplethRegions: function(shapeFileId) {
      shapeFileId = DeveloperOverrides.dataOverrideForDataset(shapeFileId) || shapeFileId;
      var url = '/views/{0}/rows.geojson'.format(shapeFileId);
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
        var whereClause = 'where ' + replaceHyphensWithUnderscores(whereClauseFragment);
      }
      fieldName = replaceHyphensWithUnderscores(fieldName);
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
        whereClause = replaceHyphensWithUnderscores(whereClause);
        url += ' where {0}'.format(whereClause);
      }
      return $http.get(url, { cache: true }).then(function(response) {
        return response.data[0].count_0;
      });
    },

    getRows: function(datasetId, offset, limit, order, timeout, whereClause) {
      if (!order) order = '';
      datasetId = DeveloperOverrides.dataOverrideForDataset(datasetId) || datasetId;
      var url = '/api/id/{0}.json?$offset={1}&$limit={2}&$order={3}'.
        format(datasetId, offset, limit, order);
      if (whereClause) {
        whereClause = replaceHyphensWithUnderscores(whereClause);
        url += '&$where={0}'.format(whereClause);
      }
      return $http.get(url, { cache: true, timeout: timeout }).then(function(response) {
        return response.data;
      });
    }
  };

});
