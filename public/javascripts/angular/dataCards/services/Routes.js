(function() {
  'use strict';

  var Routes = {
    getUIStateAndConfigFromUrl: function(urlPathname) {
      var stateName = '404';
      var params = {};

      var cardsViewUrlMatch = urlPathname.match(/^\/view\/(\w{4}-\w{4})$/);
      var singleCardViewUrlMatch = urlPathname.match(/^\/view\/(\w{4}-\w{4})\/([\w-_:@]+)$/);

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
