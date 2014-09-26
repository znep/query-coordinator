// This model is intended to be an immutable reference to a Dataset.
angular.module('dataCards.models').factory('Dataset', function(ModelHelper, Model, DatasetDataService, JJV, $injector) {
  var UID_REGEXP = /^\w{4}-\w{4}$/;

  JJV.addSchema('datasetMetadata', {
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
              'enum': [ 'number', 'point', 'geo_entity', 'text', 'timestamp', 'row_version', 'row_identifier', 'fixed_timestamp', 'floating_timestamp', '*' ]
            },
            'importance': { 'type': 'integer' , 'minimum': 1, 'maximum': 4 },
            'columnDisplayUnit': { 'type': 'string' },
            'shapefileFeatureHumanReadablePropertyName': { 'type': 'string' }
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
  });

  //TODO cache instances or share cache.
  var Dataset = Model.extend({
    init: function(id) {
      this._super();

      var self = this;
      var Page = $injector.get('Page'); // Inject Page here to avoid circular dep.

      if (!UID_REGEXP.test(id)) {
        throw new Error('Bad dataset ID passed to Dataset constructor.');
      }
      this.id = id;

      // Reuse promises across lazy properties.
      // NOTE! It's important that the various getters on PageDataService are _not_ called
      // until the lazy evaluator gets called. Otherwise we'll fetch all the data before we
      // actually need it.
      var baseInfoPromise = function() {
        return DatasetDataService.getBaseInfo(self.id).then(function(blob) {
          var errors = JJV.validate('datasetMetadata', blob);
          if (errors) {
            throw new Error('Dataset metadata deserialization failed: ' + JSON.stringify(errors) + JSON.stringify(blob));
          }
          return blob;
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

      self.defineObservableProperty('pages', {}, function() {
        return baseInfoPromise().then(function(data) {
          return _.transform(data.pages, function(res, ids, source) {
            res[source] = _.map(ids, function(id) {
              return new Page(id);
            });
          })
        });
      });
    }
  });

  return Dataset;
});
