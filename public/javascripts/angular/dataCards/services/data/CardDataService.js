angular.module('dataCards.services').factory('CardDataService', function($q, $http) {

  return {
    getUnfilteredData: function(fieldName, datasetId) {
      return $http.get('/stubs/datasets/data/' + datasetId + '.json', { cache: true }).then(function(response) {
        return _.map(response.data[fieldName].unFiltered, function(item) {
          return { name: _.first(_.keys(item)), value: _.first(_.values(item)) };
        });
      });
    },

    getFilteredData: function(fieldName, datasetId) {
      return $http.get('/stubs/datasets/data/' + datasetId + '.json', { cache: true }).then(function(response) {
        return _.map(response.data[fieldName].filtered, function(item) {
          return { name: _.first(_.keys(item)), value: _.first(_.values(item)) };
        });
      });
    }
  };

});
