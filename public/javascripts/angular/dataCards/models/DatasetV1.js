// This model is intended to be an immutable reference to a Dataset.
angular.module('dataCards.models').factory('DatasetV1', function(
  ModelHelper,
  Model,
  CardDataService,
  DatasetDataService,
  Schemas,
  SchemaDefinitions,
  $injector,
  $q) {
  var SUPPORTED_DATASET_SCHEMA_VERSION = '1';
  var SUPPORTED_PAGES_SCHEMA_VERSION = '0';

  var schemas = Schemas.regarding('dataset_metadata');

  //TODO cache instances or share cache.
  var DatasetV1 = Model.extend({
    init: function(id) {
      this._super();

      var self = this;

      if (!SchemaDefinitions.uidRegexp.test(id)) {
        throw new Error('Bad dataset ID passed to DatasetV1 constructor.');
      }
      self.id = id;
      self.version = '1';

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
            // Cause a useful error to be thrown.
            schemas.assertValidAgainstVersion('1', blob);
          }
        }).then(function(blob) {
          blob.updatedAt = new Date(blob.updatedAt);
          return blob;
        }).then(function(blob) {
          blob.columns['*'] = {
            "name": "Data Table",
            "description": "",
            "fred": "*",
            "physicalDatatype": "*",
            "defaultCardType": "table",
            "availableCardTypes": ["table"],
            "fakeColumnGeneratedByFrontEnd": true //TODO move away from this hack. The table isn't optional anymore.
          };

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

      var fields = [
        'defaultPage',
        'description',
        'domain',
        'locale',
        'name',
        'ownerId',
        'rowDisplayUnit',
        'updatedAt'
      ];

      _.each(fields, function(field) {
        self.defineObservableProperty(field, undefined, function() {
          return datasetMetadataPromise().then(_.property(field));
        });
      });

      self.defineObservableProperty('columns', {}, function() {

        function isSystemColumn(columnFieldName) {
          // A column is a system column if its name starts with a :.
          // TODO computation strategy.
          return columnFieldName[0] === ':';
        };

        return datasetMetadataPromise().
          then(_.property('columns')).
          then(function(columns) {
            _.forOwn(columns, function(columnBlob, columnFieldName) {
              columnBlob.isSystemColumn = isSystemColumn(columnFieldName);
              columnBlob.dataset = self;
            });

            return columns;
          });
      });

      self.defineObservableProperty('pages', {}, pagesPromise);

      self.defineEphemeralObservableProperty('isReadableByCurrentUser', true);

      self.defineEphemeralObservableProperty('rowCount', null, function() {
        return CardDataService.getRowCount(self.id);
      });

      self.defineEphemeralObservableProperty('permissions', {}, function() {
        return datasetMetadataPromise().then(_.property('permissions'));
      });
    }
  });

  return DatasetV1;
});
