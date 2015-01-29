(function() {
  'use strict';

  // This is just a copy/paste from lib/data/card-type-mapping.json
  var CARD_TYPE_MAPPING = {
    "map": {
      "amount": {
        "*": { "lowCardinalityDefault": "table", "highCardinalityDefault": "table", "available": ["table"] }
      },
      "category": {
        "boolean": { "lowCardinalityDefault": "column", "highCardinalityDefault": "column", "available": ["column"] },
        "fixed_timestamp": { "lowCardinalityDefault": "column", "highCardinalityDefault": "column", "available": ["column"] },
        "floating_timestamp": { "lowCardinalityDefault": "column", "highCardinalityDefault": "column", "available": ["column"] },
        "money": { "lowCardinalityDefault": "column", "highCardinalityDefault": "column", "available": ["column"] },
        "number": { "lowCardinalityDefault": "column", "highCardinalityDefault": "search", "available": ["column", "search"] },
        "text": { "lowCardinalityDefault": "column", "highCardinalityDefault": "search", "available": ["column", "search"] },
        "timestamp": { "lowCardinalityDefault": "column", "highCardinalityDefault": "column", "available": ["column"] },
        "*": { "lowCardinalityDefault": "table", "highCardinalityDefault": "table", "available": ["table"] }
      },
      "identifier": {
        "fixed_timestamp": { "lowCardinalityDefault": "timeline", "highCardinalityDefault": "timeline", "available": ["timeline"] },
        "floating_timestamp": { "lowCardinalityDefault": "timeline", "highCardinalityDefault": "timeline", "available": ["timeline"] },
        "money": { "lowCardinalityDefault": "search", "highCardinalityDefault": "search", "available": ["search"] },
        "number": { "lowCardinalityDefault": "search", "highCardinalityDefault": "search", "available": ["column", "search"] },
        "text": { "lowCardinalityDefault": "search", "highCardinalityDefault": "search", "available": ["column", "search"] },
        "timestamp": { "lowCardinalityDefault": "timeline", "highCardinalityDefault": "timeline", "available": ["timeline"] },
        "*": { "lowCardinalityDefault": "table", "highCardinalityDefault": "table", "available": ["table"] }
      },
      "location": {
        "number": { "lowCardinalityDefault": "choropleth", "highCardinalityDefault": "choropleth", "available": ["choropleth"] },
        "point": { "lowCardinalityDefault": "feature", "highCardinalityDefault": "feature", "available": ["feature"] },
        "*": { "lowCardinalityDefault": "table", "highCardinalityDefault": "table", "available": ["table"] }
      },
      "name": {
        "fixed_timestamp": { "lowCardinalityDefault": "timeline", "highCardinalityDefault": "timeline", "available": ["timeline"] },
        "floating_timestamp": { "lowCardinalityDefault": "timeline", "highCardinalityDefault": "timeline", "available": ["timeline"] },
        "money": { "lowCardinalityDefault": "search", "highCardinalityDefault": "search", "available": ["search"] },
        "number": { "lowCardinalityDefault": "search", "highCardinalityDefault": "search", "available": ["column", "search"] },
        "text": { "lowCardinalityDefault": "search", "highCardinalityDefault": "search", "available": ["column", "search"] },
        "timestamp": { "lowCardinalityDefault": "timeline", "highCardinalityDefault": "timeline", "available": ["timeline"] },
        "*": { "lowCardinalityDefault": "table", "highCardinalityDefault": "table", "available": ["table"] }
      },
      "text": {
        "fixed_timestamp": { "lowCardinalityDefault": "timeline", "highCardinalityDefault": "timeline", "available": ["timeline"] },
        "floating_timestamp": { "lowCardinalityDefault": "timeline", "highCardinalityDefault": "timeline", "available": ["timeline"] },
        "money": { "lowCardinalityDefault": "search", "highCardinalityDefault": "search", "available": ["search"] },
        "number": { "lowCardinalityDefault": "search", "highCardinalityDefault": "search", "available": ["column", "search"] },
        "text": { "lowCardinalityDefault": "search", "highCardinalityDefault": "search", "available": ["column", "search"] },
        "timestamp": { "lowCardinalityDefault": "timeline", "highCardinalityDefault": "timeline", "available": ["timeline"] },
        "*": { "lowCardinalityDefault": "table", "highCardinalityDefault": "table", "available": ["table"] }
      },
      "time": {
        "fixed_timestamp": { "lowCardinalityDefault": "timeline", "highCardinalityDefault": "timeline", "available": ["timeline"] },
        "floating_timestamp": { "lowCardinalityDefault": "timeline", "highCardinalityDefault": "timeline", "available": ["timeline"] },
        "money": { "lowCardinalityDefault": "timeline", "highCardinalityDefault": "timeline", "available": ["timeline"] },
        "number": { "lowCardinalityDefault": "timeline", "highCardinalityDefault": "timeline", "available": ["timeline"] },
        "timestamp": { "lowCardinalityDefault": "timeline", "highCardinalityDefault": "timeline", "available": ["timeline"] },
        "*": { "lowCardinalityDefault": "table", "highCardinalityDefault": "table", "available": ["table"] }
      },
      "*": {
        "*": { "lowCardinalityDefault": "table", "highCardinalityDefault": "table", "available": ["table"] }
      }
    },
    "fallbackCardType": { "lowCardinalityDefault": "invalid", "highCardinalityDefault": "invalid", "available": [] },
    "cardinality": {
      "min": 2,
      "threshold": 35
    },
    ":version": "0.2"
  };

  angular.module('test').factory('serverMocks', function() {
    return {
      CARD_TYPE_MAPPING: CARD_TYPE_MAPPING
    };
  });
})();

