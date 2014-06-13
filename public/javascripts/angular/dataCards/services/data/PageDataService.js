angular.module('dataCards.services').factory('PageDataService', function($q) {
  //TODO this is an artificial separation to exercise our thinking
  //around deferred data. This may or may not be how the API exposes
  //this info. We should think about splitting the data along expected
  //latency boundaries.
  // TODO safely cache promises for IDs so we don't do requests unnecessarily.
  var staticInfoBlobPromise = $q.when({
    'datasetId': 'bead-beds',
    'name': 'I am the primat I am the primat I am the primat I am the primat I am the primat I am the primat I am the primat fin',
    'description': 'Frist psot!',
    'layoutMode': 'single card focused view state',
    'primaryAmountField': 'fine_amount',
    'primaryAggregation': 'sum',
    'isDefaultPage': false,
    'pageSource': 'publisher'
  });

  var filtersBlobPromise = $q.when({
    'filter': {
      'ward': { 'equals': 'crime land' },
      'crime_time': { 'between': [ '01-01-2010 00:00:00', '12-31-2010 23:59:59' ] }
    }
  });

  function genMockCard(field, size) {
    return {
        "description": "I am a fancy card",
        "fieldName": field,
        "cardSize": size,
        "cardCustomStyle": {},
        "expandedCustomStyle": {} ,
        "displayMode": "figures",
        "expanded": false
      };
  };
  var cardsBlobPromise = $q.when({
    "cards": [
      genMockCard('crime_type', 1),
      genMockCard('number_of_arrests', 2),
      genMockCard('crime_time', 2),
      genMockCard('ward', 3)
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
