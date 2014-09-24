(function() {
  'use strict';

  var Routes = {
    getUIStateAndConfigFromUrl: function(urlPathname) {
      var stateName = '404';
      var params = {};

      var cardsViewUrlMatch = urlPathname.match(/^\/view\/(\w{4}-\w{4})$/);
      var datasetMetadataUrlMatch = urlPathname.match(/^\/ux\/dataset\/(\w{4}-\w{4})$/);

      if (cardsViewUrlMatch) {
        stateName = 'view.cards';
        params.id = cardsViewUrlMatch[1];
      } else if (datasetMetadataUrlMatch) {
        stateName = 'dataset.metadata';
        params.datasetId = datasetMetadataUrlMatch[1];
      }

      return {
        stateName: stateName,
        parameters: params
      };
    }
  };

  angular.
    module('dataCards.services').
      constant('Routes', Routes);

})();
