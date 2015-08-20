describe('test DataTypeFormatService output', function() {
  'use strict';

  var point1 = {
    'type': 'Point',
    'coordinates': [
      122.653274,
      53.936172
    ]
  };
  var point2 = {
    'type': 'Point',
    'coordinates': [
      -87.653274,
      41.936172
    ]
  };
  var point3 = {
    'type': 'Point',
    'coordinates': [
      120.653274,
      -31.936172
    ]
  };
  var point4 = {
    'type': 'Point',
    'coordinates': [
      -120.653274,
      -31.936172
    ]
  };

  var formattingTestData = {
    boolean_column: {
      format: {},
      dataTypeName: 'boolean',
      // values included to match up values to test with test data column.
      // 'values:' is not actually present in datasetMetadata
      values: [true, false, null]
    },
    basic_comma_number_column: {
      format: {},
      dataTypeName: 'number',
      values: ['5', '10', '0.5', '-2', '10000', '-100', '0.25']
    },
    no_comma_number_column: {
      format: {
        align: 'right',
        noCommas: true,
        precisionStyle: 'standard'
      },
      dataTypeName: 'number',
      values: ['5', '10', '0.5', '-2', '10000', '-100', '0.25']
    },
    percent_number_column: {
      format: {},
      dataTypeName: 'percent',
      values: ['5', '10', '0.5', '-2', '10000', '-100', '0.25']
    },
    percent_no_commas_number_column: {
      format: {
        align: 'right',
        formatString: null,
        noCommas: true
      },
      dataTypeName: 'percent',
      values: ['5', '10', '0.5', '-2', '10000', '-100', '0.25']
    },
    humane_number_column: {
      format: {
        humane: true
      },
      dataTypeName: 'number',
      values: ['5', '10', '0.5', '-2', '10000', '-100', '0.25']
    },
    four_digit_number_column: {
      format: {},
      dataTypeName: 'number',
      values: ['9038', '-1000', '1999', '1994', '2015', '1776', '-1444']
    },
    geo_cell_column: {
      format: {},
      dataTypeName: 'location',
      values: [point1, point2, point3, point4]
    },
    basic_money_column: {
      format: {},
      dataTypeName: 'money',
      values: ['0.40', '300', '500', '-200', '1999.99', '.25'] // numbers
    },
    user_formatted_money_column: {
      format: {
        currency: '€',
        decimalSeparator: ',',
        groupSeparator: '.'
      },
      dataTypeName: 'money',
      values: ['0.40', '300', '500', '-200', '1999.99', '.25'] // numbers
    },
    humane_money_column: {
      format: {
        humane: true
      },
      dataTypeName: 'money',
      values: ['0.40', '300', '500', '-200', '1999.99', '.25', '10000', '399000', '-40000', '-29578940839201'] // numbers
    },
    date_column_no_format: {
      format: {},
      dataTypeName: 'calendar_date',
      values: ['2001-08-11T13:44:55', '1981-04-19T12:12:11', '2001-02-13T09:17:11'],
      invalid: '2001-08-11T13:44:55xx'
    },
    date_column_format_as_string: {
      format: {
        formatString: 'MMM DD, YYYY hh:mm A'
      },
      dataTypeName: 'calendar_date',
      values: ['2001-08-11T01:33:00', '1981-04-19T12:12:11']
    },
    date_column_no_hr_min_sec: {
      format: {},
      dataTypeName: 'calendar_date',
      values: ['2001-08-11T07:00:00', '1981-04-19T07:00:00']
    }
  };

  // 2014 Jun 28 12:34:56 PM
  var TIMESTAMP_REGEX = /^\d{4}\s\w{3}\s[0-3][0-9]\s[01][0-9]:[0-5][0-9]:[0-5][0-9]\s[AP]M$/;
  // Jun 28, 2014 12:34 PM
  var TIMESTAMP_WITH_USER_FORMAT_REGEX = /^\w{3}\s[0-3][0-9],\s\d{4}\s[01][0-9]:[0-5][0-9]\s[AP]M$/;
  // 2014 Jun 28
  var TIMESTAMP_NO_HR_MIN_SEC_REGEX = /^\d{4}\s\w{3}\s[0-3][0-9]$/;
  // -23.198741°
  var LATLNG_REGEX = /^-?\d+\.\d+°$/;
  // (53.936172°, 122.653274°)
  var COORDINATES_REGEX = /^\(-?\d+\.\d+°,\s-?\d+\.\d+°\)$/;
  // <span> title="Latitude"> 53.936172° </span>
  var COORDINATES_HTML_REGEX = /\<span\stitle=\"(.*)\"\>-?\d+\.\d+°\<\/span\>/;
  // 1234 | -12,345.67
  var NUMBER_REGEX = /^-?(?:\d{1,4}|\d{1,3}(?:,\d{3})*)(?:\.\d+)?$/;
  // 12345 | -12345.67
  var NUMBER_NOCOMMAS_REGEX = /^-?\d+(?:\.\d+)?$/;
  // 1234% | -12,345.67%
  var NUMBER_HUMANE_FORMAT_REGEX = /^-?(?:\d{1,4}|\d{1,3}(?:,\d{3})*)(?:\.\d+)?[KMBTPEZY]$/;
  // 1,000K | 1.0M
  var PERCENT_REGEX = /^-?(?:\d{1,4}|\d{1,3}(?:,\d{3})*)(?:\.\d+)?%$/;
  // 12345% | -12345.67%
  var PERCENT_NOCOMMAS_REGEX = /^-?\d+(?:\.\d+)?%$/;
  // -$12,345.67
  var MONEY_REGEX = /^-?\$\d{1,3}(?:,\d{3})*\.\d{2}$/;
  // -£12.345,6
  var MONEY_WITH_USER_FORMAT_REGEX = /^-?€\d{1,3}(?:\.\d{3})*,\d{2}$/;
  // -$123.45 | -$12.3K
  var MONEY_HUMANE_FORMAT_REGEX = /^-?\$(?:\d{1,3}\.\d{2}|\d{1,3}(?:\.\d{1,2})?[KMBTPEZY])$/;


  beforeEach(module('dataCards.services'));

  var DataTypeFormatService;
  beforeEach(inject(function($injector) {
    DataTypeFormatService = $injector.get('DataTypeFormatService');
  }));

  describe('boolean cell formatting', function() {
    var currentColumn = formattingTestData.boolean_column;
    it('should render boolean cells with checkboxes for true, empty for false', function() {
      currentColumn.values.forEach(function(value) {
        var cellContent = DataTypeFormatService.renderBooleanCell(value);
        if (value) {
          expect(cellContent).to.equal('✓');
        } else {
          expect(cellContent).to.equal('');
        }
      });
    });
  });

  describe('number cell formatting', function() {
    var currentColumn;
    it('should render number cells with commas by default', function() {
      currentColumn = formattingTestData.basic_comma_number_column;
      currentColumn.values.forEach(function(value) {
        var cellContent = DataTypeFormatService.renderNumberCell(value, currentColumn);
        expect(cellContent).to.match(NUMBER_REGEX);
      });
    });

    it('should render number cells without commas when a noCommas format property is present', function() {
      currentColumn = formattingTestData.no_comma_number_column;
      currentColumn.values.forEach(function(value) {
        var cellContent = DataTypeFormatService.renderNumberCell(value, currentColumn);
        expect(cellContent).to.match(NUMBER_NOCOMMAS_REGEX);
      });
    });

    it('should render number cells without commas when number of digits is 4 as a special case', function() {
      currentColumn = formattingTestData.four_digit_number_column;
      currentColumn.values.forEach(function(value) {
        var cellContent = DataTypeFormatService.renderNumberCell(value, currentColumn);
        expect(cellContent).to.match(/\d{4}/);
      });
    });

    it('should render number cells as percent values when the dataTypeName is percent', function() {
      currentColumn = formattingTestData.percent_number_column;
      currentColumn.values.forEach(function(value) {
        var cellContent = DataTypeFormatService.renderNumberCell(value, currentColumn);
        expect(cellContent).to.match(PERCENT_REGEX);
        expect(cellContent).to.not.match(/^-?0\d/); // no leading zeroes in integer portion after string shift
      });
    });

    it('should render number cells as percent values in combination with a noCommas format property', function() {
      currentColumn = formattingTestData.percent_no_commas_number_column;
      currentColumn.values.forEach(function(value) {
        var cellContent = DataTypeFormatService.renderNumberCell(value, currentColumn);
        expect(cellContent).to.match(PERCENT_NOCOMMAS_REGEX);
        expect(cellContent).to.not.match(/^-?0\d/); // no leading zeroes in integer portion after string shift
      });
    });
  });

  describe('geo cell formatting', function() {
    var currentColumn = formattingTestData.geo_cell_column;
    describe('plain text formatting', function() {
      it('should render point cells with latitude & longitude', function() {
        currentColumn.values.forEach(function(value) {
          var cellContent = DataTypeFormatService.renderGeoCell(value, currentColumn);
          expect(cellContent).to.match(COORDINATES_REGEX);
        });
      });
    });

    describe('geo cell HTML formatting', function() {
      it('should render point cells with latitude & longitude', function() {
        currentColumn.values.forEach(function(value) {
          var cellContent = DataTypeFormatService.renderGeoCellHTML(value, currentColumn);
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
  });

  describe('currency formatting', function() {
    var currentColumn;
    it('should render money cells as US currency with cents by default', function() {
      currentColumn = formattingTestData.basic_money_column;
      currentColumn.values.forEach(function(value) {
        var cellContent = DataTypeFormatService.renderMoneyCell(value, currentColumn);
        expect(cellContent).to.match(MONEY_REGEX);
      });
    });

    it('should render money cells with user format properties', function() {
      currentColumn = formattingTestData.user_formatted_money_column;
      currentColumn.values.forEach(function(value) {
        var cellContent = DataTypeFormatService.renderMoneyCell(value, currentColumn);
        expect(cellContent).to.match(MONEY_WITH_USER_FORMAT_REGEX);
      });
    });

    it('should render money cells with humane format properties', function() {
      currentColumn = formattingTestData.humane_money_column;
      currentColumn.values.forEach(function(value) {
        var cellContent = DataTypeFormatService.renderMoneyCell(value, currentColumn);
        expect(cellContent).to.match(MONEY_HUMANE_FORMAT_REGEX);
      });
    });
  });

  describe('date and time formatting', function() {
    var currentColumn;
    it('should render timestamp cells with date & time as YYYY MMM DD hh:mm:ss A by default', function() {
      currentColumn = formattingTestData.date_column_no_format;
      currentColumn.values.forEach(function(value) {
        var cellContent = DataTypeFormatService.renderTimestampCell(value, currentColumn);
        expect(cellContent).to.match(TIMESTAMP_REGEX);
      });
    });

    it('should render timestamp cells with a custom timestamp format property', function() {
      currentColumn = formattingTestData.date_column_format_as_string;
      currentColumn.values.forEach(function(value) {
        var cellContent = DataTypeFormatService.renderTimestampCell(value, currentColumn);
        expect(cellContent).to.match(TIMESTAMP_WITH_USER_FORMAT_REGEX);
      });
    });

    it('should render timestamp cells with date & time as YYYY MMM DD if hh:mm:ss are all 0', function() {
      currentColumn = formattingTestData.date_column_no_hr_min_sec;
      currentColumn.values.forEach(function(value) {
        var cellContent = DataTypeFormatService.renderTimestampCell(value, currentColumn);
        expect(cellContent).to.match(TIMESTAMP_NO_HR_MIN_SEC_REGEX);
      });
    });

    describe('when rendering null cell data', function() {
      currentColumn = formattingTestData.date_column_no_format;
      it('should render invalid dates as blank cells', function() {
        var cellContent = DataTypeFormatService.renderTimestampCell(currentColumn.invalid, currentColumn);
        expect(cellContent).to.equal('');
      });
    });
  });
});
