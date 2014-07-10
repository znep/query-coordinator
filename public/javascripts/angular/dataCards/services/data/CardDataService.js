angular.module('dataCards.services').factory('CardDataService', function($q, $http, DeveloperOverrides) {

  return {
    getUnFilteredData: function(fieldName, datasetId) {
      datasetId = DeveloperOverrides.dataOverrideForDataset(datasetId) || datasetId;
      if (fieldName == 'location') {
        return $q.when([]);
      }
      var url = '/api/id/{1}.json?$query=select {0} as name, count(*) as value group by {0} order by count(*) desc limit 50'.format(fieldName, datasetId);
      return $http.get(url, { cache: true }).then(function(response) {
        return _.map(response.data, function(item) {
          return { name: item.name, value: Number(item.value) };
        });
      });
    },

    getFilteredData: function(fieldName, datasetId, whereClause) {
      datasetId = DeveloperOverrides.dataOverrideForDataset(datasetId) || datasetId;
      if (fieldName == 'location') {
        return $q.when([]);
      }
      var url = '/api/id/{1}.json?$query=select {0} as name, count(*) as value where {2} group by {0} order by count(*) desc limit 50'.format(fieldName, datasetId, whereClause);
      return $http.get(url, { cache: true }).then(function(response) {
        return _.map(response.data, function(item) {
          return { name: item.name, value: Number(item.value) };
        });
      });
    },

    // This now appears here rather than cardVizualizationChoropleth.js in order to
    // prepare for live GeoJSON data.
    getChoroplethRegions: function(fieldName, datasetId, shapefileId) {
      url = '/datasets/geojson/ward_geojson.json';
      return $http.get(url, { cache: true }).then(function(response) {
        return response.data;
      });
    },

    // This is distinct from getUnFilteredData in order to allow for (eventual)
    // paginated queries to get total counts across all rows rather than the hard
    // 1,000-row limit on SoQL queries.
    getUnfilteredChoroplethAggregates: function(fieldName, datasetId) {
      datasetId = DeveloperOverrides.dataOverrideForDataset(datasetId) || datasetId;
      var url = ('/api/id/{1}.json?$query=' +
                 'select {0} as name, ' +
                 'count(*) as value ' +
                 'group by {0} ' +
                 'order by count(*) desc').format(fieldName, datasetId);
      return $http.get(url, { cache: true }).then(function(response) {
        return _.map(response.data, function(item) {
          return { name: item.name, value: Number(item.value) };
        });
      });
    },

    // This is distinct from getFilteredData in order to allow for (eventual)
    // paginated queries to get total counts across all rows rather than the hard
    // 1,000-row limit on SoQL queries.
    getFilteredChoroplethAggregates: function(fieldName, datasetId, whereClause) {
      datasetId = DeveloperOverrides.dataOverrideForDataset(datasetId) || datasetId;
      var url = ('/api/id/{1}.json?$query=' +
                 'select {0} as name, ' +
                 'count(*) as value ' +
                 'where {2} ' +
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

});
