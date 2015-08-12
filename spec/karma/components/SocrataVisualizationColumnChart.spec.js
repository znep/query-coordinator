describe('SocrataVisualizationColumnChart jQuery plugin', function() {

  'use strict';

  var VALID_DOMAIN = 'localhost:9443';
  var VALID_FOUR_BY_FOUR = 'test-test';
  var VALID_BASE_QUERY = 'SELECT *';

  var INVALID_DOMAIN = null;
  var INVALID_FOUR_BY_FOUR = null;
  var INVALID_BASE_QUERY = null;

  var NAME_ALIAS = 'NAME_ALIAS';
  var VALUE_ALIAS = 'VALUE_ALIAS';

  var EXPECTED_COLUMNS = [NAME_ALIAS, VALUE_ALIAS];

  var EXPECTED_ROWS = [
    ['TEST NAME 1', 'TEST VALUE 1'],
    ['TEST NAME 2', 'TEST VALUE 2']
  ];

  var QUERY_RESPONSE = {
    columns: EXPECTED_COLUMNS,
    rows: EXPECTED_ROWS
  };

  var storyteller = window.socrata.storyteller;
  var container;

  function destroyVisualization(container) {

    var destroyVisualizationEvent = new window.CustomEvent(
      Constants.SOCRATA_VISUALIZATION_DESTROY,
      {
        detail: {},
        bubbles: false
      }
    );

    container[0].dispatchEvent(destroyVisualizationEvent);
    container.remove();
  }

  beforeEach(function() {
    container = testDom.append('<div>');
  });

  describe('constructor', function() {

    describe('given invalid arguments', function() {

      it('should throw an error.', function() {

        assert.throws(function() { container.socrataVisualizationColumnChart(); });
        assert.throws(function() { container.socrataVisualizationColumnChart(INVALID_DOMAIN, VALID_FOUR_BY_FOUR, VALID_BASE_QUERY); });
        assert.throws(function() { container.socrataVisualizationColumnChart(VALID_DOMAIN, INVALID_FOUR_BY_FOUR, VALID_BASE_QUERY); });
        assert.throws(function() { container.socrataVisualizationColumnChart(VALID_DOMAIN, VALID_FOUR_BY_FOUR, INVALID_BASE_QUERY); });
      });
    });

    describe('given valid arguments', function() {

      var _SoqlDataProvider;
      var mockSoqlDataProvider;

      beforeEach(function() {

        var _SoqlDataProvider = window.socrata.visualizations.SoqlDataProvider;

        var mockSoqlDataProvider = function(config) {
          this.config = config;
        }

        mockSoqlDataProvider.prototype.query = function() {
          this.config.success(QUERY_RESPONSE);
        }

        window.socrata.visualizations.SoqlDataProvider = mockSoqlDataProvider;
      });

      afterEach(function() {

        destroyVisualization(container);
        window.socrata.visualizations.SoqlDataProvider = _SoqlDataProvider;
      });

      it('should render a column visualization.', function() {

        container.socrataVisualizationColumnChart(VALID_DOMAIN, VALID_FOUR_BY_FOUR, VALID_BASE_QUERY);

        assert.isAbove($('.bar-group').length, 0);
      });
    });
  });
});
