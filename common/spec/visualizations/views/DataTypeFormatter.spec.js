var _ = require('lodash');
var DataTypeFormatter = require('common/visualizations/views/DataTypeFormatter');

// 123% | -12,345.678%
var PERCENT_FORMAT_REGEX = /^-?\d{1,3}(,\d{3})*(\.\d+)?%$/;
// 123.00% | -12,345.68%
var PERCENT_FIXED_FORMAT_REGEX = /^-?\d{1,3}(,\d{3})*\.\d{2}%$/;
// 12345% | -12345.678%
var PERCENT_NOCOMMAS_FORMAT_REGEX = /^-?\d+(\.\d+)?%$/;
// 123% | -12.345,678%
var PERCENT_CUSTOM_SEPARATOR_FORMAT_REGEX = /^-?\d{1,3}(\.\d{3})*(,\d+)?%$/;

// 12,345 | -12,345.678
var NUMBER_FORMAT_REGEX = /^-?(\d{4}|\d{1,3}(,\d{3})*(\.\d+)?)$/;
// 12,345.00 | -12,345.68
var NUMBER_FIXED_FORMAT_REGEX = /^-?\d{1,3}(,\d{3})*\.\d{2}$/;
// 12345 | -12345.678
var NUMBER_NOCOMMAS_FORMAT_REGEX = /^-?\d+(\.\d+)?$/;
// 12.345 | -12.345,678
var NUMBER_CUSTOM_SEPARATOR_FORMAT_REGEX = /^-?(\d{4}|\d{1,3}(\.\d{3})*(,\d+)?)$/;

// $100,012.345 | -$12.345
var CURRENCY_FORMAT_REGEX = /^-?\$\d{1,3}(,\d{3})*(\.\d+)?$/;
// $100,012.35 | -$12.35
var CURRENCY_FIXED_FORMAT_REGEX = /^-?\$\d{1,3}(,\d{3})*(\.\d{2})?$/;
// $100012.35 | -$12.35
var CURRENCY_NOCOMMAS_FORMAT_REGEX = /^-?\$\d+(\.\d+)?$/;
// £100.012,345 | -£12,345
var CURRENCY_CUSTOM_SEPARATOR_AND_SYMBOL_FORMAT_REGEX = /^-?£\d{1,3}(\.\d{3})*(,\d+)?$/;

// 100,012.345 | (12.345)
var FINANCIAL_FORMAT_REGEX = /^\(?\d{1,3}(,\d{3})*(\.\d+)?\)?$/;
// 100,012.35 | (12.35)
var FINANCIAL_FIXED_FORMAT_REGEX = /^\(?\d{1,3}(,\d{3})*(\.\d{2})?\)?$/;
// 100012.35 | (12.35)
var FINANCIAL_NOCOMMAS_FORMAT_REGEX = /^\(?\d+(\.\d+)?\)?$/;
// 100.012,345 | (12,345)
var FINANCIAL_CUSTOM_SEPARATOR_FORMAT_REGEX = /^\(?\d{1,3}(\.\d{3})*(,\d+)?\)?$/;

// 1.234e+5 | -1.2348e-5 | 0e+0
var SCIENTIFIC_FORMAT_REGEX = /^-?\d(\.\d+)?e[+-]\d+$/;
// 1.23e+3 | -1.234e-5 | 0.00e+0
var SCIENTIFIC_FIXED_FORMAT_REGEX = /^-?\d\.\d{2}e[+-]\d+$/;
// 1,23e+3 | -1,234e-5 | 0e+0
var SCIENTIFIC_CUSTOM_SEPARATOR_FORMAT_REGEX = /^-?\d(,\d+)?e[+-]\d+$/;

// (53.936172°, 122.653274°)
var COORDINATES_REGEX = /^\(-?\d+\.\d+°,\s-?\d+\.\d+°\)$/;
// <span title="Latitude"> 53.936172° </span>
var COORDINATES_HTML_REGEX = /\<span\stitle=\"(.*)\"\>-?\d+\.\d+°\<\/span\>/;

// -$12,345.67
var MONEY_REGEX = /^-?\$\d{1,3}(,\d{3})*\.\d{2}$/;
// -£12.345,6
var MONEY_WITH_USER_FORMAT_REGEX = /^-?€\d{1,3}(\.\d{3})*,\d{2}$/;
// -$123.45 | -$12.3K
var MONEY_HUMANE_FORMAT_REGEX = /^-?\$(\d{1,3}\.\d{2}|\d{1,3}(\.\d{1,2})?[KMBTPEZY])$/;

