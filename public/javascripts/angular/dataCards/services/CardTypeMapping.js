(function() {
  'use strict';

  function CardTypeMapping(ServerConfig, $exceptionHandler, $log) {

    function _getCardTypeForNumber(logicalDatatype) {
      switch (logicalDatatype) {

        case 'category':
          return {
            availableTypes: ['column', 'search'],
            defaultType: 'column'
          };

        case 'location':
          return {
            availableTypes: ['choropleth'],
            defaultType: 'choropleth'
          };

        case 'time':
          return {
            availableTypes: ['timeline'],
            defaultType: 'timeline'
          };

        case 'text':
        case 'name':
        case 'identifier':
          return {
            availableTypes: ['column', 'search'],
            defaultType: 'search'
          };

        default:
          return null;

      }
    }

    function _getCardTypeForPoint(logicalDatatype) {
      switch (logicalDatatype) {

        case 'location':
          return {
            availableTypes: ['feature'],
            defaultType: 'feature'
          };

        default:
          return null;

      }
    }


    function _getCardTypeForText(logicalDatatype) {
      // It is possible for this to also map to choropleth cards with a 'location' logical data
      // type but that has been removed. We should treat anything that breaks as a result as bad data.
      switch (logicalDatatype) {

        case 'category':
          return {
            availableTypes: ['column', 'search'],
            defaultType: 'column'
          };

        // DEPRECATED
        case 'location':
          // Note that we must wrap this exception in the $exceptionHandler because
          // otherwise the model's lazy loading breaks.
          var message = 'Encountered column with physicalDatatype "text" ' +
                        'and logicalDatatype "location".';
          $exceptionHandler(new Error(message));
          return null;
          break;

        case 'text':
        case 'name':
        case 'identifier':
          return {
            availableTypes: ['column', 'search'],
            defaultType: 'search'
          };

        default:
          return null;

      }
    }

    function _getCardTypeForGeoEntity(logicalDatatype) {
      switch (logicalDatatype) {

        default:
          return null;

      }
    }

    function _getCardTypeForTimestamp(logicalDatatype) {
      switch (logicalDatatype) {

        case 'category':
          return {
            availableTypes: ['column'],
            defaultType: 'column'
          };

        case 'time':
        case 'text':
        case 'name':
        case 'identifier':
          return {
            availableTypes: ['timeline'],
            defaultType: 'timeline'
          };

        default:
          return null;

      }
    }

    function _getCardTypeForBoolean(logicalDatatype) {
      switch (logicalDatatype) {

        case 'category':
          return {
            availableTypes: ['column'],
            defaultType: 'column'
          };

        default:
          return null;

      }
    }

    function _getCardTypeForMoney(logicalDatatype) {
      switch (logicalDatatype) {

        case 'category':
          return {
            availableTypes: ['column'],
            defaultType: 'column'
          };

        case 'time':
          return {
            availableTypes: ['timeline'],
            defaultType: 'timeline'
          };

        case 'text':
        case 'name':
        case 'identifier':
          return {
            availableTypes: ['search'],
            defaultType: 'search'
          };

        default:
          return null;

      }
    }

    function _getCardTypesForColumn(column) {

      var physicalDatatype;
      var logicalDatatype;
      var cardType = null;

      if (_.isUndefined(column)) {
        $log.error('Could not determine card type for undefined column.');
        return null;
      }

      if (!column.hasOwnProperty('physicalDatatype') ||
          !column.hasOwnProperty('logicalDatatype')) {

        $log.error('Could not determine card type for column: "{0}".'.format(JSON.stringify(column)));
        return null;

      }

      physicalDatatype = column.physicalDatatype;
      logicalDatatype = column.logicalDatatype;


      switch (physicalDatatype) {

        case 'number':
          cardType = _getCardTypeForNumber(logicalDatatype);
          break;

        case 'point':
          cardType = _getCardTypeForPoint(logicalDatatype);
          break;

        case 'text':
          cardType = _getCardTypeForText(logicalDatatype);
          break;

        case 'geo_entity':
          cardType = _getCardTypeForGeoEntity(logicalDatatype);
          break;

        case 'timestamp':           // To be deprecated
        case 'fixed_timestamp':     // To be deprecated
        case 'floating_timestamp':
          cardType = _getCardTypeForTimestamp(logicalDatatype);
          break;

        case 'boolean':
          cardType = _getCardTypeForBoolean(logicalDatatype);
          break;

        case 'money':
          cardType = _getCardTypeForMoney(logicalDatatype);
          break;

        default:
          if (logicalDatatype === '*') {
            cardType = {
              avaialbleTypes: ['table'],
              defaultType: 'table'
            };
          }
          break;

      }

      if (cardType === null) {
        _warnOnceOnUnknownCardType(logicalDatatype, physicalDatatype);
      }

      return cardType;

    }

    function _getdefaultVisualizationForColumn(column) {

      var cardTypes = _getCardTypesForColumn(column);

      if (cardTypes === null) {
        return 'unsupported';
      }

      return cardTypes.defaultType;

    }

    function _getDefaultCardTypeForModel(cardModel) {

      // TODO: how would I reactify this?
      var columns = cardModel.page.getCurrentValue('dataset').getCurrentValue('columns');
      var column = columns[cardModel.fieldName];
      var cardTypes = _getCardTypesForColumn(column);

      if (cardTypes === null) {
        return 'unsupported';
      }

      return cardTypes.defaultType;

    }

    function _warnOnceOnUnknownCardType(logicalDatatype, physicalDatatype) {

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
      var columnCardTypes = _getCardTypesForColumn(column);
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
      var columnCardTypes = _getCardTypesForColumn(column);
      if (columnCardTypes === null) {
        return 'unsupported';
      }
      return _getCardTypesForColumn(column).defaultType;
     }

    /**
     *
     * Determines whether or not a visualization exists for the intersection
     * of the column's physical and logical datatypes.
     *
     */

    function visualizationSupportedForColumn(column) {
      return CARD_TYPES.hasOwnProperty(_getdefaultVisualizationForColumn(column));
    }

    /**
     *
     * Determines whether or not the given card is customizeable.
     *
     */

    function modelIsCustomizable(cardModel) {
      var modelCardType = cardModel.getCurrentValue('cardType');
      if (_.isUndefined(modelCardType)) {
        modelCardType = _getDefaultCardTypeForModel(cardModel);
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
      var modelCardType = _getDefaultCardTypeForModel(cardModel);
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
