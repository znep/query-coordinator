angular.module('dataCards.models').factory('Card', function($injector, ModelHelper, Model, CardDataService, JJV, Filter, CardTypeMapping) {

  var UID_REGEXP = /^\w{4}-\w{4}$/;

  JJV.addSchema('serializedCard', {
    'type': 'object',
    'properties': {
      'activeFilters': { 'type': 'array' },
      'baseLayerUrl': { 'type': 'string' },
      'cardCustomStyle': { 'type': 'object' },
      'cardSize': { 'type': 'integer' , 'minimum': 1, 'maximum': 4 },
      'cardType': { 'type': 'string', },
      'displayMode': { 'type': 'string', 'enum': ['figures', 'visualization'] },
      'expanded': { 'type': 'boolean' },
      'expandedCustomStyle': { 'type': 'object' },
      'fieldName': { 'type': 'string', 'minLength': 1 },
      'shapefileFeatureHumanReadablePropertyName': { 'type': 'string' }
    },
    'required': ['fieldName', 'cardSize', 'cardCustomStyle', 'expandedCustomStyle', 'displayMode', 'expanded']
  });

  var Card = Model.extend({
    init: function(parentPageModel, fieldName, id) {
      this._super();

      if(!(parentPageModel instanceof Model)) { throw new Error('Cards must have parent Page models.'); }
      if(!_.isString(fieldName) || _.isEmpty(fieldName)) { throw new Error('Cards must have a non-empty field name.'); }

      var self = this;
      this.page = parentPageModel;
      this.fieldName = fieldName;
      this.uniqueId = id || _.uniqueId();

      _.each(_.keys(JJV.schema.serializedCard.properties), function(field) {
        if (field === 'fieldName') return; // fieldName isn't observable.
        if (field === 'cardType') return; // cardType needs a lazy default.
        self.defineObservableProperty(field);
      });

      self.set('activeFilters', []);

      // To compute default cardType, we need column info.
      // Usually the default is overridden during deserialization, but
      // in case cardType isn't set, we have a sane default.
      self.defineObservableProperty('cardType', undefined, function() {
        return self.page.observe('dataset').filter(_.isPresent).observeOnLatest('columns').filter(_.isPresent).first().map(
          function(columns) {
            var column = columns[fieldName];
            var defaultCardType = CardTypeMapping.defaultVisualizationForColumn(column);
            return defaultCardType;
          }
        ).toPromise(Promise);
      });
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

  Card.deserialize = function(page, blob, id) {
    validateCardBlobSchema(blob);

    var instance = new Card(page, blob.fieldName, id);
    _.each(_.keys(JJV.schema.serializedCard.properties), function(field) {
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

  function validateCardBlobSchema(blob) {
    var errors = JJV.validate('serializedCard', blob);
    if (errors) {
      throw new Error('Card deserialization failed: ' + JSON.stringify(errors));
    }
  }

  return Card;
});
