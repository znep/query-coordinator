describe('test DataTypeFormatService output', function() {
  'use strict';

  var columnMetadata;

  beforeEach(module('dataCards'));

  var DataTypeFormatService;
  beforeEach(inject(function($injector) {
    DataTypeFormatService = $injector.get('DataTypeFormatService');
  }));

  describe('boolean cell formatting', function() {

    var BOOLEAN_DATA = [true, false, null];

    it('should render boolean cells with checkboxes for true, empty for false', function() {
      BOOLEAN_DATA.forEach(function(value) {
        var cellContent = DataTypeFormatService.renderBooleanCell(value);
        expect(cellContent).to.equal(value ? '✓' : '');
      });
    });

  });

  describe('number cell formatting', function() {

    var NUMBER_DATA = [
      0, 0.0, -0.0,
      1, 0.1, 0.01, 0.001, 0.0001, 10, 100, 1000, 10000, 100000, 1000000,
      -1, -0.1, -0.01, -0.001, -0.0001, -10, -100, -1000, -10000, -100000, -1000000,
      0.9, 0.99, 0.999, 0.09, 0.009, 0.0009, 0.99, 0.099, 0.0099, 0.0999,
      -0.9, -0.99, -0.999, -0.09, -0.009, -0.0009, -0.99, -0.099, -0.0099, -0.0999,
      9.9, 9.99, 99.9, 99.99, 999.9, 999.99, 999.999, 9999.99, 9999.999,
      -9.9, -9.99, -99.9, -99.99, -999.9, -999.99, -999.999, -9999.99, -9999.999
    ];

    describe('with percent data type', function() {

      // 123% | -12,345.678%
      var PERCENT_FORMAT_REGEX = /^-?\d{1,3}(,\d{3})*(\.\d+)?%$/;
      // 123.00% | -12,345.68%
      var PERCENT_FIXED_FORMAT_REGEX = /^-?\d{1,3}(,\d{3})*\.\d{2}%$/;
      // 12345% | -12345.678%
      var PERCENT_NOCOMMAS_FORMAT_REGEX = /^-?\d+(\.\d+)?%$/;
      // 123% | -12.345,678%
      var PERCENT_CUSTOM_SEPARATOR_FORMAT_REGEX = /^-?\d{1,3}(\.\d{3})*(,\d+)?%$/;

      it('should render number cells as percent values', function() {
        columnMetadata = {
          dataTypeName: 'percent'
        };
        NUMBER_DATA.forEach(function(value) {
          var cellContent = DataTypeFormatService.renderNumberCell(value, columnMetadata);
          expect(cellContent).to.match(PERCENT_FORMAT_REGEX);
          expect(cellContent).to.not.match(/^-?0\d/);
        });
      });

      it('should respect fixed precision', function() {
        columnMetadata = {
          dataTypeName: 'percent',
          format: {
            precision: 2
          }
        };
        NUMBER_DATA.forEach(function(value) {
          var cellContent = DataTypeFormatService.renderNumberCell(value, columnMetadata);
          expect(cellContent).to.match(PERCENT_FIXED_FORMAT_REGEX);
        });
      });

      it('should respect noCommas setting', function() {
        columnMetadata = {
          dataTypeName: 'percent',
          format: {
            noCommas: true
          }
        };
        NUMBER_DATA.forEach(function(value) {
          var cellContent = DataTypeFormatService.renderNumberCell(value, columnMetadata);
          expect(cellContent).to.match(PERCENT_NOCOMMAS_FORMAT_REGEX);
          expect(cellContent).to.not.match(/^-?0\d/);
        });
      });

      it('should respect custom separators', function() {
        columnMetadata = {
          dataTypeName: 'percent',
          format: {
            decimalSeparator: ',',
            groupSeparator: '.'
          }
        };
        NUMBER_DATA.forEach(function(value) {
          var cellContent = DataTypeFormatService.renderNumberCell(value, columnMetadata);
          expect(cellContent).to.match(PERCENT_CUSTOM_SEPARATOR_FORMAT_REGEX);
        });
      });

    });

    describe('with standard precisionStyle', function() {

      // 12,345 | -12,345.678
      var NUMBER_FORMAT_REGEX = /^-?(\d{4}|\d{1,3}(,\d{3})*(\.\d+)?)$/;
      // 12,345.00 | -12,345.68
      var NUMBER_FIXED_FORMAT_REGEX = /^-?\d{1,3}(,\d{3})*\.\d{2}$/;
      // 12345 | -12345.678
      var NUMBER_NOCOMMAS_FORMAT_REGEX = /^-?\d+(\.\d+)?$/;
      // 12.345 | -12.345,678
      var NUMBER_CUSTOM_SEPARATOR_FORMAT_REGEX = /^-?(\d{4}|\d{1,3}(\.\d{3})*(,\d+)?)$/;

      it('should render normal number cells', function() {
        columnMetadata = {
          dataTypeName: 'number'
        };
        NUMBER_DATA.forEach(function(value) {
          var cellContent = DataTypeFormatService.renderNumberCell(value, columnMetadata);
          expect(cellContent).to.match(NUMBER_FORMAT_REGEX);
        });
      });

      it('should respect fixed precision', function() {
        columnMetadata = {
          dataTypeName: 'number',
          format: {
            precision: 2
          }
        };
        NUMBER_DATA.forEach(function(value) {
          var cellContent = DataTypeFormatService.renderNumberCell(value, columnMetadata);
          expect(cellContent).to.match(NUMBER_FIXED_FORMAT_REGEX);
        });
      });

      it('should respect noCommas setting', function() {
        columnMetadata = {
          dataTypeName: 'number',
          format: {
            noCommas: true
          }
        };
        NUMBER_DATA.forEach(function(value) {
          var cellContent = DataTypeFormatService.renderNumberCell(value, columnMetadata);
          expect(cellContent).to.match(NUMBER_NOCOMMAS_FORMAT_REGEX);
        });
      });

      it('should apply noCommas when number of digits is 4 as a special case', function() {
        columnMetadata = {
          dataTypeName: 'number'
        };
        var values = _.filter(NUMBER_DATA, function(value) { return /^\-?\d{4}$/.test(value); })
        values.forEach(function(value) {
          var cellContent = DataTypeFormatService.renderNumberCell(value, columnMetadata);
          expect(cellContent).to.match(/\d{4}/);
        });
      });

      it('should respect custom separators', function() {
        columnMetadata = {
          dataTypeName: 'number',
          format: {
            decimalSeparator: ',',
            groupSeparator: '.'
          }
        };
        NUMBER_DATA.forEach(function(value) {
          var cellContent = DataTypeFormatService.renderNumberCell(value, columnMetadata);
          expect(cellContent).to.match(NUMBER_CUSTOM_SEPARATOR_FORMAT_REGEX);
        });
      });

    });

    describe('with percent precisionStyle', function() {

      // 123% | -12,345.678%
      var PERCENT_FORMAT_REGEX = /^-?\d{1,3}(,\d{3})*(\.\d+)?%$/;
      // 123.00% | -12,345.68%
      var PERCENT_FIXED_FORMAT_REGEX = /^-?\d{1,3}(,\d{3})*\.\d{2}%$/;
      // 12345% | -12345.678%
      var PERCENT_NOCOMMAS_FORMAT_REGEX = /^-?\d+(\.\d+)?%$/;
      // 123% | -12.345,678%
      var PERCENT_CUSTOM_SEPARATOR_FORMAT_REGEX = /^-?\d{1,3}(\.\d{3})*(,\d+)?%$/;

      it('should render number cells in percentage format', function() {
        columnMetadata = {
          dataTypeName: 'number',
          format: {
            precisionStyle: 'percentage'
          }
        };
        NUMBER_DATA.forEach(function(value) {
          var cellContent = DataTypeFormatService.renderNumberCell(value, columnMetadata);
          expect(cellContent).to.match(PERCENT_FORMAT_REGEX);
        });
      });

      it('should respect fixed precision', function() {
        columnMetadata = {
          dataTypeName: 'number',
          format: {
            precisionStyle: 'percentage',
            precision: 2
          }
        };
        NUMBER_DATA.forEach(function(value) {
          var cellContent = DataTypeFormatService.renderNumberCell(value, columnMetadata);
          expect(cellContent).to.match(PERCENT_FIXED_FORMAT_REGEX);
        });
      });

      it('should respect noCommas setting', function() {
        columnMetadata = {
          dataTypeName: 'number',
          format: {
            precisionStyle: 'percentage',
            noCommas: true
          }
        };
        NUMBER_DATA.forEach(function(value) {
          var cellContent = DataTypeFormatService.renderNumberCell(value, columnMetadata);
          expect(cellContent).to.match(PERCENT_NOCOMMAS_FORMAT_REGEX);
        });
      });

      it('should respect custom separators', function() {
        columnMetadata = {
          dataTypeName: 'number',
          format: {
            precisionStyle: 'percentage',
            decimalSeparator: ',',
            groupSeparator: '.'
          }
        };
        NUMBER_DATA.forEach(function(value) {
          var cellContent = DataTypeFormatService.renderNumberCell(value, columnMetadata);
          expect(cellContent).to.match(PERCENT_CUSTOM_SEPARATOR_FORMAT_REGEX);
        });
      });

    });

    describe('with currency precisionStyle', function() {

      // $100,012.345 | -$12.345
      var CURRENCY_FORMAT_REGEX = /^-?\$\d{1,3}(,\d{3})*(\.\d+)?$/;
      // $100,012.35 | -$12.35
      var CURRENCY_FIXED_FORMAT_REGEX = /^-?\$\d{1,3}(,\d{3})*(\.\d{2})?$/;
      // $100012.35 | -$12.35
      var CURRENCY_NOCOMMAS_FORMAT_REGEX = /^-?\$\d+(\.\d+)?$/;
      // £100.012,345 | -£12,345
      var CURRENCY_CUSTOM_SEPARATOR_AND_SYMBOL_FORMAT_REGEX = /^-?£\d{1,3}(\.\d{3})*(,\d+)?$/;

      it('should render number cells in currency format', function() {
        columnMetadata = {
          dataTypeName: 'number',
          format: {
            precisionStyle: 'currency'
          }
        };
        NUMBER_DATA.forEach(function(value) {
          var cellContent = DataTypeFormatService.renderNumberCell(value, columnMetadata);
          expect(cellContent).to.match(CURRENCY_FORMAT_REGEX);
        });
      });

      it('should respect fixed precision', function() {
        columnMetadata = {
          dataTypeName: 'number',
          format: {
            precisionStyle: 'currency',
            precision: 2
          }
        };
        NUMBER_DATA.forEach(function(value) {
          var cellContent = DataTypeFormatService.renderNumberCell(value, columnMetadata);
          expect(cellContent).to.match(CURRENCY_FIXED_FORMAT_REGEX);
        });
      });

      it('should respect noCommas setting', function() {
        columnMetadata = {
          dataTypeName: 'number',
          format: {
            precisionStyle: 'currency',
            noCommas: true
          }
        };
        NUMBER_DATA.forEach(function(value) {
          var cellContent = DataTypeFormatService.renderNumberCell(value, columnMetadata);
          expect(cellContent).to.match(CURRENCY_NOCOMMAS_FORMAT_REGEX);
        });
      });

      it('should respect custom separators and currency symbols', function() {
        columnMetadata = {
          dataTypeName: 'number',
          format: {
            precisionStyle: 'currency',
            currency: '£',
            decimalSeparator: ',',
            groupSeparator: '.'
          }
        };
        NUMBER_DATA.forEach(function(value) {
          var cellContent = DataTypeFormatService.renderNumberCell(value, columnMetadata);
          expect(cellContent).to.match(CURRENCY_CUSTOM_SEPARATOR_AND_SYMBOL_FORMAT_REGEX);
        });
      });

    });

    describe('with financial precisionStyle', function() {

      // 100,012.345 | (12.345)
      var FINANCIAL_FORMAT_REGEX = /^\(?\d{1,3}(,\d{3})*(\.\d+)?\)?$/;
      // 100,012.35 | (12.35)
      var FINANCIAL_FIXED_FORMAT_REGEX = /^\(?\d{1,3}(,\d{3})*(\.\d{2})?\)?$/;
      // 100012.35 | (12.35)
      var FINANCIAL_NOCOMMAS_FORMAT_REGEX = /^\(?\d+(\.\d+)?\)?$/;
      // 100.012,345 | (12,345)
      var FINANCIAL_CUSTOM_SEPARATOR_FORMAT_REGEX = /^\(?\d{1,3}(\.\d{3})*(,\d+)?\)?$/;

      it('should render number cells in financial format', function() {
        columnMetadata = {
          dataTypeName: 'number',
          format: {
            precisionStyle: 'financial'
          }
        };
        NUMBER_DATA.forEach(function(value) {
          var cellContent = DataTypeFormatService.renderNumberCell(value, columnMetadata);
          expect(cellContent).to.match(FINANCIAL_FORMAT_REGEX);
        });
      });

      it('should respect fixed precision', function() {
        columnMetadata = {
          dataTypeName: 'number',
          format: {
            precisionStyle: 'financial',
            precision: 2
          }
        };
        NUMBER_DATA.forEach(function(value) {
          var cellContent = DataTypeFormatService.renderNumberCell(value, columnMetadata);
          expect(cellContent).to.match(FINANCIAL_FIXED_FORMAT_REGEX);
        });
      });

      it('should respect noCommas setting', function() {
        columnMetadata = {
          dataTypeName: 'number',
          format: {
            precisionStyle: 'financial',
            noCommas: true
          }
        };
        NUMBER_DATA.forEach(function(value) {
          var cellContent = DataTypeFormatService.renderNumberCell(value, columnMetadata);
          expect(cellContent).to.match(FINANCIAL_NOCOMMAS_FORMAT_REGEX);
        });
      });

      it('should respect custom separators', function() {
        columnMetadata = {
          dataTypeName: 'number',
          format: {
            precisionStyle: 'financial',
            decimalSeparator: ',',
            groupSeparator: '.'
          }
        };
        NUMBER_DATA.forEach(function(value) {
          var cellContent = DataTypeFormatService.renderNumberCell(value, columnMetadata);
          expect(cellContent).to.match(FINANCIAL_CUSTOM_SEPARATOR_FORMAT_REGEX);
        });
      });

    });

    describe('with scientific precisionStyle', function() {

      // 1.234e+5 | -1.2348e-5 | 0e+0
      var SCIENTIFIC_FORMAT_REGEX = /^-?\d(\.\d+)?e[+-]\d+$/;
      // 1.23e+3 | -1.234e-5 | 0.00e+0
      var SCIENTIFIC_FIXED_FORMAT_REGEX = /^-?\d\.\d{2}e[+-]\d+$/;
      // 1,23e+3 | -1,234e-5 | 0e+0
      var SCIENTIFIC_CUSTOM_SEPARATOR_FORMAT_REGEX = /^-?\d(,\d+)?e[+-]\d+$/;

      it('should render number cells in scientific format', function() {
        columnMetadata = {
          dataTypeName: 'number',
          format: {
            precisionStyle: 'scientific'
          }
        };
        NUMBER_DATA.forEach(function(value) {
          var cellContent = DataTypeFormatService.renderNumberCell(value, columnMetadata);
          expect(cellContent).to.match(SCIENTIFIC_FORMAT_REGEX);
        });
      });

      it('should respect fixed precision', function() {
        columnMetadata = {
          dataTypeName: 'number',
          format: {
            precisionStyle: 'scientific',
            precision: 2
          }
        };
        NUMBER_DATA.forEach(function(value) {
          var cellContent = DataTypeFormatService.renderNumberCell(value, columnMetadata);
          expect(cellContent).to.match(SCIENTIFIC_FIXED_FORMAT_REGEX);
        });
      });

      it('should respect a custom decimal separator', function() {
        columnMetadata = {
          dataTypeName: 'number',
          format: {
            precisionStyle: 'scientific',
            decimalSeparator: ',',
            groupSeparator: '.' // unused
          }
        };
        NUMBER_DATA.forEach(function(value) {
          var cellContent = DataTypeFormatService.renderNumberCell(value, columnMetadata);
          expect(cellContent).to.match(SCIENTIFIC_CUSTOM_SEPARATOR_FORMAT_REGEX);
        });
      })

    });

    it('should render number cells according to a custom mask', function() {
      var MASK_FORMAT_REGEX = /^([0-9.-]{1,3}|[0-9.-]{3}@[0-9.-]+)$/;
      columnMetadata = {
        dataTypeName: 'number',
        format: {
          mask: '###@###'
        }
      };
      NUMBER_DATA.forEach(function(value) {
        var cellContent = DataTypeFormatService.renderNumberCell(value, columnMetadata);
        expect(cellContent).to.match(MASK_FORMAT_REGEX);
      });
    });

  });

  describe('geo cell formatting', function() {

    // (53.936172°, 122.653274°)
    var COORDINATES_REGEX = /^\(-?\d+\.\d+°,\s-?\d+\.\d+°\)$/;
    // <span title="Latitude"> 53.936172° </span>
    var COORDINATES_HTML_REGEX = /\<span\stitle=\"(.*)\"\>-?\d+\.\d+°\<\/span\>/;

    var POINT_DATA = [{
      'type': 'Point',
      'coordinates': [122.653274, 53.936172]
    }, {
      'type': 'Point',
      'coordinates': [-87.653274, 41.936172]
    }, {
      'type': 'Point',
      'coordinates': [120.653274, -31.936172]
    }, {
      'type': 'Point',
      'coordinates': [-120.653274, -31.936172]
    }];

    columnMetadata = {
      dataTypeName: 'location'
    };

    it('should render point cells as plain text', function() {
      POINT_DATA.forEach(function(value) {
        var cellContent = DataTypeFormatService.renderGeoCell(value, columnMetadata);
        expect(cellContent).to.match(COORDINATES_REGEX);
      });
    });

    it('should render point cells with latitude & longitude', function() {
      POINT_DATA.forEach(function(value) {
        var cellContent = DataTypeFormatService.renderGeoCellHTML(value, columnMetadata);
        var pointCellSpans = cellContent.split(',').map(function(span) {
          return span.trim();
        });

        expect(pointCellSpans).to.have.length(2);

        expect(pointCellSpans[0]).to.match(COORDINATES_HTML_REGEX);
        var matchLat = COORDINATES_HTML_REGEX.exec(pointCellSpans[0]);
        expect(matchLat[1]).to.equal('Latitude');
        expect(pointCellSpans[1]).to.match(COORDINATES_HTML_REGEX);
        var matchLng = COORDINATES_HTML_REGEX.exec(pointCellSpans[1]);
        expect(matchLng[1]).to.equal('Longitude');
      });
    });

  });

  describe('currency formatting', function() {

    var MONEY_DATA = [
      '0.40', '300', '500', '-200', '1999.99', '.25',
      '10000', '399000', '-40000', '-29578940839201'
    ];

    // -$12,345.67
    var MONEY_REGEX = /^-?\$\d{1,3}(,\d{3})*\.\d{2}$/;
    // -£12.345,6
    var MONEY_WITH_USER_FORMAT_REGEX = /^-?€\d{1,3}(\.\d{3})*,\d{2}$/;
    // -$123.45 | -$12.3K
    var MONEY_HUMANE_FORMAT_REGEX = /^-?\$(\d{1,3}\.\d{2}|\d{1,3}(\.\d{1,2})?[KMBTPEZY])$/;

    it('should render money cells as US currency with cents by default', function() {
      columnMetadata = {
        dataTypeName: 'money'
      };
      MONEY_DATA.forEach(function(value) {
        var cellContent = DataTypeFormatService.renderMoneyCell(value, columnMetadata);
        expect(cellContent).to.match(MONEY_REGEX);
      });
    });

    it('should render money cells with user format properties', function() {
      columnMetadata = {
        dataTypeName: 'money',
        format: {
          currency: '€',
          decimalSeparator: ',',
          groupSeparator: '.'
        }
      };
      MONEY_DATA.forEach(function(value) {
        var cellContent = DataTypeFormatService.renderMoneyCell(value, columnMetadata);
        expect(cellContent).to.match(MONEY_WITH_USER_FORMAT_REGEX);
      });
    });

    it('should render money cells with humane format properties', function() {
      columnMetadata = {
        dataTypeName: 'money',
        format: {
          humane: true
        }
      };
      MONEY_DATA.forEach(function(value) {
        var cellContent = DataTypeFormatService.renderMoneyCell(value, columnMetadata);
        expect(cellContent).to.match(MONEY_HUMANE_FORMAT_REGEX);
      });
    });

  });

  // TODO: verify behavior and fix!
  // This suite contains a test that was skipped prior CORE-5447's refactor, and
  // it can produce inconsistent test results when run on Jenkins instead of
  // locally - related to the failure mode seen inconsistently for CORE-7057.
  xdescribe('date and time formatting', function() {

    var TIMESTAMP_DATA = [
      '2001-08-11T13:44:55',
      '1981-04-19T12:12:11',
      '2001-02-13T09:17:11',
      '2001-08-11T00:00:00',
      '1981-04-19T00:00:00'
    ];

    // 2014 Jun 28 12:34:56 PM
    var TIMESTAMP_REGEX = /^\d{4}\s\w{3}\s[0-3][0-9]\s[01][0-9]:[0-5][0-9]:[0-5][0-9]\s[AP]M$/;
    // Jun 28, 2014 12:34 PM
    var TIMESTAMP_WITH_USER_FORMAT_REGEX = /^\w{3}\s[0-3][0-9],\s\d{4}\s[01][0-9]:[0-5][0-9]\s[AP]M$/;
    // 2014 Jun 28
    var TIMESTAMP_NO_HR_MIN_SEC_REGEX = /^\d{4}\s\w{3}\s[0-3][0-9]$/;

    it('should render timestamp cells with date & time as YYYY MMM DD hh:mm:ss A by default', function() {
      columnMetadata = {
        dataTypeName: 'calendar_date'
      };
      TIMESTAMP_DATA.forEach(function(value) {
        var cellContent = DataTypeFormatService.renderTimestampCell(value, columnMetadata);
        expect(cellContent).to.match(TIMESTAMP_REGEX);
      });
    });

    it('should render timestamp cells with a custom timestamp format property', function() {
      columnMetadata = {
        dataTypeName: 'calendar_date',
        format: {
          formatString: 'MMM DD, YYYY hh:mm A'
        }
      };
      TIMESTAMP_DATA.forEach(function(value) {
        var cellContent = DataTypeFormatService.renderTimestampCell(value, columnMetadata);
        expect(cellContent).to.match(TIMESTAMP_WITH_USER_FORMAT_REGEX);
      });
    });

    it('should render timestamp cells with date & time as YYYY MMM DD if hh:mm:ss are all 0', function() {
      columnMetadata = {
        dataTypeName: 'calendar_date'
      };
      var values = _.filter(TIMESTAMP_DATA, function(value) { return /00:00:00$/.test(value); });
      values.forEach(function(value) {
        var cellContent = DataTypeFormatService.renderTimestampCell(value, columnMetadata);
        expect(cellContent).to.match(TIMESTAMP_NO_HR_MIN_SEC_REGEX);
      });
    });

    it('should render invalid dates as blank cells', function() {
      columnMetadata = {
        dataTypeName: 'calendar_date'
      };
      var values = _.map(TIMESTAMP_DATA, function(value) { return value + 'xx'; });
      values.forEach(function(value) {
        var cellContent = DataTypeFormatService.renderTimestampCell(value, columnMetadata);
        expect(cellContent).to.equal('');
      });
    });

  });

});
