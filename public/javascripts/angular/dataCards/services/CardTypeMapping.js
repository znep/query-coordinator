(function() {
  'use strict';

  function CardTypeMapping(ServerConfig, $exceptionHandler, $log) {
    function computeAvailableCardTypesInPreferenceOrder(candidateCardTypes, column) {

      candidateCardTypes = _.map(candidateCardTypes, normalizeVisualizationDefinition);

      function computeExpressionValue(expression) {
        //TODO isLowCardinality = (currentExpr) && cardinality != rowCount
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

      // We're ultimately only interested in the visualization type only.
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
      physicalDatatypeMapping = getCardTypeMapping().map[physicalDatatype];

      if (physicalDatatypeMapping) {
        cardTypes = computeAvailableCardTypesInPreferenceOrder(physicalDatatypeMapping, column);
      } else {
        warnOnceOnUnknownPhysicalType(physicalDatatype);
      }

      return cardTypes;

    }

    // For convenience, visualizations can be defined in card-type-mapping.json as a plain string, instead of as an object
    // with [type, onlyIf, defaultIf] keys. This normalizes strings into the object representation (objects with just a type key).
    function normalizeVisualizationDefinition(definition) {
      if (_.isString(definition)) {
        return { type: definition };
      } else {
        return definition;
      }
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
     * Determines whether or not a visualization exists for the intersection
     * of the column's physical and logical datatypes.
     *
     */

    function availableVisualizationsForColumn(column) {
      return getCardTypesForColumnInPreferenceOrder(column);
    }

    /**
     *
     * Returns the default visualization type for the intersection of the
     * column's physical and logical datatypes.
     *
     */

    function defaultVisualizationForColumn(column) {
      return _.first(availableVisualizationsForColumn(column));
    }

    /**
     *
     * Determines whether or not a visualization exists for the intersection
     * of the column's physical and logical datatypes.
     *
     */

    function visualizationSupportedForColumn(column) {
      return CARD_TYPES.hasOwnProperty(defaultVisualizationForColumn(column));
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

    var getCardTypeMapping = function() {
      return ServerConfig.get('oduxCardTypeMapping');
    };

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
