(function() {
  'use strict';

  var Routes = {
    getUIStateAndConfigFromUrl: function(urlPathname) {
      var stateName = '404';
      var params = {};

      var id = urlPathname.match(/\/\w{4}-\w{4}$/);
      if (_.isEmpty(id)) {
        stateName = '404'
      } else {
        stateName = 'view.cards';
        params.id = id[0];
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
