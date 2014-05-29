angular.module('dataCards.models').factory('Card', function(ModelHelper) {
  // List of field names which are serializable.
  var serializedFields = ['description', 'fieldName', 'importance', 'cardCustomStyle', 'expandedCustomStyle', 'displayMode', 'expanded'];

  function Card() {
    var self = this;
    _.each(serializedFields, function(field) {
      ModelHelper.addProperty(field, self);
    });
  };

  Card.deserialize = function(blob) {
    var instance = new Card();
    _.each(serializedFields, function(field) {
      instance[field] = blob[field];
    });
    return instance;
  };

  Card._serializedFields = serializedFields; // Enable testing.

  return Card;
});
