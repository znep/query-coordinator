angular.module('dataCards.services').factory('PageDataService', function($q) {
  //TODO this is an artificial separation to exercise our thinking
  //around deferred data. This may or may not be how the API exposes
  //this info. We should think about splitting the data along expected
  //latency boundaries.
  // TODO safely cache promises for IDs so we don't do requests unnecessarily.
  var staticInfoBlobPromise = $q.when({
    "dataset_id": "bead-beds",
    "name": "I am the primat",
    "description": "Frist psot!",
    "layoutMode": "single card focused view state",
    "primaryAmountField": "ward",
    "primaryAggregation": "count"
  });

  var filterBlobPromise = $q.when({
    "filter": {
      "ward": { "equals": "crime land" },
      "crime_time": { "between": [ "01-01-2010 00:00:00", "12-31-2010 23:59:59" ] }
    }
  });

  var cardsBlobPromise = $q.when({
    "cards": [
      {
        "description": "I am a fancy card",
        "fieldName": "crime_type",
        "importance": 1,
        "cardCustomStyle": { "barColor": "#659CEF" },
        "expandedCustomStyle": { "zebraStripeRows" : true } ,
        "displayMode": "figures",
        "expanded": true
      }, 
      {
        "description": "I am a superfancy card",
        "fieldName": "ward",
        "importance": 2,
        "cardCustomStyle": {
          "choroplethBreaks": { 
            "1-100": "#659CEF", 
            "101-200": "#65EF9C", 
            "201-300": "#9C65EF" 
          } 
        },
        "expandedCustomStyle": { "zebraStripeRows" : false },
        "displayMode": "visualization",
        "expanded": false
      }
    ]
  });

  return {
    getStaticInfo: function(id) {
      return staticInfoBlobPromise.then(function(blob) {
        return $.extend({}, blob, {'page_id': id });
      })
    },
    getFilters: function(id) { return filtersBlobPromise; },
    getCards: function(id) { return cardsBlobPromise; }
  };
});
