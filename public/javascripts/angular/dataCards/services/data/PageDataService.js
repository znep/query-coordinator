(function() {

  function PageDataService(http, ServerConfig) {

    function fetch(id) {
      var url = null;
      if (ServerConfig.get('useViewStubs')) {
        url = '/stubs/pages/{0}.json'.format(id);
      } else {
        url = '/page_metadata/{0}.json'.format(id);
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

    this.save = function(pageModel) {
      if (ServerConfig.get('useViewStubs')) {
        throw new Error('Using stubs - save not allowed');
      }
      var url = '/page_metadata/{0}.json'.format(pageModel.id);
      var config = {
        requester: this
      };

      var json = JSON.stringify(pageModel.serialize());
      return http.put(url, {'pageMetadata':  json}, config);
    };

    this.requesterLabel = function() {
      return 'page-data-service';
    };

  }

  angular.
    module('dataCards.services').
    service('PageDataService', PageDataService);

})();
