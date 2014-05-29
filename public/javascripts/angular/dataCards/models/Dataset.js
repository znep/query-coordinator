// This model is intended to be an immutable reference to a Dataset.
angular.module('dataCards.models').factory('Dataset', function(ModelHelper, DatasetDataService, JJV, $injector) {
  var UID_REGEXP = /^\w{4}-\w{4}$/;

  JJV.addSchema('datasetPageList', {
    type: 'object',
    properties: {
      publisher: { type: 'array', items: { type: 'string', pattern: UID_REGEXP } },
      user: { type: 'array', items: { type: 'string', pattern: UID_REGEXP } }
    }
  });

  JJV.addSchema('datasetMetadata', {
    type: 'object',
    properties: {
      id: { type: 'string', pattern: UID_REGEXP },
      rowDisplayUnit: { type: 'string', minLength: 1},
      defaultAggregateColumn: { type: 'string', minLength: 1},
      owner: { type: 'string', pattern: UID_REGEXP },
      updatedAt: { type: 'string' }, //TODO ISO8601
      columns: {
        type: 'object',
        patternProperties: {
          '\\w+': {
            type: 'object',
          properties: {
            logicalDatatype: {
              type: 'string',
              enum: [ 'category', 'amount', 'location', 'time', 'text', 'name', 'identifier' ]
            },
            physicalDatatype: {
              type: 'string',
              enum: [ 'number', 'point', 'geo entity', 'text', 'timestamp' ]
            },
            importance: { type: 'integer' , minimum: 1, maximum: 4},
            columnDisplayUnit: { type: 'string' }
          },
          required: [ 'logicalDatatype', 'physicalDatatype', 'importance' ]
          }
        }
      }
    },
    required: [ 'id', 'rowDisplayUnit', 'defaultAggregateColumn', 'owner', 'updatedAt', 'columns' ]
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
    var staticDataPromise = function() {
      return DatasetDataService.getStaticInfo(self.id).then(function(blob) {
        var errors = JJV.validate('datasetMetadata', blob, {removeAdditional: true});
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
        var errors = JJV.validate('datasetPageList', blob, {removeAdditional: true});
        if (errors) {
          throw new Error('Page List deserialization failed: ' + JSON.stringify(errors));
        }
        return blob;
      });
    };

    //TODO Columns may need to also be observable properties. Maybe.
    var fields = ["rowDisplayUnit", "defaultAggregateColumn", "domain", "owner", "updatedAt", "columns"];
    _.each(fields, function(field) {
      ModelHelper.addReadOnlyPropertyWithLazyDefault(field, self, function() {
        return staticDataPromise().then(_.property(field));
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
