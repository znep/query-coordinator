angular.module('dataCards.models').factory('Card', function($injector, ModelHelper, CardDataService) {
  // List of field names which are serializable.
  var serializedFields = ['description', 'fieldName', 'importance', 'cardCustomStyle', 'expandedCustomStyle', 'displayMode', 'expanded'];

  function Card(page, fieldName) {
    var Page = $injector.get('Page'); // Inject Page here to avoid circular dep.
    if(!(page instanceof Page)) { throw new Error('Cards must have parent Page models.'); }
    if(!_.isString(fieldName) || _.isEmpty(fieldName)) { throw new Error('Cards must have a non-empty field name.'); }

    var self = this;
    this.page = page;
    this.fieldName = fieldName;

    var cardsPromise = function() { return CardDataService.getData(self.fieldName); };

    _.each(serializedFields, function(field) {
      if (field === 'fieldName') return; // fieldName isn't observable.
      ModelHelper.addProperty(field, self);
    });

    ModelHelper.addReadOnlyPropertyWithLazyDefault('data', this, function() {
      return cardsPromise();
    });
  };

  Card.deserialize = function(page, blob) {
    //TODO verify cleanliness.
    var instance = new Card(page, blob.fieldName);
    _.each(serializedFields, function(field) {
      instance[field] = blob[field];
    });
    return instance;
  };

  Card._serializedFields = serializedFields; // Enable testing.

  return Card;
});
