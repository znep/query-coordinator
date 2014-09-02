(function() {

  var serverConfig;
  var config = {
    get: function(key) {
      if (_.isDefined(serverConfig) && _.isDefined(serverConfig[key])) {
        return serverConfig[key];
      }
    },
    setup: function(config) {
      serverConfig = config;
    }
  };

  angular.
    module('socrataCommon.services').
    constant('ServerConfig', config);

})();
