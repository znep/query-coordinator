(function() {
  'use strict';

  //TODO: These functions should live on Card, or possibly the Dataset's columns.
  function CardTypeMapping(ServerConfig, $exceptionHandler, $log, Assert) {

    function columnInfoFromDatasetAndFieldName(dataset, fieldName) {
      //TODO We're not strictly guaranteed to have the dataset's columns, but in current usage
      //we will (under the assumption that the fieldName is determined from the Dataset model).

      var columns = dataset.getCurrentValue('columns');
      Assert(_.isPresent(columns), 'Columns hash not yet present on dataset model.');
      var column = columns[fieldName];

      if (_.isUndefined(column)) {
        $log.error('Could not determine card type for undefined column.');
        return null;
      } else {
        return column;
      }
    }

    function getCardTypesForDatasetColumn(dataset, fieldName) {
      var mappingConfiguration = getMappingConfiguration().map;
      var fallbackCardType = getMappingConfiguration().fallbackCardType;

      var column = columnInfoFromDatasetAndFieldName(dataset, fieldName);

      var logicalDatatype;
      var physicalDatatype;

      if (!_.isPresent(column)) {
        $log.error('Could not determine card type for undefined column.');

        return null;
      }

      if (column.dataset.version === '0') {
        if (!column.hasOwnProperty('logicalDatatype') ||
            !column.hasOwnProperty('physicalDatatype')) {

          $log.error(
            'Could not determine card type for column: "{0}" (physical and/or logical datatype is missing).'.
            format(column.name)
          );

          return null;
        }

        logicalDatatype = column.logicalDatatype;
        physicalDatatype = column.physicalDatatype;
      } else {
        if (!column.hasOwnProperty('fred') ||
            !column.hasOwnProperty('physicalDatatype')) {

          $log.error(
            'Could not determine card type for column: "{0}" (physical datatype and/or fred is missing).'.
            format(column.name)
          );

          return null;
        }

        logicalDatatype = column.fred;
        physicalDatatype = column.physicalDatatype;
      }

      var cardType = null;

      if (mappingConfiguration.hasOwnProperty(logicalDatatype) &&
          mappingConfiguration[logicalDatatype].hasOwnProperty(physicalDatatype)) {
        cardType = mappingConfiguration[logicalDatatype][physicalDatatype];
      } else {
        warnOnceOnUnknownCardType(logicalDatatype, physicalDatatype);
      }

      if (_.isEmpty(cardType) && _.isDefined(fallbackCardType)) {
        return fallbackCardType;
      }

      return cardType;

    }

    function getDefaultCardTypeForModel(cardModel) {
      //DANGER: Assuming card's page's dataset has columns.
      //Evil! This service needs a rewrite, see comment at top
      //of file.
      var dataset = cardModel.page.getCurrentValue('dataset');
      Assert(_.isPresent(dataset), 'Dataset model not present on Page model.');
      return defaultVisualizationForColumn(dataset, cardModel.fieldName);

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

    function availableVisualizationsForColumn(dataset, fieldName) {
      var cardTypes = getCardTypesForDatasetColumn(dataset, fieldName);

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

    function defaultVisualizationForColumn(dataset, fieldName) {
      var cardinalityConfiguration = getMappingConfiguration().cardinality;
      var column = columnInfoFromDatasetAndFieldName(dataset, fieldName);
      var cardTypes = getCardTypesForDatasetColumn(dataset, fieldName);

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

    function visualizationSupportedForColumn(dataset, fieldName) {
      return _.any(
        availableVisualizationsForColumn(dataset, fieldName),
        function(visualization) {
          return visualizationSupported(visualization);
        }
      );
    }

    /** Determines whether or not a particular cardType is supported.
     */
    function visualizationSupported(cardType) {
      return CARD_TYPES.hasOwnProperty(cardType);
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
      return visualizationSupported(cardType) &&
             CARD_TYPES[cardType].customizable;
    }

    /**
     *
     * Determines whether or not the given card is able to be exported as a PNG.
     *
     */

    function modelIsExportable(cardModel) {
      var modelCardType = getDefaultCardTypeForModel(cardModel);
      return visualizationSupported(modelCardType) &&
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
      },
      'table': {
        'customizable': false,
        'exportable': false
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
      visualizationSupported: visualizationSupported,
      modelIsCustomizable: modelIsCustomizable,
      modelIsExportable: modelIsExportable
    };

  }

  angular.
    module('dataCards.services').
      factory('CardTypeMapping', CardTypeMapping);

})();
