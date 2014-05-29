angular.module('dataCards.services').factory('CardDataService', function($q) {

  return {
    getData: function(fieldName) {
      var obj = {};
      obj[fieldName] = [1,2,3,4,5];
      return $q.when(obj);
    }
  };
});
