// This model is intended to be an immutable reference to a Dataset.
angular.module('dataCards.models').factory('Dataset', function(ServerConfig, DatasetV0, DatasetV1) {
  if (ServerConfig.metadataMigration.datasetMetadata.useV0Models()) {
    return DatasetV0;
  } else {
    return DatasetV1;
  }
});
