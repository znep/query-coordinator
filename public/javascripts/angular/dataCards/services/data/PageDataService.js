(function() {

  function PageDataService(http) {

    function fetch(pageId) {
      return http.get('/page_metadata/' + pageId + '.json').then(
        function(response) {
          return response.data;
        }
      );
    }

    // TODO short-circuit this to have callers of getBaseInfo call fetch instead
    return {
      getBaseInfo: function(pageId) {
        return fetch(pageId);
      }
    };
  }

  angular.
    module('dataCards.services').
    factory('PageDataService', PageDataService);

})();
