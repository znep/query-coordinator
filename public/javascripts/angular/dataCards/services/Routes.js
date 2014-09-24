(function() {
  'use strict';

  var Routes = {
    getUIStateAndConfigFromUrl: function(urlPathname) {
      var stateName = '404';
      var params = {};

      var viewUrlMatch = urlPathname.match(/^\/view\/(\w{4}-\w{4})$/);

      if (viewUrlMatch) {
        stateName = 'view.cards';
        params.id = viewUrlMatch[1];
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
