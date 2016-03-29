module.exports = function SuggestionService(http, $window) {

  var serviceDefinition = {

    suggest: function suggest(datasetId, fieldName, query, limit) {

      // TODO Create a 4x4 validation service
      $window.socrata.utils.assert(datasetId, 'Must provide a datasetId 4x4');
      $window.socrata.utils.assert(fieldName, 'Must provide a fieldName value');
      $window.socrata.utils.assert(query, 'Must provide a non-empty search query value');

      var url = $.baseUrl(
        `/views/${datasetId}/columns/${fieldName}/suggest`
      );

      url.searchParams.set('text', query);

      if (_.isFinite(limit)) {
        url.searchParams.set('size', limit + 1);
      }

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
        function() {

          // Return null to signal a non-success response
          return null;
        }
      );
    },

    requesterLabel: function requesterLabel() {
      return 'suggestion-service';
    }
  };

  return serviceDefinition;
};
