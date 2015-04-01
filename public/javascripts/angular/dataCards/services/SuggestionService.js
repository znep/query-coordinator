(function() {

  'use strict';

  function SuggestionService(http, Assert, $log) {

    var self = this;

    this.suggest = function(datasetId, fieldName, query) {
      // TODO Create a 4x4 validation service
      Assert(datasetId, 'Must provide a datasetId 4x4');
      Assert(fieldName, 'Must provide a fieldName value');
      Assert(query, 'Must provide a non-empty search query value');
      var url = $.baseUrl(
        '/views/{0}/columns/{1}/suggest/{2}'.format(datasetId, fieldName, query)
      );
      var config = {
        cache: true,
        requester: self
      };

      return http.get(url.href, config).then(
        function(response) {
          return _.chain(response).
            getPathOrElse('data.suggest.0.options', []).
            pluck('text').
            value();
        },
        function(data) {
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
