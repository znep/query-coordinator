(function() {
  'use strict';

  var CARD_TYPE_MAPPING = {
    "amount": {
      "boolean": { "lowCardinalityDefault": null, "highCardinalityDefault": null, "available": [] },
      "fixed_timestamp": { "lowCardinalityDefault": null, "highCardinalityDefault": null, "available": [] },
      "floating_timestamp": { "lowCardinalityDefault": null, "highCardinalityDefault": null, "available": [] },
      "geo_entity": { "lowCardinalityDefault": null, "highCardinalityDefault": null, "available": [] },
      "money": { "lowCardinalityDefault": null, "highCardinalityDefault": null, "available": [] },
      "number": { "lowCardinalityDefault": null, "highCardinalityDefault": null, "available": [] },
      "point": { "lowCardinalityDefault": null, "highCardinalityDefault": null, "available": [] },
      "text": { "lowCardinalityDefault": null, "highCardinalityDefault": null, "available": [] },
      "timestamp": { "lowCardinalityDefault": null, "highCardinalityDefault": null, "available": [] },
      "*": { "lowCardinalityDefault": "table", "highCardinalityDefault": "table", "available": ["table"] }
    },
    "category": {
      "boolean": { "lowCardinalityDefault": "column", "highCardinalityDefault": "column", "available": ["column"] },
      "fixed_timestamp": { "lowCardinalityDefault": "column", "highCardinalityDefault": "column", "available": ["column"] },
      "floating_timestamp": { "lowCardinalityDefault": "column", "highCardinalityDefault": "column", "available": ["column"] },
      "geo_entity": { "lowCardinalityDefault": null, "highCardinalityDefault": null, "available": [] },
      "money": { "lowCardinalityDefault": "column", "highCardinalityDefault": "column", "available": ["column"] },
      "number": { "lowCardinalityDefault": "column", "highCardinalityDefault": "search", "available": ["column", "search"] },
      "point": { "lowCardinalityDefault": null, "highCardinalityDefault": null, "available": [] },
      "text": { "lowCardinalityDefault": "column", "highCardinalityDefault": "search", "available": ["column", "search"] },
      "timestamp": { "lowCardinalityDefault": "column", "highCardinalityDefault": "column", "available": ["column"] },
      "*": { "lowCardinalityDefault": "table", "highCardinalityDefault": "table", "available": ["table"] }
    },
    "identifier": {
      "boolean": { "lowCardinalityDefault": null, "highCardinalityDefault": null, "available": [] },
      "fixed_timestamp": { "lowCardinalityDefault": "timeline", "highCardinalityDefault": "timeline", "available": ["timeline"] },
      "floating_timestamp": { "lowCardinalityDefault": "timeline", "highCardinalityDefault": "timeline", "available": ["timeline"] },
      "geo_entity": { "lowCardinalityDefault": null, "highCardinalityDefault": null, "available": [] },
      "money": { "lowCardinalityDefault": "search", "highCardinalityDefault": "search", "available": ["search"] },
      "number": { "lowCardinalityDefault": "search", "highCardinalityDefault": "search", "available": ["column", "search"] },
      "point": { "lowCardinalityDefault": null, "highCardinalityDefault": null, "available": [] },
      "text": { "lowCardinalityDefault": "search", "highCardinalityDefault": "search", "available": ["column", "search"] },
      "timestamp": { "lowCardinalityDefault": "timeline", "highCardinalityDefault": "timeline", "available": ["timeline"] },
      "*": { "lowCardinalityDefault": "table", "highCardinalityDefault": "table", "available": ["table"] }
    },
    "location": {
      "boolean": { "lowCardinalityDefault": null, "highCardinalityDefault": null, "available": [] },
      "fixed_timestamp": { "lowCardinalityDefault": null, "highCardinalityDefault": null, "available": [] },
      "floating_timestamp": { "lowCardinalityDefault": null, "highCardinalityDefault": null, "available": [] },
      "geo_entity": { "lowCardinalityDefault": null, "highCardinalityDefault": null, "available": [] },
      "money": { "lowCardinalityDefault": null, "highCardinalityDefault": null, "available": [] },
      "number": { "lowCardinalityDefault": "choropleth", "highCardinalityDefault": "choropleth", "available": ["choropleth"] },
      "point": { "lowCardinalityDefault": "feature", "highCardinalityDefault": "feature", "available": ["feature"] },
      "text": { "lowCardinalityDefault": null, "highCardinalityDefault": null, "available": [] },
      "timestamp": { "lowCardinalityDefault": null, "highCardinalityDefault": null, "available": [] },
      "*": { "lowCardinalityDefault": "table", "highCardinalityDefault": "table", "available": ["table"] }
    },
    "name": {
      "boolean": { "lowCardinalityDefault": null, "highCardinalityDefault": null, "available": [] },
      "fixed_timestamp": { "lowCardinalityDefault": "timeline", "highCardinalityDefault": "timeline", "available": ["timeline"] },
      "floating_timestamp": { "lowCardinalityDefault": "timeline", "highCardinalityDefault": "timeline", "available": ["timeline"] },
      "geo_entity": { "lowCardinalityDefault": null, "highCardinalityDefault": null, "available": [] },
      "money": { "lowCardinalityDefault": "search", "highCardinalityDefault": "search", "available": ["search"] },
      "number": { "lowCardinalityDefault": "search", "highCardinalityDefault": "search", "available": ["column", "search"] },
      "point": { "lowCardinalityDefault": null, "highCardinalityDefault": null, "available": [] },
      "text": { "lowCardinalityDefault": "search", "highCardinalityDefault": "search", "available": ["column", "search"] },
      "timestamp": { "lowCardinalityDefault": "timeline", "highCardinalityDefault": "timeline", "available": ["timeline"] },
      "*": { "lowCardinalityDefault": "table", "highCardinalityDefault": "table", "available": ["table"] }
    },
    "text": {
      "boolean": { "lowCardinalityDefault": null, "highCardinalityDefault": null, "available": [] },
      "fixed_timestamp": { "lowCardinalityDefault": "timeline", "highCardinalityDefault": "timeline", "available": ["timeline"] },
      "floating_timestamp": { "lowCardinalityDefault": "timeline", "highCardinalityDefault": "timeline", "available": ["timeline"] },
      "geo_entity": { "lowCardinalityDefault": null, "highCardinalityDefault": null, "available": [] },
      "money": { "lowCardinalityDefault": "search", "highCardinalityDefault": "search", "available": ["search"] },
      "number": { "lowCardinalityDefault": "search", "highCardinalityDefault": "search", "available": ["column", "search"] },
      "point": { "lowCardinalityDefault": null, "highCardinalityDefault": null, "available": [] },
      "text": { "lowCardinalityDefault": "search", "highCardinalityDefault": "search", "available": ["column", "search"] },
      "timestamp": { "lowCardinalityDefault": "timeline", "highCardinalityDefault": "timeline", "available": ["timeline"] },
      "*": { "lowCardinalityDefault": "table", "highCardinalityDefault": "table", "available": ["table"] }
    },
    "time": {
      "boolean": { "lowCardinalityDefault": null, "highCardinalityDefault": null, "available": [] },
      "fixed_timestamp": { "lowCardinalityDefault": "timeline", "highCardinalityDefault": "timeline", "available": ["timeline"] },
      "floating_timestamp": { "lowCardinalityDefault": "timeline", "highCardinalityDefault": "timeline", "available": ["timeline"] },
      "geo_entity": { "lowCardinalityDefault": null, "highCardinalityDefault": null, "available": [] },
      "money": { "lowCardinalityDefault": "timeline", "highCardinalityDefault": "timeline", "available": ["timeline"] },
      "number": { "lowCardinalityDefault": "timeline", "highCardinalityDefault": "timeline", "available": ["timeline"] },
      "point": { "lowCardinalityDefault": null, "highCardinalityDefault": null, "available": [] },
      "text": { "lowCardinalityDefault": null, "highCardinalityDefault": null, "available": [] },
      "timestamp": { "lowCardinalityDefault": "timeline", "highCardinalityDefault": "timeline", "available": ["timeline"] },
      "*": { "lowCardinalityDefault": "table", "highCardinalityDefault": "table", "available": ["table"] }
    },
    "*": {
      "boolean": { "lowCardinalityDefault": null, "highCardinalityDefault": null, "available": [] },
      "fixed_timestamp": { "lowCardinalityDefault": null, "highCardinalityDefault": null, "available": [] },
      "floating_timestamp": { "lowCardinalityDefault": null, "highCardinalityDefault": null, "available": [] },
      "geo_entity": { "lowCardinalityDefault": null, "highCardinalityDefault": null, "available": [] },
      "money": { "lowCardinalityDefault": null, "highCardinalityDefault": null, "available": [] },
      "number": { "lowCardinalityDefault": null, "highCardinalityDefault": null, "available": [] },
      "point": { "lowCardinalityDefault": null, "highCardinalityDefault": null, "available": [] },
      "text": { "lowCardinalityDefault": null, "highCardinalityDefault": null, "available": [] },
      "timestamp": { "lowCardinalityDefault": null, "highCardinalityDefault": null, "available": [] },
      "*": { "lowCardinalityDefault": "table", "highCardinalityDefault": "table", "available": ["table"] }
    },
    ":version": "0.2"
  };

  angular.module('test').factory('serverMocks', function() {
    return {
      CARD_TYPE_MAPPING: CARD_TYPE_MAPPING
    };
  });
})();

