angular.module('dataCards.models').factory('Card', function($injector, ModelHelper, Model, CardDataService, JJV, Filter) {

  var UID_REGEXP = /^\w{4}-\w{4}$/;

  JJV.addSchema('serializedCard', {
    'type': 'object',
    'properties': {
      'fieldName': { 'type': 'string', 'minLength': 1 },
      'shapeFile': { 'type': 'string', 'pattern': UID_REGEXP },
      'baseLayerUrl': { 'type': 'string' },
      'cardSize': { 'type': 'integer' , 'minimum': 1, 'maximum': 4 },
      'displayMode': { 'type': 'string', 'enum': ['figures', 'visualization'] },
      'expanded': { 'type': 'boolean' },
      'cardCustomStyle': { 'type': 'object' },
      'expandedCustomStyle': { 'type': 'object' },
      'activeFilters': { 'type': 'array' }

    },
    'required': ['fieldName', 'cardSize', 'cardCustomStyle', 'expandedCustomStyle', 'displayMode', 'expanded']
  });

  function Card(page, fieldName) {
    Model.call(this);
    var Page = $injector.get('Page'); // Inject Page here to avoid circular dep.
    if(!(page instanceof Page)) { throw new Error('Cards must have parent Page models.'); }
    if(!_.isString(fieldName) || _.isEmpty(fieldName)) { throw new Error('Cards must have a non-empty field name.'); }

    var self = this;
    this.page = page;
    this.fieldName = fieldName;
    this.uniqueId = _.uniqueId();

    _.each(_.keys(JJV.schema.serializedCard.properties), function(field) {
      if (field === 'fieldName') return; // fieldName isn't observable.
      self.defineObservableProperty(field);
    });

    self.set('activeFilters', []);
  }

  Model.extend(Card);

  Card.prototype.serialize = function() {
    var serialized = Model.prototype.serialize.call(this);
    serialized.fieldName = this.fieldName;
    return serialized;
  };

  Card.deserialize = function(page, blob) {
    var errors = JJV.validate('serializedCard', blob);
    if (errors) {
      throw new Error('Card deserialization failed: ' + JSON.stringify(errors));
    }

    var instance = new Card(page, blob.fieldName);
    _.each(_.keys(JJV.schema.serializedCard.properties), function(field) {
      if (field === 'fieldName') return; // fieldName isn't observable.
      if (field === 'activeFilters') {
        // activeFilters needs a bit more deserialization
        instance.set(field, _.map(blob[field], Filter.deserialize));
      } else {
        instance.set(field, blob[field]);
      }
    });

    return instance;
  };

  return Card;
});
