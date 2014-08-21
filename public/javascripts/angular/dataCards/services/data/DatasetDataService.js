(function() {

  function DatasetDataService(http) {

    function fetchStub(id) {
      return http.
        get('/stubs/datasets/' + id + '.json', { cache: true }).
        then(function(response) {
          return response.data;
        });
    }

    return {
      getBaseInfo: function(id) {
        return fetchStub(id);
      }
    };

  }

  angular.
    module('dataCards.services').
    factory('DatasetDataService', DatasetDataService);

})();
