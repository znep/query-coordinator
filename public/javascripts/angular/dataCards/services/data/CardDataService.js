angular.module('dataCards.services').factory('CardDataService', function($q) {

  return {
    getData: function(fieldName) {
      var obj = {};
      var a = [];
      for (var i = 0; i < 32; i++) {
        a.push(Math.floor(Math.random() * 100));
      }
      obj[fieldName] = a.sort(function(a, b) {
        return a + 0 < b + 0 ? 1 : -1;
      });
      return $q.when(obj);
    },

    getFilteredData: function(fieldName) {
      var obj = {};
      var a = [];
      for (var i = 0; i < 32; i++) {
        a.push(Math.floor(Math.random() * 50));
      }
      obj[fieldName] = a.sort(function(a, b) {
        return a + 0 < b + 0 ? 1 : -1;
      });
      return $q.when(obj);
    }
  };

});
