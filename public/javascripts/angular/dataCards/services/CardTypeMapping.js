(function() {
  'use strict';

  // A service that computes the supported and/or suggested card types for
  // columns.
  function CardTypeMapping(ServerConfig, $exceptionHandler, $log, Schemas) {

  // Card type mappings for a column are based on the column's physical datatype,
  // cardinality, and computation strategy.
  //
  // The details of which combinations of the above attributes result in which card types
  // is configured via card-type-mapping.json, which is served to us from Rails. This file's
  // schema is provided below.
  // In brief, there are two branches of the config:
  // a) Cardinality configuration. What is considered high cardinality? What is the default cardinality?
  // b) Mapping configuration.
  //
  // (a) is straightforward. (b) is a little more tricky.
  // Regarding each key-value pairs in (b):
  // - The key is a physical datatype (number, text, etc).
  // - The value is an array of possibly-supported card types, each one with optional expressions (1) to
  //   determine availability and default status (2).
  //
  // (1) An "expression" is really a keyword, no math is supported. Valid expressions are:
  //      - isGeoregionComputed: True iff the column's computationStrategy is georegion_match_on_string
  //        or georegion_match_on_point. False otherwise.
  //      - isHighCardinality: True iff the column is high cardinality, false otherwise.
  //      - isLowCardinality: Negation of isHighCardinality.
  // (2) The algorithm to determine which card type is the default for a column is as follows. Note that
  //     the order of card types in the configuration is significant.
  //
  //     Given the ordered list T of configured card types for the column's physical datatype:
  //     1- From T, remove all card types whose onlyIf expressions evaluate to false.
  //     2- Pick the first element from T whose defaultIf expression evaluates to true, if any.
  //     3- If (2) did not pick anything, pick the first element from T that does not define any
  //        defaultIf expression, if any.
  //     4- If (3) did not pick anything, pick the first element in T.
  //     5- Return the picked element as the default card type.
  //
  // Example:
  // {
  //   'number': [
  //     { type: 'numberHistogram' }
  //    ],
  //    'text': [
  //       { type: 'choropleth', defaultIf: 'isGeoregionComputed', onlyIf: 'isGeoregionComputed' },
  //       { type: 'column', defaultIf: 'isLowCardinality' },
  //       { type: 'search' }
  //     ]
  //  }
  //
  //  In this case, all number columns only support numberHistogram, with (obviously) a fixed default of
  //  numberHistogram, regardless of cardinality.
  //  Georegion-computed text columns support choropleths, columns, and search card types. The default
  //  is choropleth (even if the column is also isLowCardinality, as the choropleth is listed first).
  //  Low-cardinalty text columns support column and search, and default to column.
  //  High-cardinality text columns also support column and search, and default to search.
  var schemas = Schemas.regarding('card_type_mapping');
  schemas.addSchemaWithVersion(
    '0.3',
    {
      'type': 'object',
      'properties': {
        'version': {
          'type': 'string',
          'value': '0.3'
        },
        'cardinality': {
          'type': 'object',
          'properties': {
            'min': { 'type': 'integer', 'minimum': 0 },
            'threshold': { 'type': 'integer', 'minimum': 1 },
            'default': { 'type': 'integer', 'minimum': 1 }
          },
          'required': [ 'min', 'threshold', 'default' ]
        },
        'mapping': {
          'type': 'object',
          'patternProperties': {
            '.*': {
              'type': 'array',
              'items': {
                'type': 'object',
                'properties': {
                  'type': { 'type': 'string', 'minLength': 1 },
                  'isDefault': { 'type': 'string', 'enum': [ 'isGeoregionComputed', 'isHighCardinality', 'isLowCardinality' ]},
                  'onlyIf': { 'type': 'string', 'enum': [ 'isGeoregionComputed', 'isHighCardinality', 'isLowCardinality' ]}
                },
                'required': [ 'type' ]
              }
            }
          }
        },
        'required': [ 'mapping', 'cardinality', 'version' ]
      }
    });

    // Given an array of card type mappings and a column metadata blob,
    // filter and sort the card types mappings based on the mappings' onlyIf
    // and defaultIf entries.
    function filterAndSortCardTypes(candidateCardTypes, column) {

      function computeExpressionValue(expression) {
        var values = {
          isHighCardinality:   column.cardinality >= getCardTypeMapping().cardinality.threshold,
          isLowCardinality:    column.cardinality < getCardTypeMapping().cardinality.threshold &&
                               column.cardinality >= getCardTypeMapping().cardinality.min,
          isGeoregionComputed: column.computationStrategy === 'georegion_match_on_string' ||
                               column.computationStrategy === 'georegion_match_on_point'
        };

        if (!values.hasOwnProperty(expression)) {
          throw new Error('Unknown expression in card-type-mapping: ' + expression);
        }

        return values[expression];
      }

      // Sort the possible card types to have the defaults first.
      // NOTE: stable sort.
      // Output should be in this order:
      // [ <all isDefault = true>, <all without defaultIf>, <all isDefault = false> ]
      var defaultTypesFirst = _.sortBy(candidateCardTypes, function(candidateCardType) {
        if (candidateCardType.hasOwnProperty('defaultIf')) {
          return computeExpressionValue(candidateCardType.defaultIf) ? 0 : 2;
        } else {
          return 1;
        }
      });

      // Filter out card types whose onlyIf evaluates to false.
      var onlyEnabledTypes = _.filter(defaultTypesFirst, function(candidateCardType) {
        if (candidateCardType.hasOwnProperty('onlyIf')) {
          return computeExpressionValue(candidateCardType.onlyIf);
        } else {
          return true;
        }
      });

      // We're ultimately only interested in the visualization type.
      return _.pluck(onlyEnabledTypes, 'type');
    }

    function getCardTypesForColumnInPreferenceOrder(column) {

      var physicalDatatype;
      var physicalDatatypeMapping;
      var cardTypes = [];

      if (_.isUndefined(column)) {
        $log.error('Could not determine card type for undefined column.');
        return null;
      }

      if (!column.hasOwnProperty('cardinality') ||
          !column.hasOwnProperty('physicalDatatype')) {

        $log.error(
          'Could not determine card type for column: "{0}" (physical datatype and/or cardinality is missing).'.
          format(JSON.stringify(column))
        );
        return null;

      }

      physicalDatatype = column.physicalDatatype;
      physicalDatatypeMapping = getCardTypeMapping().mapping[physicalDatatype];

      if (physicalDatatypeMapping) {
        cardTypes = filterAndSortCardTypes(physicalDatatypeMapping, column);
      } else {
        warnOnceOnUnknownPhysicalType(physicalDatatype);
      }

      return cardTypes;

    }

    function warnOnceOnUnknownPhysicalType(physicalDatatype) {

      var warnedOn = physicalTypesAlreadyWarnedOn;

      if (warnedOn[physicalDatatype]) {
        return;
      } else {
        warnedOn[physicalDatatype] = true;

        $log.error(
          'Unknown visualization for physicalDatatype "{0}".'.
          format(physicalDatatype)
        );
      }
    }


    //
    // Public-facing methods
    //

    /**
     *
     * Returns the supported visualizations for a given column.
     *
     */

    function availableVisualizationsForColumn(column) {
      return getCardTypesForColumnInPreferenceOrder(column);
    }

    /**
     *
     * Returns the default visualization type for a given column.
     *
     */

    function defaultVisualizationForColumn(column) {
      return _.first(availableVisualizationsForColumn(column));
    }

    /**
     *
     * Determines whether or not a supported visualization exists for a given column.
     *
     */

    function visualizationSupportedForColumn(column) {
      return _.any(availableVisualizationsForColumn(column), function(visualization) {
        return CARD_TYPES.hasOwnProperty(visualization);
      });
    }

    /**
     *
     * Determines whether or not the given card is customizeable.
     *
     */

    function modelIsCustomizable(cardModel) {
      var cardType = cardModel.getCurrentValue('cardType');
      return CARD_TYPES.hasOwnProperty(cardType) &&
             CARD_TYPES[cardType].customizable;
    }

    /**
     *
     * Determines whether or not the given card is able to be exported as a PNG.
     *
     */

    function modelIsExportable(cardModel) {
      var cardType = cardModel.getCurrentValue('cardType');
      return CARD_TYPES.hasOwnProperty(cardType) &&
             CARD_TYPES[cardType].exportable;
    }

    /**
     *
     * Set up instance variables.
     *
     */

    // A whitelist of cards for which the visualizations are defined, along with
    // properties indicating whether they are customizable and exportable or not.
    var CARD_TYPES = {
      'choropleth': {
        'customizable': true,
        'exportable': true
      },
      'column': {
        'customizable': false,
        'exportable': true
      },
      'search': {
        'customizable': false,
        'exportable': false
      },
      'timeline': {
        'customizable': false,
        'exportable': true
      }
    };

    // Optionally include feature maps based on system feature flag.
    if (ServerConfig.get('oduxEnableFeatureMap')) {

      CARD_TYPES['feature'] = {
        'customizable': true,
        'exportable': true
      };

    }

    var getCardTypeMapping = _.once(function() {
      var mapping = ServerConfig.get('oduxCardTypeMapping');
      var validationErrors = schemas.getValidationErrorsAgainstVersion('0.3', mapping);
      if (!_.isEmpty(validationErrors)) {
        throw new Error('Invalid card-type-mapping.json: ' + JSON.stringify(validationErrors));
      }

      return mapping;
    });

    // Keep track of which physical datatypes have already
    // triggered warnings so that we don't get rate-limited by Airbrake in
    // cases where we have hundreds of columns for which we cannot determine
    // a visualization type.
    var physicalTypesAlreadyWarnedOn = {};

    return {
      availableVisualizationsForColumn: availableVisualizationsForColumn,
      defaultVisualizationForColumn: defaultVisualizationForColumn,
      visualizationSupportedForColumn: visualizationSupportedForColumn,
      modelIsCustomizable: modelIsCustomizable,
      modelIsExportable: modelIsExportable
    };

  }

  angular.
    module('dataCards.services').
      factory('CardTypeMapping', CardTypeMapping);

})();
