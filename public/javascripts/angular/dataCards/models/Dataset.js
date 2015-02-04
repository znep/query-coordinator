// This model is intended to be an immutable reference to a Dataset.
angular.module('dataCards.models').factory('Dataset', function(ModelHelper, Model, DatasetDataService, Schemas, SchemaDefinitions, $injector) {
  var SUPPORTED_DATASET_SCHEMA_VERSION = '0';
  var SUPPORTED_PAGES_SCHEMA_VERSION = '0';

  var schemas = Schemas.regarding('dataset_metadata');

  //TODO cache instances or share cache.
  var Dataset = Model.extend({
    init: function(id) {
      this._super();

      var self = this;

      if (!SchemaDefinitions.uidRegexp.test(id)) {
        throw new Error('Bad dataset ID passed to Dataset constructor.');
      }
      this.id = id;

      // Reuse promises across lazy properties.
      // NOTE! It's important that the various getters on PageDataService are _not_ called
      // until the lazy evaluator gets called. Otherwise we'll fetch all the data before we
      // actually need it.
      var datasetMetadataPromise = function() {
        return DatasetDataService.getDatasetMetadata(SUPPORTED_DATASET_SCHEMA_VERSION, self.id).then(function(blob) {
          // Only support schema version 0 for now.
          if (schemas.isValidAgainstVersion(SUPPORTED_DATASET_SCHEMA_VERSION, blob)) {
            return blob;
          } else {
            var validationErrors = schemas.validateAgainstVersion('0', blob).errors;
            throw new Error('Dataset metadata deserialization failed: ' + JSON.stringify(validationErrors) + JSON.stringify(blob));
          }
        }).then(function(blob) {
          blob.updatedAt = new Date(blob.updatedAt);
          return blob;
        }).then(function(blob) {
          blob.columns.push({
            "name": "*",
            "title": "Data Table",
            "description": "",
            "logicalDatatype": "*",
            "physicalDatatype": "*",
            "importance": 1,
            "fakeColumnGeneratedByFrontEnd": true //TODO move away from this hack. The table isn't optional anymore.
          });
          return blob;
        });
      };

      var pagesPromise = function() {
        var Page = $injector.get('Page'); // Inject Page here to avoid circular dep.
        return DatasetDataService.getPagesForDataset(SUPPORTED_PAGES_SCHEMA_VERSION, self.id).
          then(function(pagesBySource) {
            var publisherPages = _.map(pagesBySource.publisher, function(blob) {
              return new Page(blob);
            });
            var userPages = _.map(pagesBySource.user, function(blob) {
              return new Page(blob);
            });
            return {
              publisher: publisherPages,
              user: userPages
            };
          }
        );
      };

      var fields = ['description', 'name', 'rowDisplayUnit', 'defaultAggregateColumn', 'domain', 'ownerId', 'updatedAt'];
      _.each(fields, function(field) {
        self.defineObservableProperty(field, undefined, function() {
          return datasetMetadataPromise().then(_.property(field));
        });
      });

      self.defineObservableProperty('columns', {}, function() {
        function isSystemColumn (column) {
          // A column is a system column if its name starts with a :.
          // Note that as of 9/26/2014, computed columns don't adhere to this
          // standard. This will be addressed in the backend.
          return column.name[0] === ':';
        };
        // Columns are provided as an array of objects.
        // For ease of use, transform it into an object where
        // the keys are the column names.
        return datasetMetadataPromise().then(function(data) {
          return _.reduce(data.columns, function(acc, column) {
            column.isSystemColumn = isSystemColumn(column);
            acc[column.name] = column;
            return acc;
          }, {});
        });
      });

      self.defineObservableProperty('pages', {}, pagesPromise);
    }
  });

  return Dataset;
});