// 2014 Jun 28 12:34:56 PM
var TIMESTAMP_REGEX = /^\d{4}\s\w{3}\s[0-3][0-9]\s[01][0-9]:[0-5][0-9]:[0-5][0-9]\s[AP]M$/;
// Jun 28, 2014 12:34 PM
var TIMESTAMP_WITH_USER_FORMAT_REGEX = /^\w{3}\s[0-3][0-9],\s\d{4}\s[01][0-9]:[0-5][0-9]\s[AP]M$/;
// 2014 Jun 28
var TIMESTAMP_NO_HR_MIN_SEC_REGEX = /^\d{4}\s\w{3}\s[0-3][0-9]$/;

describe('DataTypeFormatter', function() {
  'use strict';

  var columnMetadata;

  describe('when something goes haywire', function() {
    let consoleErrorStub;
    let lodashEscapeStub;

    beforeEach(function() {
      consoleErrorStub = sinon.stub(console, 'error');
      lodashEscapeStub = sinon.stub(_, 'escape', function() {
        throw new Error('UNESCAPABLE!');
      });
    });

    afterEach(function() {
      consoleErrorStub.restore();
      lodashEscapeStub.restore();
    });

    it('records an error message', function() {
      var cellContent = DataTypeFormatter.renderCell('anything', { renderTypeName: 'anything' });
      expect(cellContent).to.equal(undefined);
      sinon.assert.called(consoleErrorStub);
    });
  });

  describe('boolean cell formatting', function() {

    var BOOLEAN_DATA = [true, false, null];

    it('should render boolean cells with checkboxes for true, empty for false', function() {
      BOOLEAN_DATA.forEach(function(value) {
        var cellContent = DataTypeFormatter.renderBooleanCell(value);
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

    describe('with percent data type (OBE style)', function() {

      it('should render number cells as percent values', function() {
        columnMetadata = {
          renderTypeName: 'percent'
        };
        NUMBER_DATA.forEach(function(value) {
          var cellContent = DataTypeFormatter.renderNumberCell(value, columnMetadata);
          expect(cellContent).to.match(PERCENT_FORMAT_REGEX);
          expect(cellContent).to.not.match(/^-?0\d/);
        });
      });

      it('should render number cells as percent values with format.view set', function() {
        columnMetadata = {
          renderTypeName: 'percent',
          format: {
            view: 'percent_bar_and_text'
          }
        };

        expect(DataTypeFormatter.renderNumberCell(100, columnMetadata)).to.equal('100%');
      });

      it('should respect fixed precision', function() {
        columnMetadata = {
          renderTypeName: 'percent',
          format: {
            precision: 2
          }
        };
        NUMBER_DATA.forEach(function(value) {
          var cellContent = DataTypeFormatter.renderNumberCell(value, columnMetadata);
          expect(cellContent).to.match(PERCENT_FIXED_FORMAT_REGEX);
        });
      });

      it('should respect noCommas setting', function() {
        columnMetadata = {
          renderTypeName: 'percent',
          format: {
            noCommas: true
          }
        };
        NUMBER_DATA.forEach(function(value) {
          var cellContent = DataTypeFormatter.renderNumberCell(value, columnMetadata);
          expect(cellContent).to.match(PERCENT_NOCOMMAS_FORMAT_REGEX);
          expect(cellContent).to.not.match(/^-?0\d/);
        });
      });

      it('should respect custom separators', function() {
        columnMetadata = {
          renderTypeName: 'percent',
          format: {
            decimalSeparator: ',',
            groupSeparator: '.'
          }
        };
        NUMBER_DATA.forEach(function(value) {
          var cellContent = DataTypeFormatter.renderNumberCell(value, columnMetadata);
          expect(cellContent).to.match(PERCENT_CUSTOM_SEPARATOR_FORMAT_REGEX);
        });
      });
    });

    describe('with percent data type (NBE style)', function() {

      it('should render number cells as percent values', function() {
        columnMetadata = {
          renderTypeName: 'number',
          format: {
            view: 'percent_bar_and_text'
          }
        };
        NUMBER_DATA.forEach(function(value) {
          var cellContent = DataTypeFormatter.renderNumberCell(value, columnMetadata);
          expect(cellContent).to.match(PERCENT_FORMAT_REGEX);
          expect(cellContent).to.not.match(/^-?0\d/);
        });
      });

      it('should respect fixed precision', function() {
        columnMetadata = {
          renderTypeName: 'number',
          format: {
            precision: 2,
            view: 'percent_bar_and_text'
          }
        };
        NUMBER_DATA.forEach(function(value) {
          var cellContent = DataTypeFormatter.renderNumberCell(value, columnMetadata);
          expect(cellContent).to.match(PERCENT_FIXED_FORMAT_REGEX);
        });
      });

      it('should respect noCommas setting', function() {
        columnMetadata = {
          renderTypeName: 'number',
          format: {
            noCommas: true,
            view: 'percent_bar_and_text'
          }
        };
        NUMBER_DATA.forEach(function(value) {
          var cellContent = DataTypeFormatter.renderNumberCell(value, columnMetadata);
          expect(cellContent).to.match(PERCENT_NOCOMMAS_FORMAT_REGEX);
          expect(cellContent).to.not.match(/^-?0\d/);
        });
      });

      it('should respect custom separators', function() {
        columnMetadata = {
          renderTypeName: 'number',
          format: {
            decimalSeparator: ',',
            groupSeparator: '.',
            view: 'percent_bar_and_text'
          }
        };
        NUMBER_DATA.forEach(function(value) {
          var cellContent = DataTypeFormatter.renderNumberCell(value, columnMetadata);
          expect(cellContent).to.match(PERCENT_CUSTOM_SEPARATOR_FORMAT_REGEX);
        });
      });
    });

    describe('with standard precisionStyle', function() {

      it('should render normal number cells', function() {
        columnMetadata = {
          renderTypeName: 'number'
        };
        NUMBER_DATA.forEach(function(value) {
          var cellContent = DataTypeFormatter.renderNumberCell(value, columnMetadata);
          expect(cellContent).to.match(NUMBER_FORMAT_REGEX);
        });
      });

      it('should respect fixed precision', function() {
        columnMetadata = {
          renderTypeName: 'number',
          format: {
            precision: 2
          }
        };
        NUMBER_DATA.forEach(function(value) {
          var cellContent = DataTypeFormatter.renderNumberCell(value, columnMetadata);
          expect(cellContent).to.match(NUMBER_FIXED_FORMAT_REGEX);
        });
      });

      it('should respect noCommas setting', function() {
        columnMetadata = {
          renderTypeName: 'number',
          format: {
            noCommas: true
          }
        };
        NUMBER_DATA.forEach(function(value) {
          var cellContent = DataTypeFormatter.renderNumberCell(value, columnMetadata);
          expect(cellContent).to.match(NUMBER_NOCOMMAS_FORMAT_REGEX);
        });
      });

      it('should apply noCommas when number of digits is 4 as a special case', function() {
        columnMetadata = {
          renderTypeName: 'number'
        };
        var values = _.filter(NUMBER_DATA, function(value) { return /^\-?\d{4}$/.test(value); })
        values.forEach(function(value) {
          var cellContent = DataTypeFormatter.renderNumberCell(value, columnMetadata);
          expect(cellContent).to.match(/\d{4}/);
        });
      });

      it('should respect custom separators', function() {
        columnMetadata = {
          renderTypeName: 'number',
          format: {
            decimalSeparator: ',',
            groupSeparator: '.'
          }
        };
        NUMBER_DATA.forEach(function(value) {
          var cellContent = DataTypeFormatter.renderNumberCell(value, columnMetadata);
          expect(cellContent).to.match(NUMBER_CUSTOM_SEPARATOR_FORMAT_REGEX);
        });
      });

    });

    describe('with percent precisionStyle', function() {

      it('should render number cells in percentage format', function() {
        columnMetadata = {
          renderTypeName: 'number',
          format: {
            precisionStyle: 'percentage'
          }
        };
        NUMBER_DATA.forEach(function(value) {
          var cellContent = DataTypeFormatter.renderNumberCell(value, columnMetadata);
          expect(cellContent).to.match(PERCENT_FORMAT_REGEX);
        });
      });

      it('should respect fixed precision', function() {
        columnMetadata = {
          renderTypeName: 'number',
          format: {
            precisionStyle: 'percentage',
            precision: 2
          }
        };
        NUMBER_DATA.forEach(function(value) {
          var cellContent = DataTypeFormatter.renderNumberCell(value, columnMetadata);
          expect(cellContent).to.match(PERCENT_FIXED_FORMAT_REGEX);
        });
      });

      it('should respect noCommas setting', function() {
        columnMetadata = {
          renderTypeName: 'number',
          format: {
            precisionStyle: 'percentage',
            noCommas: true
          }
        };
        NUMBER_DATA.forEach(function(value) {
          var cellContent = DataTypeFormatter.renderNumberCell(value, columnMetadata);
          expect(cellContent).to.match(PERCENT_NOCOMMAS_FORMAT_REGEX);
        });
      });

      it('should respect custom separators', function() {
        columnMetadata = {
          renderTypeName: 'number',
          format: {
            precisionStyle: 'percentage',
            decimalSeparator: ',',
            groupSeparator: '.'
          }
        };
        NUMBER_DATA.forEach(function(value) {
          var cellContent = DataTypeFormatter.renderNumberCell(value, columnMetadata);
          expect(cellContent).to.match(PERCENT_CUSTOM_SEPARATOR_FORMAT_REGEX);
        });
      });

    });

    describe('with currency precisionStyle', function() {

      it('should render number cells in currency format', function() {
        columnMetadata = {
          renderTypeName: 'number',
          format: {
            precisionStyle: 'currency'
          }
        };
        NUMBER_DATA.forEach(function(value) {
          var cellContent = DataTypeFormatter.renderNumberCell(value, columnMetadata);
          expect(cellContent).to.match(CURRENCY_FORMAT_REGEX);
        });
      });

      it('should respect fixed precision', function() {
        columnMetadata = {
          renderTypeName: 'number',
          format: {
            precisionStyle: 'currency',
            precision: 2
          }
        };
        NUMBER_DATA.forEach(function(value) {
          var cellContent = DataTypeFormatter.renderNumberCell(value, columnMetadata);
          expect(cellContent).to.match(CURRENCY_FIXED_FORMAT_REGEX);
        });
      });

      it('should respect noCommas setting', function() {
        columnMetadata = {
          renderTypeName: 'number',
          format: {
            precisionStyle: 'currency',
            noCommas: true
          }
        };
        NUMBER_DATA.forEach(function(value) {
          var cellContent = DataTypeFormatter.renderNumberCell(value, columnMetadata);
          expect(cellContent).to.match(CURRENCY_NOCOMMAS_FORMAT_REGEX);
        });
      });

      it('should respect custom separators and currency symbols', function() {
        columnMetadata = {
          renderTypeName: 'number',
          format: {
            precisionStyle: 'currency',
            currency: '£',
            decimalSeparator: ',',
            groupSeparator: '.'
          }
        };
        NUMBER_DATA.forEach(function(value) {
          var cellContent = DataTypeFormatter.renderNumberCell(value, columnMetadata);
          expect(cellContent).to.match(CURRENCY_CUSTOM_SEPARATOR_AND_SYMBOL_FORMAT_REGEX);
        });
      });

    });

    describe('with financial precisionStyle', function() {

      it('should render number cells in financial format', function() {
        columnMetadata = {
          renderTypeName: 'number',
          format: {
            precisionStyle: 'financial'
          }
        };
        NUMBER_DATA.forEach(function(value) {
          var cellContent = DataTypeFormatter.renderNumberCell(value, columnMetadata);
          expect(cellContent).to.match(FINANCIAL_FORMAT_REGEX);
        });
      });

      it('should respect fixed precision', function() {
        columnMetadata = {
          renderTypeName: 'number',
          format: {
            precisionStyle: 'financial',
            precision: 2
          }
        };
        NUMBER_DATA.forEach(function(value) {
          var cellContent = DataTypeFormatter.renderNumberCell(value, columnMetadata);
          expect(cellContent).to.match(FINANCIAL_FIXED_FORMAT_REGEX);
        });
      });

      it('should respect noCommas setting', function() {
        columnMetadata = {
          renderTypeName: 'number',
          format: {
            precisionStyle: 'financial',
            noCommas: true
          }
        };
        NUMBER_DATA.forEach(function(value) {
          var cellContent = DataTypeFormatter.renderNumberCell(value, columnMetadata);
          expect(cellContent).to.match(FINANCIAL_NOCOMMAS_FORMAT_REGEX);
        });
      });

      it('should respect custom separators', function() {
        columnMetadata = {
          renderTypeName: 'number',
          format: {
            precisionStyle: 'financial',
            decimalSeparator: ',',
            groupSeparator: '.'
          }
        };
        NUMBER_DATA.forEach(function(value) {
          var cellContent = DataTypeFormatter.renderNumberCell(value, columnMetadata);
          expect(cellContent).to.match(FINANCIAL_CUSTOM_SEPARATOR_FORMAT_REGEX);
        });
      });

    });

    describe('with scientific precisionStyle', function() {

      it('should render number cells in scientific format', function() {
        columnMetadata = {
          renderTypeName: 'number',
          format: {
            precisionStyle: 'scientific'
          }
        };
        NUMBER_DATA.forEach(function(value) {
          var cellContent = DataTypeFormatter.renderNumberCell(value, columnMetadata);
          expect(cellContent).to.match(SCIENTIFIC_FORMAT_REGEX);
        });
      });

      it('should respect fixed precision', function() {
        columnMetadata = {
          renderTypeName: 'number',
          format: {
            precisionStyle: 'scientific',
            precision: 2
          }
        };
        NUMBER_DATA.forEach(function(value) {
          var cellContent = DataTypeFormatter.renderNumberCell(value, columnMetadata);
          expect(cellContent).to.match(SCIENTIFIC_FIXED_FORMAT_REGEX);
        });
      });

      it('should respect a custom decimal separator', function() {
        columnMetadata = {
          renderTypeName: 'number',
          format: {
            precisionStyle: 'scientific',
            decimalSeparator: ',',
            groupSeparator: '.' // unused
          }
        };
        NUMBER_DATA.forEach(function(value) {
          var cellContent = DataTypeFormatter.renderNumberCell(value, columnMetadata);
          expect(cellContent).to.match(SCIENTIFIC_CUSTOM_SEPARATOR_FORMAT_REGEX);
        });
      })

    });

    it('should render number cells according to a custom mask', function() {
      var MASK_FORMAT_REGEX = /^([0-9.-]{1,3}|[0-9.-]{3}@[0-9.-]+)$/;
      columnMetadata = {
        renderTypeName: 'number',
        format: {
          mask: '###@###'
        }
      };
      NUMBER_DATA.forEach(function(value) {
        var cellContent = DataTypeFormatter.renderNumberCell(value, columnMetadata);
        expect(cellContent).to.match(MASK_FORMAT_REGEX);
      });
    });

  });

  describe('geo cell formatting', function() {

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
      renderTypeName: 'location'
    };

    it('should render point cells as plain text', function() {
      POINT_DATA.forEach(function(value) {
        var cellContent = DataTypeFormatter.renderGeoCell(value, columnMetadata);
        expect(cellContent).to.match(COORDINATES_REGEX);
      });
    });

    it('should render point cells with latitude & longitude', function() {
      POINT_DATA.forEach(function(value) {
        var cellContent = DataTypeFormatter.renderGeoCellHTML(
          value,
          columnMetadata
        );
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

    it('should render money cells as US currency with cents by default', function() {
      columnMetadata = {
        renderTypeName: 'money'
      };
      MONEY_DATA.forEach(function(value) {
        var cellContent = DataTypeFormatter.renderMoneyCell(value, columnMetadata);
        expect(cellContent).to.match(MONEY_REGEX);
      });
    });

    it('should render money cells with user format properties', function() {
      columnMetadata = {
        renderTypeName: 'money',
        format: {
          currency: 'EUR',
          decimalSeparator: ',',
          groupSeparator: '.'
        }
      };
      MONEY_DATA.forEach(function(value) {
        var cellContent = DataTypeFormatter.renderMoneyCell(value, columnMetadata);
        expect(cellContent).to.match(MONEY_WITH_USER_FORMAT_REGEX);
      });
    });

    it('should render money cells with humane format properties', function() {
      columnMetadata = {
        renderTypeName: 'money',
        format: {
          humane: 'true'
        }
      };
      MONEY_DATA.forEach(function(value) {
        var cellContent = DataTypeFormatter.renderMoneyCell(value, columnMetadata);
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

    it('should render timestamp cells with date & time as YYYY MMM DD hh:mm:ss A by default', function() {
      columnMetadata = {
        renderTypeName: 'calendar_date'
      };
      TIMESTAMP_DATA.forEach(function(value) {
        var cellContent = DataTypeFormatter.renderTimestampCell(value, columnMetadata);
        expect(cellContent).to.match(TIMESTAMP_REGEX);
      });
    });

    it('should render timestamp cells with a custom timestamp format property', function() {
      columnMetadata = {
        renderTypeName: 'calendar_date',
        format: {
          formatString: 'MMM DD, YYYY hh:mm A'
        }
      };
      TIMESTAMP_DATA.forEach(function(value) {
        var cellContent = DataTypeFormatter.renderTimestampCell(value, columnMetadata);
        expect(cellContent).to.match(TIMESTAMP_WITH_USER_FORMAT_REGEX);
      });
    });

    it('should render timestamp cells with date & time as YYYY MMM DD if hh:mm:ss are all 0', function() {
      columnMetadata = {
        renderTypeName: 'calendar_date'
      };
      var values = _.filter(TIMESTAMP_DATA, function(value) { return /00:00:00$/.test(value); });
      values.forEach(function(value) {
        var cellContent = DataTypeFormatter.renderTimestampCell(value, columnMetadata);
        expect(cellContent).to.match(TIMESTAMP_NO_HR_MIN_SEC_REGEX);
      });
    });

    it('should render invalid dates as blank cells', function() {
      columnMetadata = {
        renderTypeName: 'calendar_date'
      };
      var values = _.map(TIMESTAMP_DATA, function(value) { return value + 'xx'; });
      values.forEach(function(value) {
        var cellContent = DataTypeFormatter.renderTimestampCell(value, columnMetadata);
        expect(cellContent).to.equal('');
      });
    });

  });

  describe('url formatting', function() {
    it('should render a link', function() {
      var cellContent = DataTypeFormatter.renderUrlCellHTML({
        url: 'https://socrata.com',
        description: 'wombats'
      });
      var expected = '<a href="https://socrata.com" target="_blank" rel="external">wombats</a>';
      expect(cellContent).to.equal(expected);
    });

    it('should render an empty string if no data', function() {
      var cellContent = DataTypeFormatter.renderUrlCellHTML({});
      expect(cellContent).to.equal('');
    });
  });

  describe('email formatting', function() {
    it('should render a link', function() {
      var cellContent = DataTypeFormatter.renderEmailCellHTML('a@b.com');
      var expected = '<a href="mailto:a@b.com" target="_blank" rel="external">a@b.com</a>';
      expect(cellContent).to.equal(expected);
    });

    it('should render an empty string if no data', function() {
      var cellContent = DataTypeFormatter.renderEmailCellHTML({});
      expect(cellContent).to.equal('');
    });
  });

  describe('phone formatting', function() {
    it('should render a link without extra characters in the href', function() {
      var cellContent = DataTypeFormatter.renderPhoneCellHTML({
        phone_number: 'Other: 555-5555'
      });
      var expected = '<a href="tel:555-5555" target="_blank" rel="external">Other: 555-5555</a>';
      expect(cellContent).to.equal(expected);
    });

    it('should render an empty string if no data', function() {
      var cellContent = DataTypeFormatter.renderPhoneCellHTML({});
      expect(cellContent).to.equal('');
    });
  });

  // TODO: Remove this once we don't need to support OBE datasets
  describe('html formatting', function() {
    it('should render only the text contents of HTML', function() {
      var cellContent = DataTypeFormatter.renderCell('<div>here <b>we</b> go<span style="color:red;">!</span></div>', { renderTypeName: 'html' });
      expect(cellContent).to.equal('here we go!');
    });

    it('should not fail on text that looks like a selector', function() {
      // EN-15513
      var cellContent = DataTypeFormatter.renderCell('5 lb. Comm. Line for 3 Cemt.', { renderTypeName: 'html' });
      expect(cellContent).to.equal('5 lb. Comm. Line for 3 Cemt.');
    });

    it('should render an empty string if no data', function() {
      var cellContent = DataTypeFormatter.renderCell('', { renderTypeName: 'html' });
      expect(cellContent).to.equal('');

      cellContent = DataTypeFormatter.renderCell(undefined, { renderTypeName: 'html' });
      expect(cellContent).to.equal('');
    });
  });

  // TODO: Remove this once we don't need to support OBE datasets
  describe('photo formatting', function() {
    it('should render a link', function() {
      var cellContent = DataTypeFormatter.renderPhotoCellHTML('hi', 'neat.co', 'abcd-1234');
      var expected = '<a href="https://neat.co/views/abcd-1234/files/hi" target="_blank" rel="external">hi</a>';
      expect(cellContent).to.equal(expected);
    });

    it('should render an empty string if no data', function() {
      var cellContent = DataTypeFormatter.renderPhotoCellHTML('');
      expect(cellContent).to.equal('');
    });
  });

  // TODO: Remove this once we don't need to support OBE datasets
  describe('document formatting', function() {
    it('should render a link', function() {
      var cellContent = DataTypeFormatter.renderDocumentCellHTML(
        {
          file_id: 'hello',
          filename: 'dolly'
        },
        'neat.co',
        'peng-uins'
      );
      var expected = '<a href="https://neat.co/views/peng-uins/files/hello" target="_blank" rel="external">dolly</a>';
      expect(cellContent).to.equal(expected);
    });

    it('should render an empty string if no data', function() {
      var cellContent = DataTypeFormatter.renderDocumentCellHTML({});
      expect(cellContent).to.equal('');
    });
  });

  // TODO: Remove this once we don't need to support OBE datasets
  describe('multiple choice formatting', function() {
    it('should render the corresponding value', function() {
      var cellContent = DataTypeFormatter.renderMultipleChoiceCell(
        'abcd-1234',
        {
          dropDown: {
            values: [
              {
                description: 'foo',
                id: 'four-four'
              },
              {
                description: 'bar',
                id: 'abcd-1234'
              }
            ]
          }
        }
      );
      expect(cellContent).to.equal('bar');
    });

    it('should render an empty string if no data', function() {
      var cellContent = DataTypeFormatter.renderMultipleChoiceCell('', {});
      expect(cellContent).to.equal('');
    });
  });

  describe('location cell formatting', function() {
    const LOCATION_WITH_HUMAN_ADDESS = {
      human_address: "{\"address\": \"1111 e pine st\",\"city\":\"seattle,\",\"state\":\"wa,\",\"zip\":\"98122\"}",
      latitude: "47.615267",
      longitude: "-122.317664"
    };

    const LOCATION_WITH_PARTIAL_HUMAN_ADDRESS = {
      human_address: "{\"address\": \"1111 e pine st\",\"zip\":\"98122\"}",
      latitude: "47.615267",
      longitude: "-122.317664"
    };

    const LOCATION_WITH_HUMAN_ADDRESS_ERROR = {
      human_address: "...",  // invalid json on purpose
      latitude: "47.615267",
      longitude: "-122.317664"
    };

    const LOCATION = {
      latitude: "47.615267",
      longitude: "-122.317664"
    };

    it('should render location as latitude and longitude', function() {
      const locationOutput = DataTypeFormatter.renderCell(LOCATION, { renderTypeName: 'location' });
      expect(locationOutput).to.equal('(47.615267°, -122.317664°)');
    });

    it('should render location with human address', function() {
      const locationOutput = DataTypeFormatter.renderCell(LOCATION_WITH_HUMAN_ADDESS, { renderTypeName: 'location' });
      const address = JSON.parse(LOCATION_WITH_HUMAN_ADDESS.human_address);
      const point = `(${LOCATION_WITH_HUMAN_ADDESS.latitude}°, ${LOCATION_WITH_HUMAN_ADDESS.longitude}°)`;
      expect(locationOutput).to.equal(`${address.address} ${address.city} ${address.state} ${address.zip} ${point}`);
    });

    it('should render only the parts of given human address', function() {
      const locationOutput = DataTypeFormatter.renderCell(LOCATION_WITH_PARTIAL_HUMAN_ADDRESS, { renderTypeName: 'location' });
      const address = JSON.parse(LOCATION_WITH_PARTIAL_HUMAN_ADDRESS.human_address);
      const point = `(${LOCATION_WITH_PARTIAL_HUMAN_ADDRESS.latitude}°, ${LOCATION_WITH_PARTIAL_HUMAN_ADDRESS.longitude}°)`;
      expect(locationOutput).to.equal(`${address.address} ${address.zip} ${point}`);
    });

    it('should render only the latitude and longitude if human address is not a valid json', function () {
      const locationOutput = DataTypeFormatter.renderCell(LOCATION_WITH_HUMAN_ADDRESS_ERROR, { renderTypeName: 'location' });
      const point = `(${LOCATION_WITH_HUMAN_ADDRESS_ERROR.latitude}°, ${LOCATION_WITH_HUMAN_ADDRESS_ERROR.longitude}°)`;
      expect(locationOutput).to.equal(`${point}`);
    });
  });
});
