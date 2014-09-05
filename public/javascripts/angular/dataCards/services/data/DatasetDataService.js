(function() {

  function DatasetDataService(http) {

    function fetch(datasetId) {
      return http.get('/dataset_metadata/' + datasetId + '.json').then(
        function(response) {
          return response.data;
        }
      );
    }

    // TODO short-circuit this to have callers of getBaseInfo call fetch instead
    return {
      getBaseInfo: function(id) {
        return fetch(id);
      }
    };

  }

  angular.
    module('dataCards.services').
    factory('DatasetDataService', DatasetDataService);

})();
