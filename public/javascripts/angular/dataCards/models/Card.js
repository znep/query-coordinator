angular.module('dataCards.models').factory('Card', function($injector, ModelHelper, CardDataService, JJV) {
  JJV.addSchema('serializedCard', {
    type: 'object',
    properties: {
      description: { type: 'string' },
      fieldName: { type: 'string', minLength: 1},
      cardSize: { type: 'integer' , minimum: 1, maximum: 3},
      displayMode: { type: 'string', enum: ['figures', 'visualization'] },
      expanded: { type: 'boolean' },
      cardCustomStyle: { type: 'object' },
      expandedCustomStyle: { type: 'object' }
    },
    required: ['description', 'fieldName', 'cardSize', 'cardCustomStyle', 'expandedCustomStyle', 'displayMode', 'expanded']
  });

  function Card(page, fieldName) {
    var Page = $injector.get('Page'); // Inject Page here to avoid circular dep.
    if(!(page instanceof Page)) { throw new Error('Cards must have parent Page models.'); }
    if(!_.isString(fieldName) || _.isEmpty(fieldName)) { throw new Error('Cards must have a non-empty field name.'); }

    var self = this;
    this.page = page;
    this.fieldName = fieldName;

    _.each(_.keys(JJV.schema.serializedCard.properties), function(field) {
      if (field === 'fieldName') return; // fieldName isn't observable.
      ModelHelper.addProperty(field, self);
    });

    ModelHelper.addReadOnlyPropertyWithLazyDefault('data', this, function() {
      return CardDataService.getData(self.fieldName);
    });
  };

  Card.deserialize = function(page, blob) {
    var errors = JJV.validate('serializedCard', blob, {removeAdditional: true});
    if (errors) {
      throw new Error('Card deserialization failed: ' + JSON.stringify(errors));
    }

    var instance = new Card(page, blob.fieldName);
    $.extend(instance, blob);

    return instance;
  };

  return Card;
});
