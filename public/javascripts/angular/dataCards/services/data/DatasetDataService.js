(function() {

  function DatasetDataService(http, ServerConfig) {

    function fetch(id) {
      var url = null;
      if (ServerConfig.get('useViewStubs')) {
        url = '/stubs/datasets/{0}.json'.format(id);
      } else {
        url = '/dataset_metadata/{0}.json'.format(id);
      }
      var config = {
        cache: true,
        requester: this
      };

      return http.get(url, config).
        then(function(response) {
          return response.data;
        }
      );
    }

    this.getBaseInfo = function(id) {
      return fetch.call(this, id);
    };

    this.requesterLabel = function() {
      return 'dataset-data-service';
    };

  }

  angular.
    module('dataCards.services').
    service('DatasetDataService', DatasetDataService);

})();
