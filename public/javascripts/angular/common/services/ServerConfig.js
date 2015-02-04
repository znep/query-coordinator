(function() {
  'use strict';

  var configurationStore;
  var ServerConfig = {
    get: function(key) {
      if (_.isDefined(configurationStore) && _.isDefined(configurationStore[key])) {
        return configurationStore[key];
      }
    },
    setup: function(config) {
      configurationStore = config;
    }
  };

  angular.
    module('socrataCommon.services').
    constant('ServerConfig', ServerConfig);

})();
