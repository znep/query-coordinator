// This model is intended to be an immutable reference to a Dataset.
angular.module('dataCards.models').factory('Dataset', function(ModelHelper, DatasetDataService, JJV, $injector) {
  var UID_REGEXP = /^\w{4}-\w{4}$/;

  JJV.addSchema('datasetPageList', {
    'type': 'object',
    'properties': {
      'publisher': { 'type': 'array', 'items': { 'type': 'string', 'pattern': UID_REGEXP } },
      'user': { 'type': 'array', 'items': { 'type': 'string', 'pattern': UID_REGEXP } }
    }
  });

  JJV.addSchema('datasetMetadata', {
    'type': 'object',
    'properties': {
      'id': { 'type': 'string', 'pattern': UID_REGEXP },
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
              'enum': [ 'category', 'amount', 'location', 'time', 'text', 'name', 'identifier' ]
            },
            'physicalDatatype': {
              'type': 'string',
              'enum': [ 'number', 'point', 'geo entity', 'text', 'timestamp' ]
            },
            'importance': { 'type': 'integer' , 'minimum': 1, 'maximum': 4 },
            'columnDisplayUnit': { 'type': 'string' }
          },
          'required': [ 'title', 'logicalDatatype', 'physicalDatatype', 'importance' ]
        }
      }
    },
    'required': [ 'id', 'rowDisplayUnit', 'defaultAggregateColumn', 'ownerId', 'updatedAt', 'columns' ]
  });

  //TODO cache instances or share cache.
  function Dataset(id) {
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
          throw new Error('Dataset metadata deserialization failed: ' + JSON.stringify(errors));
        }
        return blob;
      }).then(function(blob) {
        blob.updatedAt = new Date(blob.updatedAt);
        return blob;
      });
    };

    var pageIdsPromise = function() {
      return DatasetDataService.getPageIds(self.id).then(function(blob) {
        var errors = JJV.validate('datasetPageList', blob);
        if (errors) {
          throw new Error('Page List deserialization failed: ' + JSON.stringify(errors));
        }
        return blob;
      });
    };

    var fields = ['title', 'rowDisplayUnit', 'defaultAggregateColumn', 'domain', 'ownerId', 'updatedAt'];
    _.each(fields, function(field) {
      ModelHelper.addReadOnlyPropertyWithLazyDefault(field, self, function() {
        return baseInfoPromise().then(_.property(field));
      });
    });

    ModelHelper.addReadOnlyPropertyWithLazyDefault('columns', self, function() {
      // Columns are provided as an array of objects.
      // For ease of use, transform it into an object where
      // the keys are the column names.
      return baseInfoPromise().then(function(data) {
        return _.reduce(data.columns, function(acc, column) {
          acc[column.name] = column;
          return acc;
        }, {});
      });
    });

    ModelHelper.addReadOnlyPropertyWithLazyDefault('pages', self, function() {
      return pageIdsPromise().then(function(pagesBySource) {
        return _.transform(pagesBySource, function(res, ids, source) {
          res[source] = _.map(ids, function(id) {
            return new Page(id);
          });
        })
      });
    });
  };

  return Dataset;
});
