// We exclude app.js from the tests, as we don't need it and it adds lots of module dependencies. So
// we mock out its module definitions here.
var dataCards = angular.module('dataCards', [
  'test',
  'ngSanitize',
  'btford.markdown',
  'rx',
  'socrataCommon.values',
  'socrataCommon.services',
  'socrataCommon.filters',
  'socrataCommon.directives',
  'socrataCommon.decorators',
  'dataCards.templates',
  'dataCards.controllers',
  'dataCards.models',
  'dataCards.directives',
  'dataCards.filters',
  'dataCards.services'
]);

dataCards.run(function(ServerConfig, testHelpers) {
  // Provide a default server configuration.
  ServerConfig.setup({
    oduxEnableFeatureMap: true,
    enablePngDownloadUi: true,
    enableFeedback: true,
    enableSearchSuggestions: true
  });
});
