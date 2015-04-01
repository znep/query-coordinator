// This model is intended to be an immutable reference to a Dataset.
angular.module('dataCards.models').factory('DatasetV0', function(
  ModelHelper,
  Model,
  CardDataService,
  DatasetDataService,
  Schemas,
  SchemaDefinitions,
  $injector,
  $q,
  ServerConfig) {

  var SUPPORTED_DATASET_SCHEMA_VERSION = 0;
  var SUPPORTED_PAGES_SCHEMA_VERSION = 0;
  var datasetMetadataSchemas = Schemas.regarding('dataset_metadata');

  function isSystemColumn(column) {
    // A column is a system column if its name starts with a :.
    // Note that as of 9/26/2014, computed columns don't adhere to this
    // standard. This will be addressed in the backend.
    return column.name[0] === ':';
  };

  //TODO cache instances or share cache.
  var DatasetV0 = Model.extend({
    init: function(datasetMetadata) {

      datasetMetadataSchemas.assertValidAgainstVersion(0, datasetMetadata);

      this._super();

      var self = this;

      self.id = datasetMetadata.id;
      self.version = 0;

      var fields = ['description', 'name', 'rowDisplayUnit', 'defaultAggregateColumn', 'domain', 'ownerId', 'updatedAt'];

      _.each(fields, function(field) {
        self.defineObservableProperty(field, datasetMetadata[field]);
      });

      var columnsAsHash = {};

      // Decorate each column with a flag representing whether or not it is a
      // system column and a reference back to its parent dataset.
      _.forOwn(datasetMetadata.columns, function(columnBlob) {
        columnBlob.isSystemColumn = isSystemColumn(columnBlob);
        columnBlob.dataset = self;
        columnsAsHash[columnBlob.name] = columnBlob;
      });

      self.defineObservableProperty('columns', columnsAsHash);

      self.defineObservableProperty('pages', datasetMetadata.pages);

      self.defineEphemeralObservableProperty('rowCount', null, function() {
        return CardDataService.getRowCount(self.id);
      });

      if (ServerConfig.get('useCatalogLensPermissions')) {
        self.defineEphemeralObservableProperty('permissions', datasetMetadata.permissions);
      }
    }
  });

  return DatasetV0;
});
