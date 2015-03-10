(function() {

  'use strict';

  function SuggestionService(http, Assert, $log) {

    var self = this;

    this.suggest = function(datasetId, fieldName, query) {
      // TODO Create a 4x4 validation service
      Assert(datasetId, 'Must provide a datasetId 4x4');
      Assert(fieldName, 'Must provide a fieldName value');
      Assert(query, 'Must provide a non-empty search query value');

      var url = '/suggest/{0}/{1}?q={2}'.format(datasetId, fieldName, query);
      var config = {
        cache: true,
        requester: self
      };

      return http.get(url, config).then(
        function(response) {
          return response.data;
        },
        function(data, status, headers, config) {
          $log.error(data);
        }
      );
    };

    this.requesterLabel = function() {
      return 'suggestion-service';
    };

  }

  angular.
    module('dataCards.services').
    service('SuggestionService', SuggestionService);

})();
