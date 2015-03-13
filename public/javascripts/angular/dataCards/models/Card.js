angular.module('dataCards.models').factory('Card', function(ServerConfig, CardV0, CardV1) {
  if (ServerConfig.metadataMigration.pageMetadata.useV0CardModels()) {
    return CardV0;
  } else {
    return CardV1;
  }
});
