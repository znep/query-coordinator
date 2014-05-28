angular.module('dataCards.models').factory('Card', function() {
  function Card(id) {
    this.id = id;
  };

  return Card;
});
