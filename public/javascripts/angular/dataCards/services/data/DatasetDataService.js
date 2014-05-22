angular.module('dataCards.services').factory('DatasetDataService', function($q) {
  //TODO this is an artificial separation to exercise our thinking
  //around deferred data. This may or may not be how the API exposes
  //this info. We should think about splitting the data along expected
  //latency boundaries.
  // TODO safely cache promises for IDs so we don't do requests unnecessarily.
  var staticInfoBlobPromise = $q.when({
    "whatIsARow": "crime",                              // the fundamental item that a row represents
    "primaryRowQuantity": "number_of_crimes",           // ask Clint why we need this...
    "domain": "data.marciship.com",                     // could be important during federation 
    "owner": "4x4",                                     // this will be resolved on the FE (s/b cached)
    "updatedAt": new Date("2014-05-20T17:42:55+00:00"), // This is ISO8601
    "rowCount": 31415,
    "columns": {
      "ward": {
        "logicalDatatype": "location",
        "physicalDatatype": "text",
        "importance": 1
      },
      "crime_type": {
        "logicalDatatype": "category",
      "physicalDatatype": "text",
      "importance": 1
      },
      "crime_time": {
        "logicalDatatype": "time",
      "physicalDatatype": "timestamp",
      "importance": 0
      },
      "number_of_arrests": {
        "logicalDatatype": "amount",
        "physicalDatatype": "number",
        "importance": 2,
        "unit": "arrest"
      }
    }
  });

  return {
    getStaticInfo: function(id) {
      return staticInfoBlobPromise.then(function(blob) {
        return $.extend({}, blob, {'id': id });
      })
    },
    getPageIds: function(id) {
      return $q.when({
        'user': _.times(10, function(idx) {
          return _.uniqueId('fakeUserPageId');
        }),
        'publisher': _.times(20, function(idx) {
          return _.uniqueId('fakePublisherPageId');
        })
      });
    }
  };
});
