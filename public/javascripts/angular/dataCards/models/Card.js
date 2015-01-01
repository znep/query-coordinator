angular.module('dataCards.models').factory('Card', function($injector, ModelHelper, Model, CardDataService, CardTypeMapping, Schemas, Filter) {

  var UID_REGEXP = /^\w{4}-\w{4}$/;

  var schemas = Schemas.regarding('card_metadata');
  schemas.addSchemaWithVersion(
    '0',
    {
      'type': 'object',
      'properties': {
        'activeFilters': { 'type': 'array' },
        'baseLayerUrl': { 'type': 'string' },
        'cardCustomStyle': { 'type': 'object' },
        'cardSize': { 'type': 'integer' , 'minimum': 1, 'maximum': 4 },
        'cardType': { 'type': 'string' },
        'displayMode': { 'type': 'string', 'enum': [ 'figures', 'visualization' ] },
        'expanded': { 'type': 'boolean' },
        'expandedCustomStyle': { 'type': 'object' },
        'fieldName': { 'type': 'string', 'minLength': 1 },
        'shapefileFeatureHumanReadablePropertyName': { 'type': 'string' }
      },
      'required': ['fieldName', 'cardSize', 'cardCustomStyle', 'expandedCustomStyle', 'displayMode', 'expanded']
    }
  );

  schemas.addSchemaWithVersion(
    '0.1',
    {
      'type': 'object',
      'properties': {
        'activeFilters': { 'type': 'array' },
        'baseLayerUrl': { 'type': 'string' },
        'cardCustomStyle': { 'type': 'object' },
        'cardSize': { 'type': 'integer' , 'minimum': 1, 'maximum': 4 },
        'cardType': { 'type': 'string', 'enum': [ 'table', 'timeline', 'column', 'search', 'choropleth', 'feature', 'numberHistogram' ]},
        'displayMode': { 'type': 'string', 'enum': [ 'figures', 'visualization' ] },
        'expanded': { 'type': 'boolean' },
        'expandedCustomStyle': { 'type': 'object' },
        'fieldName': { 'type': 'string', 'minLength': 1 },
        'shapefileFeatureHumanReadablePropertyName': { 'type': 'string' }
      },
      'required': ['fieldName', 'cardSize', 'cardType', 'cardCustomStyle', 'expandedCustomStyle', 'displayMode', 'expanded']
    }
  );

  var Card = Model.extend({
    init: function(parentPageModel, fieldName, id) {
      this._super();

      if(!(parentPageModel instanceof Model)) { throw new Error('Cards must have parent Page models.'); }
      if(!_.isString(fieldName) || _.isEmpty(fieldName)) { throw new Error('Cards must have a non-empty field name.'); }

      var self = this;
      this.page = parentPageModel;
      this.fieldName = fieldName;
      this.uniqueId = id || _.uniqueId();

      _.each(_.keys(schemas.getSchemaWithVersion('0.1').properties), function(field) {
        if (field === 'fieldName') return; // fieldName isn't observable.
        self.defineObservableProperty(field);
      });

      self.set('activeFilters', []);
    },

    /**
     * Creates a clone of this Card, including its id and everything.
     *
     * Useful for modifying the card's contents without committing them.
     */
    clone: function() {
      return Card.deserialize(this.page, this.serialize(), this.uniqueId);
    },

    serialize: function() {
      var serialized = this._super();
      serialized.fieldName = this.fieldName;
      validateCardBlobSchema(serialized);
      return serialized;
    }
  });

  Card.deserialize = function(page, columns, blob, id) {
    blob = coerceBlobToLatestSchema(blob, page, columns);

    var instance = new Card(page, blob.fieldName, id);
    _.each(_.keys(schemas.getSchemaWithVersion('0.1').properties), function(field) {
      if (field === 'fieldName') return; // fieldName isn't observable.
      if (field === 'activeFilters') {
        // activeFilters needs a bit more deserialization
        instance.set(field, _.map(blob[field], Filter.deserialize));
      } else if (_.isDefined(blob[field])){
        instance.set(field, blob[field]);
      }
    });

    return instance;
  };


  // So we only maintain one parsing codepath, coerce an incoming metadata blob to conform to the latest version,
  // choosing defaults on a best-effort basis.
  function coerceBlobToLatestSchema(blob, page, columns) {
    if (schemas.isValidAgainstVersion('0.1', blob)) {
      return blob;
    } else if (schemas.isValidAgainstVersion('0', blob)) {
      return convertV0BlobToV0_1Blob(blob, page, columns);
    } else {
      var validationErrors = schemas.getValidationErrorsAgainstVersion('0.1', blob);
      throw new Error('Card metadata deserialization failed: ' + JSON.stringify(validationErrors) + JSON.stringify(blob));
    }
  }

  function convertV0BlobToV0_1Blob(v0Blob, page, columns) {
      var converted = _.cloneDeep(v0Blob);

      var column = columns[v0Blob.fieldName];
      converted.cardType = CardTypeMapping.defaultVisualizationForColumn(column);
      console.log(v0Blob.fieldName, converted.cardType);

      if (!schemas.isValidAgainstVersion('0.1', converted)) {
        throw new Error('Conversion of card metadata blob from schema 0 to 0.1 failed to validate: ' + JSON.stringify(converted));
      } else {
        return converted;
      }
  };

  function validateCardBlobSchema(blob) {
    var errors = schemas.getValidationErrorsAgainstVersion('0.1', blob);
    if (errors) {
      throw new Error('Card deserialization failed: ' + JSON.stringify(errors));
    }
  }

  return Card;
});
