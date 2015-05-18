// We exclude app.js from the tests, as we don't need it and it adds lots of module dependencies. So
// we mock out its module definitions here.
var dataCards = angular.module('dataCards', [
  'test',
  'ngSanitize',
  'btford.markdown',
  'rx',
  'socrataCommon.services',
  'socrataCommon.filters',
  'socrataCommon.directives',
  'socrataCommon.decorators',
  'dataCards.controllers',
  'dataCards.models',
  'dataCards.directives',
  'dataCards.filters'
]);

dataCards.run(function(ServerConfig, testHelpers, serverMocks) {
  // Provide a default server configuration.
  ServerConfig.setup({
    oduxEnableFeatureMap: true,
    enablePngDownloadUi: true,
    enableFeedback: true,
    enableSearchSuggestions: true
  });
});
