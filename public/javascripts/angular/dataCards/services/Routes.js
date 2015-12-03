(function() {
  'use strict';

  var Routes = {
    getUIStateAndConfigFromUrl: function(urlPathname, urlSearch) {
      var stateName = '404';
      var params = {};

      var regexPieces = {
        locale: '(?:/[a-z]{2})?', // Ex. 'en' or 'de'. Note: 'locale' is optional.
        withBootstrap: '(?:/bootstrap)?', // for ephemeral views only
        category: '[\\w-]+',
        viewName: '[\\w-]+',
        fourByFour: '(\\w{4}-\\w{4})',
        fieldName: '([\\w-_:@]+)'
      };

      var searchParams = _.chain((urlSearch || '').split('&')).
        invoke('split', '=').
        zipObject().
        value();

      var cardsViewUrlMatch = urlPathname.match(
        new RegExp('^{locale}/view{withBootstrap}/{fourByFour}$'.format(regexPieces)));
      var cardsViewSeoUrlMatch = urlPathname.match(
        new RegExp('^{locale}/{category}/{viewName}/{fourByFour}$'.format(regexPieces)));
      var bootstrapUrlMatch = urlPathname.match(
        new RegExp('^{locale}/dataset/{fourByFour}/lens/new$'.format(regexPieces)));
      var singleCardViewUrlMatch = urlPathname.match(
        new RegExp('^{locale}/view/{fourByFour}/vif$'.format(regexPieces)));
      var visualizationAddUrlMatch = urlPathname.match(
        new RegExp('^{locale}/component/visualization/add'.format(regexPieces)));

      if (cardsViewUrlMatch) {
        stateName = 'view.cards';
        params.id = cardsViewUrlMatch[1];
      } else if (cardsViewSeoUrlMatch) {
        stateName = 'view.cards';
        params.id = cardsViewSeoUrlMatch[1];
      } else if (bootstrapUrlMatch) {
        stateName = 'view.cards';
        params.id = bootstrapUrlMatch[1];
      } else if (visualizationAddUrlMatch) {
        stateName = 'view.visualizationAdd';
        params.defaultColumn = searchParams.defaultColumn;
        params.defaultRelatedVisualizationUid = searchParams.defaultRelatedVisualizationUid;
      } else if (singleCardViewUrlMatch) {
        stateName = 'view.card';
        params.id = singleCardViewUrlMatch[2];
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
