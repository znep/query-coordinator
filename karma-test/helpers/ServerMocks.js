(function() {
  'use strict';

  // This is just a copy/paste from lib/data/card-type-mapping.json
  var CARD_TYPE_MAPPING = {
    "map": {
      "boolean": [
        { "type": "column" }
      ],
      "floating_timestamp": [
        { "type": "timeline" }
      ],
      "fixed_timestamp": [
        { "type": "timeline" }
      ],
      "geo_entity": [
        { "type": "feature" }
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
        { "type": "search" }
      ],
      "number": [
        {
          "type": "choropleth",
          "onlyIf": "isGeoregionComputed",
          "defaultIf": "isGeoregionComputed"
        },
        {
          "type": "column",
          "defaultIf": "isLowCardinality"
        },
        {
          "type": "numberHistogram",
          "defaultIf": "isHighCardinality"
        },
        { "type": "search" }
      ],
      "point": [
        { "type": "feature" }
      ],
      "text": [
        {
          "type": "column",
          "defaultIf": "isLowCardinality"
        },
        { "type": "search" }
      ],
      "*": [
        { "type": "table" }
      ]
    },
    "cardinality": {
      "min": 2,
      "threshold": 35,
      "default": 9007199254740992
    },
    ":version": "0.3"
  };

  angular.module('test').factory('serverMocks', function() {
    return {
      CARD_TYPE_MAPPING: CARD_TYPE_MAPPING
    };
  });
})();

