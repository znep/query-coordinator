(function() {
  'use strict';

  var MAX_SAFE_INTEGER = Number.MAX_SAFE_INTEGER || 9007199254740991;
  var MIN_SAFE_INTEGER = Number.MIN_SAFE_INTEGER || -9007199254740991;

  function CardTypeMapping(ServerConfig, Constants, $exceptionHandler, $log) {

    function getCardTypesForColumn(column) {

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

      if (cardTypeMapping.hasOwnProperty(logicalDatatype) &&
          cardTypeMapping[logicalDatatype].hasOwnProperty(physicalDatatype)) {
        cardType = cardTypeMapping[logicalDatatype][physicalDatatype];
      } else {
        warnOnceOnUnknownCardType(logicalDatatype, physicalDatatype);
      }

      return cardType;

    }

    function getDefaultVisualizationForColumn(column) {

      var cardTypes = getCardTypesForColumn(column);
      var cardinality;
      var defaultType;

      // If there is no defined card type, fail early with a null result.
      if (cardTypes === null) {
        return null;
      }

      // If the cardinality is known for this column and it is within the bounds
      // of safe integers, use the column's cardinality. Otherwise, fall back to 0.
      if (!column.hasOwnProperty('cardinality') ||
          column.cardinality < MIN_SAFE_INTEGER ||
          column.cardinality > MAX_SAFE_INTEGER) {
        cardinality = 0;
      } else {
        cardinality = parseInt(column.cardinality, 10);
      }

      // Finally, determine which type to which we will map based on the column's cardinality.
      if (cardinality <= parseInt(Constants['CARD_TYPE_MAPPING_CARDINALITY_THRESHOLD'], 10)) {
        defaultType = cardTypes.lowCardinalityDefault;
      } else {
        defaultType = cardTypes.highCardinalityDefault;
      }

      return defaultType;

    }

    function getDefaultCardTypeForModel(cardModel) {

      // TODO: how would I reactify this?
      var columns = cardModel.page.getCurrentValue('dataset').getCurrentValue('columns');
      var column = columns[cardModel.fieldName];
      return getDefaultVisualizationForColumn(column);

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
       return getDefaultVisualizationForColumn(column);
     }

    /**
     *
     * Determines whether or not a visualization exists for the intersection
     * of the column's physical and logical datatypes.
     *
     */

    function visualizationSupportedForColumn(column) {
      return CARD_TYPES.hasOwnProperty(getDefaultVisualizationForColumn(column));
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

    var cardTypeMapping = ServerConfig.get('oduxCardTypeMapping');

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
