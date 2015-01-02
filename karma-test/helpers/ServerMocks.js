(function() {
  'use strict';

  // This is just a copy/paste from lib/data/card-type-mapping.json
  var CARD_TYPE_MAPPING = {
    "map": {
      "boolean": [
        "column"
      ],
      "floating_timestamp": [
        "timeline"
      ],
      "geo_entity": [
        "feature"
      ],
      "money": [
        {
          "type": "column",
          "defaultIf": "isLowCardinality"
        },
        {
          "type": "numberHistogram",
          "defaultIf": "isHighCardinality"
        },
        "search"
      ],
      "number": [
        {
          "type": "choropleth",
          "onlyIf": "isGeoregionComputed"
        },
        {
          "type": "column",
          "defaultIf": "isLowCardinality"
        },
        {
          "type": "numberHistogram",
          "defaultIf": "isHighCardinality"
        },
        "search"
      ],
      "point": [
        "feature"
      ],
      "text": [
        {
          "type": "column",
          "defaultIf": "isLowCardinality"
        },
        "search"
      ],
      "*": [
        "table"
      ]
    },
    "cardinality": {
      "min": 2,
      "threshold": 35
    },
    ":version": "0.3"
  };

  angular.module('test').factory('serverMocks', function() {
    return {
      CARD_TYPE_MAPPING: CARD_TYPE_MAPPING
    };
  });
})();

