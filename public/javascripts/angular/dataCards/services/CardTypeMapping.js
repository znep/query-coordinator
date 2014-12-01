(function() {
  'use strict';

  function CardTypeMapping(ServerConfig, $exceptionHandler, $log) {

    function getCardTypeForNumber(logicalDatatype) {

      var mapping = null;

      switch (logicalDatatype) {

        case 'category':
          mapping = {
            'availableTypes': ['column', 'search'],
            'defaultType': 'column'
          };
          break;

        case 'location':
          mapping = {
            'availableTypes': ['choropleth'],
            'defaultType': 'choropleth'
          };
          break;

        case 'time':
          mapping = {
            'availableTypes': ['timeline'],
            'defaultType': 'timeline'
          };
          break;

        case 'text':
        case 'name':
        case 'identifier':
          mapping = {
            'availableTypes': ['column', 'search'],
            'defaultType': 'search'
          };
          break;

        default:
          break;

      }

      return mapping;

    }

    function getCardTypeForPoint(logicalDatatype) {

      var mapping = null;

      switch (logicalDatatype) {

        case 'location':
          mapping = {
            'availableTypes': ['feature'],
            'defaultType': 'feature'
          };
          break;

        default:
          break;

      }

      return mapping;

    }


    function getCardTypeForText(logicalDatatype) {

      var mapping = null;

      // It is possible for this to also map to choropleth cards with a 'location' logical data
      // type but that has been removed. We should treat anything that breaks as a result as bad data.
      switch (logicalDatatype) {

        case 'category':
          mapping = {
            'availableTypes': ['column', 'search'],
            'defaultType': 'column'
          };
          break;

        // DEPRECATED
        case 'location':
          // Note that we must wrap this exception in the $exceptionHandler because
          // otherwise the model's lazy loading breaks.
          var message = 'Encountered column with physicalDatatype "text" ' +
                        'and logicalDatatype "location".';
          $exceptionHandler(new Error(message));
          break;

        case 'text':
        case 'name':
        case 'identifier':
          mapping = {
            'availableTypes': ['column', 'search'],
            'defaultType': 'search'
          };
          break;

        default:
          break;

      }

      return mapping;

    }

    function getCardTypeForGeoEntity(logicalDatatype) {

      var mapping = null;

      switch (logicalDatatype) {

        default:
          break;

      }

      return mapping;

    }

    function getCardTypeForTimestamp(logicalDatatype) {

      var mapping = null;

      switch (logicalDatatype) {

        case 'category':
          mapping = {
            'availableTypes': ['column'],
            'defaultType': 'column'
          };
          break;

        case 'time':
        case 'text':
        case 'name':
        case 'identifier':
          mapping = {
            'availableTypes': ['timeline'],
            'defaultType': 'timeline'
          };
          break;

        default:
          break;

      }

      return mapping;

    }

    function getCardTypeForBoolean(logicalDatatype) {

      var mapping = null;

      switch (logicalDatatype) {

        case 'category':
          mapping = {
            'availableTypes': ['column'],
            'defaultType': 'column'
          };
          break;

        default:
          break;

      }

      return mapping;

    }

    function getCardTypeForMoney(logicalDatatype) {

      var mapping = null;

      switch (logicalDatatype) {

        case 'category':
          mapping = {
            'availableTypes': ['column'],
            'defaultType': 'column'
          };
          break;

        case 'time':
          mapping = {
            'availableTypes': ['timeline'],
            'defaultType': 'timeline'
          };
          break;

        case 'text':
        case 'name':
        case 'identifier':
          mapping = {
            'availableTypes': ['search'],
            'defaultType': 'search'
          };
          break;

        default:
          break;

      }

      return mapping;

    }

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


      switch (physicalDatatype) {

        case 'number':
          cardType = getCardTypeForNumber(logicalDatatype);
          break;

        case 'point':
          cardType = getCardTypeForPoint(logicalDatatype);
          break;

        case 'text':
          cardType = getCardTypeForText(logicalDatatype);
          break;

        case 'geo_entity':
          cardType = getCardTypeForGeoEntity(logicalDatatype);
          break;

        case 'timestamp':           // To be deprecated
        case 'fixed_timestamp':     // To be deprecated
        case 'floating_timestamp':
          cardType = getCardTypeForTimestamp(logicalDatatype);
          break;

        case 'boolean':
          cardType = getCardTypeForBoolean(logicalDatatype);
          break;

        case 'money':
          cardType = getCardTypeForMoney(logicalDatatype);
          break;

        default:
          if (logicalDatatype === '*') {
            cardType = {
              'avaialbleTypes': ['table'],
              'defaultType': 'table'
            };
          }
          break;

      }

      if (cardType === null) {
        warnOnceOnUnknownCardType(logicalDatatype, physicalDatatype);
      }

      return cardType;

    }

    function getdefaultVisualizationForColumn(column) {

      var cardTypes = getCardTypesForColumn(column);

      if (cardTypes === null) {
        return null;
      }

      return cardTypes.defaultType;

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
      return columnCardTypes.availableTypes;
     }

    /**
     *
     * Returns the default visualization type for the intersection of the
     * column's physical and logical datatypes.
     *
     */

     function defaultVisualizationForColumn(column) {
      var columnCardTypes = getCardTypesForColumn(column);
      if (columnCardTypes === null) {
        return null;
      }
      return getCardTypesForColumn(column).defaultType;
     }

    /**
     *
     * Determines whether or not a visualization exists for the intersection
     * of the column's physical and logical datatypes.
     *
     */

    function visualizationSupportedForColumn(column) {
      return CARD_TYPES.hasOwnProperty(getdefaultVisualizationForColumn(column));
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