(function() {
  'use strict';

  function CardTypeMapping(ServerConfig, $exceptionHandler, $log) {

    function getCardTypesForColumn(column) {
      var mappingConfiguration = getMappingConfiguration().map;
      var physicalDatatype;
      var logicalDatatype;
      var cardType = null;

      if (_.isUndefined(column)) {
        $log.error('Could not determine card type for undefined column.');
        return null;
      }

      if (!column.hasOwnProperty('logicalDatatype') ||
          !column.hasOwnProperty('physicalDatatype')) {

        $log.error(
          'Could not determine card type for column: "{0}" (physical and/or logical datatype is missing).'.
          format(JSON.stringify(column))
        );
        return null;

      }

      physicalDatatype = column.physicalDatatype;
      logicalDatatype = column.logicalDatatype;

      if (mappingConfiguration.hasOwnProperty(logicalDatatype) &&
          mappingConfiguration[logicalDatatype].hasOwnProperty(physicalDatatype)) {
        cardType = mappingConfiguration[logicalDatatype][physicalDatatype];
      } else {
        warnOnceOnUnknownCardType(logicalDatatype, physicalDatatype);
      }

      return cardType;

    }

    function getDefaultCardTypeForModel(cardModel) {

      // TODO: how would I reactify this?
      var columns = cardModel.page.getCurrentValue('dataset').getCurrentValue('columns');
      var column = columns[cardModel.fieldName];
      return defaultVisualizationForColumn(column);

    }

    function warnOnceOnUnknownCardType(logicalDatatype, physicalDatatype) {

      var warnedOn = physicalLogicalDatatypePairingsAlreadyWarnedOn;

      if (warnedOn.hasOwnProperty(logicalDatatype) && warnedOn[logicalDatatype].hasOwnProperty(physicalDatatype)) {
        return;
      }

      if (!warnedOn.hasOwnProperty(logicalDatatype)) {
        warnedOn[logicalDatatype] = {};
      }

      warnedOn[logicalDatatype][physicalDatatype] = true;

      $log.error(
        'Unknown visualization for logicalDatatype: "{0}" and physicalDatatype "{1}".'.
        format(logicalDatatype, physicalDatatype)
      );

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
      var cardTypes = getCardTypesForColumn(column);
      if (cardTypes === null) {
        return [];
      }
      return cardTypes.available;
    }

    /**
     *
     * Returns the default visualization type for the intersection of the
     * column's physical and logical datatypes.
     *
     */

    function defaultVisualizationForColumn(column) {
      var cardinalityConfiguration = getMappingConfiguration().cardinality;

      var cardTypes = getCardTypesForColumn(column);

      // If there is no defined card type, we shouldn't show a card for this column.
      if (cardTypes === null) {
        return null;
      }

      // If the cardinality is not known for this column, fall back to the minimum cardinality.
      var cardinality = column.cardinality || cardinalityConfiguration.min;

      // Otherwise, determine which type to which we will map based on the column's cardinality.
      if (cardinality < cardinalityConfiguration.min) {
        // Don't show cards for columns that don't have varying data.
        return null;
      } else if (cardinality < cardinalityConfiguration.threshold) {
        return cardTypes.lowCardinalityDefault;
      } else {
        return cardTypes.highCardinalityDefault;
      }
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
      if (_.isUndefined(cardType)) {
        cardType = getDefaultCardTypeForModel(cardModel);
      }
      return CARD_TYPES.hasOwnProperty(cardType) &&
             CARD_TYPES[cardType].customizable;
    }

    /**
     *
     * Determines whether or not the given card is able to be exported as a PNG.
     *
     */

    function modelIsExportable(cardModel) {
      var modelCardType = getDefaultCardTypeForModel(cardModel);
      return CARD_TYPES.hasOwnProperty(modelCardType) &&
             CARD_TYPES[modelCardType].exportable;
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

    var getMappingConfiguration = _.once(function() {
      return ServerConfig.get('oduxCardTypeMapping');
    });

    // Keep track of which logical/physical datatype combinations have already
    // triggered warnings so that we don't get rate-limited by Airbrake in
    // cases where we have hundreds of columns for which we cannot determine
    // a visualization type.
    var physicalLogicalDatatypePairingsAlreadyWarnedOn = {};

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
