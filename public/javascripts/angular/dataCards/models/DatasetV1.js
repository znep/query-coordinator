// This model is intended to be an immutable reference to a Dataset.
angular.module('dataCards.models').factory('DatasetV1', function(
  ModelHelper,
  Model,
  CardDataService,
  DatasetDataService,
  Schemas,
  SchemaDefinitions,
  $injector,
  $q,
  ServerConfig) {

  var SUPPORTED_DATASET_SCHEMA_VERSION = 1;
  var SUPPORTED_PAGES_SCHEMA_VERSION = 0;
  var datasetMetadataSchemas = Schemas.regarding('dataset_metadata');

  function isSystemColumn(columnFieldName) {
    // A column is a system column if its name starts with a :.
    // TODO computation strategy.
    return columnFieldName[0] === ':';
  };

  //TODO cache instances or share cache.
  var DatasetV1 = Model.extend({
    init: function(datasetMetadata) {

      datasetMetadataSchemas.assertValidAgainstVersion(1, datasetMetadata);

      this._super();

      var self = this;

      self.id = datasetMetadata.id;
      self.version = 1;

      var fields = [
        'defaultPage',
        'description',
        'domain',
        'locale',
        'name',
        'ownerId',
        'rowDisplayUnit',
        'updatedAt',
        'version'
      ];

      _.each(fields, function(field) {
        self.defineObservableProperty(field, datasetMetadata[field]);
      });

      // Decorate each column with a flag representing whether or not it is a
      // system column and a reference back to its parent dataset.
      _.forOwn(datasetMetadata.columns, function(columnBlob, columnFieldName) {
        columnBlob.isSystemColumn = isSystemColumn(columnFieldName);
        columnBlob.dataset = self;
      });

      self.defineObservableProperty('columns', datasetMetadata.columns);

      self.defineObservableProperty('pages', datasetMetadata.pages);

      self.defineEphemeralObservableProperty('rowCount', null, function() {
        return CardDataService.getRowCount(self.id);
      });

      self.defineEphemeralObservableProperty('permissions', datasetMetadata.permissions || {});
    }
  });

  return DatasetV1;
});
