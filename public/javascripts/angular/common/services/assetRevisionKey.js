(function() {
  'use strict';

  var REVISION_KEY_PATTERNS = [
    'angular_templates/'
  ];
  var REVISION_KEY_MATCHER = new RegExp('({0})'.format(REVISION_KEY_PATTERNS.join('|')), 'ig');
  var PATHNAME_MATCHER = new RegExp('^/');

  function AssetRevisionKeyHttpInterceptor(ServerConfig) {
    var assetRevisionKey = ServerConfig.get('assetRevisionKey');

    return {
      request: function(config) {
        if (_.isPresent(assetRevisionKey)) {
          var urlOrPathname = config.url;
          if (REVISION_KEY_MATCHER.test(urlOrPathname)) {
            var url = PATHNAME_MATCHER.test(urlOrPathname) ? $.baseUrl(urlOrPathname) : new URL(urlOrPathname);
            url.searchParams.set('assetRevisionKey', assetRevisionKey);
            config.url = url.href;
          }
        }
        return config;
      }
    };
  }

  angular.module('socrataCommon.services').
    config(function($provide, $httpProvider) {
      $provide.factory('AssetRevisionKey', AssetRevisionKeyHttpInterceptor);
      $httpProvider.interceptors.push('AssetRevisionKey');
    });

})();
