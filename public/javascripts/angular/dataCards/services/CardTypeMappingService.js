(function() {
  'use strict';

  function CardTypeMappingService(ServerConfig, $exceptionHandler, $log) {

    if (ServerConfig.get('oduxEnableFeatureMap')) {

      var supportedCardTypes = ['column', 'choropleth', 'feature', 'search', 'timeline'];
      var CUSTOMIZABLE_CARD_TYPES = {
        choropleth: true,
        feature: true
      };
      // A whitelist of card types available for export
      var EXPORTABLE_CARD_TYPES = [
        'choropleth',
        'column',
        'point-ish map',
        'feature',
        //'search',
        'statBar',
        //'table',
        'timeline'
      ];

    } else {

      var supportedCardTypes = ['column', 'choropleth', 'search', 'timeline'];
      var CUSTOMIZABLE_CARD_TYPES = {
        choropleth: true
      };
      // A whitelist of card types available for export
      var EXPORTABLE_CARD_TYPES = [
        'choropleth',
        'column',
        'point-ish map',
        //'feature',
        //'search',
        'statBar',
        //'table',
        'timeline'
      ];

    }

    // A lookup for whether a particular card type is customizable
    var CUSTOMIZABLE_CARD_TYPES = {
      choropleth: true,
      feature: true
    };

    // Keep track of which logical/physical datatype combinations have already
    // triggered warnings so that we don't get rate-limited by Airbrake in
    // cases where we have hundreds of columns for which we cannot determine
    // a visualization type.
    var warnedOn = {};

    function warnOnceOnUnknownCardType(logicalDatatype, physicalDatatype) {

      if (warnedOn.hasOwnProperty(logicalDatatype) && warnedOn[logicalDatatype].hasOwnProperty(physicalDatatype)) {
        return;
      }

      if (!warnedOn.hasOwnProperty(logicalDatatype)) {
        warnedOn[logicalDatatype] = {};
      }

      warnedOn[logicalDatatype][physicalDatatype] = true;

      $log.error(
        'Unknown visualization for logicalDatatype: {0} and physicalDatatype {1}'.
        format(logicalDatatype, physicalDatatype)
      );

    }

    /**
     * Determines whether or not the given card is customizeable.
     */
    function _isCustomizable(cardModel) {
      return CUSTOMIZABLE_CARD_TYPES[
        _cardTypeForModel(cardModel)
      ];
    }

    /**
     * Determines whether or not the given card is able to be exported as a PNG.
     */
    function _isExportable(cardModel) {
      return _.contains(EXPORTABLE_CARD_TYPES, _cardTypeForModel(cardModel));
    }

    function _cardTypeForColumn(column) {
      debugger
      column = column || {};
      var logicalDatatype = column.logicalDatatype;
      var physicalDatatype = column.physicalDatatype;

      if (logicalDatatype === 'category') {
        return 'column';
      }
      if (logicalDatatype === 'amount') {
        if (physicalDatatype === 'number') { return 'statBar'; }
      }
      if (logicalDatatype === 'location') {
        if (physicalDatatype === 'point') { return ServerConfig.get('oduxEnableFeatureMap') ? 'feature' : 'unsupported'; }
        if (physicalDatatype === 'number') { return 'choropleth'; }
        if (physicalDatatype === 'text') {
          var message = 'Encountered location column "{0}" with text physical type - this is deprecated (expected number type).'.format(column.name);
          // TODO If you are the poor bastard that is looking at this, the problem is that the model's
          // lazy loading behavior is intolerant of exceptions being thrown in the current implementation.
          // We still want to log an "error" in this deprecation case, but we can't throw an error here.
          $exceptionHandler(new Error(message));
          return 'choropleth';
        }
        if (physicalDatatype === 'geo_entity') { return 'point-ish map'; }
      }
      if (logicalDatatype === 'time') {
        if (physicalDatatype === 'timestamp') { return 'timeline'; }
        if (physicalDatatype === 'number') { return 'timeline'; }
        if (physicalDatatype === 'fixed_timestamp') { return 'timeline'; }
        if (physicalDatatype === 'floating_timestamp') { return 'timeline'; }
      }
      if (logicalDatatype === 'text' || logicalDatatype === 'name' || logicalDatatype === 'identifier') {
        if (physicalDatatype === 'text' || physicalDatatype === 'number') {
          return 'search';
        }
        if (physicalDatatype === 'point') {
          return ServerConfig.get('oduxEnableFeatureMap') ? 'feature' : 'unsupported';
        }
        if (physicalDatatype === 'fixed_timestamp') { return 'timeline'; }
        if (physicalDatatype === 'floating_timestamp') { return 'timeline'; }
      }
      if (logicalDatatype === '*') { return 'table'; }

      warnOnceOnUnknownCardType(logicalDatatype, physicalDatatype);

      return 'unknown';

    }

    function _cardTypeForColumnIsSupported(column) {
      return _.contains(supportedCardTypes, _cardTypeForColumn(column));
    }

    function _cardTypeForModel(cardModel) {
      // TODO: how would I reactify this?
      var columns = cardModel.page.getCurrentValue('dataset').getCurrentValue('columns');
      return _cardTypeForColumn(columns[cardModel.fieldName]);
    }

    return {
      isCustomizable: _isCustomizable,
      isExportable: _isExportable,
      cardTypeForModel: _cardTypeForModel,
      cardTypeForColumn: _cardTypeForColumn,
      cardTypeForColumnIsSupported: _cardTypeForColumnIsSupported
    };

  }

  angular.
    module('dataCards.services').
      factory('CardTypeMappingService', CardTypeMappingService);

})();
