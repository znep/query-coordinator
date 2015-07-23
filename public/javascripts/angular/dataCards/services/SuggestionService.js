(function() {

  'use strict';

  function SuggestionService(http, Assert, $log) {

    var serviceDefinition = {

      suggest: function suggest(datasetId, fieldName, query, limit) {
        // TODO Create a 4x4 validation service
        Assert(datasetId, 'Must provide a datasetId 4x4');
        Assert(fieldName, 'Must provide a fieldName value');
        Assert(query, 'Must provide a non-empty search query value');

        var limitString = (_.isFinite(limit)) ? '?size={0}'.format(limit + 1) : '';

        var url = $.baseUrl(
          '/views/{0}/columns/{1}/suggest/{2}{3}'.format(
            datasetId,
            fieldName,
            query,
            limitString)
        );
        var config = {
          cache: true,
          requester: serviceDefinition
        };

        return http.get(url.href, config).then(
          function(response) {
            return _.chain(response).
              get('data.options', []).
              pluck('text').
              value();
          },
          function(data) {
            $log.error(data);
            return [];
          }
        );
      },

      requesterLabel: function requesterLabel() {
        return 'suggestion-service';
      }
    };

    return serviceDefinition;
  }

  angular.
    module('dataCards.services').
    service('SuggestionService', SuggestionService);

})();
