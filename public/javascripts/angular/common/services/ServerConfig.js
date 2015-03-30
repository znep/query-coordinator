(function() {
  'use strict';

  var THEME_CONFIGURATION_KEY = 'themeV3';
  var FEATURE_SET_KEY = 'featureSet';

  var configurationStore = {};
  var ServerConfig = {
    get: function(key) {
      if (_.isDefined(configurationStore[key])) {
        return configurationStore[key];
      }
    },
    setup: function(config) {
      configurationStore = _.cloneDeep(config);
    },
    override: function(key, value) {
      configurationStore[key] = value;
    },
    getFeatureSet: function() {
      return ServerConfig.get(FEATURE_SET_KEY) || {};
    },
    getTheme: function() {
      return ServerConfig.get(THEME_CONFIGURATION_KEY) || {};
    }
  };

  angular.
    module('socrataCommon.services').
    constant('ServerConfig', ServerConfig);

})();
