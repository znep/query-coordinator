angular.module('dataCards.services').factory('DatasetDataService', function($http, $q) {
  function fetchStub(id) {
    return $http.get('/stubs/datasets/' + id + '.json', { cache: true }).then(function(response) {
      return response.data;
    });
  };

  return {
    getBaseInfo: function(id) {
      return fetchStub(id);
    },
    getPageIds: function(id) {
      return $q.when({
        'user': _.times(2, function(idx) {
          return _.uniqueId('fakeUserPageId');
        }),
        'publisher': _.times(2, function(idx) {
          return _.uniqueId('fakePublisherPageId');
        })
      });
    }
  };
});
