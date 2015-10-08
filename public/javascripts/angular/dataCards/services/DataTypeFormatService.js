(function() {
  'use strict';

  function DataTypeFormatService(I18n) {

    /**
    * Renders a boolean value in checkbox format
    */
    var renderBooleanCell = function(cellContent) {
      return _.isBoolean(cellContent) && cellContent ? '✓' : '';
    };

    /**
    * Render a number based on column specified formatting. Will respect
    * percentage or commaified formatting.
    */
    var renderNumberCell = function(cellContent, column) {
      // CORE-4533: Preserve behavior of old UX - truncate precision
      if (cellContent && !_.isNumber(cellContent)) {
        var number = parseFloat(cellContent);
        // Just in case, default to the given cell content if parsing fails
        if (!_.isNaN(number)) {
          cellContent = number.toString();
        }
      }

      if (column.dataTypeName === 'percent') {
        var parts = cellContent.split('.');
        if (parts.length === 1) {
          // non-zero integers are multiples of 100%
          if (cellContent !== '0') {
            cellContent += '00';
          }
        } else {
          // shift the decimal point two places right string-wise
          // because we can't trust multiplying floats by 100
          var decimalValues = parts[1].split('');
          while (decimalValues.length < 2) {
            decimalValues.push('0');
          }
          cellContent = parts[0] + decimalValues.splice(0, 2).join('');
          if (decimalValues.length) {
            cellContent += '.' + decimalValues.join('');
          }
          // strip leading zeroes except just before decimal point
          cellContent = cellContent.replace(/^(-?)0*(\d+(?:\.\d+)?)/, '$1$2');
        }
      }

      var shouldCommaify = !(column.format || {}).noCommas;
      // Special case for thousands-place numbers.
      // The primary justification is that it makes year columns
      // look bad; awaiting further feedback from customers.
      // This check should be removed or reworked once the API for
      // logical type detection is in place.
      if (/^-?\d{4}\b/.test(cellContent)) {
        shouldCommaify = false;
      }
      if (shouldCommaify) {
        cellContent = window.socrata.utils.commaify(cellContent);
      }

      // Add percent sign after commaify because it affects length
      if (column.dataTypeName === 'percent') {
        cellContent += '%';
      }

      return cellContent;
    };

    // Helper for retrieving the geoCell cellContent coordinates
    var cellCoordinates = function(cellContent) {
      var coordinates = _.has(cellContent, 'value.coordinates') ?
        cellContent.value.coordinates :
        cellContent.coordinates;
      return _.isArray(coordinates) ? coordinates : null;
    };

    /**
    * Renders a Point in plain text as a lat/lng pair.
    */
    var renderGeoCell = function(cellContent) {
      var latitudeIndex = 1;
      var longitudeIndex = 0;
      var coordinates = cellCoordinates(cellContent);
      if (coordinates) {
        var latitude = coordinates[latitudeIndex];
        var longitude = coordinates[longitudeIndex];
        return '({0}°, {1}°)'.format(latitude, longitude);
      } else {
        return '';
      }
    };

    /**
    * Renders a Point wrapped in an HTML span element
    */
    var renderGeoCellHTML = function(cellContent) {
      var latitudeIndex = 1;
      var longitudeIndex = 0;
      var coordinates = cellCoordinates(cellContent);
      if (coordinates) {
        var template = '<span title="{0}">{1}°</span>';
        var latitude = template.format(I18n.common.latitude, coordinates[latitudeIndex]);
        var longitude = template.format(I18n.common.longitude, coordinates[longitudeIndex]);
        return '({0}, {1})'.format(latitude, longitude);
      } else {
        return '';
      }
    };

    /**
    * Render a numeric value as currency
    */
    var renderMoneyCell = function(cellContent, column) {
      var format = _.extend({
        currency: '$',
        decimalSeparator: '.',
        groupSeparator: ',',
        humane: false,
        precision: 2
      }, column.format || {});
      var amount = parseFloat(cellContent);

      if (_.isFinite(amount)) {
        if (format.humane) {
          // We can't use formatNumber here because this use case is
          // slightly different — we want to enforce a certain precision,
          // whereas the normal humane numbers want to use the fewest
          // digits possible at all times.
          // The handling on thousands-scale numbers is also different,
          // because humane currency will always be expressed with the K
          // scale suffix, whereas our normal humane numbers allow four-
          // digit thousands output.
          var absVal = Math.abs(amount);
          if (absVal < 1000) {
            cellContent = absVal.toFixed(format.precision).
              replace('.', format.decimalSeparator);
          } else {
            // At this point, we know that we're going to use a suffix for
            // scale, so we lean on commaify to split up the scale groups.
            // The number of groups can be used to select the correct
            // scale suffix, and we can do precision-related formatting
            // by taking the first two scale groups and treating them
            // as a float.
            // For instance, "12,345,678" will become an array of three
            // substrings, and the first two will combine into "12.345"
            // so that our toFixed call can work its magic.
            var scaleGroupedVal = window.socrata.utils.commaify(Math.floor(absVal)).split(',');
            var symbols = ['K', 'M', 'B', 'T', 'P', 'E', 'Z', 'Y'];
            var symbolIndex = scaleGroupedVal.length - 2;

            var value = parseFloat(scaleGroupedVal[0] + '.' + scaleGroupedVal[1]);
            value = value.toFixed(format.precision);
            if (parseFloat(value) === 1000) {
              // The only edge case is when rounding takes us into the
              // next scale group: 999,999 should be 1M not 1000K.
              value = '1';
              if (format.precision > 0) {
                value += '.' + _.repeat('0', format.precision);
              }
              symbolIndex++;
            }

            cellContent = value.replace('.', format.decimalSeparator) + symbols[symbolIndex];
          }
        } else {
          // Normal formatting without abbreviation.
          var commaifyOptions = {
            groupCharacter: format.groupSeparator,
            decimalCharacter: format.decimalSeparator
          };

          cellContent = window.socrata.utils.commaify(
            Math.abs(amount).toFixed(format.precision).
              replace('.', format.decimalSeparator),
            commaifyOptions
          );
        }
        cellContent = '{neg}{sym}{value}'.format({
          neg: (amount < 0 ? '-' : ''),
          sym: format.currency,
          value: cellContent
        });
      }
      return cellContent;
    };

    /**
    * Render a date or timestamp following column formatting, otherwise following defaults.
    */
    var renderTimestampCell = function(cellContent, column) {
      if (_.isPresent(cellContent)) {
        var time = moment(new Date(cellContent));
        if (time.isValid()) {
          if (column.format && column.format.formatString) {
            // Option A: format using user-specified format string
            return time.format(column.format.formatString);
          } else if (time.hour() + time.minute() + time.second() + time.millisecond() === 0) {
            // Option B: infer date-only string format
            return time.format('YYYY MMM DD');
          } else {
            // Option C: use date-with-time format
            return time.format('YYYY MMM DD hh:mm:ss A');
          }
        }
      }
      return '';
    };

    return {
      renderBooleanCell: renderBooleanCell,
      renderNumberCell: renderNumberCell,
      renderGeoCell: renderGeoCell,
      renderGeoCellHTML: renderGeoCellHTML,
      renderMoneyCell: renderMoneyCell,
      renderTimestampCell: renderTimestampCell
    };
  }

  angular.
    module('dataCards.services').
      factory('DataTypeFormatService', DataTypeFormatService);
})();
