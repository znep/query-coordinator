(function() {
  'use strict';

  function CardTypeMappingService($exceptionHandler) {

    var supportedCardTypes = ['column', 'choropleth', 'timeline'];

    function _cardTypeForColumn(column) {
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
        if (physicalDatatype === 'point') { return 'pointMap'; }
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
          return 'pointMap';
        }
        if (physicalDatatype === 'fixed_timestamp') { return 'timeline'; }
        if (physicalDatatype === 'floating_timestamp') { return 'timeline'; }
      }
      if (logicalDatatype === '*') { return 'table'; }
      throw new Error('Unknown visualization for logicalDatatype: ' + logicalDatatype +
        ' and physicalDatatype: ' + physicalDatatype);
    }

    function _cardTypeForColumnIsSupported(column) {
      return supportedCardTypes.indexOf(_cardTypeForColumn(column)) > -1;
    }

    return {
      cardTypeForColumn: _cardTypeForColumn,
      cardTypeForColumnIsSupported: _cardTypeForColumnIsSupported
    };

  }

  angular.
    module('dataCards.services').
      factory('CardTypeMappingService', CardTypeMappingService);

})();
