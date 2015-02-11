(function() {
  'use strict';

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
    datasetMetadata: {
      // Whether or not to use the new flex dataset metadata
      // endpoint and schema.
      shouldReadWriteFromNewEndpoint: function() {
        return ServerConfig.metadataMigration.currentPhase() > 0;
      }
    }
  };

  angular.
    module('socrataCommon.services').
    constant('ServerConfig', ServerConfig);

})();
