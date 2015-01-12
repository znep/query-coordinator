// This model is intended to be an immutable reference to a Dataset.
angular.module('dataCards.models').factory('Dataset', function(ModelHelper, Model, DatasetDataService, ServerConfig, Schemas, $injector) {
  var UID_REGEXP = /^\w{4}-\w{4}$/;

  var schemas = Schemas.regarding('dataset_metadata');
  schemas.addSchemaWithVersion(
    '0',
    {
      'type': 'object',
      'properties': {
        'id': { 'type': 'string', 'pattern': UID_REGEXP },
        'name': { 'type': 'string', 'minLength': 1 },
        'description': { 'type': 'string', 'minLength': 1 },
        'rowDisplayUnit': { 'type': 'string', 'minLength': 1 },
        'defaultAggregateColumn': { 'type': 'string', 'minLength': 1 },
        'ownerId': { 'type': 'string', 'pattern': UID_REGEXP },
        'updatedAt': { 'type': 'string' }, //TODO ISO8601
        'columns': {
          'type': 'array',
          'items': {
            'type': 'object',
            'properties': {
              'title': {
                'type': 'string'
              },
              'description': {
                'type': 'string'
              },
              'name': {
                'type': 'string',
                'minLength': 1
              },
              'logicalDatatype': {
                'type': 'string',
                'enum': [ 'category', 'amount', 'location', 'time', 'text', 'name', 'identifier', '*' ]
              },
              'physicalDatatype': {
                'type': 'string',
                'enum': [ 'number', 'point', 'geo_entity', 'text', 'timestamp', 'row_version', 'row_identifier', 'fixed_timestamp', 'floating_timestamp', 'boolean', 'money', '*' ]
              },
              'importance': { 'type': 'integer' , 'minimum': 1, 'maximum': 4 },
              'columnDisplayUnit': { 'type': 'string' }
            },
            'required': [ 'name', 'logicalDatatype', 'physicalDatatype', 'importance' ]
          }
        },
        'pages': {
          'type': 'object',
          'properties': {
            'publisher': { 'type': 'array', 'items': { 'type': 'string', 'pattern': UID_REGEXP } },
            'user': { 'type': 'array', 'items': { 'type': 'string', 'pattern': UID_REGEXP } }
          }
        }
      },
      'required': [ 'id', 'name', 'rowDisplayUnit', 'defaultAggregateColumn', 'ownerId', 'updatedAt', 'columns' ]
    }
  );

  schemas.addSchemaWithVersion(
    '0.1',
    {
      'type': 'object',
      'properties': {
        'id': { 'type': 'string', 'pattern': UID_REGEXP },
        'name': { 'type': 'string', 'minLength': 1 },
        'description': { 'type': 'string', 'minLength': 1 },
        'rowDisplayUnit': { 'type': 'string', 'minLength': 1 },
        'defaultAggregateColumn': { 'type': 'string', 'minLength': 1 },
        'ownerId': { 'type': 'string', 'pattern': UID_REGEXP },
        'updatedAt': { 'type': 'string' }, //TODO ISO8601
        'version': {
          'type': 'string',
          'value': '0.1'
        },
        'columns': {
          'type': 'array',
          'items': {
            'type': 'object',
            'properties': {
              'title': {
                'type': 'string'
              },
              'description': {
                'type': 'string'
              },
              'name': {
                'type': 'string',
                'minLength': 1
              },
              'physicalDatatype': {
                'type': 'string',
                'enum': [ 'number', 'point', 'geo_entity', 'text', 'timestamp', 'row_version', 'row_identifier', 'fixed_timestamp', 'floating_timestamp', 'boolean', 'money', '*' ]
              },
              'columnDisplayUnit': { 'type': 'string' },
              'cardinality': { 'type': 'integer', 'minimum': 0 },
              'computationStrategy': {
                'type': 'string',
                'enum': [ 'georegion_match_on_string', 'georegion_match_on_point' ]
              }
            },
            'required': [ 'name', 'cardinality', 'physicalDatatype' ]
          }
        },
        'pages': {
          'type': 'object',
          'properties': {
            'publisher': { 'type': 'array', 'items': { 'type': 'string', 'pattern': UID_REGEXP } },
            'user': { 'type': 'array', 'items': { 'type': 'string', 'pattern': UID_REGEXP } }
          }
        }
      },
      'required': [ 'id', 'name', 'rowDisplayUnit', 'defaultAggregateColumn', 'ownerId', 'updatedAt', 'version', 'columns' ],
      'not': {
        // Reject logicalDatatype
        'type': 'object',
        'properties': {
          'logicalDatatype': { 'type': 'string' }
        },
        'required': [ 'logicalDatatype' ]
      }
    }
  );

  // Safe value of cardinality to use if cardinality isn't specified for a column (v0 of the dataset metadata
  // schema doesn't provide this information).
  var getDefaultCardinality = function() {
    return ServerConfig.get('oduxCardTypeMapping').cardinality['default'];
  };

  // So we only maintain one parsing codepath, coerce an incoming metadata blob to conform to the latest version,
  // choosing defaults on a best-effort basis.
  function coerceBlobToLatestSchema(blob) {
    if (schemas.isValidAgainstVersion('0.1', blob)) {
      return blob;
    } else if (schemas.isValidAgainstVersion('0', blob)) {
      return convertV0BlobToV0_1Blob(blob);
    } else {
      var validationErrors = schemas.getValidationErrorsAgainstVersion('0.1', blob);
      throw new Error('Dataset metadata deserialization failed: ' + JSON.stringify(validationErrors) + JSON.stringify(blob));
    }
  }

  function convertV0BlobToV0_1Blob(v0Blob) {
      var converted = _.cloneDeep(v0Blob);

      converted.version = '0.1';

      // New column metadata includes cardinality and no logicalDataype.
      _.each(converted.columns, function(column) {
        column.cardinality = getDefaultCardinality();
        delete column.logicalDatatype;
      });

      if (!schemas.isValidAgainstVersion('0.1', converted)) {
        throw new Error('Conversion of dataset metadata blob from schema 0 to 0.1 failed to validate: ' + JSON.stringify(converted));
      } else {
        return converted;
      }
  };

  //TODO cache instances or share cache.
  var Dataset = Model.extend({
    init: function(id) {
      this._super();

      var self = this;

      if (!UID_REGEXP.test(id)) {
        throw new Error('Bad dataset ID passed to Dataset constructor.');
      }
      this.id = id;

      // Reuse promises across lazy properties.
      // NOTE! It's important that the various getters on PageDataService are _not_ called
      // until the lazy evaluator gets called. Otherwise we'll fetch all the data before we
      // actually need it.
      var baseInfoPromise = function() {
        return DatasetDataService.getBaseInfo(self.id).
          then(coerceBlobToLatestSchema).
          then(function(blob) {
            blob.updatedAt = new Date(blob.updatedAt);
            return blob;
          }).
          then(function(blob) {
            blob.columns.push({
              "name": "*",
              "title": "Data Table",
              "description": "",
              "physicalDatatype": "*",
              "cardinality": 0,
              "importance": 1,
              "fakeColumnGeneratedByFrontEnd": true //TODO move away from this hack. The table isn't optional anymore.
            });
            return blob;
          });
      };

      var pagesPromise = function() {
        var Page = $injector.get('Page'); // Inject Page here to avoid circular dep.
        return DatasetDataService.getPagesForDataset(self.id).
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
          return baseInfoPromise().then(_.property(field));
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
        return baseInfoPromise().then(function(data) {
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
