(function(){
  'use strict';

  // Cache Busting Goodness, gotten from https://gist.github.com/ProLoser/6181026
  function assetRevisionKeyProvider($provide, assetRevisionKey) {
    $provide.decorator('$http', function($delegate) {
      var get = $delegate.get;
      $delegate.get = function(url, config) {
        // Check is to avoid breaking AngularUI ui-bootstrap-tpls.js: "template/accordion/accordion-group.html"
        if (url.indexOf('template/')) {
          url += (url.indexOf('?') === -1 ? '?' : '&');

          // Append ?[cacheBustVersion] to url
          if (!_.isEmpty(assetRevisionKey)) {
            url += assetRevisionKey;
          }
        }
        return get(url, config);
      };
      return $delegate;
    });
  }

  angular.
    module('socrataCommon.decorators').
    constant('assetRevisionKeyProvider', assetRevisionKeyProvider);

})();
