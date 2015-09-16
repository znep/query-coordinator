describe('SocrataColumnChart component', function() {

  'use strict';

  var NAME_ALIAS = '__NAME_ALIAS__';
  var VALUE_ALIAS = '__VALUE_ALIAS__';

  var EXPECTED_COLUMNS = [NAME_ALIAS, VALUE_ALIAS];

  var EXPECTED_ROWS = [
    ['TEST NAME 1', 100],
    ['TEST NAME 2', 200]
  ];

  var QUERY_RESPONSE = {
    columns: EXPECTED_COLUMNS,
    rows: EXPECTED_ROWS
  };

  var $container;
  var columnChartConfig = {
    domain: 'dataspace.demo.socrata.com',
    fourByFour: 'r6t9-rak2',
    fieldName: 'category',
    filters: [],
    localization: {
      'NO_VALUE': 'No value',
      'FLYOUT_UNFILTERED_AMOUNT_LABEL': 'Total',
      'FLYOUT_FILTERED_AMOUNT_LABEL': 'Filtered',
      'FLYOUT_SELECTED_NOTICE': 'This column is selected'
    },
    unit: {
      en: {
        one: 'case',
        other: 'cases'
      }
    }
  };

  function destroyVisualization($container) {

    $container.destroySocrataColumnChart();
    $container.remove();
  }

  beforeEach(function() {

    $container = $('<div>').attr('id', 'test-column-chart').css({ width: 640, height: 480 });
    $('body').append($container);
  });

  describe('constructor', function() {

    describe('given invalid arguments', function() {

      it('should throw an error.', function() {

        assert.throws(function() { $container.socrataColumnChart(); });

        assert.throws(function() {
          var config = _.cloneDeep(columnChartConfig);

          delete config.domain;

          $container.socrataColumnChart(config);
        });

        assert.throws(function() {
          var config = _.cloneDeep(columnChartConfig);

          delete config.fourByFour;

          $container.socrataColumnChart(config);
        });

        assert.throws(function() {
          var config = _.cloneDeep(columnChartConfig);

          delete config.fieldName;

          $container.socrataColumnChart(config);
        });

        assert.throws(function() {
          var config = _.cloneDeep(columnChartConfig);

          delete config.unit;

          $container.socrataColumnChart(config);
        });
      });
    });

    describe('given valid arguments', function() {

      var actualSoqlDataProvider;

      beforeEach(function() {
        actualSoqlDataProvider = window.socrata.visualizations.SoqlDataProvider;
        window.socrata.visualizations.SoqlDataProvider = function() {
          this.query = function() {
            return new Promise(function(resolve, reject) { return resolve(QUERY_RESPONSE); });
          };
        };
      });

      afterEach(function() {

        window.socrata.visualizations.SoqlDataProvider = actualSoqlDataProvider;
        destroyVisualization($container);
      });

      it('should render a column visualization.', function(done) {

        $container.socrataColumnChart(columnChartConfig);

        setTimeout(
          function() {
            assert.isAbove($('.bar-group').length, 0);
            done();
          },
          0
        );
      });
    });
  });
});
