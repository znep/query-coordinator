angular.module('dataCards.services').factory('PageDataService', function($q) {
  //TODO this is an artificial separation to exercise our thinking
  //around deferred data. This may or may not be how the API exposes
  //this info. We should think about splitting the data along expected
  //latency boundaries.
  // TODO safely cache promises for IDs so we don't do requests unnecessarily.
  var staticInfoBlobPromise = $q.when({
    "datasetId": "bead-beds",
    "name": "I am the primat",
    "description": "Frist psot!",
    "layoutMode": "single card focused view state",
    "primaryAmountField": "fine_amount",
    "primaryAggregation": "sum",
    "isDefaultPage": false,
    "pageSource": "publisher"
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
        "cardSize": 1,
        "cardCustomStyle": { "barColor": "#659CEF" },
        "expandedCustomStyle": { "zebraStripeRows" : true } ,
        "displayMode": "figures",
        "expanded": true
      }, 
      {
        "description": "I am a superfancy card",
        "fieldName": "ward",
        "cardSize": 2,
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
      // Since we're reusing the same fake blob for every Page instance,
      // we need to patch in the correct ID before we return the fake blob
      // to the consumer.
      return staticInfoBlobPromise.then(function(blob) {
        return $.extend({}, blob, {'page_id': id });
      })
    },
    getFilters: function(id) { return filtersBlobPromise; },
    getCards: function(id) { return cardsBlobPromise; }
  };
});
