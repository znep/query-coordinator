var $ = require('jquery');
var _ = require('lodash');
var moment = require('moment');
var DataTypeFormatter = require('common/visualizations/views/DataTypeFormatter');
var I18n = require('common/i18n').default;
var allLocales = require('common/i18n/config/locales').default;

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

// $100,012.345 | $-12.345
var CURRENCY_FORMAT_REGEX = /^\$-?\d{1,3}(,\d{3})*(\.\d+)?$/;
// $100,012.35 | $-12.35
var CURRENCY_FIXED_FORMAT_REGEX = /^\$-?\d{1,3}(,\d{3})*(\.\d{2})?$/;
// $100012.35 | $-12.35
var CURRENCY_NOCOMMAS_FORMAT_REGEX = /^\$-?\d+(\.\d+)?$/;
// £100.012,345 | £-12,345
var CURRENCY_CUSTOM_SEPARATOR_AND_SYMBOL_FORMAT_REGEX = /^£-?\d{1,3}(\.\d{3})*(,\d+)?$/;

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

// $-12,345.67
var MONEY_REGEX = /^\$-?\d{1,3}(,\d{3})*\.\d{2}$/;
// £-12.345,6
var MONEY_WITH_USER_FORMAT_REGEX = /^€-?\d{1,3}(\.\d{3})*,\d{2}$/;
// $-123.45 | $-12.3K
var MONEY_HUMANE_FORMAT_REGEX = /^\$-?(\d{1,3}\.\d{2}|\d{1,3}(\.\d{1,2})?[KMBTPEZY])$/;

// 2014 Jun 28 12:34:56 PM
var TIMESTAMP_REGEX = /^\d{4}\s\w{3}\s[0-3][0-9]\s[01][0-9]:[0-5][0-9]:[0-5][0-9]\s[AP]M$/;
// Jun 28, 2014 12:34 PM
var TIMESTAMP_WITH_USER_FORMAT_REGEX = /^\w{3}\s[0-3][0-9],\s\d{4}\s[01][0-9]:[0-5][0-9]\s[AP]M$/;
// 2014 Jun 28
var TIMESTAMP_NO_HR_MIN_SEC_REGEX = /^\d{4}\s\w{3}\s[0-3][0-9]$/;

