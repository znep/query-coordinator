(function() {
  'use strict';

  var Routes = {
    getUIStateAndConfigFromUrl: function(urlPathname) {
      var stateName = '404';
      var params = {};

      var regexPieces = {
        locale: '(?:/[a-z]{2})?', // Ex. 'en' or 'de'. Note: 'locale' is optional.
        fourByFour: '(\\w{4}-\\w{4})',
        fieldName: '([\\w-_:@]+)'
      };
      var cardsViewUrlMatch = urlPathname.match(
        new RegExp('^{locale}/view/{fourByFour}$'.format(regexPieces)));
      var singleCardViewUrlMatch = urlPathname.match(
        new RegExp('^{locale}/view/{fourByFour}/{fieldName}$'.format(regexPieces)));

      if (cardsViewUrlMatch) {
        stateName = 'view.cards';
        params.id = cardsViewUrlMatch[1];
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
