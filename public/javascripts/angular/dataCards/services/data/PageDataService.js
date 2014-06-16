angular.module('dataCards.services').factory('PageDataService', function($q, $http) {

  function fetchStub(id) {
    return $http.get('/stubs/pages/' + id + '.json', { cache: true }).then(function(response) {
      return response.data;
    });
  };

  return {
    getBaseInfo: function(id) {
      return fetchStub(id);
    }
  };
});
