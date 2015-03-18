// We exclude app.js from the tests, as we don't need it and it adds lots of module dependencies. So
// we mock out its module definitions here.
var dataCards = angular.module('dataCards', [
  'test',
  'ngSanitize',
  'btford.markdown',
  'socrataCommon.services',
  'socrataCommon.directives',
  'dataCards.controllers',
  'dataCards.models',
  'dataCards.directives',
  'dataCards.filters'
]);

dataCards.run(function(ServerConfig, testHelpers, serverMocks) {
  // Provide a default server configuration.
  ServerConfig.setup({
    oduxCardTypeMapping: serverMocks.CARD_TYPE_MAPPING,
    oduxEnableFeatureMap: true,
    enablePngDownloadUi: true,
    enableFeedback: true
  });

  // Test under phase 3 by default.
  // Note that this can't be changed willy-nilly, as the tests use
  // stub data that's valid only for a particular phase.
  testHelpers.overrideMetadataMigrationPhase('3');
});
