// This model is intended to be an immutable reference to a Dataset.
angular.module('dataCards.models').factory('Dataset', function(
  ModelHelper,
  Model,
  CardDataService,
  DatasetDataService,
  Schemas) {

  var datasetMetadataSchemas = Schemas.regarding('dataset_metadata');

  function isSystemColumn(columnFieldName) {
    // A column is a system column if its name starts with a :.
    // TODO computation strategy.
    return columnFieldName[0] === ':';
  }

  //TODO cache instances or share cache.
  var Dataset = Model.extend({
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
        'downloadOverride',
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

      self.defineEphemeralObservableProperty('permissions', datasetMetadata.permissions || null);
    }
  });

  Dataset.extractHumanReadableColumnName = _.property('name');

  return Dataset;
});
