angular.module('dataCards.services').factory('CardDataService', function($q, $http, DeveloperOverrides) {

  return {
    getUnfilteredData: function(fieldName, datasetId) {
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

    getFilteredData: function(fieldName, datasetId) {
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
    }
  };

});