describe('DataTypeFormatter', function() {
  'use strict';

  beforeEach(function() {
    I18n.translations.en = allLocales.en;
  });

  afterEach(function() {
    I18n.translations = {};
  });

  var columnMetadata;

  describe('when something goes haywire', function() {
    let consoleErrorStub;
    let lodashEscapeStub;

    beforeEach(function() {
      consoleErrorStub = sinon.stub(console, 'error');
      lodashEscapeStub = sinon.stub(_, 'escape').throws(() => {
        throw new Error('UNESCAPABLE!');
      });
    });

    afterEach(function() {
      consoleErrorStub.restore();
      lodashEscapeStub.restore();
    });

    it('records an error message', function() {
      var cellContent = DataTypeFormatter.renderCellHTML('anything', { renderTypeName: 'anything' });
      assert.equal(cellContent, undefined);
      sinon.assert.called(consoleErrorStub);
    });
  });

  describe('XSS protection', function() {
    // Silence a deprecation warning. See
    // https://github.com/moment/moment/issues/2469
    let originalFallback = null;
    before(() => {
      originalFallback = moment.createFromInputFallback;
      moment.createFromInputFallback = (config) => {
        config._d = new Date(NaN);
      };
    });
    after(() => {
      moment.createFromInputFallback = originalFallback;
    });

    afterEach(() => {
      delete window.ranEvil;
    });

    const addToDOM = (html) => {
      $('<div>').html(html).appendTo(document.body).remove();
    };

    const scriptInjection = '<script>window.ranEvil = true;</script>';

    const trivialXssContents = [scriptInjection, _.escape(scriptInjection)];

    // Maps a renderer name to a XSS attack for it (column/content pair).
    // These are basic tests, but hopefully they will
    // catch the most egregious violators.
    const xssTestContents = {
      renderCellHTML: {
        column: { renderTypeName: 'unknown' },
        contents: trivialXssContents
      },
      renderFormattedTextHTML: {
        contents: trivialXssContents
      },
      renderBooleanCellHTML: {
        contents: trivialXssContents
      },
      renderNumberCellHTML: {
        column: {},
        contents: trivialXssContents
      },
      renderMoneyCellHTML: {
        column: {},
        contents: trivialXssContents
      },
      renderUrlCellHTML: {
        contents: [
          scriptInjection,
          {
            url: scriptInjection,
            description: scriptInjection
          },
          {
            url: _.escape(scriptInjection),
            description: _.escape(scriptInjection)
          }
        ]
      },
      renderGeoCellHTML: {
        contents: [
          {
            value: {
              coordinates: [
                scriptInjection,
                scriptInjection
              ]
            }
          },
          {
            value: {
              coordinates: [
                _.escape(scriptInjection),
                _.escape(scriptInjection)
              ]
            }
          }
        ]
      },
      renderPhoneCellHTML: {
        contents: [
          scriptInjection,
          {
            phone_number: scriptInjection
          },
          {
            phone_number: _.escape(scriptInjection)
          }
        ]
      },
      renderEmailCellHTML: {
        contents: trivialXssContents
      },
      renderBlobCellHTML: {
        contents: trivialXssContents
      },
      renderPhotoCellHTML: {
        contents: trivialXssContents
      },
      renderDocumentCellHTML: {
        contents: [
          {
            filename: scriptInjection
          },
          {
            filename: _.escape(scriptInjection)
          }
        ]
      },
      renderMultipleChoiceCellHTML: {
        column: {
          dropDown: {
            values: [
              {
                id: scriptInjection,
                description: scriptInjection
              },
              {
                id: _.escape(scriptInjection),
                description: _.escape(scriptInjection)
              }
            ]
          }
        },
        contents: trivialXssContents
      },
      renderTimestampCellHTML: {
        contents: trivialXssContents
      },
      renderObeLocationHTML: {
        contents: [
          {
            coordinates: [scriptInjection, scriptInjection]
          },
          {
            latitude: scriptInjection,
            longitude: scriptInjection
          },
          {
            latitude: _.escape(scriptInjection),
            longitude: _.escape(scriptInjection)
          }
        ]
      }
    };

    const rendererNames = _(DataTypeFormatter).
      keys().
      filter((name) => name.match(/render.*HTML/)).
      value();

    it('is a valid test suite', () => {
      assert.isUndefined(window.ranEvil);
      addToDOM(scriptInjection);
      assert.isTrue(window.ranEvil);
      delete window.ranEvil;
      assert.isAtLeast(rendererNames.length, 1);
    });

    _.each(rendererNames, (rendererName) => {
      describe(rendererName, () => {
        it('blocks trivial XSS', () => {
          const test = xssTestContents[rendererName];
          assert(
            test !== undefined,
            `No test payload defined - add ${rendererName} to xssTestContents`
          );

          _.each(test.contents, (content) => {
            addToDOM(DataTypeFormatter[rendererName](content, test.column));
            assert(
              window.ranEvil === undefined,
              `XSS payload was run - renderer is vulnerable to injection attack: ${JSON.stringify(content)}`
            );
          });
        });
      });
    });
  });

  describe('boolean cell formatting', function() {

    var BOOLEAN_DATA = [true, false, null];

    it('should render boolean cells with checkboxes for true, empty for false', function() {
      BOOLEAN_DATA.forEach(function(value) {
        var cellContent = DataTypeFormatter.renderBooleanCellHTML(value);
        assert.equal(cellContent, value ? '✓' : '');
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
          var cellContent = DataTypeFormatter.renderNumberCellHTML(value, columnMetadata);
          assert.match(cellContent, PERCENT_FORMAT_REGEX);
          assert.notMatch(cellContent, /^-?0\d/);
        });
      });

      it('should render number cells as percent values with format.view set', function() {
        columnMetadata = {
          renderTypeName: 'percent',
          format: {
            view: 'percent_bar_and_text'
          }
        };

        assert.equal(DataTypeFormatter.renderNumberCellHTML(100, columnMetadata), '100%');
      });

      it('should respect fixed precision', function() {
        columnMetadata = {
          renderTypeName: 'percent',
          format: {
            precision: 2
          }
        };
        NUMBER_DATA.forEach(function(value) {
          var cellContent = DataTypeFormatter.renderNumberCellHTML(value, columnMetadata);
          assert.match(cellContent, PERCENT_FIXED_FORMAT_REGEX);
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
          var cellContent = DataTypeFormatter.renderNumberCellHTML(value, columnMetadata);
          assert.match(cellContent, PERCENT_NOCOMMAS_FORMAT_REGEX);
          assert.notMatch(cellContent, /^-?0\d/);
        });

        columnMetadata = {
          renderTypeName: 'percent',
          format: {
            noCommas: 'true'
          }
        };
        NUMBER_DATA.forEach(function(value) {
          var cellContent = DataTypeFormatter.renderNumberCellHTML(value, columnMetadata);
          assert.match(cellContent, PERCENT_NOCOMMAS_FORMAT_REGEX);
          assert.notMatch(cellContent, /^-?0\d/);
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
          var cellContent = DataTypeFormatter.renderNumberCellHTML(value, columnMetadata);
          assert.match(cellContent, PERCENT_CUSTOM_SEPARATOR_FORMAT_REGEX);
        });
      });

      describe('when there is a custom locale', function() {
        beforeEach(function() { window.serverConfig = { locale: 'es' }; });
        afterEach(function() { delete window.serverConfig; });

        it('should respect custom locale', function() {
          columnMetadata = {
            renderTypeName: 'percent'
          };

          NUMBER_DATA.forEach(function(value) {
            var cellContent = DataTypeFormatter.renderNumberCellHTML(value, columnMetadata);
            assert.match(cellContent, PERCENT_CUSTOM_SEPARATOR_FORMAT_REGEX);
          });
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
          var cellContent = DataTypeFormatter.renderNumberCellHTML(value, columnMetadata);
          assert.match(cellContent, PERCENT_FORMAT_REGEX);
          assert.notMatch(cellContent, /^-?0\d/);
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
          var cellContent = DataTypeFormatter.renderNumberCellHTML(value, columnMetadata);
          assert.match(cellContent, PERCENT_FIXED_FORMAT_REGEX);
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
          var cellContent = DataTypeFormatter.renderNumberCellHTML(value, columnMetadata);
          assert.match(cellContent, PERCENT_NOCOMMAS_FORMAT_REGEX);
          assert.notMatch(cellContent, /^-?0\d/);
        });

        columnMetadata = {
          renderTypeName: 'number',
          format: {
            noCommas: 'true',
            view: 'percent_bar_and_text'
          }
        };
        NUMBER_DATA.forEach(function(value) {
          var cellContent = DataTypeFormatter.renderNumberCellHTML(value, columnMetadata);
          assert.match(cellContent, PERCENT_NOCOMMAS_FORMAT_REGEX);
          assert.notMatch(cellContent, /^-?0\d/);
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
          var cellContent = DataTypeFormatter.renderNumberCellHTML(value, columnMetadata);
          assert.match(cellContent, PERCENT_CUSTOM_SEPARATOR_FORMAT_REGEX);
        });
      });

      describe('when there is a custom locale', function() {
        beforeEach(function() { window.serverConfig = { locale: 'it' }; });
        afterEach(function() { delete window.serverConfig; });

        it('should respect custom locale', function() {
          columnMetadata = {
            renderTypeName: 'number',
            format: {
              view: 'percent_bar_and_text'
            }
          };
          NUMBER_DATA.forEach(function(value) {
            var cellContent = DataTypeFormatter.renderNumberCellHTML(value, columnMetadata);
            assert.match(cellContent, PERCENT_CUSTOM_SEPARATOR_FORMAT_REGEX);
          });
        });
      });
    });

    describe('with standard precisionStyle', function() {

      it('should render normal number cells', function() {
        columnMetadata = {
          renderTypeName: 'number'
        };
        NUMBER_DATA.forEach(function(value) {
          var cellContent = DataTypeFormatter.renderNumberCellHTML(value, columnMetadata);
          assert.match(cellContent, NUMBER_FORMAT_REGEX);
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
          var cellContent = DataTypeFormatter.renderNumberCellHTML(value, columnMetadata);
          assert.match(cellContent, NUMBER_FIXED_FORMAT_REGEX);
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
          var cellContent = DataTypeFormatter.renderNumberCellHTML(value, columnMetadata);
          assert.match(cellContent, NUMBER_NOCOMMAS_FORMAT_REGEX);
        });

        columnMetadata = {
          renderTypeName: 'number',
          format: {
            noCommas: 'true'
          }
        };
        NUMBER_DATA.forEach(function(value) {
          var cellContent = DataTypeFormatter.renderNumberCellHTML(value, columnMetadata);
          assert.match(cellContent, NUMBER_NOCOMMAS_FORMAT_REGEX);
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
          var cellContent = DataTypeFormatter.renderNumberCellHTML(value, columnMetadata);
          assert.match(cellContent, NUMBER_CUSTOM_SEPARATOR_FORMAT_REGEX);
        });
      });

      describe('when there is a custom locale', function() {
        beforeEach(function() { window.serverConfig = { locale: 'es' }; });
        afterEach(function() { delete window.serverConfig; });

        it('should respect custom locale', function() {
          columnMetadata = {
            renderTypeName: 'number'
          };
          NUMBER_DATA.forEach(function(value) {
            var cellContent = DataTypeFormatter.renderNumberCellHTML(value, columnMetadata);
            assert.match(cellContent, NUMBER_CUSTOM_SEPARATOR_FORMAT_REGEX);
          });
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
          var cellContent = DataTypeFormatter.renderNumberCellHTML(value, columnMetadata);
          assert.match(cellContent, PERCENT_FORMAT_REGEX);
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
          var cellContent = DataTypeFormatter.renderNumberCellHTML(value, columnMetadata);
          assert.match(cellContent, PERCENT_FIXED_FORMAT_REGEX);
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
          var cellContent = DataTypeFormatter.renderNumberCellHTML(value, columnMetadata);
          assert.match(cellContent, PERCENT_NOCOMMAS_FORMAT_REGEX);
        });

        columnMetadata = {
          renderTypeName: 'number',
          format: {
            precisionStyle: 'percentage',
            noCommas: 'true'
          }
        };
        NUMBER_DATA.forEach(function(value) {
          var cellContent = DataTypeFormatter.renderNumberCellHTML(value, columnMetadata);
          assert.match(cellContent, PERCENT_NOCOMMAS_FORMAT_REGEX);
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
          var cellContent = DataTypeFormatter.renderNumberCellHTML(value, columnMetadata);
          assert.match(cellContent, PERCENT_CUSTOM_SEPARATOR_FORMAT_REGEX);
        });
      });

      describe('when there is a custom locale', function() {
        beforeEach(function() { window.serverConfig = { locale: 'it' }; });
        afterEach(function() { delete window.serverConfig; });

        it('should respect custom locale', function() {
          columnMetadata = {
            renderTypeName: 'number',
            format: {
              precisionStyle: 'percentage'
            }
          };
          NUMBER_DATA.forEach(function(value) {
            var cellContent = DataTypeFormatter.renderNumberCellHTML(value, columnMetadata);
            assert.match(cellContent, PERCENT_CUSTOM_SEPARATOR_FORMAT_REGEX);
          });
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
          var cellContent = DataTypeFormatter.renderNumberCellHTML(value, columnMetadata);
          assert.match(cellContent, CURRENCY_FORMAT_REGEX);
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
          var cellContent = DataTypeFormatter.renderNumberCellHTML(value, columnMetadata);
          assert.match(cellContent, CURRENCY_FIXED_FORMAT_REGEX);
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
          var cellContent = DataTypeFormatter.renderNumberCellHTML(value, columnMetadata);
          assert.match(cellContent, CURRENCY_NOCOMMAS_FORMAT_REGEX);
        });

        columnMetadata = {
          renderTypeName: 'number',
          format: {
            precisionStyle: 'currency',
            noCommas: 'true'
          }
        };
        NUMBER_DATA.forEach(function(value) {
          var cellContent = DataTypeFormatter.renderNumberCellHTML(value, columnMetadata);
          assert.match(cellContent, CURRENCY_NOCOMMAS_FORMAT_REGEX);
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
          var cellContent = DataTypeFormatter.renderNumberCellHTML(value, columnMetadata);
          assert.match(cellContent, CURRENCY_CUSTOM_SEPARATOR_AND_SYMBOL_FORMAT_REGEX);
        });
      });

      describe('when there is a custom locale', function() {
        beforeEach(function() { window.serverConfig = { locale: 'es' }; });
        afterEach(function() { delete window.serverConfig; });

        it('should respect custom locale', function() {
          columnMetadata = {
            renderTypeName: 'number',
            format: {
              precisionStyle: 'currency',
              currency: '£'
            }
          };
          NUMBER_DATA.forEach(function(value) {
            var cellContent = DataTypeFormatter.renderNumberCellHTML(value, columnMetadata);
            assert.match(cellContent, CURRENCY_CUSTOM_SEPARATOR_AND_SYMBOL_FORMAT_REGEX);
          });
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
          var cellContent = DataTypeFormatter.renderNumberCellHTML(value, columnMetadata);
          assert.match(cellContent, FINANCIAL_FORMAT_REGEX);
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
          var cellContent = DataTypeFormatter.renderNumberCellHTML(value, columnMetadata);
          assert.match(cellContent, FINANCIAL_FIXED_FORMAT_REGEX);
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
          var cellContent = DataTypeFormatter.renderNumberCellHTML(value, columnMetadata);
          assert.match(cellContent, FINANCIAL_NOCOMMAS_FORMAT_REGEX);
        });

        columnMetadata = {
          renderTypeName: 'number',
          format: {
            precisionStyle: 'financial',
            noCommas: 'true'
          }
        };
        NUMBER_DATA.forEach(function(value) {
          var cellContent = DataTypeFormatter.renderNumberCellHTML(value, columnMetadata);
          assert.match(cellContent, FINANCIAL_NOCOMMAS_FORMAT_REGEX);
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
          var cellContent = DataTypeFormatter.renderNumberCellHTML(value, columnMetadata);
          assert.match(cellContent, FINANCIAL_CUSTOM_SEPARATOR_FORMAT_REGEX);
        });
      });

      describe('when there is a custom locale', function() {
        beforeEach(function() { window.serverConfig = { locale: 'it' }; });
        afterEach(function() { delete window.serverConfig; });

        it('should respect custom locale', function() {
          columnMetadata = {
            renderTypeName: 'number',
            format: {
              precisionStyle: 'financial'
            }
          };
          NUMBER_DATA.forEach(function(value) {
            var cellContent = DataTypeFormatter.renderNumberCellHTML(value, columnMetadata);
            assert.match(cellContent, FINANCIAL_CUSTOM_SEPARATOR_FORMAT_REGEX);
          });
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
          var cellContent = DataTypeFormatter.renderNumberCellHTML(value, columnMetadata);
          assert.match(cellContent, SCIENTIFIC_FORMAT_REGEX);
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
          var cellContent = DataTypeFormatter.renderNumberCellHTML(value, columnMetadata);
          assert.match(cellContent, SCIENTIFIC_FIXED_FORMAT_REGEX);
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
          var cellContent = DataTypeFormatter.renderNumberCellHTML(value, columnMetadata);
          assert.match(cellContent, SCIENTIFIC_CUSTOM_SEPARATOR_FORMAT_REGEX);
        });
      });

      describe('when there is a custom locale', function() {
        beforeEach(function() { window.serverConfig = { locale: 'es' }; });
        afterEach(function() { delete window.serverConfig; });

        it('should respect the custom locale', function() {
          columnMetadata = {
            renderTypeName: 'number',
            format: {
              precisionStyle: 'scientific'
            }
          };
          NUMBER_DATA.forEach(function(value) {
            var cellContent = DataTypeFormatter.renderNumberCellHTML(value, columnMetadata);
            assert.match(cellContent, SCIENTIFIC_CUSTOM_SEPARATOR_FORMAT_REGEX);
          });
        });
      });
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
        var cellContent = DataTypeFormatter.renderNumberCellHTML(value, columnMetadata);
        assert.match(cellContent, MASK_FORMAT_REGEX);
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

    it('should render point cells with latitude & longitude', function() {
      POINT_DATA.forEach(function(value) {
        var cellContent = DataTypeFormatter.renderGeoCellHTML(
          value,
          columnMetadata
        );
        var pointCellSpans = cellContent.split(',').map(function(span) {
          return span.trim();
        });

        assert.lengthOf(pointCellSpans, 2);

        assert.match(pointCellSpans[0], COORDINATES_HTML_REGEX);
        var matchLat = COORDINATES_HTML_REGEX.exec(pointCellSpans[0]);
        assert.equal(matchLat[1], 'Latitude');
        assert.match(pointCellSpans[1], COORDINATES_HTML_REGEX);
        var matchLng = COORDINATES_HTML_REGEX.exec(pointCellSpans[1]);
        assert.equal(matchLng[1], 'Longitude');
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
        var cellContent = DataTypeFormatter.renderMoneyCellHTML(value, columnMetadata);
        assert.match(cellContent, MONEY_REGEX);
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
        var cellContent = DataTypeFormatter.renderMoneyCellHTML(value, columnMetadata);
        assert.match(cellContent, MONEY_WITH_USER_FORMAT_REGEX);
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
        var cellContent = DataTypeFormatter.renderMoneyCellHTML(value, columnMetadata);
        assert.match(cellContent, MONEY_HUMANE_FORMAT_REGEX);
      });
    });

    describe('when there is a custom locale', function() {
      beforeEach(function() { window.serverConfig = { locale: 'it' }; });
      afterEach(function() { window.serverConfig = undefined; });

      it('should respect custom locale', function() {
        columnMetadata = {
          renderTypeName: 'money',
          format: {}
        };
        MONEY_DATA.forEach(function(value) {
          var cellContent = DataTypeFormatter.renderMoneyCellHTML(value, columnMetadata);
          assert.match(cellContent, MONEY_WITH_USER_FORMAT_REGEX);
        });
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
        var cellContent = DataTypeFormatter.renderTimestampCellHTML(value, columnMetadata);
        assert.match(cellContent, TIMESTAMP_REGEX);
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
        var cellContent = DataTypeFormatter.renderTimestampCellHTML(value, columnMetadata);
        assert.match(cellContent, TIMESTAMP_WITH_USER_FORMAT_REGEX);
      });
    });

    it('should render timestamp cells with date & time as YYYY MMM DD if hh:mm:ss are all 0', function() {
      columnMetadata = {
        renderTypeName: 'calendar_date'
      };
      var values = _.filter(TIMESTAMP_DATA, function(value) { return /00:00:00$/.test(value); });
      values.forEach(function(value) {
        var cellContent = DataTypeFormatter.renderTimestampCellHTML(value, columnMetadata);
        assert.match(cellContent, TIMESTAMP_NO_HR_MIN_SEC_REGEX);
      });
    });

    it('should render invalid dates as blank cells', function() {
      columnMetadata = {
        renderTypeName: 'calendar_date'
      };
      var values = _.map(TIMESTAMP_DATA, function(value) { return value + 'xx'; });
      values.forEach(function(value) {
        var cellContent = DataTypeFormatter.renderTimestampCellHTML(value, columnMetadata);
        assert.equal(cellContent, '');
      });
    });

  });

  describe('url formatting', function() {
    it('should render a link', function() {
      var cellContent = DataTypeFormatter.renderUrlCellHTML({
        url: 'https://example.com',
        description: 'wombats'
      });
      var expected = '<a href="https://example.com" target="_blank" rel="external">wombats</a>';
      assert.equal(cellContent, expected);
    });

    it('should render a link when given a string', function() {
      var cellContent = DataTypeFormatter.renderUrlCellHTML('https://example.com');
      var expected = '<a href="https://example.com" target="_blank" rel="external">https://example.com</a>';
      assert.equal(cellContent, expected);
    });

    it('should render an empty string if no data', function() {
      var cellContent = DataTypeFormatter.renderUrlCellHTML({});
      assert.equal(cellContent, '');
    });
  });

  describe('email formatting', function() {
    it('should render a link', function() {
      var cellContent = DataTypeFormatter.renderEmailCellHTML('test@example.com');
      var expected = '<a href="mailto:test@example.com" target="_blank" rel="external">test@example.com</a>';
      assert.equal(cellContent, expected);
    });

    it('should render an empty string if no data', function() {
      var cellContent = DataTypeFormatter.renderEmailCellHTML({});
      assert.equal(cellContent, '');
    });
  });

  describe('blob formatting', function() {
    it('should render a link', function() {
      var cellContent = DataTypeFormatter.renderBlobCellHTML('blobid', 'example.com', 'xxxx-yyyy');
      var expected = '<a href="https://example.com/views/xxxx-yyyy/files/blobid" target="_blank" rel="external">blobid</a>';
      assert.equal(cellContent, expected);
    });

    it('should render an empty string if no data', function() {
      var cellContent = DataTypeFormatter.renderBlobCellHTML({});
      assert.equal(cellContent, '');
    });
  });

  describe('phone formatting', function() {
    it('should render a link without extra characters in the href', function() {
      var cellContent = DataTypeFormatter.renderPhoneCellHTML({
        phone_number: 'Other: 555-5555'
      });
      var expected = '<a href="tel:555-5555" target="_blank" rel="external">Other: 555-5555</a>';
      assert.equal(cellContent, expected);
    });

    it('should render a link when given a string', function() {
      var cellContent = DataTypeFormatter.renderPhoneCellHTML('555-5555');
      var expected = '<a href="tel:555-5555" target="_blank" rel="external">555-5555</a>';
      assert.equal(cellContent, expected);
    });

    it('should render an empty string if no data', function() {
      var cellContent = DataTypeFormatter.renderPhoneCellHTML({});
      assert.equal(cellContent, '');
    });
  });

  // TODO: Remove this once we don't need to support OBE datasets
  describe('html formatting', function() {
    it('should render only the text contents of HTML', function() {
      var cellContent = DataTypeFormatter.renderCellHTML('<div>here <b>we</b> go<span style="color:red;">!</span></div>', { renderTypeName: 'html' });
      assert.equal(cellContent, 'here we go!');
    });

    it('should not fail on text that looks like a selector', function() {
      // EN-15513
      var cellContent = DataTypeFormatter.renderCellHTML('5 lb. Comm. Line for 3 Cemt.', { renderTypeName: 'html' });
      assert.equal(cellContent, '5 lb. Comm. Line for 3 Cemt.');
    });

    it('should render an empty string if no data', function() {
      var cellContent = DataTypeFormatter.renderCellHTML('', { renderTypeName: 'html' });
      assert.equal(cellContent, '');

      cellContent = DataTypeFormatter.renderCellHTML(undefined, { renderTypeName: 'html' });
      assert.equal(cellContent, '');
    });
  });

  // TODO: Remove this once we don't need to support OBE datasets
  describe('photo formatting', function() {
    it('should render a link', function() {
      var cellContent = DataTypeFormatter.renderPhotoCellHTML('hi', 'neat.co', 'abcd-1234');
      var expected = '<a href="https://neat.co/views/abcd-1234/files/hi" target="_blank" rel="external">hi</a>';
      assert.equal(cellContent, expected);
    });

    it('should render an empty string if no data', function() {
      var cellContent = DataTypeFormatter.renderPhotoCellHTML('');
      assert.equal(cellContent, '');
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
      assert.equal(cellContent, expected);
    });

    it('should render an empty string if no data', function() {
      var cellContent = DataTypeFormatter.renderDocumentCellHTML({});
      assert.equal(cellContent, '');
    });
  });

  // TODO: Remove this once we don't need to support OBE datasets
  describe('multiple choice formatting', function() {
    it('should render the corresponding value', function() {
      var cellContent = DataTypeFormatter.renderMultipleChoiceCellHTML(
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
      assert.equal(cellContent, 'bar');
    });

    it('should render an empty string if no data', function() {
      var cellContent = DataTypeFormatter.renderMultipleChoiceCellHTML('', {});
      assert.equal(cellContent, '');
    });
  });

  describe('location cell formatting', function() {
    const LOCATION_WITH_HUMAN_ADDESS = {
      human_address: '{"address": "1111 e pine st","city":"seattle,","state":"wa,","zip":"98122"}',
      latitude: '47.615267',
      longitude: '-122.317664'
    };

    const LOCATION_WITH_PARTIAL_HUMAN_ADDRESS = {
      human_address: '{"address": "1111 e pine st","zip":"98122"}',
      latitude: '47.615267',
      longitude: '-122.317664'
    };

    const LOCATION_WITH_HUMAN_ADDRESS_ERROR = {
      human_address: '...',  // invalid json on purpose
      latitude: '47.615267',
      longitude: '-122.317664'
    };

    const LOCATION_WITH_COORDINATES = {
      coordinates: [47.615267, -122.317664]
    };

    const LOCATION = {
      latitude: '47.615267',
      longitude: '-122.317664'
    };

    it('should render location as latitude and longitude', function() {
      const locationOutput = DataTypeFormatter.renderCellHTML(LOCATION, { renderTypeName: 'location' });
      assert.equal(locationOutput, '(47.615267°, -122.317664°)');
    });

    it('should render location with human address', function() {
      const locationOutput = DataTypeFormatter.renderCellHTML(LOCATION_WITH_HUMAN_ADDESS, { renderTypeName: 'location' });
      const address = JSON.parse(LOCATION_WITH_HUMAN_ADDESS.human_address);
      const point = `(${LOCATION_WITH_HUMAN_ADDESS.latitude}°, ${LOCATION_WITH_HUMAN_ADDESS.longitude}°)`;
      assert.equal(locationOutput, `${address.address} ${address.city} ${address.state} ${address.zip} ${point}`);
    });

    it('should render only the parts of given human address', function() {
      const locationOutput = DataTypeFormatter.renderCellHTML(LOCATION_WITH_PARTIAL_HUMAN_ADDRESS, { renderTypeName: 'location' });
      const address = JSON.parse(LOCATION_WITH_PARTIAL_HUMAN_ADDRESS.human_address);
      const point = `(${LOCATION_WITH_PARTIAL_HUMAN_ADDRESS.latitude}°, ${LOCATION_WITH_PARTIAL_HUMAN_ADDRESS.longitude}°)`;
      assert.equal(locationOutput, `${address.address} ${address.zip} ${point}`);
    });

    it('should render if given a coordinates array', function() {
      const locationOutput = DataTypeFormatter.renderCellHTML(LOCATION_WITH_COORDINATES, { renderTypeName: 'location' });
      const point = `(${LOCATION_WITH_COORDINATES.coordinates[1]}°, ${LOCATION_WITH_COORDINATES.coordinates[0]}°)`;
      assert.equal(locationOutput, point);
    });

    it('should render only the latitude and longitude if human address is not a valid json', function() {
      const locationOutput = DataTypeFormatter.renderCellHTML(LOCATION_WITH_HUMAN_ADDRESS_ERROR, { renderTypeName: 'location' });
      const point = `(${LOCATION_WITH_HUMAN_ADDRESS_ERROR.latitude}°, ${LOCATION_WITH_HUMAN_ADDRESS_ERROR.longitude}°)`;
      assert.equal(locationOutput, `${point}`);
    });
  });
});
