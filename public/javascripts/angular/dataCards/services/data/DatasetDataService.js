(function() {

  function DatasetDataService(http) {

    function fetchStub(id) {
      var url = '/stubs/datasets/{0}.json'.format(id);
      var config = {
        cache: true,
        requester: this
      };
      return http.get(url, config).
        then(function(response) {
          return response.data;
        });
    }

    this.getBaseInfo = function(id) {
      return fetchStub.call(this, id);
    };

    this.requesterLabel = function() {
      return 'dataset-data-service';
    };

  }

  angular.
    module('dataCards.services').
    service('DatasetDataService', DatasetDataService);

})();
