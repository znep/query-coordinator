(function() {
  'use strict';

  var Routes = {
    getUIStateAndConfigFromUrl: function(urlPathname) {
      var stateName = '404';
      var params = {};

      var regexPieces = {
        locale: '(?:/[a-z]{2})?', // Ex. 'en' or 'de'. Note: 'locale' is optional.
        withBootstrap: '(?:/bootstrap)?', // for ephemeral views only
        fourByFour: '(\\w{4}-\\w{4})',
        fieldName: '([\\w-_:@]+)'
      };
      var cardsViewUrlMatch = urlPathname.match(
        new RegExp('^{locale}/view{withBootstrap}/{fourByFour}$'.format(regexPieces)));
      var singleCardViewUrlMatch = urlPathname.match(
        new RegExp('^{locale}/view/{fourByFour}/{fieldName}$'.format(regexPieces)));
      var configureVisualizationUrlMatch = urlPathname.match(
        new RegExp('^{locale}/component/card/add'.format(regexPieces)));

      if (cardsViewUrlMatch) {
        stateName = 'view.cards';
        params.id = cardsViewUrlMatch[1];
      } else if (configureVisualizationUrlMatch) {
        stateName = 'view.configureVisualization';
        // TODO: FIX THIS
        params.datasetId = '';
      } else if (singleCardViewUrlMatch) {
        stateName = 'view.card';
        params.pageId = singleCardViewUrlMatch[1];
        params.fieldName = singleCardViewUrlMatch[2];
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
