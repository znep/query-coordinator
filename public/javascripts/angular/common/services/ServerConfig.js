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

  ServerConfig.metadataMigration = {
    currentPhase: function() {
      var phaseAsString = ServerConfig.get('metadataTransitionPhase');

      // If feature flag isn't set, fall back to phase 0.
      if (_.isUndefined(phaseAsString)) {
        return 0;
      }

      var phaseAsInt = parseInt(phaseAsString, 10);
      if (_.isNaN(phaseAsInt)) {
        throw new Error('Metadata transition phase is not a number: {0}'.format(phaseAsString));
      }

      return phaseAsInt;
    },
    shouldConsumeComputationStrategy: function() {
      return ServerConfig.metadataMigration.currentPhase() > 0;
    },
    shouldUseLocalCardTypeMapping: function() {
      return ServerConfig.metadataMigration.currentPhase() < 3;
    },
    datasetMetadata: {
      // Whether or not to use the new flex dataset metadata
      // endpoint and schema.
      shouldReadWriteFromNewEndpoint: function() {
        return ServerConfig.metadataMigration.currentPhase() > 0;
      },
      // Whether or not to allow the old-style V0 metadata endpoint.
      allowUseOfOldEndpoint: function() {
        return ServerConfig.metadataMigration.currentPhase() <= 1;
      },
      // Whether or not to use DatasetV0 models.
      useV0Models: function() {
        return ServerConfig.metadataMigration.currentPhase() <= 1;
      }
    },
    pageMetadata: {
      shouldReadWriteFromNewEndpoint: function() {
        // Whether or not to use the new flex page metadata
        // endpoint and schema.
        return ServerConfig.metadataMigration.currentPhase() >= 2;
      },
      useV0CardModels: function() {
        return ServerConfig.metadataMigration.currentPhase() <= 1;
      }
    }
  };

  angular.
    module('socrataCommon.services').
    constant('ServerConfig', ServerConfig);

})();
