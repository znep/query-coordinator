angular.module('dataCards.services').factory('CardDataService', function($q, $http) {

  return {
    getUnfilteredData: function(fieldName, datasetId) {
      datasetId = 'q77b-s2zi';
      if (fieldName == 'location') {
        return $q.when([]);
      }
      var url = 'https://localhost:9443/api/id/{1}.json?$query=select {0} as name, count(*) as value group by {0} order by count(*) desc limit 50'.format(fieldName, datasetId);
      return $http.get(url, { cache: true }).then(function(response) {
        return _.map(response.data, function(item) {
          return { name: item.name, value: Number(item.value) };
        });
      });
    },

    getFilteredData: function(fieldName, datasetId) {
      datasetId = 'q77b-s2zi';
      if (fieldName == 'location') {
        return $q.when([]);
      }
      var url = 'https://localhost:9443/api/id/{1}.json?$query=select {0} as name, count(*) as value group by {0} order by count(*) desc limit 50'.format(fieldName, datasetId);
      return $http.get(url, { cache: true }).then(function(response) {
        return _.map(response.data, function(item) {
          return { name: item.name, value: Number(item.value) };
        });
      });
    }
  };

});
