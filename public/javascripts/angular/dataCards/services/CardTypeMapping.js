(function() {
  'use strict';

  function CardTypeMapping(ServerConfig, Constants, $exceptionHandler, $log) {

    function getCardTypesForColumn(column) {

      var physicalDatatype;
      var logicalDatatype;
      var cardType = null;

      if (_.isUndefined(column)) {
        $log.error('Could not determine card type for undefined column.');
        return null;
      }

      if (!column.hasOwnProperty('physicalDatatype') ||
          !column.hasOwnProperty('logicalDatatype')) {

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
      if (cardTypes.available.length === 0) {
        return null;
      }

      // If the cardinality is known for this column, use it. Otherwise,
      // fall back to Number.MAX_SAFE_INTEGER.
      if (!column.hasOwnProperty('cardinality') || column.cardinality > Number.MAX_SAFE_INTEGER) {
        cardinality = Number.MAX_SAFE_INTEGER;
      } else {
        cardinality = parseInt(column.cardinality, 10);
      }

      // Finally, determine which type to which we will map based on the column's cardinality.
      if (cardinality <= parseInt(Constants['VISUALIZATION_MAPPING_CARDINALITY_THRESHOLD'], 10)) {
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
      var cardTypes = getCardTypesForColumn(column);

      if (cardTypes === null) {
        return null;
      }

      return cardTypes.defaultType;

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
      var columnCardTypes = getCardTypesForColumn(column);
      if (columnCardTypes === null) {
        return [];
      }
      return columnCardTypes.available;
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
      var modelCardType = cardModel.getCurrentValue('cardType');
      if (_.isUndefined(modelCardType)) {
        modelCardType = getDefaultCardTypeForModel(cardModel);
      }
      return CARD_TYPES.hasOwnProperty(modelCardType) &&
             CARD_TYPES[modelCardType].customizable;
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

    var cardTypeMapping = ServerConfig.get('cardTypeMapping');

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
