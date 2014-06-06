angular.module('dataCards.services').factory('CardDataService', function($q) {

  var count = 80;
  var names = [];
  for (var i = 0 ; i < count; i++) {
    names.push(_.shuffle('baeiouqrt').join(''));
  }

  return {
    getData: function(fieldName) {
      var obj = {};
      var a = [];
      for (var i = 0; i < count; i++) {
        var datum = {};
        datum["name"] = names[i];
        datum["value"] = Math.floor(Math.random() * 100);
        a.push(datum);
      }
      obj[fieldName] = a.sort(function(a, b) {
        return a.value + 0 < b.value + 0 ? 1 : -1;
      });
      return $q.when(obj);
    },

    getFilteredData: function(fieldName) {
      var obj = {};
      var a = [];
      for (var i = 0; i < count; i++) {
        var datum = {};
        datum["name"] = names[i];
        datum["value"] = Math.floor(Math.random() * 50);
        a.push(datum);
      }
      obj[fieldName] = a.sort(function(a, b) {
        return a.value + 0 < b.value + 0 ? 1 : -1;
      });
      return $q.when(obj);
    }
  };

});
